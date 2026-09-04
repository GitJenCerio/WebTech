import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import Booking from '@/lib/models/Booking';
import NailTech from '@/lib/models/NailTech';
import { normalizeSlotTime } from '@/lib/constants/slots';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const slot = await Slot.findById(id).lean();
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    return NextResponse.json({ slot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch slot' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const slot = await Slot.findById(id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;
    if (assignedNailTechId && String(slot.nailTechId) !== assignedNailTechId) {
      return NextResponse.json({ error: 'You can only edit slots for your assigned nail tech' }, { status: 403 });
    }

    const activeBooking = await Booking.findOne({
      slotIds: { $in: [id] },
      status: { $in: ['pending', 'confirmed'] },
    }).lean();

    if (slot.status === 'pending' || slot.status === 'confirmed' || activeBooking) {
      return NextResponse.json(
        { error: 'Cannot edit a pending or confirmed slot. Use booking actions instead.' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.slotType !== undefined) updates.slotType = body.slotType;
    if (body.isHidden !== undefined) updates.isHidden = body.isHidden;

    if (body.status !== undefined) {
      const status = body.status === 'disabled' ? 'blocked' : body.status;
      if (status !== 'available' && status !== 'blocked') {
        return NextResponse.json(
          { error: 'Slot status can only be set to available or blocked' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (body.date !== undefined) {
      if (typeof body.date !== 'string' || !isValidDateString(body.date)) {
        return NextResponse.json({ error: 'Date must be a valid YYYY-MM-DD value' }, { status: 400 });
      }
      updates.date = body.date;
    }

    if (body.time !== undefined) {
      if (typeof body.time !== 'string' || !body.time.trim()) {
        return NextResponse.json({ error: 'Time is required' }, { status: 400 });
      }
      const normalizedTime = normalizeSlotTime(body.time);
      if (!TIME_RE.test(normalizedTime)) {
        return NextResponse.json({ error: 'Time must be a valid time value' }, { status: 400 });
      }
      updates.time = normalizedTime;
    }

    if (body.nailTechId !== undefined) {
      if (typeof body.nailTechId !== 'string' || !body.nailTechId.trim()) {
        return NextResponse.json({ error: 'Nail tech is required' }, { status: 400 });
      }
      if (assignedNailTechId && body.nailTechId !== assignedNailTechId) {
        return NextResponse.json({ error: 'You can only assign slots to your assigned nail tech' }, { status: 403 });
      }
      const nailTech = await NailTech.findById(body.nailTechId);
      if (!nailTech) {
        return NextResponse.json({ error: 'Nail tech not found' }, { status: 404 });
      }
      updates.nailTechId = body.nailTechId;
    }

    const nextDate = (updates.date as string | undefined) ?? slot.date;
    const nextTime = (updates.time as string | undefined) ?? normalizeSlotTime(slot.time);
    const nextTechId = String((updates.nailTechId as string | undefined) ?? slot.nailTechId);

    const siblings = await Slot.find({
      date: nextDate,
      nailTechId: nextTechId,
      _id: { $ne: slot._id },
    })
      .select('time')
      .lean();

    const hasConflict = siblings.some((sibling) => normalizeSlotTime(sibling.time) === nextTime);
    if (hasConflict) {
      return NextResponse.json(
        { error: 'A slot already exists at this date and time for this nail tech' },
        { status: 400 }
      );
    }

    const updated = await Slot.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ slot: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update slot' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const slot = await Slot.findById(id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;
    if (assignedNailTechId && String(slot.nailTechId) !== assignedNailTechId) {
      return NextResponse.json({ error: 'You can only delete slots for your assigned nail tech' }, { status: 403 });
    }

    const activeBooking = await Booking.findOne({
      slotIds: { $in: [id] },
      status: { $in: ['pending', 'confirmed'] },
    }).lean();

    if (slot.status === 'pending' || slot.status === 'confirmed' || activeBooking) {
      return NextResponse.json(
        { error: 'Cannot delete a pending or confirmed slot. Use booking actions instead.' },
        { status: 400 }
      );
    }

    if (slot.status !== 'available') {
      return NextResponse.json({ error: `Cannot delete a ${slot.status} slot` }, { status: 400 });
    }

    await Slot.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Slot deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete slot' }, { status: 500 });
  }
}
