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
 *   # Create SUPER_ADMIN for Google OAuth (use when locked out):
 *   npx tsx scripts/create-admin-user.ts <email> --google-only --super-admin [name]
 * 
 *   # Fix existing user: set SUPER_ADMIN + active (use when locked out):
 *   npx tsx scripts/create-admin-user.ts <email> --fix
 * 
 *   # Create admin in TEST database: set USE_TEST_DB=true and MONGODB_URI_TEST in .env, then:
 *   npx tsx scripts/create-admin-user.ts <email> <password> --role ADMIN [name]
 * 
 * Examples:
 *   npx tsx scripts/create-admin-user.ts admin@example.com mypassword123 "Admin User"
 *   npx tsx scripts/create-admin-user.ts user@gmail.com --google-only "User Name"
 *   npx tsx scripts/create-admin-user.ts cerio@gmail.com --google-only --super-admin
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
    console.log('  npx tsx scripts/create-admin-user.ts <email> <password> --role=ADMIN [name]');
    console.log('\n  # Create user for Google OAuth only:');
    console.log('  npx tsx scripts/create-admin-user.ts <email> --google-only [name]');
    console.log('\n  # Create SUPER_ADMIN for Google OAuth (when locked out):');
    console.log('  npx tsx scripts/create-admin-user.ts <email> --google-only --super-admin [name]');
    console.log('\n  # Fix existing user (set SUPER_ADMIN + active):');
    console.log('  npx tsx scripts/create-admin-user.ts <email> --fix');
    process.exit(1);
  }

  const email = args[0];
  const isFix = args[1] === '--fix';
  const isGoogleOnly = args[1] === '--google-only' || (args[1] !== '--fix' && args[2] === '--google-only');
  const isSuperAdmin = args.includes('--super-admin');
  const roleArg = args.find((a) => a.startsWith('--role='));
  const roleValue = roleArg ? roleArg.split('=')[1] : undefined;
  const password = isGoogleOnly || isFix ? undefined : (args[1] === '--google-only' ? undefined : args[1]);
  const name = args.find((a) => !['--google-only', '--super-admin', '--fix'].includes(a) && !a.startsWith('--role=') && a !== email && a !== password) || undefined;

  if (!email) {
    console.error('❌ Email is required');
    process.exit(1);
  }

  if (!isGoogleOnly && !isFix && !password) {
    console.error('❌ Password is required (or use --google-only or --fix flag)');
    process.exit(1);
  }

  try {
    const useTestDb = process.env.USE_TEST_DB === 'true';
    if (useTestDb) console.log('📂 Using TEST database (USE_TEST_DB=true)');
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      
      if (isFix) {
        (existingUser as any).role = 'SUPER_ADMIN';
        (existingUser as any).status = 'active';
        await existingUser.save();
        console.log('✅ User updated: role=SUPER_ADMIN, status=active');
        console.log('   You can now sign in with Google.');
        process.exit(0);
      }
      
      if (isGoogleOnly) {
        if (isSuperAdmin) {
          (existingUser as any).role = 'SUPER_ADMIN';
          (existingUser as any).status = 'active';
          if (name) (existingUser as any).name = name;
          await existingUser.save();
          console.log('   Updated: role=SUPER_ADMIN, status=active');
        } else if (name && name !== existingUser.name) {
          existingUser.name = name;
          await existingUser.save();
          console.log(`   Updated name to: ${name}`);
        }
        console.log('   User already exists. You can sign in with Google.');
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

    // Create new user (or create for --fix when user doesn't exist)
    if (isGoogleOnly || isFix) {
      const role = isSuperAdmin || isFix ? 'SUPER_ADMIN' : 'STAFF';
      console.log(`📝 Creating authorized user for Google OAuth: ${email} (role: ${role})`);
      const user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        emailVerified: true,
        role,
        status: 'active',
      });

      console.log(`✅ User created successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${role}`);
      console.log(`   ID: ${user._id}`);
      console.log('\n🎉 User can now sign in with Google OAuth!');
    } else {
      console.log(`📝 Creating authorized user with password: ${email}`);
      const hashedPassword = await bcrypt.hash(password!, 10);
      const role = (roleValue === 'SUPER_ADMIN' || roleValue === 'ADMIN' ? roleValue : 'STAFF') as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
      
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        emailVerified: true,
        role,
      });

      console.log(`✅ User created successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${role}`);
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
