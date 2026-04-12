import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Booking from '@/lib/models/Booking';
import type { CustomerInput } from '@/lib/types';
import { authOptions } from '@/lib/auth-options';
import { requireCanDeleteCustomer } from '@/lib/api-rbac';
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/apiError';
import { getCombinedInvoiceTotal, hasAnyRealInvoice } from '@/lib/utils/bookingInvoice';

const patchCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  socialMediaName: z.string().optional(),
  referralSource: z.string().optional(),
  referralSourceOther: z.string().optional(),
  notes: z.string().max(5000).optional(),
  nailHistory: z.any().optional(),
  healthInfo: z.any().optional(),
  inspoDescription: z.string().optional(),
  waiverAccepted: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isVIP: z.boolean().optional(),
});

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();

    await connectDB();
    const { id } = await params;
    const assignedNailTechId = (session.user as { assignedNailTechId?: string })?.assignedNailTechId;

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Staff with assigned nail tech: only allow access if customer has bookings with that tech
    if (assignedNailTechId) {
      const hasBookingWithTech = await Booking.exists({
        customerId: id,
        nailTechId: assignedNailTechId,
      });
      if (!hasBookingWithTech) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const bookings = await Booking.find({ customerId: id }).sort({ createdAt: -1 }).lean();
    const lifetimeValue = bookings.reduce((total, booking: any) => {
      const hasInvoice = hasAnyRealInvoice(booking);
      const totalAmount = hasInvoice ? getCombinedInvoiceTotal(booking) : 0;
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
        isVIP: customer.isVIP ?? false,
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
    const assignedNailTechId = (session.user as { assignedNailTechId?: string })?.assignedNailTechId;

    if (assignedNailTechId) {
      const hasBookingWithTech = await Booking.exists({
        customerId: id,
        nailTechId: assignedNailTechId,
      });
      if (!hasBookingWithTech) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const parsed = patchCustomerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten());
    }
    const data = parsed.data;
    const updates: Partial<CustomerInput> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.email !== undefined) updates.email = data.email || undefined;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.socialMediaName !== undefined) updates.socialMediaName = data.socialMediaName;
    if (data.referralSource !== undefined) updates.referralSource = data.referralSource;
    if (data.referralSourceOther !== undefined) updates.referralSourceOther = data.referralSourceOther;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.nailHistory !== undefined) updates.nailHistory = data.nailHistory;
    if (data.healthInfo !== undefined) updates.healthInfo = data.healthInfo;
    if (data.inspoDescription !== undefined) updates.inspoDescription = data.inspoDescription;
    if (data.waiverAccepted !== undefined) updates.waiverAccepted = data.waiverAccepted;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.isVIP !== undefined) updates.isVIP = data.isVIP;

    await connectDB();
    const customer = await Customer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: false }
    ).lean();
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
        isVIP: customer.isVIP ?? false,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
    });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const forbid = await requireCanDeleteCustomer(session, id, request);
    if (forbid) return forbid;

    await connectDB();
    const assignedNailTechId = (session!.user as { assignedNailTechId?: string })?.assignedNailTechId;

    if (assignedNailTechId) {
      const hasBookingWithTech = await Booking.exists({
        customerId: id,
        nailTechId: assignedNailTechId,
      });
      if (!hasBookingWithTech) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
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
  } catch (error) {
    return handleApiError(error, request);
  }
}
