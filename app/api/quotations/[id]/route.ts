import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Quotation from '@/lib/models/Quotation';
import { authOptions } from '@/lib/auth-options';
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

const patchQuotationSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  items: z.array(z.any()).optional(),
  subtotal: z.number().optional(),
  discountRate: z.number().optional(),
  discountAmount: z.number().optional(),
  squeezeInFee: z.number().optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted']).optional(),
});

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
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();

    await connectDB();
    const { id } = await params;
    if (!id?.trim()) throw new ValidationError('Quotation ID required');
    const quotation = await findQuotationById(id);
    if (!quotation) throw new NotFoundError('Quotation not found');
    return NextResponse.json({ quotation: quotation.toObject ? quotation.toObject() : quotation });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const parsed = patchQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const quotation = await findQuotationById(id);
    if (!quotation) throw new NotFoundError('Quotation not found');
    Object.assign(quotation, parsed.data);
    await quotation.save();
    return NextResponse.json({ quotation });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();

    await connectDB();
    const { id } = await params;
    const quotation = await findQuotationById(id);
    if (!quotation) throw new NotFoundError('Quotation not found');
    await Quotation.findByIdAndDelete(quotation._id);
    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    return handleApiError(error, request);
  }
}
