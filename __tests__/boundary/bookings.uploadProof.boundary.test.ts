import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { POST as uploadProof } from '@/app/api/bookings/upload-proof/route';

jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  uploadImage: async () => ({ secure_url: 'https://example.com/p.png', public_id: 'pid' }),
  deleteImage: async () => {},
}));

jest.mock('@/lib/uploadProofToken', () => ({
  __esModule: true,
  verifyUploadProofToken: (token: string) => {
    if (token === 'valid') return { bookingId: (global as any).__BOOKING_ID__ };
    throw new Error('Invalid token');
  },
}));

describe('boundary/validation: upload payment proof', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await Booking.deleteMany({ bookingCode: 'JEST-PROOF' });
    delete (global as any).__BOOKING_ID__;
  });

  it('rejects missing file (400)', async () => {
    const fd = new FormData();
    fd.set('token', 'valid');
    const req = new Request('http://localhost/api/bookings/upload-proof', { method: 'POST', body: fd as any });
    const res = await uploadProof(req);
    expect(res.status).toBe(400);
  });

  it('rejects unsupported content type (400)', async () => {
    const booking = await Booking.create({
      bookingCode: 'JEST-PROOF',
      customerId: '000000000000000000000000',
      nailTechId: '000000000000000000000000',
      slotIds: [],
      status: 'pending',
      paymentStatus: 'unpaid',
      service: { type: 'Manicure', location: 'homebased_studio', clientType: 'new' },
      pricing: { total: 0, depositRequired: 0, paidAmount: 0, tipAmount: 0 },
    });
    (global as any).__BOOKING_ID__ = booking._id.toString();

    const badFile = new File([new Uint8Array([1, 2, 3])], 'proof.gif', { type: 'image/gif' });
    const fd = new FormData();
    fd.set('token', 'valid');
    fd.set('file', badFile);

    const req = new Request('http://localhost/api/bookings/upload-proof', { method: 'POST', body: fd as any });
    const res = await uploadProof(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Only JPEG, PNG, and WebP/i);
  });
});

