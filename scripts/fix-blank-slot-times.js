/**
 * Fix Blank Slot Times
 * ====================
 * Updates slots in MongoDB that have empty, null, or invalid time
 * to a default time (09:00). Use for already-migrated data.
 *
 * MongoDB ONLY. Does not touch Firebase.
 *
 * USAGE:
 *   node scripts/fix-blank-slot-times.js
 *   node scripts/fix-blank-slot-times.js --dry-run   # Preview only
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const CONFIG = {
  DRY_RUN: process.argv.includes('--dry-run'),
  DEFAULT_TIME: '09:00',
};

const SlotSchema = new mongoose.Schema({
  date: String,
  time: String,
  status: String,
  slotType: String,
  nailTechId: String,
}, { timestamps: true, strict: false });

const Slot = mongoose.model('Slot', SlotSchema);

function isBlankTime(t) {
  if (t == null || t === '') return true;
  const s = String(t).trim();
  if (!s) return true;
  if (!/^\d{1,2}:\d{2}/.test(s) && !/^\d{1,2}:\d{2}\s*(AM|PM)/i.test(s)) return true;
  return false;
}

function log(msg, level = 'INFO') {
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', WARNING: '\x1b[33m', ERROR: '\x1b[31m' };
  console.log(`${colors[level] || ''}[${new Date().toISOString()}] [${level}] ${msg}\x1b[0m`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI is required', 'ERROR');
    process.exit(1);
  }

  log(CONFIG.DRY_RUN ? 'DRY RUN – no changes will be made' : 'Fixing blank slot times', 'INFO');
  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');

  const slots = await Slot.find({}).select('_id date time').lean();
  const badSlots = slots.filter((s) => isBlankTime(s.time));
  log(`Found ${badSlots.length} slot(s) with blank or invalid time`, 'INFO');

  if (badSlots.length === 0) {
    await mongoose.connection.close();
    log('Nothing to fix', 'SUCCESS');
    return;
  }

  if (CONFIG.DRY_RUN) {
    badSlots.slice(0, 10).forEach((s) => console.log(`  ${s._id} | date=${s.date} | time="${s.time}"`));
    if (badSlots.length > 10) console.log(`  ... and ${badSlots.length - 10} more`);
    await mongoose.connection.close();
    log(`Would fix ${badSlots.length} slot(s) to time=${CONFIG.DEFAULT_TIME}`, 'WARNING');
    return;
  }

  const result = await Slot.updateMany(
    { _id: { $in: badSlots.map((s) => s._id) } },
    { $set: { time: CONFIG.DEFAULT_TIME } }
  );
  log(`Updated ${result.modifiedCount} slot(s) to time=${CONFIG.DEFAULT_TIME}`, 'SUCCESS');
  await mongoose.connection.close();
}

main().catch((err) => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
