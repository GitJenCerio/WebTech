# Migration Checklist ✓

Follow these steps in order to successfully migrate your data from Firebase to MongoDB.

## Pre-Migration Setup

- [ ] **Step 1**: Verify all dependencies are installed
  ```bash
  npm install
  ```
  _(All required packages are already in package.json: firebase-admin, mongoose, dotenv)_

- [x] **Step 2**: Firebase credentials configured ✅
  - Your Firebase Admin SDK credentials are already set up in `scripts/.env`
  - Project: `glammednailsbyjhen-1345c`
  - No additional Firebase setup needed!

- [x] **Step 3**: Environment file created ✅
  - The `scripts/.env` file is already created with your Firebase credentials

- [ ] **Step 4**: Configure MongoDB connection
  - [ ] Open `scripts/.env` in your editor
  - [ ] Update `MONGODB_URI` with your actual MongoDB connection string
    ```env
    # For local MongoDB:
    MONGODB_URI=mongodb://localhost:27017/glammednails
    
    # For MongoDB Atlas:
    MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glammednails
    ```
  - [ ] Verify `DRY_RUN=true` (for safety on first run)

## Test Run (Dry-Run Mode)

- [x] **Step 5**: Dry-run mode is already enabled ✅
  - `DRY_RUN=true` is already set in `scripts/.env`

- [ ] **Step 6**: Run the migration in dry-run mode
  ```bash
  npm run migrate
  ```
  OR

- [ ] **Step 7how many documents will be migrated
  - [ ] Review the sample transformed documents
  - [ ] Verify field mappings look correct
  - [ ] Note any errors in the output

- [ ] **Step 9**: If there are issues:
  - [ ] Check `scripts/migration-errors.log` for details
  - [ ] Verify your Firebase and MongoDB connections
  - [ ] Adjust the `transformDocument()` function if field names differ

## Actual Mig8ation

- [ ] **Step 10**: Disable dry-run mode
  - [ ] Open `scripts/.env`
  - [ ] Set `DRY_RUN=false`

- [ ] **Step 9**: (Optional but recommended) Backup your MongoDB database
  ```bash
  # For MongoDB Atlas, use the Atlas UI
  # For local MongoDB:
  mongodump --0ri="your_mongodb_uri" --out="./mongo-backup"
  ```

- [ ] **Step 12**: Run the actual migration
  ```bash
  npm run migrate
  ```
1
- [ ] **Step 12**: Monitor the progress
  - Watch the real-time progress bar
  - Progress is saved periodically (can resume if interrupted)

## Post-Migration Validation

- [ ] **Step 13**: Review the migration summary in the console

- [ ] **Step 14**: Check the migration report
  - [ ] Open `scripts/migration-report.json`
  - [ ] Verify document counts match
  - [ ] Check validation results
  - [ ] Review any failed or skipped documents

- [ ] **Step 15**: Check for errors
  - [ ] If there are failed documents, check `scripts/migration-errors.log`
  - [ ] Decide if manual intervention is needed

- [ ] **Step 16**: Verify in MongoDB
  ```bash
  # Connect to MongoDB and run:
  use your_database_name
  db.customers.countDocuments()
  db.customers.findOne()  # Check a sample document
  ```

- [ ] **Step 17**: Test your application
  - [ ] Verify the app can read from MongoDB
  - [ ] Check that customer data displays correctly
  - [ ] Test creating new customers

## Cleanup (After Successful Migration)

- [ ] **Step 18**: Keep the backup temporarily
  - Don't delete `scripts/migration-backup.json` yet
  - Keep it for at least a week in case you need to verify data

- [ ] **Step 19**: Delete the checkpoint file
  ```bash
  del scripts\migration-checkpoint.json
  ```
  _(This is usually auto-deleted on successful completion)_

- [ ] **Step 20**: (Optional) Secure the .env file
  - Or keep it for future migrations/rollbacks

## If Something Goes Wrong

### Migration Failed Partially

- [ ] **Option A**: Resume the migration
  - The script automatically resumes from the last checkpoint
  - Just run `npm run migrate` again

- [ ] **Option B**: Rollback and start over
  ```bash
  npm run migrate:rollback
  ```
  - This deletes ALL documents from MongoDB customers collection
  - Then fix the issue and re-run the migration

### Need to Re-run Migration

- [ ] Step 1: Check if documents already exist in MongoDB
  - The script will skip duplicates automatically
  - Based on `firebaseId` field

- [ ] Step 2: Or perform a complete rollback first
  ```bash
  npm run migrate:rollback
  ```

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `npm run migrate` | Run migration (respects DRY_RUN setting in .env) |
| `npm run migrate:dry-run` | Run in dry-run mode (Linux/Mac) |
| `npm run migrate:rollback` | Delete all migrated documents from MongoDB |
| `node scripts/migrate-firebase-to-mongodb.js` | Direct script execution |

## Support Files Generated

After migration, you'll have these files in the `scripts/` directory:

- ✓ `migration-report.json` - Complete statistics and validation
- ✓ `migration-errors.log` - Detailed error information
- ✓ `migration-backup.json` - Complete backup of Firebase data
- ✓ `migration-checkpoint.json` - Resume checkpoint (auto-deleted on success)

## Tips

- 💡 Always run dry-run mode first
- 💡 Keep the backup file until you're sure migration is successful
- 💡 Monitor the first 10-20 documents closely during actual migration
- 💡 If migration is slow, try increasing BATCH_SIZE
- 💡 If you get memory errors, decrease BATCH_SIZE
- 💡 You can interrupt the migration (Ctrl+C) and resume later

---

**Need Help?** Check [MIGRATION_README.md](scripts/MIGRATION_README.md) for detailed documentation and troubleshooting.
