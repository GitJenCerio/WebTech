import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quotation from '@/lib/models/Quotation';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    const quotation = await Quotation.create({
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone?.trim(),
      customerEmail: body.customerEmail?.trim(),
      items: body.items,
      subtotal: body.subtotal || 0,
      discountRate: body.discountRate || 0,
      discountAmount: body.discountAmount || 0,
      squeezeInFee: body.squeezeInFee || 0,
      totalAmount: body.totalAmount || 0,
      notes: body.notes?.trim(),
      status: body.status || 'draft',
      createdBy: body.createdBy,
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create quotation' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const query: any = {};
    if (searchParams.get('status')) query.status = searchParams.get('status');
    if (searchParams.get('customerName')) {
      query.customerName = { $regex: searchParams.get('customerName'), $options: 'i' };
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      Quotation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Quotation.countDocuments(query),
    ]);

    return NextResponse.json({
      quotations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch quotations' }, { status: 500 });
  }
}
