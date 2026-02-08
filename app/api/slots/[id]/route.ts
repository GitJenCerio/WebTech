import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const slot = await Slot.findById(params.id).lean();
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    return NextResponse.json({ slot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch slot' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();

    const slot = await Slot.findById(params.id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const allowedUpdates = ['status', 'notes', 'slotType', 'isHidden'];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const updated = await Slot.findByIdAndUpdate(params.id, updates, { new: true });
    return NextResponse.json({ slot: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update slot' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const slot = await Slot.findById(params.id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.status !== 'available') {
      return NextResponse.json({ error: `Cannot delete a ${slot.status} slot` }, { status: 400 });
    }

    await Slot.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Slot deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete slot' }, { status: 500 });
  }
}
