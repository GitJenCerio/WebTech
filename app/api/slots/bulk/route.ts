import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import Booking from '@/lib/models/Booking';

const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(['hide', 'unhide', 'delete']),
});

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;

    const body = await request.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ids, action } = parsed.data;
    if (ids.some((id) => !isObjectId(id))) {
      return NextResponse.json({ error: 'One or more slot IDs are invalid' }, { status: 400 });
    }

    const slots = await Slot.find({ _id: { $in: ids } });
    const foundIds = new Set(slots.map((slot) => String(slot._id)));
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      if (!foundIds.has(id)) {
        skipped.push({ id, reason: 'Slot not found' });
      }
    }

    const eligible = [];
    for (const slot of slots) {
      const slotId = String(slot._id);
      if (assignedNailTechId && String(slot.nailTechId) !== assignedNailTechId) {
        skipped.push({ id: slotId, reason: 'You can only manage slots for your assigned nail tech' });
        continue;
      }
      if (slot.status === 'pending' || slot.status === 'confirmed') {
        skipped.push({ id: slotId, reason: 'Cannot change a pending or confirmed slot' });
        continue;
      }
      if (action === 'delete' && slot.status !== 'available') {
        skipped.push({ id: slotId, reason: `Cannot delete a ${slot.status} slot` });
        continue;
      }
      if (action !== 'delete' && slot.status !== 'available' && slot.status !== 'blocked') {
        skipped.push({ id: slotId, reason: 'Only available or blocked slots can be hidden' });
        continue;
      }
      eligible.push(slot);
    }

    const eligibleIds = eligible.map((slot) => String(slot._id));
    const activeBookings = eligibleIds.length
      ? await Booking.find({
          slotIds: { $in: eligibleIds },
          status: { $in: ACTIVE_BOOKING_STATUSES },
        })
          .select('slotIds')
          .lean()
      : [];

    const bookedSlotIds = new Set<string>();
    for (const booking of activeBookings) {
      for (const slotId of booking.slotIds || []) {
        bookedSlotIds.add(String(slotId));
      }
    }

    const actionable = [];
    for (const slot of eligible) {
      const slotId = String(slot._id);
      if (bookedSlotIds.has(slotId)) {
        skipped.push({ id: slotId, reason: 'Slot has an active booking' });
        continue;
      }
      actionable.push(slot);
    }

    const actionableIds = actionable.map((slot) => slot._id);

    if (action === 'delete') {
      if (actionableIds.length > 0) {
        await Slot.deleteMany({ _id: { $in: actionableIds } });
      }
      return NextResponse.json({
        action,
        deleted: actionableIds.length,
        skipped: skipped.length,
        skippedSlots: skipped,
      });
    }

    const isHidden = action === 'hide';
    if (actionableIds.length > 0) {
      await Slot.updateMany({ _id: { $in: actionableIds } }, { $set: { isHidden } });
    }

    return NextResponse.json({
      action,
      updated: actionableIds.length,
      skipped: skipped.length,
      skippedSlots: skipped,
    });
  } catch (error: any) {
    console.error('Error applying bulk slot action:', error);
    return NextResponse.json({ error: error.message || 'Failed to update slots' }, { status: 500 });
  }
}
