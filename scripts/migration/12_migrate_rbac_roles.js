/**
 * 12_migrate_rbac_roles.js — Migrate User roles from admin/staff to SUPER_ADMIN/ADMIN/MANAGER/STAFF.
 * Run this BEFORE deploying the new User schema with 4-role enum.
 *
 * Usage: node scripts/migration/12_migrate_rbac_roles.js
 *
 * Actions:
 * - admin -> ADMIN
 * - staff -> STAFF
 * - Promotes the first admin (oldest by createdAt) to SUPER_ADMIN if none exist
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../../.env.local')) });
const mongoose = require('mongoose');

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const c = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m', WARNING: '\x1b[33m' }[level] || '\x1b[0m';
  console.log(`${c}[${ts}] ${msg}\x1b[0m`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    log('MONGODB_URI is required', 'ERROR');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  log('Connected to MongoDB');

  const User = mongoose.connection.collection('users');
  const adminLower = 'admin';
  const staffLower = 'staff';

  // Use raw collection so we can update legacy enum values
  const adminUsers = await User.find({ role: adminLower }).sort({ createdAt: 1 }).toArray();
  const staffUsers = await User.find({ role: staffLower }).toArray();

  log(`Found ${adminUsers.length} admin(s), ${staffUsers.length} staff`);

  // Promote first admin to SUPER_ADMIN if no SUPER_ADMIN exists
  const hasSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (!hasSuperAdmin && adminUsers.length > 0) {
    const first = adminUsers[0];
    await User.updateOne({ _id: first._id }, { $set: { role: 'SUPER_ADMIN' } });
    log(`Promoted first admin (${first.email}) to SUPER_ADMIN`, 'SUCCESS');
  }

  // Migrate remaining admins to ADMIN
  const adminResult = await User.updateMany(
    { role: adminLower },
    { $set: { role: 'ADMIN' } }
  );
  if (adminResult.modifiedCount > 0) {
    log(`Migrated ${adminResult.modifiedCount} admin(s) to ADMIN`, 'SUCCESS');
  }

  // Migrate staff to STAFF
  const staffResult = await User.updateMany(
    { role: staffLower },
    { $set: { role: 'STAFF' } }
  );
  if (staffResult.modifiedCount > 0) {
    log(`Migrated ${staffResult.modifiedCount} staff to STAFF`, 'SUCCESS');
  }

  log('RBAC migration complete');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  log(err.message, 'ERROR');
  process.exit(1);
});
