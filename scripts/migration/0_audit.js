/**
 * 0_audit.js — Firebase audit (READ ONLY)
 * ========================================
 * Discovers all field names and counts before migration. No writes to Firebase or MongoDB.
 *
 * Usage: node scripts/migration/0_audit.js
 * Output: scripts/migration/audit_report.json
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const COLLECTIONS = ['bookings', 'customers', 'nailTechs', 'slots', 'users'];
// Firestore may use snake_case; try these if primary name returns empty
const COLLECTION_ALIASES = {
  nailTechs: ['nailTechs', 'nail_techs'],
  users: ['users'],
  customers: ['customers', 'clients'],
  slots: ['slots'],
  bookings: ['bookings'],
};

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' };
  console.log(`${colors[level] || '\x1b[0m'}[${ts}] ${msg}\x1b[0m`);
}

function collectFieldNames(obj, prefix = '') {
  const names = new Set();
  if (obj === null || typeof obj !== 'object') return names;
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    names.add(full);
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      collectFieldNames(obj[key], full).forEach((n) => names.add(n));
    }
  }
  return names;
}

function initFirebase() {
  if (admin.apps.length) return admin.firestore();

  const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (jsonPath && fs.existsSync(path.resolve(jsonPath))) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(jsonPath))) });
    log('Firebase initialized via GOOGLE_APPLICATION_CREDENTIALS', 'SUCCESS');
    return admin.firestore();
  }

  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonString) {
    try {
      const cred = JSON.parse(jsonString);
      admin.initializeApp({ credential: admin.credential.cert(cred) });
      log('Firebase initialized via FIREBASE_SERVICE_ACCOUNT_JSON', 'SUCCESS');
      return admin.firestore();
    } catch (e) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${e.message}`);
    }
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    });
    log('Firebase initialized via FIREBASE_* env vars', 'SUCCESS');
    return admin.firestore();
  }

  const servicePath = path.resolve('./serviceAccountKey.json');
  if (fs.existsSync(servicePath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(servicePath)) });
    log('Firebase initialized via serviceAccountKey.json', 'SUCCESS');
    return admin.firestore();
  }

  throw new Error(
    'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY, or add serviceAccountKey.json'
  );
}

async function run() {
  const report = {
    generatedAt: new Date().toISOString(),
    collections: {},
    bookingSpecialCases: {
      pendingFormOrMigrationNeeded: [],
      missingSlotId: [],
      missingCustomerId: [],
      missingNailTechId: [],
    },
  };

  let firestore;
  try {
    firestore = initFirebase();
  } catch (err) {
    log(err.message, 'ERROR');
    process.exit(1);
  }

  for (const collName of COLLECTIONS) {
    const aliases = COLLECTION_ALIASES[collName] || [collName];
    let snapshot = null;
    let usedName = null;
    for (const name of aliases) {
      try {
        const ref = firestore.collection(name);
        snapshot = await ref.get(); // READ ONLY — or use ref.limit(1).get() for test run
        if (snapshot.size > 0 || usedName === null) {
          usedName = name;
          if (snapshot.size > 0) break;
        }
      } catch (e) {
        log(`Collection ${name} error: ${e.message}`, 'WARNING');
      }
    }

    const docCount = snapshot ? snapshot.size : 0;
    const fieldSet = new Set();
    const docs = snapshot ? snapshot.docs : [];

    for (const doc of docs) {
      const data = doc.data();
      collectFieldNames(data).forEach((f) => fieldSet.add(f));
    }

    const fields = [...fieldSet].sort();
    report.collections[collName] = {
      firestoreCollectionName: usedName || aliases[0],
      documentCount: docCount,
      uniqueFieldNames: fields,
    };
    log(`Collection ${collName} (${usedName || aliases[0]}): ${docCount} docs, ${fields.length} unique fields`);

    if (collName === 'bookings') {
      for (const doc of docs) {
        const d = doc.data();
        const id = doc.id;
        const cid = d.customerId;
        const sid = d.slotId;
        const nid = d.nailTechId;
        const code = d.bookingId || id;

        if (cid === 'PENDING_FORM_SUBMISSION' || cid === 'MIGRATION_NEEDED') {
          report.bookingSpecialCases.pendingFormOrMigrationNeeded.push({ id, bookingCode: code, customerId: cid });
        }
        if (!sid) report.bookingSpecialCases.missingSlotId.push({ id, bookingCode: code });
        if (!cid) report.bookingSpecialCases.missingCustomerId.push({ id, bookingCode: code });
        if (!nid) report.bookingSpecialCases.missingNailTechId.push({ id, bookingCode: code });
      }
      log(
        `Bookings: PENDING_FORM/MIGRATION_NEEDED=${report.bookingSpecialCases.pendingFormOrMigrationNeeded.length}, missing slotId=${report.bookingSpecialCases.missingSlotId.length}, missing customerId=${report.bookingSpecialCases.missingCustomerId.length}, missing nailTechId=${report.bookingSpecialCases.missingNailTechId.length}`,
        'WARNING'
      );
    }
  }

  const outPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  log(`Audit report saved to ${outPath}`, 'SUCCESS');
  process.exit(0);
}

run().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
