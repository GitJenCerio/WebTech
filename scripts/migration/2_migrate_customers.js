/**
 * 2_migrate_customers.js — Migrate customers from Firebase to MongoDB (READ Firebase only).
 * Run after 1_migrate_nailtechs.js. No other dependencies.
 *
 * Usage: node scripts/migration/2_migrate_customers.js
 * Test:  Uncomment .limit(1) in the Firebase fetch below for a single-doc run.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CustomerSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    name: { type: String, required: true },
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    socialMediaName: String,
    referralSource: String,
    referralSourceOther: String,
    isRepeatClient: Boolean,
    clientType: { type: String, enum: ['NEW', 'REPEAT'], default: 'NEW' },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalTips: { type: Number, default: 0 },
    totalDiscounts: { type: Number, default: 0 },
    lastVisit: { type: Date, default: null },
    notes: String,
    isActive: { type: Boolean, default: true },
    isVIP: { type: Boolean, default: false },
  },
  { timestamps: true }
);
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

function normPhone(v) {
  if (v == null || typeof v !== 'string') return v;
  return v.replace(/\s+/g, '').replace(/-/g, '');
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

  const collNames = ['customers', 'clients'];
  let docs = [];
  for (const name of collNames) {
    try {
      // const snap = await firestore.collection(name).limit(1).get(); // uncomment for test run
      const snap = await firestore.collection(name).get(); // READ ONLY
      docs = snap.docs;
      if (docs.length > 0) break;
    } catch (_) {}
  }

  let count = 0;
  for (const doc of docs) {
    const f = doc.data();
    const firebaseId = doc.id;
    const email = (f.email && typeof f.email === 'string') ? f.email.toLowerCase().trim() : undefined;
    const data = {
      firebaseId,
      name: (f.name || '').trim() || 'Unknown',
      firstName: f.firstName != null ? String(f.firstName).trim() : null,
      lastName: f.lastName != null ? String(f.lastName).trim() : null,
      email: email || undefined,
      phone: f.phone != null ? normPhone(String(f.phone)) : undefined,
      socialMediaName: f.socialMediaName != null ? String(f.socialMediaName) : undefined,
      referralSource: f.referralSource != null ? String(f.referralSource) : undefined,
      isRepeatClient: Boolean(f.isRepeatClient),
      notes: f.notes != null ? String(f.notes) : undefined,
      clientType: f.isRepeatClient ? 'REPEAT' : 'NEW',
      totalBookings: 0,
      completedBookings: 0,
      totalSpent: 0,
      totalTips: 0,
      totalDiscounts: 0,
      lastVisit: null,
      isActive: true,
      isVIP: false,
      createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
      updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
    };
    await Customer.findOneAndUpdate({ firebaseId }, data, { upsert: true, new: true });
    count++;
    log(`✅ Migrated Customer: ${data.name}`);
  }

  log(`Final count: ${count} customer(s) migrated.`, 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
