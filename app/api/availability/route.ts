import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import NailTech from '@/lib/models/NailTech';
import { cleanupPastSlotsIfDue } from '@/lib/services/cleanupPastSlots';

// Prevent caching in production to ensure fresh slot data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Use Node.js runtime so the route is always registered (avoids dev 404s when edge is default)
export const runtime = 'nodejs';

/**
 * Normalize time to 24-hour format (HH:mm)
 * Handles both 24-hour (14:30) and 12-hour (2:30 PM) formats
 */
function normalizeTime(time: string): string {
  if (!time) return time;
  
  // If already in 24-hour format (no AM/PM), return as-is
  if (!time.toUpperCase().includes('AM') && !time.toUpperCase().includes('PM')) {
    return time;
  }
  
  // Parse 12-hour format and convert to 24-hour
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time;
  
  let [, hours, minutes, period] = match;
  let hour = parseInt(hours, 10);
  
  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${String(hour).padStart(2, '0')}:${minutes}`;
}

export async function GET(request: Request) {
  try {
    await connectDB();
    // Clean past unbooked slots when slots are fetched (e.g. booking page refresh)
    await cleanupPastSlotsIfDue();

    const { searchParams } = new URL(request.url);
    const nailTechId = searchParams.get('nailTechId');
    
    // If no nailTechId provided, try default (first active nail tech)
    let targetNailTechId = nailTechId;
    if (!targetNailTechId) {
      const defaultNailTech = await NailTech.findOne({ status: 'Active' });
      if (defaultNailTech) {
        targetNailTechId = defaultNailTech._id.toString();
      }
    }
    
    if (!targetNailTechId) {
      return NextResponse.json(
        { error: 'No nail technician specified and no default available' },
        { status: 400 }
      );
    }
    
    // Fetch next 3 months of slots
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const startDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const endDate = threeMonthsLater.toISOString().slice(0, 10);
    
    console.log('[API Availability] Fetching slots:', {
      nailTechId: targetNailTechId,
      dateRange: `${startDate} to ${endDate}`
    });
    
    // Query slots from MongoDB
    let slots = await Slot.find({
      nailTechId: targetNailTechId,
      date: { $gte: startDate, $lte: endDate },
      isHidden: { $ne: true } // Exclude hidden slots from public view
    }).lean();

    // Normalize slot times and ensure each slot has `id` for frontend (booking uses slot.id)
    slots = slots.map(slot => ({
      ...slot,
      id: (slot as any)._id?.toString?.() ?? (slot as any).id,
      time: normalizeTime(slot.time)
    }));

    console.log('[API Availability] Found slots:', slots.length);
    if (slots.length > 0) {
      console.log('[API Availability] Sample slots:', slots.slice(0, 2).map(s => ({
        date: s.date,
        time: s.time,
        status: s.status,
        nailTechId: s.nailTechId,
        timeType: typeof s.time
      })));
    }

    return NextResponse.json({ slots }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=30',
      },
    });
  } catch (error) {
    console.error('[API Availability] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}


