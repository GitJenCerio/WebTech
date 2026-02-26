/**
 * 5_migrate_users.js — Migrate users from Firebase Auth + Firestore to MongoDB (READ Firebase only).
 * Depends on nailTechs (run 1_migrate_nailtechs.js first).
 *
 * Usage: node scripts/migration/5_migrate_users.js
 * Test:  Use .limit(1) in listUsers for a single-user run.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const UserSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    name: String,
    image: String,
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    assignedNailTechId: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const NailTechSchema = new mongoose.Schema({ firebaseId: String }, {});
const NailTech = mongoose.models.NailTech || mongoose.model('NailTech', NailTechSchema);

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const c = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' }[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

function initFirebase() {
  if (admin.apps.length) return admin.auth();
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))) });
    return admin.auth();
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
    return admin.auth();
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    return admin.auth();
  }
  const p = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(p)) {
    admin.initializeApp({ credential: admin.credential.cert(require(p)) });
    return admin.auth();
  }
  throw new Error('Firebase credentials not found.');
}

function mapRole(firebaseRole) {
  const r = (firebaseRole || '').toLowerCase();
  if (r === 'admin' || r === 'manager') return 'admin';
  if (r === 'staff' || r === 'viewer') return 'staff';
  return 'admin';
}

async function run() {
  let auth;
  try {
    auth = initFirebase();
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

  let listResult;
  try {
    listResult = await auth.listUsers(1000); // READ ONLY — reduce to 1 for test
  } catch (e) {
    log(`Firebase listUsers failed: ${e.message}`, 'ERROR');
    process.exit(1);
  }

  let firestore;
  try {
    firestore = admin.app().firestore();
  } catch (_) {
    firestore = null;
  }

  let count = 0;
  for (const userRecord of listResult.users) {
    const uid = userRecord.uid;
    const email = (userRecord.email || '').toLowerCase().trim();
    const displayName = userRecord.displayName || null;
    if (!email) {
      log(`Skipping user ${uid}: no email`, 'WARNING');
      continue;
    }

    let firebaseRole = null;
    let nailTechId = null;
    if (firestore) {
      try {
        const userDoc = await firestore.collection('users').doc(uid).get(); // READ ONLY
        if (userDoc.exists) {
          const d = userDoc.data();
          firebaseRole = d.role;
          if (d.nailTechId) {
            const nt = await NailTech.findOne({ firebaseId: d.nailTechId }).lean();
            if (nt) nailTechId = nt._id.toString();
          }
        }
      } catch (_) {}
    }

    const role = mapRole(firebaseRole);
    const data = {
      firebaseId: uid,
      email,
      name: displayName,
      password: null,
      emailVerified: true,
      role,
      assignedNailTechId: nailTechId || undefined,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await User.findOneAndUpdate(
      { firebaseId: uid },
      data,
      { upsert: true, new: true }
    );
    count++;
    log(`✅ Migrated User: ${email} | role: ${role}`);
  }

  log(`Final count: ${count} user(s) migrated.`, 'SUCCESS');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
