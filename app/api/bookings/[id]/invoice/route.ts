import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import NailTech from '@/lib/models/NailTech';
import Quotation from '@/lib/models/Quotation';
import { recomputeCustomerStats } from '@/lib/services/bookingService';
import { isDualTechManiPediExpress, sumStoredInvoiceDiscounts } from '@/lib/utils/bookingInvoice';

async function findQuotationById(id: string) {
  if (!id?.trim()) return null;
  const t = id.trim();
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(t);
  let doc = isObjectId ? await Quotation.findById(t) : await Quotation.findOne({ firebaseId: t });
  if (!doc && isObjectId) doc = await Quotation.findOne({ firebaseId: t });
  return doc;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!['confirmed', 'completed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Invoice can only be created for confirmed or completed bookings' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const depositRequired =
      typeof body.depositRequired === 'number' && body.depositRequired >= 0 ? body.depositRequired : undefined;
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    const customer = await Customer.findById(booking.customerId);
    const customerName = customer?.name || 'Unknown Client';
    const customerPhone = customer?.phone || '';
    const customerEmail = customer?.email || '';

    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);

    const requestedInvoiceNailTechId =
      typeof body.nailTechId === 'string' && body.nailTechId.trim() ? body.nailTechId.trim() : undefined;
    const allowedNailTechIds = new Set(
      [booking.nailTechId, booking.service?.secondaryNailTechId]
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim())
    );

    if (!requestedInvoiceNailTechId || !allowedNailTechIds.has(requestedInvoiceNailTechId)) {
      return NextResponse.json(
        { error: 'nailTechId must match this booking primary or secondary nail tech' },
        { status: 400 }
      );
    }
    const invoiceNailTechId = requestedInvoiceNailTechId;

    const dual = isDualTechManiPediExpress(booking);
    const secondaryTechId = booking.service?.secondaryNailTechId?.trim();
    const isSecondarySegment = Boolean(dual && secondaryTechId && invoiceNailTechId === secondaryTechId);

    let squeezeInFee =
      typeof body.squeezeInFee === 'number' && body.squeezeInFee >= 0 ? body.squeezeInFee : 0;
    if (isSecondarySegment) {
      squeezeInFee = 0;
    }

    const nailTech = invoiceNailTechId ? await NailTech.findById(invoiceNailTechId).lean() : null;
    const nailTechDiscountRate =
      typeof (nailTech as { discount?: number })?.discount === 'number' &&
      (nailTech as { discount: number }).discount > 0
        ? (nailTech as { discount: number }).discount
        : 0;
    const hasExplicitDiscountAmount = typeof body.discountAmount === 'number' && body.discountAmount >= 0;
    const requestedDiscountAmount = hasExplicitDiscountAmount ? body.discountAmount : undefined;
    const fallbackDiscountRate =
      nailTechDiscountRate > 0
        ? nailTechDiscountRate
        : typeof body.discountRate === 'number' && body.discountRate >= 0
          ? body.discountRate
          : 0;
    const discountAmount = hasExplicitDiscountAmount
      ? requestedDiscountAmount!
      : Math.round(subtotal * (fallbackDiscountRate / 100));
    const discountRate = subtotal > 0 ? Math.round((discountAmount / subtotal) * 10000) / 100 : 0;
    const totalAmount = subtotal - discountAmount + squeezeInFee;

    const quotationPayload = {
      customerName,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      discountRate,
      discountAmount,
      squeezeInFee,
      totalAmount,
      status: 'accepted' as const,
      notes: body.notes?.trim() || (booking.bookingCode ? `Booking: ${booking.bookingCode}` : undefined),
    };

    const prevSlice = isSecondarySegment ? booking.secondaryInvoice : booking.invoice;
    const existingQuotId = prevSlice?.quotationId;

    let quotation;
    if (existingQuotId) {
      const existing = await findQuotationById(existingQuotId);
      if (!existing) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      const refVariants = [
        String(existing._id),
        typeof (existing as { firebaseId?: string }).firebaseId === 'string'
          ? (existing as { firebaseId: string }).firebaseId
          : undefined,
        existingQuotId.trim(),
        existingQuotId,
      ].filter((x): x is string => typeof x === 'string' && x.length > 0);
      const uniqRefs = [...new Set(refVariants)];

      const sharedWithOtherBookings = await Booking.exists({
        _id: { $ne: booking._id },
        $or: [
          { 'invoice.quotationId': { $in: uniqRefs } },
          { 'secondaryInvoice.quotationId': { $in: uniqRefs } },
        ],
      });

      if (sharedWithOtherBookings) {
        quotation = await Quotation.create(quotationPayload);
      } else {
        const updated = await Quotation.findByIdAndUpdate(existing._id, quotationPayload, { new: true });
        if (!updated) {
          return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
        }
        quotation = updated;
      }
    } else {
      quotation = await Quotation.create(quotationPayload);
    }

    if (!quotation) {
      return NextResponse.json({ error: 'Failed to save quotation' }, { status: 500 });
    }

    const slicePayload = {
      quotationId: quotation._id.toString(),
      total: totalAmount,
      nailTechId: invoiceNailTechId,
      createdAt: prevSlice?.createdAt || new Date(),
      discountAmount,
    };

    if (isSecondarySegment) {
      booking.secondaryInvoice = slicePayload;
    } else {
      booking.invoice = slicePayload;
    }

    if (dual) {
      booking.pricing = {
        ...booking.pricing,
        total:
          (Number(booking.invoice?.total) || 0) + (Number(booking.secondaryInvoice?.total) || 0),
        depositRequired: depositRequired ?? booking.pricing?.depositRequired ?? 0,
        discountAmount: sumStoredInvoiceDiscounts(booking),
      };
    } else {
      booking.pricing = {
        ...booking.pricing,
        total: totalAmount,
        depositRequired: depositRequired ?? booking.pricing?.depositRequired ?? 0,
        discountAmount,
      };
    }

    await booking.save();
    await recomputeCustomerStats(booking.customerId);

    return NextResponse.json({
      quotation,
      booking: {
        id: booking._id.toString(),
        invoice: booking.invoice,
        secondaryInvoice: booking.secondaryInvoice,
        pricing: booking.pricing,
      },
    });
  } catch (error: any) {
    console.error('Error creating booking invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
