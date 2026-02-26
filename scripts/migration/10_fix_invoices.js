/**
 * 10_fix_invoices.js — Fix incorrectly migrated invoice data.
 * Clears fake invoices (no items in Firebase), creates Quotations for real invoices.
 * Firebase: READ ONLY. Writes only to MongoDB.
 *
 * Usage: node scripts/migration/10_fix_invoices.js
 * Output: scripts/migration/invoice_fix_report.json
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BookingSchema = new mongoose.Schema(
  {
    firebaseId: String,
    bookingCode: String,
    invoice: {
      quotationId: String,
      total: Number,
      createdAt: Date,
    },
  },
  { strict: false, timestamps: true }
);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

const QuotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
});
const QuotationSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    quotationNumber: { type: String, unique: true },
    customerName: { type: String, required: true },
    customerPhone: String,
    customerEmail: String,
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    squeezeInFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    notes: String,
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'expired'], default: 'accepted' },
    createdBy: String,
  },
  { timestamps: true }
);
const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);

const CustomerSchema = new mongoose.Schema({ _id: mongoose.Schema.Types.ObjectId, firebaseId: String, name: String, phone: String, email: String }, {});
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

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

function hasRealInvoice(f) {
  return f?.invoice != null && Array.isArray(f.invoice.items) && f.invoice.items.length > 0;
}

async function nextQuotationNumberForDate(createdAt) {
  const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `QN-${dateStr}`;
  const existing = await Quotation.find({ quotationNumber: new RegExp(`^${prefix}`) }).select('quotationNumber').lean();
  let maxSeq = 0;
  for (const q of existing) {
    const suffix = (q.quotationNumber || '').slice(prefix.length);
    const seq = parseInt(suffix, 10);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  const next = (maxSeq + 1).toString().padStart(3, '0');
  return `${prefix}${next}`;
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

  const report = { fixed: 0, createdQuotations: 0, skipped: 0, errors: [] };
  const cleared = [];
  const created = [];
  const skipped = [];

  const bookings = await Booking.find({ firebaseId: { $exists: true, $ne: null } }).lean();
  for (const booking of bookings) {
    const firebaseId = booking.firebaseId;
    const bookingCode = booking.bookingCode || booking._id?.toString();
    let fbSnap;
    try {
      fbSnap = await firestore.collection('bookings').doc(firebaseId).get(); // READ ONLY
    } catch (e) {
      report.errors.push({ bookingCode, firebaseId, step: 'fetch', message: e.message });
      continue;
    }
    if (!fbSnap.exists) {
      skipped.push(bookingCode);
      report.skipped++;
      continue;
    }
    const f = fbSnap.data();
    const realInvoice = hasRealInvoice(f);

    if (!realInvoice) {
      const currentTotal = num(booking.invoice?.total);
      const hasQuotationId = booking.invoice?.quotationId != null && booking.invoice.quotationId !== '';
      if (currentTotal > 0 || hasQuotationId) {
        try {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              'invoice.quotationId': null,
              'invoice.total': 0,
              'invoice.createdAt': null,
            },
          });
          report.fixed++;
          cleared.push(bookingCode);
          log(`🧹 Cleared fake invoice from ${bookingCode}`);
        } catch (e) {
          report.errors.push({ bookingCode, step: 'clear', message: e.message });
        }
      } else {
        skipped.push(bookingCode);
        report.skipped++;
      }
      continue;
    }

    const inv = f.invoice;
    const totalAmount = num(inv?.total) || 0;
    const invCreatedAt = dateOrNull(inv?.createdAt) || new Date();
    const invUpdatedAt = dateOrNull(inv?.updatedAt) || invCreatedAt;

    let quotationId = booking.invoice?.quotationId;
    let existingQuotation = null;
    if (quotationId) {
      existingQuotation = await Quotation.findById(quotationId).lean();
    }

    if (!existingQuotation) {
      const items = (inv?.items || []).map((it) => {
        const qty = Math.max(1, num(it.quantity));
        const unitPrice = Math.max(0, num(it.unitPrice));
        const total = Math.max(0, unitPrice * qty);
        return {
          description: (it.description || '').trim() || 'Item',
          quantity: qty,
          unitPrice,
          total,
        };
      });
      const subtotal = items.reduce((s, i) => s + (num(i.total) || 0), 0);
      const discountRate = num(inv?.discountRate) || 0;
      const discountAmount = num(inv?.discountAmount) || 0;
      const squeezeInFee = num(inv?.squeezeInFee) || 0;

      let customerName = (inv?.customerName || '').trim() || 'Unknown';
      let customerPhone = '';
      let customerEmail = '';
      if (booking.customerId) {
        const cust = await Customer.findById(booking.customerId).lean();
        if (cust) {
          if (customerName === 'Unknown') customerName = (cust.name || '').trim() || customerName;
          customerPhone = cust.phone != null ? String(cust.phone) : '';
          customerEmail = cust.email != null ? String(cust.email).trim().toLowerCase() : '';
        }
      }

      const quotationNumber = await nextQuotationNumberForDate(invCreatedAt);
      const newQuotation = new Quotation({
        firebaseId: null,
        quotationNumber,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        items,
        subtotal,
        discountRate,
        discountAmount,
        squeezeInFee,
        totalAmount,
        notes: (inv?.notes || '') || undefined,
        status: 'accepted',
        createdBy: 'migration',
        createdAt: invCreatedAt,
        updatedAt: invUpdatedAt,
      });
      await newQuotation.save();
      await Quotation.findByIdAndUpdate(newQuotation._id, { $set: { createdAt: invCreatedAt, updatedAt: invUpdatedAt } });
      quotationId = newQuotation._id.toString();
      report.createdQuotations++;
      created.push(bookingCode);
      log(`✅ Created Quotation for ${bookingCode} | total: ₱${totalAmount}`);
    }

    try {
      await Booking.findByIdAndUpdate(booking._id, {
        $set: {
          'invoice.quotationId': quotationId,
          'invoice.total': totalAmount,
          'invoice.createdAt': invCreatedAt,
        },
      });
    } catch (e) {
      report.errors.push({ bookingCode, step: 'update_booking', message: e.message });
    }
  }

  const reportPath = path.join(__dirname, 'invoice_fix_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fixed: report.fixed,
        createdQuotations: report.createdQuotations,
        skipped: report.skipped,
        errors: report.errors,
        clearedBookings: cleared,
        createdForBookings: created,
      },
      null,
      2
    ),
    'utf8'
  );
  log('✅ Invoice fix complete', 'SUCCESS');
  log(`🧹 Cleared ${report.fixed} fake invoices`);
  log(`📄 Created ${report.createdQuotations} quotation documents`);
  log(`⏭️ Skipped ${report.skipped} bookings (no invoice)`);
  if (report.errors.length) log(`${report.errors.length} error(s) — see ${reportPath}`, 'WARNING');
  await mongoose.connection.close();
  process.exit(report.errors.length ? 1 : 0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
