import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || process.env.UPLOAD_PROOF_SECRET || 'upload-proof-secret';
const TOKEN_VALID_DAYS = 14;

/**
 * Create a signed token for the "upload proof of payment" link.
 * Token contains bookingId and expiry; only the server can create valid tokens.
 */
export function createUploadProofToken(bookingId: string): string {
  const exp = Date.now() + TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${bookingId}|${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}|${sig}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return token;
}

export interface VerifyUploadProofResult {
  bookingId: string;
}

/**
 * Verify token and return bookingId. Throws if invalid or expired.
 */
export function verifyUploadProofToken(token: string): VerifyUploadProofResult {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token');
  }
  try {
    const decoded = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const [bookingId, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) {
      throw new Error('Link has expired');
    }
    const payload = `${bookingId}|${expStr}`;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (expected !== sig) {
      throw new Error('Invalid token');
    }
    return { bookingId };
  } catch (e: any) {
    if (e.message) throw e;
    throw new Error('Invalid token');
  }
}
