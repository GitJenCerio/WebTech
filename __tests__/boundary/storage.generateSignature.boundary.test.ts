import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { POST as generateSignature } from '@/app/api/integrations/storage/generate-signature/route';

jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  generateSignature: () => ({ signature: 'sig', timestamp: 123 }),
}));

describe('boundary/validation: storage generate-signature', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await Booking.deleteMany({ bookingCode: 'JEST-SIG' });
  });

  it('rejects missing bookingId (400)', async () => {
    const req = new Request('http://localhost/api/integrations/storage/generate-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoType: 'inspiration' }),
    });
    const res = await generateSignature(req);
    expect(res.status).toBe(400);
  });

  it('enforces max 3 photos per type (400)', async () => {
    const booking = await Booking.create({
      bookingCode: 'JEST-SIG',
      customerId: '000000000000000000000000',
      nailTechId: '000000000000000000000000',
      slotIds: [],
      status: 'pending',
      paymentStatus: 'unpaid',
      service: { type: 'Manicure', location: 'homebased_studio', clientType: 'new' },
      clientPhotos: {
        inspiration: [
          { url: '1', publicId: 'p1' },
          { url: '2', publicId: 'p2' },
          { url: '3', publicId: 'p3' },
        ],
        currentState: [],
      },
      pricing: { total: 0, depositRequired: 0, paidAmount: 0, tipAmount: 0 },
    });

    const req = new Request('http://localhost/api/integrations/storage/generate-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking._id.toString(), photoType: 'inspiration' }),
    });
    const res = await generateSignature(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Maximum 3 photos/i);
  });
});

