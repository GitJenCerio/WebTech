/**
 * Insert Missing Booking
 * ======================
 * Inserts a booking for:
 *   - Date: February 2, 2026
 *   - Time: 6:00 PM (18:00) - Mani + Pedi uses 2 slots: 18:00, 18:30
 *   - Client: Jhane Taligatos
 *   - Nail Tech: Salve
 *   - Service: Mani + Pedi, homebased_studio
 *   - Status: confirmed
 *   - Deposit: 500
 *
 * USAGE:
 *   node scripts/insert-booking.js
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const DATE = '2026-02-02';
const SLOT_TIMES = ['18:00', '18:30']; // Mani + Pedi = 2 slots
const CLIENT_NAME = 'jhane taligatos';
const NAIL_TECH_NAME = 'salve';
const DEPOSIT = 500;
const TOTAL = 1500; // Placeholder - user will create invoice in frontend

// Schemas (match lib/models)
const CustomerSchema = new mongoose.Schema(
  { name: String, email: String, phone: String },
  { timestamps: true, strict: false }
);
const NailTechSchema = new mongoose.Schema(
  { name: String, status: String },
  { timestamps: true, strict: false }
);
const SlotSchema = new mongoose.Schema(
  { date: String, time: String, status: String, nailTechId: String, slotType: String, isHidden: Boolean },
  { timestamps: true, strict: false }
);
const BookingCounterSchema = new mongoose.Schema({ dateKey: String, seq: Number }, { timestamps: true, strict: false });
const BookingSchema = new mongoose.Schema(
  {
    bookingCode: String,
    customerId: String,
    nailTechId: String,
    slotIds: [String],
    service: new mongoose.Schema(
      { type: String, location: String, clientType: String },
      { _id: false }
    ),
    status: String,
    paymentStatus: String,
    pricing: { total: Number, depositRequired: Number, paidAmount: Number, tipAmount: Number },
    payment: Object,
    clientNotes: String,
    adminNotes: String,
    completedAt: Date,
    confirmedAt: Date,
  },
  { timestamps: true, strict: false }
);

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const NailTech = mongoose.models.NailTech || mongoose.model('NailTech', NailTechSchema);
const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
const BookingCounter = mongoose.models.BookingCounter || mongoose.model('BookingCounter', BookingCounterSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

function log(msg, level = 'INFO') {
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', WARNING: '\x1b[33m', ERROR: '\x1b[31m' };
  console.log(`${colors[level] || ''}[${level}] ${msg}\x1b[0m`);
}

function getManilaDateKey(date = new Date()) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return formatted.replace(/-/g, '');
}

async function generateBookingCode() {
  const dateKey = getManilaDateKey();
  const counter = await BookingCounter.findOneAndUpdate(
    { dateKey },
    { $inc: { seq: 1 }, $setOnInsert: { dateKey } },
    { new: true, upsert: true }
  );
  const seq = counter?.seq ?? 1;
  return `GN-${dateKey}${String(seq).padStart(3, '0')}`;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI is required', 'ERROR');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  // 1. Find customer (case-insensitive)
  const customer = await Customer.findOne({ name: new RegExp(`^${CLIENT_NAME.replace(/\s+/g, '\\s+')}$`, 'i') });
  if (!customer) {
    log(`Customer "${CLIENT_NAME}" not found. Please add the client first or check the name.`, 'ERROR');
    await mongoose.connection.close();
    process.exit(1);
  }
  log(`Found customer: ${customer.name} (${customer._id})`, 'SUCCESS');

  // 2. Find nail tech (name contains "salve")
  const nailTech = await NailTech.findOne({ name: new RegExp('salve', 'i'), status: 'Active' });
  if (!nailTech) {
    log(`Nail tech with name containing "Salve" not found.`, 'ERROR');
    await mongoose.connection.close();
    process.exit(1);
  }
  const nailTechId = nailTech._id.toString();
  log(`Found nail tech: ${nailTech.name} (${nailTechId})`, 'SUCCESS');

  // 3. Find or create slots
  const slotIds = [];
  for (const time of SLOT_TIMES) {
    let slot = await Slot.findOne({ date: DATE, time, nailTechId, status: 'available' });
    if (!slot) {
      slot = await Slot.findOne({ date: DATE, time, nailTechId });
      if (slot && slot.status !== 'available') {
        log(`Slot ${DATE} ${time} exists but is not available (status: ${slot.status}).`, 'ERROR');
        await mongoose.connection.close();
        process.exit(1);
      }
      if (!slot) {
        slot = await Slot.create({
          date: DATE,
          time,
          nailTechId,
          status: 'available',
          slotType: 'regular',
          isHidden: false,
        });
        log(`Created slot: ${DATE} ${time}`, 'SUCCESS');
      }
    }
    slotIds.push(slot._id);
  }

  // 4. Create booking
  const bookingCode = await generateBookingCode();
  const slotIdStrings = slotIds.map((id) => id.toString());
  const booking = await Booking.create({
    bookingCode,
    customerId: customer._id.toString(),
    nailTechId,
    slotIds: slotIdStrings,
    service: {
      type: 'mani_pedi',
      location: 'homebased_studio',
      clientType: 'repeat',
    },
    status: 'confirmed',
    paymentStatus: 'unpaid',
    pricing: {
      total: TOTAL,
      depositRequired: DEPOSIT,
      paidAmount: 0,
      tipAmount: 0,
    },
    payment: {},
    clientNotes: '',
    adminNotes: 'Inserted via script - invoice to be created in frontend',
    completedAt: null,
    confirmedAt: new Date(),
  });
  log(`Created booking: ${bookingCode}`, 'SUCCESS');

  // 5. Update slots to confirmed
  await Slot.updateMany({ _id: { $in: slotIds } }, { $set: { status: 'confirmed' } });
  log('Updated slots to confirmed', 'SUCCESS');

  // 6. Update customer stats
  const bookingCount = await Booking.countDocuments({ customerId: customer._id, status: { $ne: 'cancelled' } });
  await Customer.updateOne(
    { _id: customer._id },
    { $set: { totalBookings: bookingCount, clientType: 'REPEAT', isRepeatClient: true } }
  );
  log('Updated customer stats', 'SUCCESS');

  log('', 'INFO');
  log(`Done. Booking ${bookingCode} created for Jhane Taligatos, Feb 2 2026 6:00 PM, Nail Tech: ${nailTech.name}`, 'SUCCESS');
  log('You can create the invoice in the admin frontend.', 'INFO');

  await mongoose.connection.close();
}

main().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
