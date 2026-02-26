/**
 * 4_migrate_bookings.js — Migrate bookings from Firebase to MongoDB (READ Firebase only).
 * Depends on customers, nailTechs, slots (run scripts 1–3 first).
 *
 * Usage: node scripts/migration/4_migrate_bookings.js
 * Test:  Uncomment .limit(1) in the Firebase fetch below for a single-doc run.
 * Output: scripts/migration/booking_warnings.json
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Permissive schema for migration (allows null customerId/nailTechId, empty slotIds)
const BookingSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    bookingCode: { type: String, required: true, unique: true },
    customerId: { type: String },
    nailTechId: { type: String },
    slotIds: [{ type: String }],
    service: {
      type: { type: String },
      location: { type: String },
      clientType: { type: String },
    },
    status: { type: String, required: true, default: 'pending' },
    paymentStatus: { type: String, required: true, default: 'unpaid' },
    pricing: {
      total: { type: Number, default: 0 },
      depositRequired: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      tipAmount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },
    payment: {
      method: { type: String },
      depositPaidAt: { type: Date },
      fullyPaidAt: { type: Date },
      paymentProofUrl: { type: String },
    },
    clientNotes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    statusReason: { type: String, default: '' },
    completedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    customerData: { type: mongoose.Schema.Types.Mixed },
    invoice: {
      quotationId: { type: String },
      total: { type: Number },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

const CustomerSchema = new mongoose.Schema({ firebaseId: String }, {});
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const NailTechSchema = new mongoose.Schema({ firebaseId: String }, {});
const NailTech = mongoose.models.NailTech || mongoose.model('NailTech', NailTechSchema);
const SlotSchema = new mongoose.Schema({ firebaseId: String }, {});
const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const c = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' }[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

function initFirebase() {
  if (admin.apps.length) return admin.firestore();
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))) });
    return admin.firestore();
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
    return admin.firestore();
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    return admin.firestore();
  }
  const p = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(p)) {
    admin.initializeApp({ credential: admin.credential.cert(require(p)) });
    return admin.firestore();
  }
  throw new Error('Firebase credentials not found.');
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dateOrNull(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

async function run() {
  let firestore;
  try {
    firestore = initFirebase();
    log('Firebase connected (read-only)', 'SUCCESS');
  } catch (e) {
    log(e.message, 'ERROR');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI required', 'ERROR');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  let docs = [];
  try {
    // const snap = await firestore.collection('bookings').limit(1).get(); // uncomment for test run
    const snap = await firestore.collection('bookings').get(); // READ ONLY
    docs = snap.docs;
  } catch (_) {}

  const warnings = [];
  let count = 0;

  for (const doc of docs) {
    const f = doc.data();
    const bookingCode = f.bookingId || doc.id;

    let customerId = null;
    const rawCustomerId = f.customerId;
    if (rawCustomerId === 'PENDING_FORM_SUBMISSION' || rawCustomerId === 'MIGRATION_NEEDED') {
      warnings.push({ bookingCode, firebaseId: doc.id, type: 'customerId_placeholder', value: rawCustomerId });
    } else if (rawCustomerId) {
      const cust = await Customer.findOne({ firebaseId: rawCustomerId }).lean();
      if (cust) customerId = cust._id.toString();
      else {
        warnings.push({ bookingCode, firebaseId: doc.id, type: 'customerId_not_found', value: rawCustomerId });
      }
    } else {
      warnings.push({ bookingCode, firebaseId: doc.id, type: 'customerId_missing' });
    }

    let nailTechId = null;
    if (f.nailTechId) {
      const nt = await NailTech.findOne({ firebaseId: f.nailTechId }).lean();
      if (nt) nailTechId = nt._id.toString();
      else {
        warnings.push({ bookingCode, firebaseId: doc.id, type: 'nailTechId_not_found', value: f.nailTechId });
      }
    } else {
      warnings.push({ bookingCode, firebaseId: doc.id, type: 'nailTechId_missing' });
    }

    const firebaseSlotIds = [
      f.slotId,
      f.pairedSlotId,
      ...(Array.isArray(f.linkedSlotIds) ? f.linkedSlotIds : []),
    ].filter(Boolean);
    const uniqueSlotIds = [...new Set(firebaseSlotIds)];
    const slotIds = [];
    for (const sid of uniqueSlotIds) {
      const slot = await Slot.findOne({ firebaseId: sid }).lean();
      if (slot) slotIds.push(slot._id.toString());
      else warnings.push({ bookingCode, firebaseId: doc.id, type: 'slot_not_found', slotId: sid });
    }

    let status = 'pending';
    const paymentStatusRaw = (f.paymentStatus || 'unpaid').toLowerCase();
    const paidDate = f.paidDate;
    const statusRaw = (f.status || '').toLowerCase();
    if (paymentStatusRaw === 'paid' && paidDate) status = 'completed';
    else if (statusRaw === 'confirmed' && paymentStatusRaw !== 'paid') status = 'confirmed';
    else if (statusRaw === 'pending_form' || statusRaw === 'pending_payment') status = 'pending';
    else if (statusRaw === 'cancelled') status = 'cancelled';
    else status = 'pending';

    let paymentStatus = 'unpaid';
    if (paymentStatusRaw === 'paid') paymentStatus = 'paid';
    else if (paymentStatusRaw === 'partial') paymentStatus = 'partial';
    else if (paymentStatusRaw === 'unpaid') paymentStatus = 'unpaid';
    else if (paymentStatusRaw === 'refunded') paymentStatus = 'refunded';
    else if (paymentStatusRaw === 'forfeited') paymentStatus = 'unpaid';

    const statusReason = paymentStatusRaw === 'forfeited' ? 'forfeited' : '';

    // Only use invoice total when there is a real invoice (has line items). DP-only bookings without
    // invoice should not get a placeholder total (e.g. 500 reservation fee); Firebase may store 500.
    const hasInvoiceItems = Array.isArray(f.invoice?.items) && f.invoice.items.length > 0;
    const total = hasInvoiceItems ? num(f.invoice?.total) : 0;
    const depositRequired = num(f.depositAmount);
    const paidAmount = num(f.paidAmount) + num(f.depositAmount);
    const tipAmount = num(f.tipAmount);
    const discountAmount = hasInvoiceItems ? num(f.invoice?.discountAmount) : 0;

    const adminNoteParts = [];
    if (rawCustomerId === 'PENDING_FORM_SUBMISSION') adminNoteParts.push('Firebase customerId was PENDING_FORM_SUBMISSION.');
    if (rawCustomerId === 'MIGRATION_NEEDED') adminNoteParts.push('Firebase customerId was MIGRATION_NEEDED.');
    const adminNotes = adminNoteParts.join(' ') || '';

    const serviceType = f.serviceType || null;
    const serviceLocation = f.serviceLocation || null;
    const serviceClientType = (f.clientType || 'new').toLowerCase();
    const validLocation = serviceLocation === 'home_service' ? 'home_service' : 'homebased_studio';
    const validServiceType = ['manicure', 'pedicure', 'mani_pedi', 'home_service_2slots', 'home_service_3slots'].includes(serviceType) ? serviceType : 'manicure';
    const validClientType = serviceClientType === 'repeat' ? 'repeat' : 'new';

    const data = {
      firebaseId: doc.id,
      bookingCode,
      customerId: customerId != null ? customerId : null,
      nailTechId: nailTechId != null ? nailTechId : null,
      slotIds,
      service: {
        type: validServiceType,
        location: validLocation,
        clientType: validClientType,
      },
      status,
      paymentStatus,
      pricing: {
        total,
        depositRequired,
        paidAmount,
        tipAmount,
        discountAmount,
      },
      payment: {
        method: f.paidPaymentMethod || f.depositPaymentMethod || null,
        depositPaidAt: dateOrNull(f.depositDate),
        fullyPaidAt: paidDate && paymentStatusRaw === 'paid' ? dateOrNull(paidDate) : null,
        paymentProofUrl: null,
      },
      clientNotes: '',
      adminNotes,
      statusReason,
      completedAt: null,
      confirmedAt: null,
      customerData: f.customerData || {},
      invoice: {
        quotationId: null,
        total,
        createdAt: hasInvoiceItems && f.invoice?.createdAt ? dateOrNull(f.invoice.createdAt) : null,
      },
      createdAt: dateOrNull(f.createdAt) || new Date(),
      updatedAt: dateOrNull(f.updatedAt) || new Date(),
    };

    // Avoid E11000 duplicate bookingCode: Firebase can have multiple docs with same bookingId
    const existingByCode = await Booking.findOne({ bookingCode }).lean();
    if (existingByCode) {
      await Booking.findByIdAndUpdate(existingByCode._id, { ...data, firebaseId: doc.id }, { new: true });
    } else {
      await Booking.findOneAndUpdate(
        { firebaseId: doc.id },
        data,
        { upsert: true, new: true }
      );
    }
    count++;
    log(`✅ Migrated booking: ${bookingCode} | status: ${status} | paymentStatus: ${paymentStatus}`);
  }

  const warnPath = path.join(__dirname, 'booking_warnings.json');
  fs.writeFileSync(warnPath, JSON.stringify(warnings, null, 2), 'utf8');
  if (warnings.length) log(`⚠️ ${warnings.length} warning(s) saved to ${warnPath}`, 'WARNING');
  log(`Final count: ${count} booking(s) migrated.`, 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
