# Firebase to MongoDB – Full Migration Guide

This guide covers migrating **all** Firestore collections to MongoDB: `nail_techs`, `users`, `customers`, `slots`, `bookings`, and `blocks`.

## Prerequisites

- Node.js (v14+)
- Access to Firebase project
- MongoDB (local or Atlas)
- Firebase Admin credentials

## Step 1: Configure environment

Ensure `.env` or `.env.local` contains:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/glammednails

# Firebase Admin (choose one method)

# Method A: environment variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Method B: service account file
# Place serviceAccountKey.json in project root
```

## Step 2: Backup Firebase

```bash
npm run backup-firestore
```

Backups are written to `backups/<timestamp>/`.

## Step 3: Dry run (recommended)

Preview the migration without writing data:

```bash
npm run migrate:all:dry-run
```

Or:

```bash
node scripts/migrate-all-firebase-to-mongodb.js --dry-run
```

## Step 4: Run migration

```bash
npm run migrate:all
```

## Migration order

1. **nail_techs** – no dependencies  
2. **users** – references nail_techs  
3. **customers** – no dependencies  
4. **slots** – references nail_techs  
5. **bookings** – references customers, nail_techs, slots  
6. **blocks** – optional

IDs are mapped so references stay valid in MongoDB.

## Optional flags

| Command | Description |
|---------|-------------|
| `--dry-run` | Preview only, no writes |
| `--only=slots,bookings` | Migrate specific collections |
| `--rollback` | Remove migrated data (with confirmation) |

Examples:

```bash
# Migrate only slots and bookings
node scripts/migrate-all-firebase-to-mongodb.js --only=slots,bookings

# Rollback (removes migrated documents)
npm run migrate:all:rollback
```

## Output files

- `migration-full-report.json` – Summary and counts
- `migration-full-errors.log` – Details of failed documents

## After migration

1. Test the app against MongoDB.
2. Confirm bookings, slots, customers, and nail techs load correctly.
3. Update app config if needed to stop using Firestore.
4. Keep Firebase data until you are confident in the migration.

## Troubleshooting

### "MONGODB_URI is required"
Set `MONGODB_URI` in `.env` or `.env.local`.

### "Firebase credentials required"
Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, or place `serviceAccountKey.json` in the project root.

### Duplicate key errors
The script is idempotent. It uses `firebaseId` to detect already-migrated documents. Re-run the migration; existing documents will be skipped.

### Different field names in Firebase
If your Firestore schema differs, edit the transform functions in `scripts/migrate-all-firebase-to-mongodb.js` (e.g. `transformBooking`, `transformCustomer`).
