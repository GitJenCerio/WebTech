# 🚀 Quick Start - Your Migration is Ready!

Your Firebase credentials are already configured! Just 2 steps to go:

## Step 1: Configure MongoDB Connection

Open [scripts/.env](scripts/.env) and update line 2:

```env
MONGODB_URI=your_actual_mongodb_connection_string
```

**Examples:**
- **Local MongoDB:** `mongodb://localhost:27017/glammednails`
- **MongoDB Atlas:** `mongodb+srv://username:password@cluster.mongodb.net/glammednails`

## Step 2: Run Dry-Run Test

```bash
npm run migrate
```

This will show you:
- ✅ How many documents will be migrated
- ✅ Sample of transformed data
- ✅ What fields will be mapped
- ❌ Any connection or configuration issues

**DRY_RUN is already enabled** - no data will be written to MongoDB yet!

## Step 3: Run Actual Migration

If the dry-run looks good:

1. Open `scripts/.env`
2. Change `DRY_RUN=true` to `DRY_RUN=false`
3. Run: `npm run migrate`

---

## ✅ What's Already Configured

- ✅ Firebase Project ID: `glammednailsbyjhen-1345c`
- ✅ Firebase Service Account credentials
- ✅ Dry-run mode enabled (safe testing)
- ✅ Migration script ready to run
- ✅ All npm commands configured

## 📚 Need More Info?

- **Full Documentation:** [scripts/MIGRATION_README.md](scripts/MIGRATION_README.md)
- **Step-by-Step Checklist:** [scripts/MIGRATION_CHECKLIST.md](scripts/MIGRATION_CHECKLIST.md)

## 🆘 Troubleshooting

### Can't connect to Firebase
- Your credentials are already configured - should work!
- Check that `scripts/.env` file exists

### Can't connect to MongoDB
- Make sure you've updated `MONGODB_URI` in `scripts/.env`
- Test your connection string in MongoDB Compass or mongo shell

### Other issues
Check `scripts/migration-errors.log` after running the script

---

**Ready to migrate?** Just update MongoDB URI and run `npm run migrate`! 🎉
