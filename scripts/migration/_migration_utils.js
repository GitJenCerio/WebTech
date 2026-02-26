/**
 * Shared Firebase (read-only) and MongoDB helpers for migration scripts.
 * Firebase: READ ONLY — .get() and .collection().get() only.
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' };
  console.log(`${colors[level] || '\x1b[0m'}[${ts}] ${msg}\x1b[0m`);
}

function initFirebase() {
  if (admin.apps.length) return admin.firestore();

  const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (jsonPath && fs.existsSync(path.resolve(jsonPath))) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(jsonPath))) });
    return admin.firestore();
  }
  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonString) {
    const cred = JSON.parse(jsonString);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    return admin.firestore();
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
    return admin.firestore();
  }
  const servicePath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(servicePath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(servicePath)) });
    return admin.firestore();
  }
  throw new Error('Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_* env vars.');
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
}

function getFirestoreCollection(firestore, name, aliases) {
  const list = aliases || [name];
  return list;
}

async function getFirestoreDocs(firestore, collectionName, aliases) {
  const list = aliases || [collectionName];
  for (const n of list) {
    try {
      const snap = await firestore.collection(n).get(); // READ ONLY
      return { name: n, docs: snap.docs };
    } catch (e) {
      continue;
    }
  }
  return { name: list[0], docs: [] };
}

module.exports = { log, initFirebase, connectMongo, getFirestoreDocs };