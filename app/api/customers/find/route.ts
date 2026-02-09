import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json({ error: 'Either email or phone parameter is required.' }, { status: 400 });
    }

    await connectDB();
    let customer: any = null;
    
    // Try email first if provided
    if (email && email.trim()) {
      customer = await Customer.findOne({ email: email.trim().toLowerCase() }).lean();
    }
    
    // If no customer found by email and phone is provided, try phone
    if (!customer && phone && phone.trim()) {
      customer = await Customer.findOne({ phone: phone.trim() }).lean();
    }
    
    if (!customer) {
      return NextResponse.json({ customer: null, found: false });
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
      },
      found: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to find customer.' }, { status: 500 });
  }
}

