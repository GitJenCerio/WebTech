import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/services/bookingService';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { slotId, serviceType, pairedSlotId, linkedSlotIds, clientType, repeatClientEmail, serviceLocation, socialMediaName } = body ?? {};

  if (!slotId) {
    return NextResponse.json({ error: 'Missing slotId.' }, { status: 400 });
  }

  try {
    const result = await createBooking(slotId, { serviceType, pairedSlotId, linkedSlotIds, clientType, repeatClientEmail, serviceLocation, socialMediaName });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to create booking.' }, { status: 400 });
  }
}

