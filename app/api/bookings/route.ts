import { NextResponse } from 'next/server';
import { createBooking, listBookings, type CreateBookingInput } from '@/lib/services/bookingService';
import type { BookingStatus, PaymentStatus } from '@/lib/types';
import { sendBookingPendingEmail } from '@/lib/email';
import Customer from '@/lib/models/Customer';
import { createUploadProofToken } from '@/lib/uploadProofToken';
import connectDB from '@/lib/mongodb';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slotIds,
      customerId,
      nailTechId,
      service, 
      pricing,
      customerEmail,
      customer,
      clientNotes,
      adminNotes,
    } = body;

    // Validate required fields
    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      return NextResponse.json({ error: 'At least one slot ID is required' }, { status: 400 });
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      if (!customer || !customer.name || !String(customer.name).trim()) {
        return NextResponse.json({ error: 'Customer ID or customer details are required' }, { status: 400 });
      }
      await connectDB();
      const createdCustomer = await Customer.create({
        name: String(customer.name).trim(),
        firstName: customer.firstName?.trim(),
        lastName: customer.lastName?.trim(),
        email: customer.email ? String(customer.email).toLowerCase().trim() : undefined,
        phone: customer.phone?.trim(),
        socialMediaName: customer.socialMediaName?.trim(),
        referralSource: customer.referralSource?.trim() || customer.howDidYouFindUs?.trim(),
        referralSourceOther: customer.referralSourceOther?.trim() || customer.howDidYouFindUsOther?.trim(),
        clientType: customer.clientType?.toUpperCase() === 'REPEAT' ? 'REPEAT' : 'NEW',
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        totalTips: 0,
        totalDiscounts: 0,
        lastVisit: null,
        notes: customer.notes?.trim(),
        nailHistory: customer.nailHistory,
        healthInfo: customer.healthInfo,
        inspoDescription: customer.inspoDescription?.trim(),
        waiverAccepted: typeof customer.waiverAccepted === 'boolean'
          ? customer.waiverAccepted
          : customer.waiverAccepted === 'accept',
        isActive: customer.isActive !== undefined ? Boolean(customer.isActive) : true,
      });
      resolvedCustomerId = createdCustomer._id.toString();
    }

    if (!nailTechId) {
      return NextResponse.json({ error: 'Nail tech ID is required' }, { status: 400 });
    }

    if (!service || !service.type || !service.location || !service.clientType) {
      return NextResponse.json({ 
        error: 'Service information is required (type, location, clientType)' 
      }, { status: 400 });
    }

    const pricingTotal = 0;
    const pricingDeposit = 0;

    const input: CreateBookingInput = {
      slotIds,
      customerId: resolvedCustomerId,
      nailTechId,
      service: {
        type: service.type,
        location: service.location,
        clientType: service.clientType,
      },
      pricing: {
        total: pricingTotal,
        depositRequired: pricingDeposit,
      },
      clientNotes: typeof clientNotes === 'string' ? clientNotes.trim() : undefined,
      adminNotes: typeof adminNotes === 'string' ? adminNotes.trim() : undefined,
    };

    const normalizedCustomerEmail =
      typeof customerEmail === 'string' ? customerEmail.trim().toLowerCase() : '';

    const booking = await createBooking(input);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '';
    const uploadProofToken = createUploadProofToken(booking._id.toString());
    const uploadProofPath = `/booking/upload-proof?token=${encodeURIComponent(uploadProofToken)}`;
    const uploadProofLink = baseUrl ? `${baseUrl}${uploadProofPath}` : uploadProofPath;

    // Send confirmation email and backup to Google Sheets (non-blocking)
    Customer.findById(resolvedCustomerId)
      .then(customer => {
        if (customer) {
          const emailToUse = customer.email || normalizedCustomerEmail;
          if (!emailToUse) {
            console.warn(`Skipping booking confirmation email for ${booking.bookingCode}: no customer email`);
            return;
          }

          if (!customer.email && normalizedCustomerEmail) {
            customer.email = normalizedCustomerEmail;
            customer.save().catch(err =>
              console.error('Failed to save customer fallback email:', err)
            );
          }

          sendBookingPendingEmail(booking, { ...customer.toObject(), email: emailToUse }).catch(err =>
            console.error('Failed to send booking confirmation email:', err)
          );
        }
      })
      .catch(err => console.error('Failed to fetch customer for email:', err));

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        customerId: booking.customerId,
        nailTechId: booking.nailTechId,
        slotIds: booking.slotIds,
        service: booking.service,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        pricing: booking.pricing,
        payment: booking.payment,
        completedAt: booking.completedAt?.toISOString() || null,
        confirmedAt: booking.confirmedAt?.toISOString() || null,
        invoice: booking.invoice || null,
        clientNotes: booking.clientNotes || '',
        adminNotes: booking.adminNotes || '',
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      },
      uploadProofLink: uploadProofLink || undefined,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create booking' 
    }, { status: 400 });
  }
}

/**
 * GET /api/bookings
 * List bookings with optional filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: {
      customerId?: string;
      nailTechId?: string;
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {};

    const range = searchParams.get('range');
    if (range && !searchParams.get('startDate') && !searchParams.get('endDate')) {
      const rangeLower = range.toLowerCase();
      const { startDate, endDate } = getManilaRange(rangeLower);
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
    }

    if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId')!;
    }

    if (searchParams.get('nailTechId')) {
      filters.nailTechId = searchParams.get('nailTechId')!;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as BookingStatus;
    }

    if (searchParams.get('paymentStatus')) {
      filters.paymentStatus = searchParams.get('paymentStatus') as PaymentStatus;
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!, 10);
    }

    const bookings = await listBookings(filters);
    const customerIds = Array.from(new Set(bookings.map(b => String(b.customerId)).filter(Boolean)));
    const slotIds = Array.from(new Set(bookings.flatMap((b) => (b.slotIds || []).map(String))));
    const customers = customerIds.length
      ? await Customer.find({ _id: { $in: customerIds } })
          .select('_id name email phone socialMediaName')
          .lean()
      : [];
    const customerById = new Map(
      customers.map((customer: any) => [
        String(customer._id),
        {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          socialMediaName: customer.socialMediaName,
        },
      ])
    );

    const slots = slotIds.length
      ? await (await import('@/lib/models/Slot')).default.find({ _id: { $in: slotIds } })
          .select('_id date time')
          .lean()
      : [];
    const slotById = new Map(slots.map((slot: any) => [String(slot._id), { date: slot.date, time: slot.time }]));

    return NextResponse.json({
      bookings: bookings.map(booking => {
        const firstSlotId = (booking.slotIds || [])[0];
        const slotInfo = firstSlotId ? slotById.get(String(firstSlotId)) : undefined;
        return {
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        customerId: booking.customerId,
        customerName: customerById.get(String(booking.customerId))?.name || 'Unknown Client',
        customerEmail: customerById.get(String(booking.customerId))?.email || '',
        customerPhone: customerById.get(String(booking.customerId))?.phone || '',
        customerSocialMediaName: customerById.get(String(booking.customerId))?.socialMediaName || '',
        nailTechId: booking.nailTechId,
        slotIds: booking.slotIds,
        appointmentDate: slotInfo?.date || null,
        appointmentTime: slotInfo?.time || null,
        service: booking.service,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        pricing: booking.pricing,
        payment: booking.payment,
        completedAt: booking.completedAt?.toISOString() || null,
        confirmedAt: booking.confirmedAt?.toISOString() || null,
        invoice: booking.invoice || null,
        clientNotes: booking.clientNotes || '',
        adminNotes: booking.adminNotes || '',
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      };
      })
    });
  } catch (error: any) {
    console.error('Error listing bookings:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to list bookings' 
    }, { status: 500 });
  }
}

function getManilaRange(range: string): { startDate?: Date; endDate?: Date } {
  const manilaNow = new Date();
  const { year, month, day } = getManilaDateParts(manilaNow);
  if (!year || !month || !day) return {};

  if (range === 'today') {
    return getManilaDayRange(year, month, day);
  }

  if (range === 'week') {
    const startOfWeek = getManilaWeekStart(year, month, day);
    return getManilaRangeFromStart(startOfWeek.year, startOfWeek.month, startOfWeek.day, 7);
  }

  if (range === 'month') {
    const startDate = getManilaStartOfMonth(year, month);
    const endDate = getManilaStartOfMonth(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
    return { startDate, endDate };
  }

  return {};
}

function getManilaDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);
  return { year, month, day };
}

function manilaMidnightToUtc(year: number, month: number, day: number): Date {
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0);
  const manilaOffsetMs = 8 * 60 * 60 * 1000;
  return new Date(utcMidnight - manilaOffsetMs);
}

function getManilaDayRange(year: number, month: number, day: number): { startDate: Date; endDate: Date } {
  const startDate = manilaMidnightToUtc(year, month, day);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

function getManilaRangeFromStart(year: number, month: number, day: number, days: number): { startDate: Date; endDate: Date } {
  const startDate = manilaMidnightToUtc(year, month, day);
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

function getManilaWeekStart(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const dateUtc = new Date(Date.UTC(year, month - 1, day));
  const dow = dateUtc.getUTCDay(); // 0 Sun ... 6 Sat
  const offset = (dow + 6) % 7; // Monday = 0
  const startDate = new Date(Date.UTC(year, month - 1, day - offset));
  return { year: startDate.getUTCFullYear(), month: startDate.getUTCMonth() + 1, day: startDate.getUTCDate() };
}

function getManilaStartOfMonth(year: number, month: number): Date {
  return manilaMidnightToUtc(year, month, 1);
}
