import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';

// Avoid sending real emails during integration tests.
jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendPasswordResetEmail: async () => ({ success: true }),
}));

describe('integration: password reset (real MongoDB)', () => {
  const testEmail = 'jest.reset+test@glammednailsbyjhen.com';

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testEmail });
    await PasswordResetToken.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
  });

  it('forgot-password rejects invalid email (boundary/validation)', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const res = await forgotPassword(req);
    expect(res.status).toBe(400);
  });

  it('forgot-password is anti-enumeration (security) for unknown email', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com' }),
    });
    const res = await forgotPassword(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toMatch(/If an account exists/i);
  });

  it('end-to-end: creates token; reset updates password; token deleted (functional + integration)', async () => {
    const originalHash = await bcrypt.hash('OldPass@1234', 10);
    await User.create({
      email: testEmail,
      password: originalHash,
      name: 'Reset Test',
      emailVerified: true,
      role: 'ADMIN',
      status: 'active',
    });

    const forgotReq = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotRes = await forgotPassword(forgotReq);
    expect(forgotRes.status).toBe(200);

    const resetRecord = await PasswordResetToken.findOne({}).lean();
    expect(resetRecord?.token).toBeTruthy();

    const newPassword = 'NewPass@5678';
    const resetReq = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetRecord!.token, newPassword }),
    });
    const resetRes = await resetPassword(resetReq);
    expect(resetRes.status).toBe(200);

    const updated = await User.findOne({ email: testEmail }).select('+password').lean();
    expect(updated?.password).toBeTruthy();
    expect(await bcrypt.compare(newPassword, updated!.password as string)).toBe(true);

    const tokenAfter = await PasswordResetToken.findOne({ token: resetRecord!.token }).lean();
    expect(tokenAfter).toBeNull();
  });
});

