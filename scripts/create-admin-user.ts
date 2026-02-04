/**
 * Script to create an authorized admin user
 * 
 * Usage:
 *   # Create user with email/password:
 *   npx tsx scripts/create-admin-user.ts <email> <password> [name]
 * 
 *   # Create user for Google OAuth only (no password):
 *   npx tsx scripts/create-admin-user.ts <email> --google-only [name]
 * 
 * Examples:
 *   npx tsx scripts/create-admin-user.ts admin@example.com mypassword123 "Admin User"
 *   npx tsx scripts/create-admin-user.ts user@gmail.com --google-only "User Name"
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../lib/mongodb';
import User from '../lib/models/User';

// Load env vars for local script execution (Next.js loads these automatically, tsx scripts do not)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createAdminUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Missing required arguments');
    console.log('\nUsage:');
    console.log('  # Create user with email/password:');
    console.log('  npx tsx scripts/create-admin-user.ts <email> <password> [name]');
    console.log('\n  # Create user for Google OAuth only:');
    console.log('  npx tsx scripts/create-admin-user.ts <email> --google-only [name]');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/create-admin-user.ts admin@example.com mypassword123 "Admin User"');
    console.log('  npx tsx scripts/create-admin-user.ts user@gmail.com --google-only "User Name"');
    process.exit(1);
  }

  const email = args[0];
  const isGoogleOnly = args[1] === '--google-only';
  const password = isGoogleOnly ? undefined : args[1];
  const name = isGoogleOnly ? args[2] : args[2];

  if (!email) {
    console.error('❌ Email is required');
    process.exit(1);
  }

  if (!isGoogleOnly && !password) {
    console.error('❌ Password is required (or use --google-only flag)');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      
      if (isGoogleOnly) {
        console.log('   User already exists. No changes needed for Google OAuth.');
        if (name && name !== existingUser.name) {
          existingUser.name = name;
          await existingUser.save();
          console.log(`   Updated name to: ${name}`);
        }
        process.exit(0);
      }
      
      if (existingUser.password) {
        console.log('   User already has a password set.');
        console.log('   To update the password, delete the user first or use a different email.');
        process.exit(1);
      } else {
        // User exists but has no password - add password
        console.log('   User exists but has no password. Adding password...');
        const hashedPassword = await bcrypt.hash(password!, 10);
        existingUser.password = hashedPassword;
        if (name) existingUser.name = name;
        await existingUser.save();
        console.log(`✅ Password set for existing user: ${email}`);
        process.exit(0);
      }
    }

    // Create new user
    if (isGoogleOnly) {
      console.log(`📝 Creating authorized user for Google OAuth: ${email}`);
      const user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        emailVerified: true,
      });

      console.log(`✅ User created successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user._id}`);
      console.log('\n🎉 User can now sign in with Google OAuth!');
    } else {
      console.log(`📝 Creating authorized user with password: ${email}`);
      const hashedPassword = await bcrypt.hash(password!, 10);
      
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        emailVerified: true,
      });

      console.log(`✅ User created successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user._id}`);
      console.log('\n🎉 User can now sign in with email/password or Google OAuth!');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.error('   User with this email already exists');
    }
    process.exit(1);
  }
}

createAdminUser();
