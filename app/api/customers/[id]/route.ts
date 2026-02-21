import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Booking from '@/lib/models/Booking';
import type { CustomerInput } from '@/lib/types';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const bookings = await Booking.find({ customerId: id }).sort({ createdAt: -1 }).lean();
    const lifetimeValue = bookings.reduce((total, booking: any) => {
      const totalAmount = booking.pricing?.total || 0;
      const tipAmount = booking.pricing?.tipAmount || 0;
      return total + totalAmount + tipAmount;
    }, 0);

    return NextResponse.json({ 
      customer: {
        id: String(customer._id),
        name: customer.name,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        socialMediaName: customer.socialMediaName,
        referralSource: customer.referralSource,
        referralSourceOther: customer.referralSourceOther,
        isRepeatClient: customer.isRepeatClient,
        clientType: customer.clientType,
        totalBookings: customer.totalBookings ?? 0,
        completedBookings: customer.completedBookings ?? 0,
        totalSpent: customer.totalSpent ?? 0,
        totalTips: customer.totalTips ?? 0,
        totalDiscounts: customer.totalDiscounts ?? 0,
        lastVisit: customer.lastVisit ?? null,
        notes: customer.notes,
        nailHistory: customer.nailHistory,
        healthInfo: customer.healthInfo,
        inspoDescription: customer.inspoDescription,
        waiverAccepted: customer.waiverAccepted,
        isActive: customer.isActive ?? true,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      bookings: bookings.map((booking: any) => ({
        id: String(booking._id),
        bookingCode: booking.bookingCode,
        slotIds: booking.slotIds,
        nailTechId: booking.nailTechId,
        service: booking.service,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        pricing: booking.pricing,
        payment: booking.payment,
        completedAt: booking.completedAt || null,
        confirmedAt: booking.confirmedAt || null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      })),
      lifetimeValue,
      bookingCount: bookings.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to get customer.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      socialMediaName,
      referralSource,
      referralSourceOther,
      notes,
      nailHistory,
      healthInfo,
      inspoDescription,
      waiverAccepted,
      isActive,
    } = body ?? {};

    const updates: Partial<CustomerInput> = {};
    if (name !== undefined) updates.name = name;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (socialMediaName !== undefined) updates.socialMediaName = socialMediaName;
    if (referralSource !== undefined) updates.referralSource = referralSource;
    if (referralSourceOther !== undefined) updates.referralSourceOther = referralSourceOther;
    if (notes !== undefined) updates.notes = notes;
    if (nailHistory !== undefined) updates.nailHistory = nailHistory;
    if (healthInfo !== undefined) updates.healthInfo = healthInfo;
    if (inspoDescription !== undefined) updates.inspoDescription = inspoDescription;
    if (waiverAccepted !== undefined) updates.waiverAccepted = waiverAccepted;
    if (isActive !== undefined) updates.isActive = isActive;

    await connectDB();
    const customer = await Customer.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
    return NextResponse.json({
      customer: {
        id: String(customer._id),
        name: customer.name,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        socialMediaName: customer.socialMediaName,
        referralSource: customer.referralSource,
        referralSourceOther: customer.referralSourceOther,
        isRepeatClient: customer.isRepeatClient,
        clientType: customer.clientType,
        totalBookings: customer.totalBookings ?? 0,
        completedBookings: customer.completedBookings ?? 0,
        totalSpent: customer.totalSpent ?? 0,
        totalTips: customer.totalTips ?? 0,
        totalDiscounts: customer.totalDiscounts ?? 0,
        lastVisit: customer.lastVisit ?? null,
        notes: customer.notes,
        nailHistory: customer.nailHistory,
        healthInfo: customer.healthInfo,
        inspoDescription: customer.inspoDescription,
        waiverAccepted: customer.waiverAccepted,
        isActive: customer.isActive ?? true,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to update customer.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      customerId: id,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (activeBookings > 0) {
      return NextResponse.json({ error: 'Cannot delete customer with active bookings' }, { status: 400 });
    }

    await Customer.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
