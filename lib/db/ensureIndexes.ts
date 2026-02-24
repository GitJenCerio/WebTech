/**
 * Ensure MongoDB indexes for performance. Run once after connection.
 * Failures are logged and do not crash the app.
 */

import Booking from '@/lib/models/Booking';
import Slot from '@/lib/models/Slot';
import Customer from '@/lib/models/Customer';
import AuditLog from '@/lib/models/AuditLog';

const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60; // 7776000

export async function ensureIndexes(): Promise<void> {
  try {
    // Booking indexes
    await Booking.collection.createIndex({ nailTechId: 1, status: 1 }).catch((e) => console.error('[ensureIndexes] Booking nailTechId+status', e));
    await Booking.collection.createIndex({ customerId: 1 }).catch((e) => console.error('[ensureIndexes] Booking customerId', e));
    await Booking.collection.createIndex({ createdAt: -1 }).catch((e) => console.error('[ensureIndexes] Booking createdAt', e));
    await Booking.collection.createIndex({ status: 1, createdAt: -1 }).catch((e) => console.error('[ensureIndexes] Booking status+createdAt', e));

    // Slot indexes
    await Slot.collection.createIndex({ date: 1, nailTechId: 1 }).catch((e) => console.error('[ensureIndexes] Slot date+nailTechId', e));
    await Slot.collection.createIndex({ status: 1, date: 1 }).catch((e) => console.error('[ensureIndexes] Slot status+date', e));

    // Customer indexes
    await Customer.collection.createIndex({ email: 1 }, { sparse: true }).catch((e) => console.error('[ensureIndexes] Customer email', e));
    await Customer.collection.createIndex({ socialMediaName: 1 }, { sparse: true }).catch((e) => console.error('[ensureIndexes] Customer socialMediaName', e));
    await Customer.collection.createIndex({ isActive: 1 }).catch((e) => console.error('[ensureIndexes] Customer isActive', e));

    // AuditLog TTL index (auto-delete after 90 days)
    await AuditLog.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: NINETY_DAYS_SECONDS }
    ).catch((e) => console.error('[ensureIndexes] AuditLog TTL', e));
  } catch (err) {
    console.error('[ensureIndexes]', err);
  }
}
