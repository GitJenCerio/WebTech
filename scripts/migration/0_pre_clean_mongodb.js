/**
 * 0_pre_clean_mongodb.js
 * =======================
 * Run this FIRST before any migration. Wipes all previously migrated data
 * from MongoDB so we start fresh. Firebase is never touched.
 *
 * Usage: node scripts/migration/0_pre_clean_mongodb.js
 * Requires: MONGODB_URI in .env
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Group A: delete only documents that have firebaseId (migrated rows; leave manual records)
const GROUP_A = [
  { name: 'nailtechs', filter: { firebaseId: { $exists: true } } },
  { name: 'customers', filter: { firebaseId: { $exists: true } } },
  { name: 'slots', filter: { firebaseId: { $exists: true } } },
  { name: 'bookings', filter: { firebaseId: { $exists: true } } },
  { name: 'users', filter: { firebaseId: { $exists: true } } },
];

// Group B: delete all (100% migration data)
const GROUP_B = [{ name: 'quotations', filter: {} }];

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' };
  const c = colors[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

async function run() {
  if (!MONGODB_URI) {
    log('Missing MONGODB_URI in environment', 'ERROR');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    log('MongoDB connected', 'SUCCESS');
  } catch (err) {
    log(`MongoDB connect failed: ${err.message}`, 'ERROR');
    process.exit(1);
  }

  const db = mongoose.connection.db;
  if (!db) {
    log('No database on connection', 'ERROR');
    process.exit(1);
  }

  const results = { groupA: [], groupB: [] };

  try {
    for (const { name, filter } of GROUP_A) {
      const col = db.collection(name);
      const before = await col.countDocuments(filter);
      log(`📊 Found ${before} documents in ${name}`);
      const { deletedCount } = await col.deleteMany(filter);
      log(`🗑️ Deleted ${deletedCount} documents from ${name}`);
      const after = await col.countDocuments(filter);
      if (after !== 0) {
        log(`❌ ${name} still has ${after} documents matching filter after delete`, 'ERROR');
        results.groupA.push({ name, ok: false, before, deletedCount, after });
      } else {
        log(`✅ ${name} is clean`);
        results.groupA.push({ name, ok: true, before, deletedCount, after: 0 });
      }
    }

    for (const { name, filter } of GROUP_B) {
      const col = db.collection(name);
      const before = await col.countDocuments(filter);
      log(`📊 Found ${before} documents in ${name}`);
      const { deletedCount } = await col.deleteMany(filter);
      log(`🗑️ Deleted ${deletedCount} documents from ${name}`);
      const after = await col.countDocuments({});
      if (after !== 0) {
        log(`❌ ${name} still has ${after} documents after delete`, 'ERROR');
        results.groupB.push({ name, ok: false, before, deletedCount, after });
      } else {
        log(`✅ ${name} is clean`);
        results.groupB.push({ name, ok: true, before, deletedCount, after: 0 });
      }
    }

    const anyFail = [...results.groupA, ...results.groupB].some((r) => !r.ok);
    if (anyFail) {
      log('One or more collections did not clean to zero', 'ERROR');
      await mongoose.connection.close();
      process.exit(1);
    }

    log('🎉 MongoDB cleaned. Ready for fresh migration.', 'SUCCESS');
  } catch (err) {
    log(`Clean failed: ${err.message}`, 'ERROR');
    console.error(err);
    await mongoose.connection.close();
    process.exit(1);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run();
