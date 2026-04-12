/**
 * Functional tests for core booking lifecycle using route handlers.
 *
 * Uses real MongoDB and mocks external integrations (email + Google Sheets).
 */

import connectDB from '@/lib/mongodb';
import NailTech from '@/lib/models/NailTech';
import Slot from '@/lib/models/Slot';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import { POST as createBooking } from '@/app/api/bookings/route';
import { PATCH as updateBooking } from '@/app/api/bookings/[id]/route';

jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendBookingPendingEmail: async () => ({ emailSent: true }),
  sendBookingConfirmedEmail: async () => ({ emailSent: true }),
  sendBookingRescheduledEmail: async () => ({ emailSent: true }),
}));

jest.mock('@/lib/services/googleSheetsService', () => ({
  __esModule: true,
  syncBookingToSheet: async () => {},
  syncFinanceToSheet: async () => {},
}));

jest.mock('@/lib/services/googleSheetsBackup', () => ({
  __esModule: true,
  backupBooking: async () => {},
}));

// booking create route reads session for staff scoping; for these functional tests, no session is fine.
jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: async () => null,
}));

describe('functional: booking lifecycle', () => {
  let nailTechId: string;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await Promise.all([
      Booking.deleteMany({ bookingCode: /JEST-/ }),
      Customer.deleteMany({ email: 'jest.customer@example.com' }),
      Slot.deleteMany({ notes: 'JEST' }),
      NailTech.deleteMany({ name: 'JEST TECH' }),
    ]);

    const tech = await NailTech.create({
      name: 'JEST TECH',
      role: 'Junior Tech',
      serviceAvailability: 'Studio only',
      workingDays: [],
      status: 'Active',
    });
    nailTechId = tech._id.toString();
  });

  it('creates booking (pending) from customer submission and then confirms it (functional)', async () => {
    const slot = await Slot.create({
      nailTechId,
      date: '2026-04-01',
      time: '10:00',
      status: 'available',
      notes: 'JEST',
      isHidden: false,
    });

    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotIds: [slot._id.toString()],
        nailTechId,
        customer: {
          name: 'Jest Customer',
          email: 'jest.customer@example.com',
          phone: '09170000000',
        },
        service: {
          type: 'Manicure',
          location: 'homebased_studio',
          clientType: 'NEW',
        },
        pricing: { total: 0, depositRequired: 0 },
      }),
    });

    const res = await createBooking(req);
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.booking?.status).toBe('pending');
    const bookingId = body.booking?.id as string | undefined;
    expect(bookingId).toBeTruthy();

    const created = await Booking.findById(bookingId).lean();
    expect(created).toBeTruthy();

    const patchReq = new Request(`http://localhost/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'manual_confirm', paidAmount: 0, tipAmount: 0 }),
    });
    const patchRes = await updateBooking(patchReq, { params: Promise.resolve({ id: bookingId! }) });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.booking?.status).toBe('confirmed');
  });
});

