import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import Quotation from '@/lib/models/Quotation';
import { recomputeCustomerStats } from '@/lib/services/bookingService';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Invoice can only be created for confirmed bookings' }, { status: 400 });
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
    const discountRate =
      typeof body.discountRate === 'number' && body.discountRate >= 0 ? body.discountRate : 0;
    const discountAmount =
      typeof body.discountAmount === 'number' && body.discountAmount >= 0
        ? body.discountAmount
        : Math.round(subtotal * (discountRate / 100));
    const squeezeInFee =
      typeof body.squeezeInFee === 'number' && body.squeezeInFee >= 0 ? body.squeezeInFee : 0;
    const totalAmount = subtotal - discountAmount + squeezeInFee;

    let quotation;
    if (booking.invoice?.quotationId) {
      quotation = await Quotation.findByIdAndUpdate(
        booking.invoice.quotationId,
        {
          customerName,
          customerPhone,
          customerEmail,
          items,
          subtotal,
          discountRate,
          discountAmount,
          squeezeInFee,
          totalAmount,
          status: 'accepted',
          notes: body.notes?.trim() || (booking.bookingCode ? `Booking: ${booking.bookingCode}` : undefined),
        },
        { new: true }
      );
      if (!quotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }
    } else {
      quotation = await Quotation.create({
        customerName,
        customerPhone,
        customerEmail,
        items,
        subtotal,
        discountRate,
        discountAmount,
        squeezeInFee,
        totalAmount,
        status: 'accepted',
        notes: body.notes?.trim() || (booking.bookingCode ? `Booking: ${booking.bookingCode}` : undefined),
      });
    }

    booking.invoice = {
      quotationId: quotation._id.toString(),
      total: totalAmount,
      createdAt: booking.invoice?.createdAt || new Date(),
    };
    booking.pricing = {
      ...booking.pricing,
      total: totalAmount,
      depositRequired: depositRequired ?? booking.pricing?.depositRequired ?? 0,
      discountAmount,
    };
    await booking.save();
    await recomputeCustomerStats(booking.customerId);

    return NextResponse.json({ quotation, booking: { id: booking._id.toString(), invoice: booking.invoice } });
  } catch (error: any) {
    console.error('Error creating booking invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
