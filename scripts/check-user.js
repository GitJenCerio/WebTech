/**
 * Quick check: does this user exist and can they sign in?
 * Usage: node scripts/check-user.js <email>
 * Example: node scripts/check-user.js cerio.dev@gmail.com
 */
require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(require('path').join(__dirname, '../.env.local')) });
const mongoose = require('mongoose');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/check-user.js <email>');
    process.exit(1);
  }
  const emailKey = email.toLowerCase().trim();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  console.log('MONGODB_URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // hide credentials
  await mongoose.connect(uri);
  const User = mongoose.connection.collection('users');
  const user = await User.findOne({ email: emailKey });
  if (!user) {
    console.log('❌ No user found for:', emailKey);
    const any = await User.findOne({});
    if (any) console.log('   (DB has users; try exact email. Sample:', any.email, ')');
    else console.log('   (Users collection is empty)');
    process.exit(1);
  }
  console.log('✅ User found:');
  console.log('   email:', user.email);
  console.log('   role:', user.role);
  console.log('   status:', user.status);
  console.log('   Can sign in:', user.status === 'active' ? 'YES' : 'NO (status is inactive)');
  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
