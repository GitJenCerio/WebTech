import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import NailTech from '@/lib/models/NailTech';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';

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

    // Enrich slots with active booking details for admin workflows
    const slotIds = slots.map((slot: any) => String(slot._id));
    const bookings = slotIds.length
      ? await Booking.find({
          slotIds: { $in: slotIds },
          status: { $in: ['pending', 'confirmed', 'no_show'] },
        })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const customerIds = Array.from(new Set(bookings.map((booking: any) => booking.customerId).filter(Boolean)));
    const customers = customerIds.length
      ? await Customer.find({ _id: { $in: customerIds } })
          .select('_id name email phone socialMediaName')
          .lean()
      : [];
    const customerById = new Map(
      customers.map((customer: any) => [
        String(customer._id),
        {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          socialMediaName: customer.socialMediaName,
        },
      ])
    );

    const bookingBySlotId = new Map<string, any>();
    for (const booking of bookings as any[]) {
      for (const slotId of booking.slotIds || []) {
        const slotKey = String(slotId);
        if (!bookingBySlotId.has(slotKey)) {
          bookingBySlotId.set(slotKey, {
            id: String(booking._id),
            bookingCode: booking.bookingCode,
            customerId: booking.customerId,
            customerName: customerById.get(String(booking.customerId))?.name || 'Unknown Client',
            customerEmail: customerById.get(String(booking.customerId))?.email || '',
            customerPhone: customerById.get(String(booking.customerId))?.phone || '',
            customerSocialMediaName: customerById.get(String(booking.customerId))?.socialMediaName || '',
            slotIds: booking.slotIds || [],
            service: booking.service,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            clientNotes: booking.clientNotes || '',
            adminNotes: booking.adminNotes || '',
            pricing: booking.pricing,
            payment: booking.payment,
            completedAt: booking.completedAt || null,
          });
        }
      }
    }

    const enrichedSlots = slots.map((slot: any) => ({
      ...slot,
      booking: bookingBySlotId.get(String(slot._id)) || null,
    }));

    return NextResponse.json({ slots: enrichedSlots });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch slots' }, { status: 500 });
  }
}
