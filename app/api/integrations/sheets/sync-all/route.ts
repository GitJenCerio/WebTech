import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import Slot from '@/lib/models/Slot';
import NailTech from '@/lib/models/NailTech';
import Settings from '@/lib/models/Settings';
import { syncBookingToSheet, syncFinanceToSheet } from '@/lib/services/googleSheetsService';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let synced = 0;
    let errors = 0;
    let skip = 0;
    let hasMore = true;

    const settings = await Settings.findById('global').lean();
    const commissionRate = (settings as { adminCommissionRate?: number })?.adminCommissionRate ?? 10;

    while (hasMore) {
      const bookings = await Booking.find({}).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean();
      if (bookings.length === 0) break;

      for (const b of bookings as any[]) {
        try {
          const [cust, slots, tech] = await Promise.all([
            Customer.findById(b.customerId).lean(),
            Slot.find({ _id: { $in: b.slotIds || [] } }).sort({ date: 1, time: 1 }).lean(),
            NailTech.findById(b.nailTechId).lean(),
          ]);
          const customerName = cust?.name || 'Unknown';
          const socialMediaName = cust?.socialMediaName || '';
          const nailTechName = tech?.name ? `Ms. ${tech.name}` : '';
          const firstSlot = (slots as any[])?.[0];
          const appointmentDate = firstSlot?.date || '';
          const appointmentTimes = (slots as any[])?.map((s: any) => s.time).filter(Boolean) || [];

          await syncBookingToSheet(b, customerName, socialMediaName, nailTechName, appointmentDate, appointmentTimes);
          await syncFinanceToSheet(b, socialMediaName, nailTechName, appointmentDate, appointmentTimes, commissionRate);
          synced++;
        } catch (err) {
          console.error('[Sheets] sync-all error for booking', b._id, err);
          errors++;
        }
        await new Promise(r => setTimeout(r, 100));
      }

      skip += PAGE_SIZE;
      hasMore = bookings.length === PAGE_SIZE;
    }

    return NextResponse.json({ synced, errors });
  } catch (error: unknown) {
    console.error('Sheets sync-all error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
