/**
 * Fix Booking Status for Fully Paid Migrated Bookings
 * ====================================================
 * Updates bookings where paymentStatus === "paid" AND payment.fullyPaidAt !== null
 * by setting status to "completed".
 *
 * MongoDB ONLY. Does not touch Firebase.
 *
 * USAGE:
 *   node scripts/fix-booking-status-fully-paid.js
 *   node scripts/fix-booking-status-fully-paid.js --dry-run   # Preview only
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const CONFIG = {
  DRY_RUN: process.argv.includes('--dry-run'),
};

const BookingSchema = new mongoose.Schema(
  {
    status: String,
    paymentStatus: String,
    payment: Object,
  },
  { timestamps: true, strict: false }
);

const Booking = mongoose.model('Booking', BookingSchema);

function log(msg, level = 'INFO') {
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', WARNING: '\x1b[33m', ERROR: '\x1b[31m' };
  console.log(`${colors[level] || ''}[${new Date().toISOString()}] [${level}] ${msg}\x1b[0m`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI is required', 'ERROR');
    process.exit(1);
  }

  log(
    CONFIG.DRY_RUN ? 'DRY RUN – no changes will be made' : 'Updating fully-paid bookings to status=completed',
    'INFO'
  );

  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  const filter = {
    paymentStatus: 'paid',
    'payment.fullyPaidAt': { $ne: null },
  };

  const count = await Booking.countDocuments(filter);
  log(`Found ${count} booking(s) with paymentStatus=paid and payment.fullyPaidAt set`, 'INFO');

  const toUpdate = await Booking.countDocuments({ ...filter, status: { $ne: 'completed' } });
  log(`Of those, ${toUpdate} have status !== 'completed'`, 'INFO');

  if (toUpdate === 0) {
    await mongoose.connection.close();
    log('Nothing to update', 'SUCCESS');
    return;
  }

  if (CONFIG.DRY_RUN) {
    const sample = await Booking.find({ ...filter, status: { $ne: 'completed' } })
      .limit(5)
      .select('bookingCode status paymentStatus payment.fullyPaidAt')
      .lean();
    log('Sample (dry-run):', 'INFO');
    sample.forEach((b) =>
      console.log(`  ${b.bookingCode} | status=${b.status} | paymentStatus=${b.paymentStatus} | fullyPaidAt=${b.payment?.fullyPaidAt ? 'set' : 'null'}`)
    );
    await mongoose.connection.close();
    log(`Would update ${toUpdate} booking(s) to status=completed`, 'WARNING');
    return;
  }

  const result = await Booking.updateMany(
    {
      paymentStatus: 'paid',
      'payment.fullyPaidAt': { $ne: null },
    },
    { $set: { status: 'completed' } }
  );
  log(`Updated ${result.modifiedCount} booking(s) to status=completed`, 'SUCCESS');

  await mongoose.connection.close();
}

main().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
