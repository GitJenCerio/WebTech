/**
 * Phase 1.3 Environment Check
 * Validates that all required env vars are set for Firebase → MongoDB migration
 * Run: node scripts/check-env-for-migration.js
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Also try scripts/.env (used by some setups)
const scriptsEnv = path.resolve(process.cwd(), 'scripts', '.env');
if (fs.existsSync(scriptsEnv)) {
  require('dotenv').config({ path: scriptsEnv });
}

const checks = [];
let passed = 0;

// 1. MONGODB_URI
const mongoUri = process.env.MONGODB_URI;
if (mongoUri && mongoUri.trim() && !mongoUri.includes('your-database-name')) {
  checks.push({ name: 'MONGODB_URI', ok: true, msg: 'Set' });
  passed++;
} else {
  checks.push({ name: 'MONGODB_URI', ok: false, msg: 'Missing or placeholder. Set to your Atlas/production URI.' });
}

// 2. Firebase credentials (METHOD A: env vars)
const hasFirebaseEnv =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

// METHOD B: service account JSON
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
const hasServiceAccount = fs.existsSync(serviceAccountPath);

if (hasFirebaseEnv || hasServiceAccount) {
  checks.push({
    name: 'Firebase credentials',
    ok: true,
    msg: hasFirebaseEnv ? 'Env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)' : 'serviceAccountKey.json',
  });
  passed++;
} else {
  checks.push({
    name: 'Firebase credentials',
    ok: false,
    msg: 'Missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env OR add serviceAccountKey.json to project root.',
  });
}

// 3. DRY_RUN (recommendation for first run)
const dryRun = process.env.DRY_RUN === 'true';
checks.push({
  name: 'DRY_RUN',
  ok: true,
  msg: dryRun ? 'true (good for first run)' : 'false (will write to DB when you run migration)',
  note: !dryRun ? 'For first migration, set DRY_RUN=true or use: npm run migrate:all:dry-run' : null,
});

// Output
console.log('\n=== Phase 1.3 Environment Check ===\n');
checks.forEach((c) => {
  const icon = c.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`${icon} ${c.name}: ${c.msg}`);
  if (c.note) console.log(`   \x1b[33m→ ${c.note}\x1b[0m`);
});

console.log('');
if (passed === 2) {
  console.log('\x1b[32mAll required checks passed. Ready for migration.\x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[31mFix the items above before running migration.\x1b[0m\n');
  process.exit(1);
}
