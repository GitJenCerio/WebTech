import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/lib/models/Quotation';

/** Resolve quotation by _id or firebaseId (migrated docs may reference either). */
async function findQuotationById(id: string) {
  const trimmed = id?.trim();
  if (!trimmed) return null;
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(trimmed);
  let doc = isObjectId ? await Quotation.findById(trimmed) : await Quotation.findOne({ firebaseId: trimmed });
  if (!doc && isObjectId) doc = await Quotation.findOne({ firebaseId: trimmed });
  return doc;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Quotation ID required' }, { status: 400 });
    }
    const quotation = await findQuotationById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json({ quotation: quotation.toObject ? quotation.toObject() : quotation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const quotation = await findQuotationById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    Object.assign(quotation, body);
    await quotation.save();
    return NextResponse.json({ quotation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const quotation = await findQuotationById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    await Quotation.findByIdAndDelete(quotation._id);
    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quotation' }, { status: 500 });
  }
}
