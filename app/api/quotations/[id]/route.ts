import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/lib/models/Quotation';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const quotation = await Quotation.findById(id).lean();
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json({ quotation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const quotation = await Quotation.findByIdAndUpdate(id, body, { new: true });
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json({ quotation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    await Quotation.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quotation' }, { status: 500 });
  }
}
