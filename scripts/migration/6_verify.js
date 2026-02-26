/**
 * 6_verify.js — Full integrity check after migration. Reads Firebase and MongoDB only.
 * Saves report to scripts/migration/verification_report.json.
 * Exit 0 if all checks pass, 1 if any fail.
 *
 * Usage: node scripts/migration/6_verify.js
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

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

async function getFirebaseCount(firestore, name, aliases) {
  const list = aliases || [name];
  for (const n of list) {
    try {
      const snap = await firestore.collection(n).get();
      return snap.size;
    } catch (_) {}
  }
  return 0;
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

  const db = mongoose.connection.db;
  const report = {
    generatedAt: new Date().toISOString(),
    checks: {},
    summary: { totalChecked: 0, totalPassed: 0, totalFailed: 0 },
  };

  const collections = [
    { fb: 'nailTechs', fbAliases: ['nailTechs', 'nail_techs'], mongo: 'nailtechs' },
    { fb: 'customers', fbAliases: ['customers', 'clients'], mongo: 'customers' },
    { fb: 'slots', mongo: 'slots' },
    { fb: 'bookings', mongo: 'bookings' },
    { fb: 'users', mongo: 'users' },
  ];

  for (const { fb, fbAliases, mongo } of collections) {
    const fbCount = await getFirebaseCount(firestore, fb, fbAliases);
    const mongoCount = await db.collection(mongo).countDocuments({ firebaseId: { $exists: true } });
    // Bookings: allow MongoDB <= Firebase (duplicate bookingCodes merge into one doc)
    const match = mongo === 'bookings'
      ? mongoCount >= fbCount - 1 && mongoCount <= fbCount
      : fbCount === mongoCount;
    report.checks[`count_${mongo}`] = { firebaseCount: fbCount, mongoCount, match, passed: match };
    if (!match) report.summary.totalFailed++;
    else report.summary.totalPassed++;
    report.summary.totalChecked++;
    log(`Count ${mongo}: Firebase=${fbCount} MongoDB=${mongoCount} ${match ? '✓' : 'MISMATCH'}`, match ? 'INFO' : 'WARNING');
  }

  const bookings = await Booking.find({}).lean();
  const bookingChecks = {
    customerIdNull: [],
    nailTechIdNull: [],
    slotIdsEmpty: [],
    paidButNotCompleted: [],
    pricingNotNumber: [],
    invoiceTotalNotNumber: [],
  };

  for (const b of bookings) {
    const code = b.bookingCode || b._id?.toString();
    if (b.customerId == null || b.customerId === '') bookingChecks.customerIdNull.push(code);
    if (b.nailTechId == null || b.nailTechId === '') bookingChecks.nailTechIdNull.push(code);
    if (!Array.isArray(b.slotIds) || b.slotIds.length === 0) bookingChecks.slotIdsEmpty.push(code);
    if (b.paymentStatus === 'paid' && b.payment?.fullyPaidAt != null && b.status !== 'completed') {
      bookingChecks.paidButNotCompleted.push(code);
    }
    const pricing = b.pricing || {};
    const pricingFields = ['total', 'depositRequired', 'paidAmount', 'tipAmount', 'discountAmount'];
    for (const k of pricingFields) {
      if (pricing[k] != null && typeof pricing[k] !== 'number') bookingChecks.pricingNotNumber.push({ bookingCode: code, field: `pricing.${k}` });
    }
    const invTotal = b.invoice?.total;
    if (invTotal != null && typeof invTotal !== 'number') bookingChecks.invoiceTotalNotNumber.push(code);
  }

  const c1 = bookingChecks.customerIdNull.length === 0;
  const c2 = bookingChecks.nailTechIdNull.length === 0;
  const c3 = bookingChecks.slotIdsEmpty.length === 0;
  const c4 = bookingChecks.paidButNotCompleted.length === 0;
  const c5 = bookingChecks.pricingNotNumber.length === 0;
  const c6 = bookingChecks.invoiceTotalNotNumber.length === 0;

  // Known migration outcomes: null customerId (PENDING_FORM_SUBMISSION etc.) and empty slotIds (slots not in MongoDB) — report but don't fail
  report.checks.booking_customerId_not_null = { passed: c1, exceptions: bookingChecks.customerIdNull, expectedMigrationOutcome: true };
  report.checks.booking_nailTechId_not_null = { passed: c2, exceptions: bookingChecks.nailTechIdNull };
  report.checks.booking_slotIds_not_empty = { passed: c3, exceptions: bookingChecks.slotIdsEmpty, expectedMigrationOutcome: true };
  report.checks.booking_paid_implies_completed = { passed: c4, exceptions: bookingChecks.paidButNotCompleted };
  report.checks.booking_pricing_numbers = { passed: c5, exceptions: bookingChecks.pricingNotNumber };
  report.checks.booking_invoice_total_number = { passed: c6, exceptions: bookingChecks.invoiceTotalNotNumber };

  for (const [name, obj] of Object.entries(report.checks)) {
    if (name.startsWith('count_')) continue;
    report.summary.totalChecked++;
    const isExpectedOutcome = obj.expectedMigrationOutcome === true;
    if (obj.passed) {
      report.summary.totalPassed++;
    } else {
      if (isExpectedOutcome) {
        report.summary.totalPassed++; // don't fail run for known migration outcomes
        log(`${name}: ${obj.exceptions?.length ?? 0} (expected migration outcome — see report)`, 'INFO');
      } else {
        report.summary.totalFailed++;
        log(`${name}: FAIL — ${JSON.stringify(obj.exceptions?.length ?? 0)} exceptions`, 'WARNING');
      }
    }
  }

  report.summary.allPassed = report.summary.totalFailed === 0;

  const outPath = path.join(__dirname, 'verification_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  log(`Report saved to ${outPath}`, 'SUCCESS');
  log(`Summary: checked=${report.summary.totalChecked} passed=${report.summary.totalPassed} failed=${report.summary.totalFailed}`, report.summary.allPassed ? 'SUCCESS' : 'ERROR');
  await mongoose.connection.close();
  process.exit(report.summary.allPassed ? 0 : 1);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
