import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import NailTech from '@/lib/models/NailTech';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.nailTechId) {
      return NextResponse.json({ error: 'Nail tech ID is required' }, { status: 400 });
    }

    const nailTech = await NailTech.findById(body.nailTechId);
    if (!nailTech) {
      return NextResponse.json({ error: 'Nail tech not found' }, { status: 404 });
    }

    // Support bulk creation
    const dates = body.dates || [body.date];
    const times = body.times || [body.time];

    if (!dates.length || !times.length) {
      return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });
    }

    const createdSlots = [];
    const errors = [];

    for (const date of dates) {
      for (const time of times) {
        // Check duplicate
        const existing = await Slot.findOne({ date, time, nailTechId: body.nailTechId });
        if (existing) {
          errors.push(`Slot already exists: ${date} ${time}`);
          continue;
        }

        const slot = await Slot.create({
          date,
          time,
          nailTechId: body.nailTechId,
          status: body.status || 'available',
          slotType: body.slotType || null,
          notes: body.notes || '',
          isHidden: body.isHidden || false,
        });
        createdSlots.push(slot);
      }
    }

    return NextResponse.json({
      slots: createdSlots,
      created: createdSlots.length,
      errors,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating slots:', error);
    return NextResponse.json({ error: error.message || 'Failed to create slots' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const query: any = {};
    if (searchParams.get('nailTechId')) query.nailTechId = searchParams.get('nailTechId');
    if (searchParams.get('date')) query.date = searchParams.get('date');
    if (searchParams.get('status')) query.status = searchParams.get('status');
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      query.date = { $gte: searchParams.get('startDate'), $lte: searchParams.get('endDate') };
    }

    const slots = await Slot.find(query).sort({ date: 1, time: 1 }).lean();
    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch slots' }, { status: 500 });
  }
}
