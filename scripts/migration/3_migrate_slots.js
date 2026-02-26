/**
 * 3_migrate_slots.js — Migrate slots from Firebase to MongoDB (READ Firebase only).
 * Depends on nailTechs (run 1_migrate_nailtechs.js first).
 *
 * Usage: node scripts/migration/3_migrate_slots.js
 * Test:  Uncomment .limit(1) in the Firebase fetch below for a single-doc run.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// nailTechId can be null when lookup fails (migration edge case)
const SlotSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, required: true, enum: ['available', 'blocked', 'pending', 'confirmed'] },
    slotType: { type: String, enum: ['regular', 'with_squeeze_fee'] },
    notes: { type: String, default: '' },
    isHidden: { type: Boolean, default: false },
    nailTechId: { type: String }, // optional for migration when unresolved
  },
  { timestamps: true }
);
const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

const NailTechSchema = new mongoose.Schema({ firebaseId: String, name: String }, { timestamps: true });
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

  let docs = [];
  try {
    // const snap = await firestore.collection('slots').limit(1).get(); // uncomment for test run
    const snap = await firestore.collection('slots').get(); // READ ONLY
    docs = snap.docs;
  } catch (_) {}

  let count = 0;
  for (const doc of docs) {
    const f = doc.data();
    const firebaseId = doc.id;
    let nailTechMongoId = null;
    if (f.nailTechId) {
      const nt = await NailTech.findOne({ firebaseId: f.nailTechId }).lean();
      if (nt) nailTechMongoId = nt._id.toString();
      else log(`⚠️ WARNING: Could not resolve nailTechId for slot ${doc.id} — setting null`, 'WARNING');
    }

    const data = {
      firebaseId,
      date: (f.date || '').trim() || '',
      time: (f.time || '').trim() || '00:00',
      status: (f.status || 'available').toLowerCase(),
      slotType: f.slotType === 'with_squeeze_fee' ? 'with_squeeze_fee' : (f.slotType === 'regular' ? 'regular' : null),
      notes: (f.notes != null ? String(f.notes) : '') || '',
      isHidden: Boolean(f.isHidden),
      nailTechId: nailTechMongoId,
      createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
      updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
    };
    await Slot.findOneAndUpdate({ firebaseId }, data, { upsert: true, new: true });
    count++;
    log(`✅ Migrated Slot: ${data.date} ${data.time}`);
  }

  log(`Final count: ${count} slot(s) migrated.`, 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
