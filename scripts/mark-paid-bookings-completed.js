/**
 * Mark Paid Bookings as Completed
 * ===============================
 * One-time script to update migrated bookings: set status='completed'
 * for all bookings where paymentStatus='paid'.
 *
 * MongoDB ONLY. Does not touch Firebase.
 *
 * USAGE:
 *   node scripts/mark-paid-bookings-completed.js
 *   node scripts/mark-paid-bookings-completed.js --dry-run   # Preview only
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const CONFIG = {
  DRY_RUN: process.argv.includes('--dry-run'),
};

const BookingSchema = new mongoose.Schema({
  firebaseId: String,
  bookingCode: String,
  customerId: String,
  nailTechId: String,
  slotIds: [String],
  service: Object,
  status: String,
  paymentStatus: String,
  pricing: Object,
  payment: Object,
  completedAt: Date,
  confirmedAt: Date,
  invoice: Object,
  statusReason: String,
  clientNotes: String,
  adminNotes: String,
  clientPhotos: Object,
}, { timestamps: true, strict: false });

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

  log(CONFIG.DRY_RUN ? 'DRY RUN – no changes will be made' : 'Updating paid bookings to completed', 'INFO');

  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  const filter = { paymentStatus: 'paid', status: { $ne: 'completed' } };
  const count = await Booking.countDocuments(filter);
  log(`Found ${count} paid booking(s) with status != completed`, 'INFO');

  if (count === 0) {
    await mongoose.connection.close();
    log('Nothing to update', 'SUCCESS');
    return;
  }

  if (CONFIG.DRY_RUN) {
    const sample = await Booking.find(filter).limit(5).select('bookingCode status paymentStatus').lean();
    log('Sample (dry-run):', 'INFO');
    sample.forEach(b => console.log(`  ${b.bookingCode} | status=${b.status} | paymentStatus=${b.paymentStatus}`));
    await mongoose.connection.close();
    log(`Would update ${count} booking(s) to status=completed`, 'WARNING');
    return;
  }

  const result = await Booking.updateMany(filter, { $set: { status: 'completed' } });
  log(`Updated ${result.modifiedCount} booking(s) to status=completed`, 'SUCCESS');

  const withoutCompletedAt = await Booking.countDocuments({
    paymentStatus: 'paid',
    status: 'completed',
    completedAt: null,
  });
  if (withoutCompletedAt > 0) {
    await Booking.updateMany(
      { paymentStatus: 'paid', status: 'completed', completedAt: null },
      { $set: { completedAt: new Date() } }
    );
    log(`Set completedAt on ${withoutCompletedAt} booking(s)`, 'INFO');
  }

  await mongoose.connection.close();
}

main().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
