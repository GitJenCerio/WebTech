/**
 * Firebase to MongoDB Migration Script
 * =====================================
 * 
 * This script migrates client/customer data from Firebase Firestore to MongoDB.
 * 
 * SETUP INSTRUCTIONS:
 * -------------------
 * 1. Firebase Authentication (choose ONE method):
 * 
 *    METHOD A - Environment Variables (RECOMMENDED):
 *    - Set FIREBASE_PROJECT_ID in .env
 *    - Set FIREBASE_CLIENT_EMAIL in .env
 *    - Set FIREBASE_PRIVATE_KEY in .env (entire key with \n newlines)
 * 
 *    METHOD B - Service Account JSON File:
 *    - Go to Firebase Console -> Project Settings -> Service Accounts
 *    - Click "Generate New Private Key"
 *    - Save the JSON file as 'serviceAccountKey.json' in the project root
 * 
 * 2. Create a .env file with the following variables:
 *    - MONGODB_URI=your_mongodb_connection_string
 *    - DRY_RUN=false (set to true for dry-run mode)
 *    - BATCH_SIZE=100 (optional, defaults to 100)
 *    - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (if using Method A)
 * 
 * 3. Install dependencies:
 *    npm install firebase-admin mongoose dotenv
 * 
 * 4. Run the script:
 *    node scripts/migrate-firebase-to-mongodb.js
 * 
 * FEATURES:
 * ---------
 * - Progress tracking with real-time updates
 * - Dry-run mode to preview migrations without writing to MongoDB
 * - Resume capability from last processed document
 * - Duplicate detection to prevent re-migration
 * - Batch processing to manage memory usage
 * - Comprehensive error handling and logging
 * - Validation and summary reports
 * - Rollback capability
 */

require('dotenv').config();
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  FIREBASE_COLLECTION: 'customers',
  MONGODB_COLLECTION: 'customers',
  SERVICE_ACCOUNT_PATH: './serviceAccountKey.json',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 100,
  DRY_RUN: process.env.DRY_RUN === 'true',
  CHECKPOINT_FILE: './migration-checkpoint.json',
  REPORT_FILE: './migration-report.json',
  ERROR_LOG_FILE: './migration-errors.log',
  BACKUP_FILE: './migration-backup.json',
};

// ============================================================================
// MONGOOSE SCHEMA
// ============================================================================

const CustomerSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    socialMediaName: { type: String },
    referralSource: { type: String },
    isRepeatClient: { type: Boolean, default: false },
    notes: { type: String },
    migratedAt: { type: Date, default: Date.now },
    originalCreatedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes (firebaseId already indexed via unique: true on field)
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

const Customer = mongoose.model('Customer', CustomerSchema);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Logger with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const colorCode = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    WARNING: '\x1b[33m',
    ERROR: '\x1b[31m',
  }[level] || '\x1b[0m';
  
  console.log(`${colorCode}[${timestamp}] [${level}] ${message}\x1b[0m`);
}

/**
 * Write to error log file
 */
function logError(docId, error, data = null) {
  const timestamp = new Date().toISOString();
  const errorEntry = `[${timestamp}] Document ID: ${docId}\nError: ${error.message}\nStack: ${error.stack}\n${data ? `Data: ${JSON.stringify(data, null, 2)}\n` : ''}${'='.repeat(80)}\n`;
  
  fs.appendFileSync(CONFIG.ERROR_LOG_FILE, errorEntry);
  log(`Error logged for document ${docId}: ${error.message}`, 'ERROR');
}

/**
 * Progress indicator
 */
class ProgressIndicator {
  constructor(total) {
    this.total = total;
    this.current = 0;
    this.successful = 0;
    this.failed = 0;
    this.skipped = 0;
    this.startTime = Date.now();
  }

  update(status) {
    this.current++;
    if (status === 'success') this.successful++;
    else if (status === 'failed') this.failed++;
    else if (status === 'skipped') this.skipped++;

    const percentage = ((this.current / this.total) * 100).toFixed(2);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const rate = (this.current / elapsed).toFixed(2);
    const eta = ((this.total - this.current) / rate).toFixed(0);

    process.stdout.write(
      `\r\x1b[K Progress: ${this.current}/${this.total} (${percentage}%) | ` +
      `✓ ${this.successful} | ✗ ${this.failed} | ⊘ ${this.skipped} | ` +
      `${rate} docs/s | ETA: ${eta}s`
    );

    if (this.current === this.total) {
      console.log('\n');
    }
  }

  getSummary() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    return {
      total: this.total,
      processed: this.current,
      successful: this.successful,
      failed: this.failed,
      skipped: this.skipped,
      duration: `${elapsed}s`,
      rate: `${(this.current / elapsed).toFixed(2)} docs/s`,
    };
  }
}

/**
 * Save checkpoint for resume capability
 */
function saveCheckpoint(lastProcessedId, stats) {
  const checkpoint = {
    lastProcessedId,
    timestamp: new Date().toISOString(),
    stats,
  };
  fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  log(`Checkpoint saved: ${lastProcessedId}`);
}

/**
 * Load checkpoint
 */
function loadCheckpoint() {
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    const checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8'));
    log(`Checkpoint loaded: resuming from ${checkpoint.lastProcessedId}`, 'INFO');
    return checkpoint;
  }
  return null;
}

/**
 * Clear checkpoint
 */
function clearCheckpoint() {
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
    log('Checkpoint cleared', 'INFO');
  }
}

// ============================================================================
// FIELD MAPPING FUNCTIONS
// ============================================================================

/**
 * Transform Firebase document to MongoDB document
 */
function transformDocument(firebaseDoc) {
  const data = firebaseDoc.data();
  const id = firebaseDoc.id;

  // Map Firebase fields to MongoDB schema
  const transformed = {
    firebaseId: id,
    name: data.name || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    email: data.email || null,
    phone: data.phone || data.phoneNumber || data.mobile || null,
    socialMediaName: data.socialMediaName || data.socialMedia || data.instagram || null,
    referralSource: data.referralSource || data.howDidYouHear || data.source || null,
    isRepeatClient: data.isRepeatClient || data.returning || data.repeat || false,
    notes: data.notes || data.comments || data.additionalInfo || null,
    migratedAt: new Date(),
    originalCreatedAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
  };

  // Remove null values to use schema defaults
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === null) {
      delete transformed[key];
    }
  });

  return transformed;
}

// ============================================================================
// DATABASE CONNECTIONS
// ============================================================================

/**
 * Initialize Firebase Admin SDK
 */
async function initializeFirebase() {
  try {
    // Method A: Use environment variables (preferred)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      log('Initializing Firebase using environment variables', 'INFO');
      
      // Parse the private key (handle escaped newlines)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      
      log('Firebase Admin SDK initialized successfully (via environment variables)', 'SUCCESS');
    }
    // Method B: Use service account JSON file
    else if (fs.existsSync(CONFIG.SERVICE_ACCOUNT_PATH)) {
      log('Initializing Firebase using service account JSON file', 'INFO');
      
      const serviceAccount = require(path.resolve(CONFIG.SERVICE_ACCOUNT_PATH));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      log('Firebase Admin SDK initialized successfully (via JSON file)', 'SUCCESS');
    }
    // No credentials found
    else {
      throw new Error(
        'Firebase credentials not found. Please use one of these methods:\n' +
        '\n' +
        'METHOD A (Recommended): Set environment variables in .env:\n' +
        '  - FIREBASE_PROJECT_ID\n' +
        '  - FIREBASE_CLIENT_EMAIL\n' +
        '  - FIREBASE_PRIVATE_KEY\n' +
        '\n' +
        'METHOD B: Download service account key from Firebase Console and save as:\n' +
        `  - ${CONFIG.SERVICE_ACCOUNT_PATH}\n`
      );
    }

    return admin.firestore();
  } catch (error) {
    log(`Failed to initialize Firebase: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    log('MongoDB connected successfully', 'SUCCESS');
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error.message}`, 'ERROR');
    throw error;
  }
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Check if document already exists in MongoDB
 */
async function documentExists(firebaseId) {
  const existing = await Customer.findOne({ firebaseId });
  return !!existing;
}

/**
 * Migrate a single document
 */
async function migrateDocument(firebaseDoc, dryRun = false) {
  const firebaseId = firebaseDoc.id;

  try {
    // Check for duplicates
    if (await documentExists(firebaseId)) {
      return { status: 'skipped', reason: 'Already exists', id: firebaseId };
    }

    // Transform the document
    const transformed = transformDocument(firebaseDoc);

    // Dry run - just return what would be migrated
    if (dryRun) {
      return {
        status: 'dry-run',
        id: firebaseId,
        data: transformed,
      };
    }

    // Save to MongoDB
    const customer = new Customer(transformed);
    await customer.save();

    return { status: 'success', id: firebaseId };
  } catch (error) {
    logError(firebaseId, error, firebaseDoc.data());
    return { status: 'failed', id: firebaseId, error: error.message };
  }
}

/**
 * Batch migration
 */
async function migrateBatch(documents, dryRun = false) {
  const results = [];

  for (const doc of documents) {
    const result = await migrateDocument(doc, dryRun);
    results.push(result);
  }

  return results;
}

/**
 * Main migration function
 */
async function migrate() {
  log('Starting migration process...', 'INFO');
  log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`, 'INFO');
  log(`Batch size: ${CONFIG.BATCH_SIZE}`, 'INFO');

  // Initialize connections
  const firestore = await initializeFirebase();
  await connectMongoDB();

  // Clear old logs
  if (fs.existsSync(CONFIG.ERROR_LOG_FILE)) {
    fs.unlinkSync(CONFIG.ERROR_LOG_FILE);
  }

  // Load checkpoint if exists
  const checkpoint = loadCheckpoint();
  let resumeFromId = checkpoint?.lastProcessedId;

  // Fetch all documents from Firebase
  log('Fetching documents from Firebase...', 'INFO');
  const snapshot = await firestore.collection(CONFIG.FIREBASE_COLLECTION).get();
  const totalDocs = snapshot.size;

  log(`Found ${totalDocs} documents in Firebase ${CONFIG.FIREBASE_COLLECTION} collection`, 'INFO');

  if (totalDocs === 0) {
    log('No documents to migrate', 'WARNING');
    return {
      progress: { completed: 0, total: 0, percentage: 0 },
      results: { successful: [], failed: [], skipped: [], dryRunSamples: [] }
    };
  }

  // Filter documents if resuming
  let documents = snapshot.docs;
  if (resumeFromId) {
    const resumeIndex = documents.findIndex(doc => doc.id === resumeFromId);
    if (resumeIndex >= 0) {
      documents = documents.slice(resumeIndex + 1);
      log(`Resuming from document ${resumeFromId}, ${documents.length} documents remaining`, 'INFO');
    } else {
      log('Checkpoint document not found, starting from beginning', 'WARNING');
    }
  }

  // Create backup of all documents
  if (!CONFIG.DRY_RUN) {
    log('Creating backup...', 'INFO');
    const backup = documents.map(doc => ({ id: doc.id, data: doc.data() }));
    fs.writeFileSync(CONFIG.BACKUP_FILE, JSON.stringify(backup, null, 2));
    log(`Backup saved to ${CONFIG.BACKUP_FILE}`, 'SUCCESS');
  }

  // Initialize progress indicator
  const progress = new ProgressIndicator(documents.length);

  const migrationResults = {
    successful: [],
    failed: [],
    skipped: [],
    dryRunSamples: [],
  };

  // Process in batches
  for (let i = 0; i < documents.length; i += CONFIG.BATCH_SIZE) {
    const batch = documents.slice(i, i + CONFIG.BATCH_SIZE);
    const results = await migrateBatch(batch, CONFIG.DRY_RUN);

    results.forEach(result => {
      progress.update(result.status === 'success' || result.status === 'dry-run' ? 'success' : result.status);

      if (result.status === 'success' || result.status === 'dry-run') {
        migrationResults.successful.push(result.id);
        if (result.status === 'dry-run' && migrationResults.dryRunSamples.length < 5) {
          migrationResults.dryRunSamples.push(result.data);
        }
      } else if (result.status === 'failed') {
        migrationResults.failed.push({ id: result.id, error: result.error });
      } else if (result.status === 'skipped') {
        migrationResults.skipped.push({ id: result.id, reason: result.reason });
      }
    });

    // Save checkpoint after each batch
    if (!CONFIG.DRY_RUN && batch.length > 0) {
      const lastDoc = batch[batch.length - 1];
      saveCheckpoint(lastDoc.id, progress.getSummary());
    }
  }

  log('Migration completed!', 'SUCCESS');

  return { progress: progress.getSummary(), results: migrationResults };
}

/**
 * Validate migration results
 */
async function validateMigration(firestore) {
  log('Validating migration...', 'INFO');

  try {
    // Count documents in Firebase
    const firebaseSnapshot = await firestore.collection(CONFIG.FIREBASE_COLLECTION).get();
    const firebaseCount = firebaseSnapshot.size;

    // Count documents in MongoDB
    const mongoCount = await Customer.countDocuments();

    log(`Firebase documents: ${firebaseCount}`, 'INFO');
    log(`MongoDB documents: ${mongoCount}`, 'INFO');

    const validation = {
      firebaseCount,
      mongoCount,
      difference: mongoCount - firebaseCount,
      status: mongoCount >= firebaseCount ? 'PASS' : 'FAIL',
    };

    if (validation.status === 'PASS') {
      log('Validation passed ✓', 'SUCCESS');
    } else {
      log(`Validation failed: ${validation.difference} documents missing`, 'WARNING');
    }

    return validation;
  } catch (error) {
    log(`Validation error: ${error.message}`, 'ERROR');
    return { status: 'ERROR', error: error.message };
  }
}

/**
 * Generate migration report
 */
function generateReport(summary, results, validation) {
  const report = {
    timestamp: new Date().toISOString(),
    mode: CONFIG.DRY_RUN ? 'DRY_RUN' : 'LIVE',
    configuration: {
      firebaseCollection: CONFIG.FIREBASE_COLLECTION,
      mongodbCollection: CONFIG.MONGODB_COLLECTION,
      batchSize: CONFIG.BATCH_SIZE,
    },
    summary,
    results: {
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      failedDocuments: results.failed,
      skippedDocuments: results.skipped,
    },
    validation,
    dryRunSamples: results.dryRunSamples || [],
  };

  fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(report, null, 2));
  log(`Report saved to ${CONFIG.REPORT_FILE}`, 'SUCCESS');

  return report;
}

// ============================================================================
// ROLLBACK FUNCTION
// ============================================================================

/**
 * Rollback migration - delete all migrated documents
 */
async function rollback() {
  log('Starting rollback...', 'WARNING');

  try {
    await connectMongoDB();

    const result = await Customer.deleteMany({});
    log(`Rollback completed: ${result.deletedCount} documents removed from MongoDB`, 'SUCCESS');

    clearCheckpoint();

    return { deletedCount: result.deletedCount };
  } catch (error) {
    log(`Rollback failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('   FIREBASE TO MONGODB MIGRATION SCRIPT');
  console.log('='.repeat(80) + '\n');

  try {
    // Check for rollback flag
    if (process.argv.includes('--rollback')) {
      const answer = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      answer.question('⚠️  This will delete ALL documents from MongoDB. Are you sure? (yes/no): ', async (response) => {
        if (response.toLowerCase() === 'yes') {
          await rollback();
        } else {
          log('Rollback cancelled', 'INFO');
        }
        answer.close();
        process.exit(0);
      });
      return;
    }

    // Run migration
    const { progress, results } = await migrate();

    // Validate only if not dry run
    let validation = null;
    if (!CONFIG.DRY_RUN) {
      const firestore = admin.firestore();
      validation = await validateMigration(firestore);
    }

    // Generate report
    const report = generateReport(progress, results, validation);

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('   MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Mode:           ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Total:          ${progress.total}`);
    console.log(`Processed:      ${progress.processed}`);
    console.log(`Successful:     ${progress.successful}`);
    console.log(`Failed:         ${progress.failed}`);
    console.log(`Skipped:        ${progress.skipped}`);
    console.log(`Duration:       ${progress.duration}`);
    console.log(`Rate:           ${progress.rate}`);
    console.log('='.repeat(80) + '\n');

    if (CONFIG.DRY_RUN && results.dryRunSamples.length > 0) {
      console.log('Sample transformed documents (first 5):');
      console.log(JSON.stringify(results.dryRunSamples, null, 2));
      console.log('\nTo perform the actual migration, set DRY_RUN=false in your .env file\n');
    }

    if (results.failed.length > 0) {
      log(`⚠️  ${results.failed.length} documents failed. Check ${CONFIG.ERROR_LOG_FILE} for details`, 'WARNING');
    }

    if (!CONFIG.DRY_RUN) {
      clearCheckpoint();
    }

    // Close connections
    await mongoose.connection.close();
    await admin.app().delete();

    log('Migration script completed successfully', 'SUCCESS');
    process.exit(0);
  } catch (error) {
    log(`Migration script failed: ${error.message}`, 'ERROR');
    console.error(error);

    // Close connections
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      if (admin.apps.length > 0) {
        await admin.app().delete();
      }
    } catch (closeError) {
      log(`Error closing connections: ${closeError.message}`, 'ERROR');
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'ERROR');
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  log('Migration interrupted by user', 'WARNING');
  
  // Close connections gracefully
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'ERROR');
  }
  
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { migrate, rollback, validateMigration };
