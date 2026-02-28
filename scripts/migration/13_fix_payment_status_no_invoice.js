/**
 * 13_fix_payment_status_no_invoice.js — Fix old bookings that show "paid" but have no invoice.
 * Rule: If no invoice yet and only deposit (or partial) paid → should be "partial", not "paid".
 *
 * Usage: node scripts/migration/13_fix_payment_status_no_invoice.js
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const mongoose = require('mongoose');

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const c = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' }[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI is required', 'ERROR');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  log('Connected to MongoDB');

  const Booking = mongoose.connection.collection('bookings');

  const allPaid = await Booking.find({ paymentStatus: 'paid', 'pricing.paidAmount': { $gt: 0 } }).toArray();

  const toFix = allPaid.filter((b) => {
    const inv = b.invoice;
    if (!inv || (typeof inv !== 'object')) return true;
    const hasQuotation = inv.quotationId != null && String(inv.quotationId).trim() !== '';
    const hasTotal = typeof inv.total === 'number' && inv.total > 0;
    return !hasQuotation && !hasTotal;
  });

  log(`Found ${toFix.length} booking(s) with paymentStatus=paid but no invoice`);

  if (toFix.length === 0) {
    log('Nothing to fix.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const ids = toFix.map((b) => b._id);
  const result = await Booking.updateMany(
    { _id: { $in: ids } },
    { $set: { paymentStatus: 'partial' }, $unset: { 'payment.fullyPaidAt': '' } }
  );

  log(`Updated ${result.modifiedCount} booking(s) to paymentStatus=partial`, 'SUCCESS');
  toFix.slice(0, 5).forEach((b) => {
    log(`  - ${b.bookingCode || b._id} (paidAmount: ${b.pricing?.paidAmount ?? 0})`);
  });
  if (toFix.length > 5) log(`  ... and ${toFix.length - 5} more`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
