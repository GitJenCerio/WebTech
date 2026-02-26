import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import NailTech from '@/lib/models/NailTech';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import { cleanupPastSlotsIfDue } from '@/lib/services/cleanupPastSlots';

const createSlotsSchema = z.object({
  nailTechId: z.string().min(1),
  date: z.string().optional(),
  dates: z.array(z.string()).optional(),
  time: z.string().optional(),
  times: z.array(z.string()).optional(),
  status: z.enum(['available', 'blocked']).optional(),
  slotType: z.enum(['regular', 'with_squeeze_fee']).nullable().optional(),
  notes: z.string().max(500).optional(),
  isHidden: z.boolean().optional(),
}).refine(
  (data) => {
    const dates = data.dates ?? (data.date ? [data.date] : []);
    const times = data.times ?? (data.time ? [data.time] : []);
    return dates.length > 0 && times.length > 0;
  },
  { message: 'At least one date and one time are required' }
);

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;

    const body = await request.json();
    const parsed = createSlotsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (assignedNailTechId && data.nailTechId !== assignedNailTechId) {
      return NextResponse.json({ error: 'You can only create slots for your assigned nail tech' }, { status: 403 });
    }

    const nailTech = await NailTech.findById(data.nailTechId);
    if (!nailTech) {
      return NextResponse.json({ error: 'Nail tech not found' }, { status: 404 });
    }

    const dates = data.dates ?? (data.date ? [data.date] : []);
    const times = data.times ?? (data.time ? [data.time] : []);

    const createdSlots = [];
    const errors = [];

    for (const date of dates) {
      for (const time of times) {
        const existing = await Slot.findOne({ date, time, nailTechId: data.nailTechId });
        if (existing) {
          errors.push(`Slot already exists: ${date} ${time}`);
          continue;
        }

        const slot = await Slot.create({
          date,
          time,
          nailTechId: data.nailTechId,
          status: data.status || 'available',
          slotType: data.slotType ?? null,
          notes: data.notes || '',
          isHidden: data.isHidden ?? false,
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
    await cleanupPastSlotsIfDue();

    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;

    const { searchParams } = new URL(request.url);

    const query: any = {};
    if (searchParams.get('nailTechId')) query.nailTechId = searchParams.get('nailTechId');
    // Staff with assigned nail tech: restrict to their tech only
    if (assignedNailTechId) query.nailTechId = assignedNailTechId;
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
          status: { $in: ['pending', 'confirmed', 'completed', 'no_show'] },
        })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const rawCustomerIds = Array.from(new Set(bookings.map((booking: any) => booking.customerId).filter(Boolean)));
    const customerIds = rawCustomerIds.filter((id) => mongoose.Types.ObjectId.isValid(id) && String(id).length === 24);
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
            clientPhotos: booking.clientPhotos || { inspiration: [], currentState: [] },
            invoice: booking.invoice || null,
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
