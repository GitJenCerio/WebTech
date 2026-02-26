/**
 * 7_recalculate_stats.js — Recalculate denormalized customer stats from migrated bookings.
 * MongoDB only. Run after 4_migrate_bookings.js and 6_verify.js.
 *
 * Usage: node scripts/migration/7_recalculate_stats.js
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    totalBookings: Number,
    completedBookings: Number,
    totalSpent: Number,
    totalTips: Number,
    totalDiscounts: Number,
    lastVisit: Date,
  },
  { strict: false }
);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

const BookingSchema = new mongoose.Schema(
  {
    customerId: String,
    status: String,
    createdAt: Date,
    pricing: {
      paidAmount: Number,
      tipAmount: Number,
      discountAmount: Number,
    },
  },
  { strict: false }
);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const c = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' }[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

async function run() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI required', 'ERROR');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  const customers = await Customer.find({}).lean();
  for (const cust of customers) {
    const cid = cust._id.toString();
    const bookings = await Booking.find({ customerId: cid }).lean();
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'completed').length;
    let totalSpent = 0;
    let totalTips = 0;
    let totalDiscounts = 0;
    let lastVisit = null;
    for (const b of bookings) {
      const p = b.pricing || {};
      totalSpent += Number(p.paidAmount) || 0;
      totalTips += Number(p.tipAmount) || 0;
      totalDiscounts += Number(p.discountAmount) || 0;
      if (b.status === 'completed' && b.createdAt) {
        const d = new Date(b.createdAt);
        if (!lastVisit || d > lastVisit) lastVisit = d;
      }
    }
    await Customer.updateOne(
      { _id: cust._id },
      {
        $set: {
          totalBookings,
          completedBookings,
          totalSpent,
          totalTips,
          totalDiscounts,
          lastVisit,
          updatedAt: new Date(),
        },
      }
    );
    const name = cust.name || cid;
    log(`✅ Updated stats for: ${name} | bookings: ${totalBookings} | spent: ₱${totalSpent.toFixed(2)}`);
  }

  log('Recalculate stats complete.', 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
