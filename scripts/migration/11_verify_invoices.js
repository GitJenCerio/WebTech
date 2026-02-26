/**
 * 11_verify_invoices.js — Verify invoice and quotation data after fix.
 * Firebase: READ ONLY. Reads MongoDB for checks.
 *
 * Usage: node scripts/migration/11_verify_invoices.js
 * Output: scripts/migration/invoice_verification_report.json
 * Exit 0 if all checks pass, 1 if any fail.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const QuotationSchema = new mongoose.Schema({}, { strict: false });
const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);

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

function hasRealInvoice(f) {
  return f?.invoice != null && Array.isArray(f.invoice.items) && f.invoice.items.length > 0;
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

  const report = {
    generatedAt: new Date().toISOString(),
    totalBookingsChecked: 0,
    totalWithRealInvoices: 0,
    totalWithoutInvoices: 0,
    checks: {
      noFakeInvoiceTotal: { passed: true, violations: [] },
      invoiceTotalHasQuotationId: { passed: true, violations: [] },
      quotationIdExists: { passed: true, violations: [] },
      quotationMatchesBookingTotal: { passed: true, violations: [] },
      uniqueQuotationNumber: { passed: true, duplicates: [] },
    },
    allPassed: true,
  };

  const bookings = await Booking.find({}).lean();
  report.totalBookingsChecked = bookings.length;

  const quotationNumbers = new Map();

  for (const b of bookings) {
    const code = b.bookingCode || b._id?.toString();
    const invTotal = Number(b.invoice?.total) || 0;
    const quotationId = b.invoice?.quotationId;

    let fbHasRealInvoice = false;
    if (b.firebaseId) {
      try {
        const fbSnap = await firestore.collection('bookings').doc(b.firebaseId).get(); // READ ONLY
        if (fbSnap.exists) fbHasRealInvoice = hasRealInvoice(fbSnap.data());
      } catch (_) {}
    }

    if (fbHasRealInvoice) report.totalWithRealInvoices++;
    else report.totalWithoutInvoices++;

    // 1. No booking with only deposit paid should have invoice.total > 0
    const onlyDepositPaid = (b.paymentStatus === 'partial' || b.paymentStatus === 'unpaid') && !fbHasRealInvoice;
    if (onlyDepositPaid && invTotal > 0) {
      report.checks.noFakeInvoiceTotal.passed = false;
      report.checks.noFakeInvoiceTotal.violations.push(code);
      log(`❌ ${code} has wrong invoice.total (${invTotal})`, 'ERROR');
    }

    // 2. Every booking with invoice.total > 0 must have invoice.quotationId set
    if (invTotal > 0 && (quotationId == null || quotationId === '')) {
      report.checks.invoiceTotalHasQuotationId.passed = false;
      report.checks.invoiceTotalHasQuotationId.violations.push(code);
      log(`❌ ${code} has invoice.total but no quotationId`, 'ERROR');
    }

    // 3. Every booking with invoice.quotationId must have matching Quotation
    if (quotationId) {
      const quot = await Quotation.findById(quotationId).lean();
      if (!quot) {
        report.checks.quotationIdExists.passed = false;
        report.checks.quotationIdExists.violations.push(code);
        log(`❌ ${code} quotationId points to missing Quotation`, 'ERROR');
      } else {
        const qTotal = Number(quot.totalAmount) || 0;
        if (Math.abs(qTotal - invTotal) > 0.01) {
          report.checks.quotationMatchesBookingTotal.passed = false;
          report.checks.quotationMatchesBookingTotal.violations.push({ bookingCode: code, bookingTotal: invTotal, quotationTotal: qTotal });
          log(`❌ ${code} invoice.total (${invTotal}) != quotation.totalAmount (${qTotal})`, 'ERROR');
        }
        const qn = quot.quotationNumber;
        if (qn) {
          if (quotationNumbers.has(qn)) quotationNumbers.get(qn).push(code);
          else quotationNumbers.set(qn, [code]);
        }
      }
    }
  }

  // 5. Every Quotation must have unique quotationNumber
  for (const [qn, codes] of quotationNumbers) {
    if (codes.length > 1) {
      report.checks.uniqueQuotationNumber.passed = false;
      report.checks.uniqueQuotationNumber.duplicates.push({ quotationNumber: qn, bookingCodes: codes });
      log(`❌ Duplicate quotationNumber: ${qn} (bookings: ${codes.join(', ')})`, 'ERROR');
    }
  }

  report.allPassed =
    report.checks.noFakeInvoiceTotal.passed &&
    report.checks.invoiceTotalHasQuotationId.passed &&
    report.checks.quotationIdExists.passed &&
    report.checks.quotationMatchesBookingTotal.passed &&
    report.checks.uniqueQuotationNumber.passed;

  const failed = [
    report.checks.noFakeInvoiceTotal.passed,
    report.checks.invoiceTotalHasQuotationId.passed,
    report.checks.quotationIdExists.passed,
    report.checks.quotationMatchesBookingTotal.passed,
    report.checks.uniqueQuotationNumber.passed,
  ].filter((p) => !p).length;

  const outPath = path.join(__dirname, 'invoice_verification_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  log(`Total bookings checked: ${report.totalBookingsChecked}`);
  log(`Total with real invoices: ${report.totalWithRealInvoices}`);
  log(`Total without invoices (deposit only): ${report.totalWithoutInvoices}`);
  if (report.allPassed) log('All checks passed', 'SUCCESS');
  else log(`${failed} check(s) failed`, 'ERROR');
  await mongoose.connection.close();
  process.exit(report.allPassed ? 0 : 1);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
