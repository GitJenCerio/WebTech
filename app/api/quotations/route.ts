import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Quotation from '@/lib/models/Quotation';
import { authOptions } from '@/lib/auth-options';
import { handleApiError, UnauthorizedError, ValidationError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

const createQuotationSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').transform((s) => s.trim()),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  items: z.array(z.any()).min(1, 'At least one item is required'),
  subtotal: z.number().optional(),
  discountRate: z.number().optional(),
  discountAmount: z.number().optional(),
  squeezeInFee: z.number().optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted']).optional(),
  createdBy: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError();
    }

    await connectDB();
    const body = await request.json();
    const parsed = createQuotationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten());
    }

    const quotation = await Quotation.create({
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone?.trim(),
      customerEmail: parsed.data.customerEmail?.trim() || undefined,
      items: parsed.data.items,
      subtotal: parsed.data.subtotal ?? 0,
      discountRate: parsed.data.discountRate ?? 0,
      discountAmount: parsed.data.discountAmount ?? 0,
      squeezeInFee: parsed.data.squeezeInFee ?? 0,
      totalAmount: parsed.data.totalAmount ?? 0,
      notes: parsed.data.notes?.trim(),
      status: parsed.data.status ?? 'draft',
      createdBy: parsed.data.createdBy,
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError();
    }

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
  } catch (error) {
    return handleApiError(error, request);
  }
}
