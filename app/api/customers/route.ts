import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Booking from '@/lib/models/Booking';

export const dynamic = 'force-dynamic';

let legacyFirebaseIndexChecked = false;

async function ensureLegacyFirebaseIdIndexRemoved() {
  if (legacyFirebaseIndexChecked) return;

  const indexes = await Customer.collection.indexes();
  const legacyIndex = indexes.find((index: any) =>
    index?.name === 'firebaseId_1' || index?.key?.firebaseId === 1
  );

  if (legacyIndex?.name) {
    await Customer.collection.dropIndex(legacyIndex.name);
    console.log(`Dropped legacy customers index: ${legacyIndex.name}`);
  }

  legacyFirebaseIndexChecked = true;
}

/**
 * GET /api/customers
 * List customers with optional search. Returns customers with totalVisits (booking count).
 * Staff with assignedNailTechId only see clients who have bookings with that nail tech.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const assignedNailTechId = (session.user as any)?.assignedNailTechId;

    const query: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { socialMediaName: regex },
      ];
    }

    // Staff with assigned nail tech: only show clients who have bookings with that tech
    if (assignedNailTechId) {
      const customerIdsWithBookings = await Booking.distinct('customerId', {
        nailTechId: assignedNailTechId,
      });
      if (customerIdsWithBookings.length === 0) {
        return NextResponse.json({ customers: [] });
      }
      query._id = { $in: customerIdsWithBookings };
    }

    const customers = await Customer.find(query).sort({ name: 1 }).lean().exec();

    const list = customers.map((c) => ({
      id: String(c._id),
      name: c.name,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      socialMediaName: c.socialMediaName,
      referralSource: c.referralSource,
      referralSourceOther: c.referralSourceOther,
      isRepeatClient: c.isRepeatClient,
      clientType: c.clientType,
      totalBookings: c.totalBookings ?? 0,
      completedBookings: c.completedBookings ?? 0,
      totalSpent: c.totalSpent ?? 0,
      totalTips: c.totalTips ?? 0,
      totalDiscounts: c.totalDiscounts ?? 0,
      lastVisit: c.lastVisit ?? null,
      notes: c.notes,
      nailHistory: c.nailHistory,
      healthInfo: c.healthInfo,
      inspoDescription: c.inspoDescription,
      waiverAccepted: c.waiverAccepted,
      isActive: c.isActive ?? true,
      isVIP: c.isVIP ?? false,
      totalVisits: c.totalBookings ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ customers: list });
  } catch (error: any) {
    console.error('Error listing customers:', error);
    return NextResponse.json({ error: error.message || 'Failed to list customers' }, { status: 500 });
  }
}

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((s) => s.trim()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  socialMediaName: z.string().optional(),
  referralSource: z.string().optional(),
  referralSourceOther: z.string().optional(),
  howDidYouFindUs: z.string().optional(),
  howDidYouFindUsOther: z.string().optional(),
  clientType: z.enum(['NEW', 'REPEAT', 'new', 'repeat']).optional(),
  notes: z.string().max(5000).optional(),
  isVIP: z.boolean().optional(),
  nailHistory: z.any().optional(),
  healthInfo: z.any().optional(),
  inspoDescription: z.string().optional(),
  waiverAccepted: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await connectDB();
    await ensureLegacyFirebaseIdIndexRemoved();
    const body = await request.json();

    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const name = data.name;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check duplicate by phone or email
    if (data.phone) {
      const existing = await Customer.findOne({ phone: data.phone });
      if (existing) {
        return NextResponse.json({ error: 'Customer with this phone already exists' }, { status: 400 });
      }
    }
    if (data.email) {
      const existing = await Customer.findOne({ email: data.email.toLowerCase() });
      if (existing) {
        return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 });
      }
    }

    const customer = await Customer.create({
      name,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      phone: data.phone?.trim(),
      socialMediaName: data.socialMediaName?.trim(),
      referralSource: (data.referralSource?.trim() || data.howDidYouFindUs?.trim()) || undefined,
      referralSourceOther: (data.referralSourceOther?.trim() || data.howDidYouFindUsOther?.trim()) || undefined,
      clientType: (data.clientType || '').toString().toUpperCase() === 'REPEAT' ? 'REPEAT' : 'NEW',
      totalBookings: 0,
      completedBookings: 0,
      totalSpent: 0,
      totalTips: 0,
      totalDiscounts: 0,
      lastVisit: null,
      notes: data.notes?.trim(),
      isVIP: data.isVIP === true,
      nailHistory: data.nailHistory,
      healthInfo: data.healthInfo,
      inspoDescription: data.inspoDescription?.trim(),
      waiverAccepted: typeof data.waiverAccepted === 'boolean'
        ? data.waiverAccepted
        : (body as { waiverAccepted?: string }).waiverAccepted === 'accept',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);

    if (
      error?.code === 11000 &&
      (error?.keyPattern?.firebaseId === 1 || error?.message?.includes('firebaseId_1'))
    ) {
      return NextResponse.json(
        { error: 'Legacy Firebase index conflict detected. Please retry the request.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
