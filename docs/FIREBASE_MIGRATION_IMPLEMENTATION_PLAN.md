# Firebase → MongoDB Migration: Implementation Plan

This plan helps you **clean your current MongoDB** and then **migrate real data from Firebase** smoothly. Follow the phases in order.

---

## Your answers (locked in)

| Question | Your answer |
|----------|-------------|
| **1. Current MongoDB** | Test data only → safe to clean everything migration will replace |
| **2. Firebase collections** | All have real data (customers, nail_techs, users, slots, bookings, etc.) → migrate all |
| **3. Preserve in MongoDB** | **Settings** (admin commission, etc.) → do not delete |
| **4. Where** | **Atlas, production** → use Atlas backup; run migration against production DB |
| **5. Auth** | **Google (NextAuth)** → see below |

### Google Auth – will it be fine?

**Yes.** NextAuth with Google does not depend on Firebase Auth. After migration:

- Admins sign in with Google as they do now; NextAuth creates or finds a `User` in MongoDB by email.
- The migration script can **migrate Firebase `users`** so that existing staff (email, name, role, `assignedNailTechId`) are already in MongoDB. Then when they sign in with Google, the app can match by email and use that profile.
- **Recommendation:** Run the full migration including `users`. The script maps Firebase users into MongoDB; when someone signs in with Google, your app can look up by email and use the migrated role/data. No extra auth setup needed.

**Summary:** Keep using Google sign-in; migrating the `users` collection is for profiles/roles, not for authentication.

---

## Phase 1: Backup & Prepare

### 1.1 Backup Firebase (source of truth)

- Run a Firestore backup so you have a snapshot before any change:
  ```bash
  npm run backup-firestore
  ```
- Keep the backup in a safe place (e.g. `scripts/` or cloud storage). You already have backup scripts.

### 1.2 Backup MongoDB (current state) – Atlas / production

- **MongoDB Atlas:** In Atlas UI go to your cluster → **Backup** (or **Snapshot**) and create a manual snapshot before any cleanup or migration. This is your restore point for production.
- Optionally also export critical collections (e.g. Settings) via Atlas Data Export or `mongodump` so you have a copy outside Atlas.
- This lets you restore if something goes wrong during cleanup or migration.

### 1.3 Environment check

- Ensure `scripts/.env` (or the env used by migration scripts) has:
  - `MONGODB_URI` → the database you will clean and then migrate into.
  - `DRY_RUN=true` for the first migration run.
  - Firebase credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` or service account path).

---

## Phase 2: Clean MongoDB (Before Migration)

Goal: Remove data that migration will replace (and optionally other collections), so there are no duplicate or conflicting documents.

### 2.1 Decide what to clean

**Collections that the full migration script re-populates (safe to empty before migration):**

| Collection (MongoDB) | Migrated from Firebase | Safe to clean? |
|----------------------|------------------------|----------------|
| `nailtechs`          | `nail_techs`           | Yes            |
| `users`              | `users`                | Yes*           |
| `customers`          | `customers` / `clients`| Yes            |
| `slots`              | `slots`                | Yes            |
| `bookings`           | `bookings`             | Yes            |

\* For you: migrating `users` is recommended so staff roles and assigned nail techs are in MongoDB; Google sign-in will still work and can match by email.

**Collections to treat with care:**

- **Settings** – Only clean if you will re-create or re-import settings; otherwise leave as-is.
- **AuditLog** – Optional: clean for a fresh start, or keep for history.
- **Quotation** – Usually tied to bookings; if migration recreates bookings, you may want to clean quotations too (or run a separate script to re-link after migration).
- **BookingCounter** – Reset if you want booking codes to continue from a known value; otherwise leave.
- **NotificationLog** – Optional: clean or keep.

### 2.2 Clean script (recommended)

Create a single script that cleans only the collections you chose above, in a **safe order** (e.g. delete bookings first, then slots, then customers, then nail techs, then users) to avoid FK issues if any app code runs during cleanup.

**Option A – Use rollback of the migration script (recommended for you):**

- The full migration script already supports `--rollback`, which deletes **only** from: nail_techs, users, customers, slots, bookings, blocks.
- **It does NOT touch Settings** – your admin commission and other settings are preserved.
- So you can **treat “clean” as “run rollback”** before migrating:
  ```bash
  npm run migrate:all:rollback
  ```
- Then run migration (dry-run first, then real).

**Option B – Dedicated clean script (for more control):**

- Add a script, e.g. `scripts/clean-mongodb-for-migration.ts`, that:
  - Connects to MongoDB using `MONGODB_URI`.
  - Deletes in this order: `Bookings` → `Slots` → `Customers` → `NailTechs` → `Users` (and optionally `Quotation`, `AuditLog`, `BookingCounter`, `NotificationLog` if you decided to clean them).
  - Uses Mongoose models so collection names stay consistent.
  - Logs counts of deleted documents.
  - Does **not** drop the database or drop collections (so indexes and structure remain).
- Run it once before migration:
  ```bash
  npx tsx scripts/clean-mongodb-for-migration.ts
  ```

### 2.3 Re-run indexes after clean (optional)

- After cleaning, your app’s `ensureIndexes()` will run on next API request (or on server start if you call it there). No need to drop indexes for a “clean” migration; only if you want a fully fresh DB would you drop and recreate.

---

## Phase 3: Dry-Run Migration

### 3.1 Dry-run (no writes to MongoDB)

- Set in `scripts/.env`: `DRY_RUN=true` (or use the dry-run command).
- Run the **full** migration in dry-run mode:
  ```bash
  npm run migrate:all:dry-run
  ```
- Check the console and any report file (e.g. `migration-full-report.json`) for:
  - Document counts per collection.
  - Any errors or skipped documents.
  - Sample transformed documents to confirm field mapping (e.g. Firebase `name` → MongoDB `name`, etc.).

### 3.2 Fix mapping or script if needed

- If Firestore field names differ from what the script expects, update the transform functions in `scripts/migrate-all-firebase-to-mongodb.js` (e.g. `transformCustomer`, `transformBooking`) and run dry-run again until the output looks correct.

---

## Phase 4: Run Real Migration

### 4.0 Production (Atlas) – before you run for real

- [ ] Atlas snapshot/snapshot backup created (Phase 1.2).
- [ ] `MONGODB_URI` in `scripts/.env` points to your **production** Atlas database (you confirmed this is where you want real data).
- [ ] Dry-run looked good and document counts match your expectations.
- [ ] Run during a low-traffic window if the app is live (migration reads from Firebase and writes to MongoDB; brief inconsistency is possible until migration finishes).

### 4.1 Turn off dry-run

- In `scripts/.env` set `DRY_RUN=false` (or remove it if the script treats absence as false).

### 4.2 Run migration

- Use the same DB you cleaned (and backed up):
  ```bash
  npm run migrate:all
  ```
- Migration order in the script is already: `nail_techs` → `users` → `customers` → `slots` → `bookings` → `blocks` (correct for references).

### 4.3 If interrupted

- Run `npm run migrate:all` again. If the script supports resume (e.g. skips existing `firebaseId`), it will continue; otherwise you may need to run rollback and then migrate again from scratch.

---

## Phase 5: Post-Migration Validation

### 5.1 Counts and sanity checks

- Open `scripts/migration-full-report.json` and compare:
  - Firebase document counts vs MongoDB document counts per collection.
- In MongoDB (Compass or shell), for each collection run something like:
  - `db.bookings.countDocuments()`
  - `db.customers.countDocuments()`
  - etc.
- Spot-check a few documents: booking has correct `customerId` / `nailTechId`, slots reference the right nail tech, etc.

### 5.2 App checks

- Start the app and:
  - [ ] Log in (Google or migrated user).
  - [ ] Open Customers list and confirm names/data.
  - [ ] Open Bookings (or Calendar) and confirm appointments and links to customers/nail techs.
  - [ ] Open Nail Techs and confirm list.
  - [ ] Create one new booking and one new customer to confirm app still writes correctly.

### 5.3 Booking codes and counters

- If you use sequential booking codes, check whether `BookingCounter` (or equivalent) needs to be set to the next value after the last migrated booking so new codes don’t clash.

---

## Phase 6: After Success

- Keep Firebase backup and MongoDB backup for at least a week.
- Remove or secure `scripts/.env` (and any service account key) so they are not committed.
- If you no longer need Firebase for this app, you can later remove Firebase dependencies and switch the app fully to MongoDB; that can be a separate “post-migration cleanup” task.

---

## Quick Command Reference

| Step              | Command |
|-------------------|--------|
| Backup Firestore  | `npm run backup-firestore` |
| Clean MongoDB     | `npm run migrate:all:rollback` (or your custom clean script) |
| Dry-run migration | `npm run migrate:all:dry-run` |
| Real migration    | `npm run migrate:all` |
| Rollback migration| `npm run migrate:all:rollback` |

---

## One-Page Checklist (summary)

- [ ] Backed up Firebase (`npm run backup-firestore`)
- [ ] Created Atlas snapshot (production backup)
- [ ] `scripts/.env` has production `MONGODB_URI` and Firebase credentials
- [ ] Cleaned MongoDB: `npm run migrate:all:rollback` (Settings are **not** deleted)
- [ ] Ran `npm run migrate:all:dry-run` and checked report
- [ ] Set `DRY_RUN=false`, ran `npm run migrate:all`
- [ ] Checked `migration-full-report.json` and MongoDB counts
- [ ] Tested app: Google login, customers, bookings, nail techs, create new data
- [ ] Kept backups; secured env and keys

Once you answer the “Questions to Clarify First” section, the plan can be tightened (e.g. “do not clean users”, “also clean quotations”, or “add a clean script that leaves Settings and AuditLog intact”). If you want, next step can be adding a concrete `scripts/clean-mongodb-for-migration.ts` that matches your answers.
