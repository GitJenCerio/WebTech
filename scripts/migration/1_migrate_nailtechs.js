/**
 * 1_migrate_nailtechs.js — Migrate nailTechs from Firebase to MongoDB (READ Firebase only).
 * Run after 0_pre_clean_mongodb.js and 0_audit.js. No dependencies.
 *
 * Usage: node scripts/migration/1_migrate_nailtechs.js
 * Test:  Uncomment .limit(1) in the Firebase fetch below for a single-doc run.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mirror of lib/models/NailTech.ts for use in Node (no @/ imports)
const NailTechSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['Owner', 'Junior Tech', 'Senior Tech'] },
    serviceAvailability: { type: String, required: true, enum: ['Studio only', 'Home service only', 'Studio and Home Service'] },
    workingDays: { type: [String], default: [] },
    discount: Number,
    commissionRate: Number,
    status: { type: String, required: true, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);
const NailTech = mongoose.models.NailTech || mongoose.model('NailTech', NailTechSchema);

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

  const collNames = ['nailTechs', 'nail_techs'];
  let docs = [];
  for (const name of collNames) {
    try {
      const ref = firestore.collection(name);
      // const snap = await ref.limit(1).get(); // uncomment for test run
      const snap = await ref.get(); // READ ONLY
      docs = snap.docs;
      if (docs.length > 0) break;
    } catch (_) {}
  }

  let count = 0;
  for (const doc of docs) {
    const f = doc.data();
    const firebaseId = doc.id;
    let serviceAvailability = (f.serviceAvailability || '').trim();
    if (serviceAvailability === 'Both') serviceAvailability = 'Studio and Home Service';

    const data = {
      firebaseId,
      name: (f.name || '').trim() || 'Unknown',
      role: f.role || 'Junior Tech',
      serviceAvailability: serviceAvailability || 'Studio and Home Service',
      workingDays: Array.isArray(f.workingDays) ? f.workingDays : [],
      discount: typeof f.discount === 'number' ? f.discount : (Number(f.discount) || undefined),
      commissionRate: typeof f.commissionRate === 'number' ? f.commissionRate : (Number(f.commissionRate) || undefined),
      status: f.status === 'Inactive' ? 'Inactive' : 'Active',
      createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
      updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
    };
    await NailTech.findOneAndUpdate(
      { firebaseId },
      data,
      { upsert: true, new: true }
    );
    count++;
    log(`✅ Migrated NailTech: ${data.name}`);
  }

  log(`Final count: ${count} nail tech(s) migrated.`, 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
