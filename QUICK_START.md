# 🚀 Quick Start Guide

## What You Need to Run `npm run dev`

### 1. **Prerequisites** (One-time setup)
- ✅ **Node.js 18+** installed ([Download here](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)

### 2. **Install Dependencies** (One-time setup)
```bash
npm install
```

### 3. **Create `.env.local` File** (Required!)
Create a `.env.local` file in the root directory with **minimum required variables**:

#### **Minimum Required for Basic Functionality:**
```env
# MongoDB Atlas Connection (REQUIRED for authentication)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# NextAuth Configuration (REQUIRED for authentication)
NEXTAUTH_SECRET=your-secret-key-here-generate-a-random-string
NEXTAUTH_URL=http://localhost:3000

# Optional: Google OAuth (if you want Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### **For Full Functionality, you'll also need:**
- Firebase configuration (for Firestore database)
- Google Sheets/Forms integration
- Email service configuration

---

## 📦 About MongoDB

### **MongoDB Atlas is Cloud-Based - No Installation Needed!**

**You DON'T need to "start" MongoDB** because:
- ✅ MongoDB Atlas is a **cloud service** (like AWS or Google Cloud)
- ✅ It's **always running** in the cloud
- ✅ You just need the **connection string** in your `.env.local` file

### **How to Get MongoDB Atlas Connection String:**

1. **Sign up/Login** to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create a Free Cluster** (M0 tier is free forever)
3. **Create a Database User:**
   - Go to **Database Access** → **Add New Database User**
   - Choose **Password** authentication
   - Save the username and password
4. **Get Connection String:**
   - Go to **Database** → Click **Connect** on your cluster
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with your database name
5. **Whitelist Your IP:**
   - Go to **Network Access** → **Add IP Address**
   - Click **Add Current IP Address** (or use `0.0.0.0/0` for development)
   - Wait 1-2 minutes for changes to apply

### **Example MongoDB URI:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/glammednails?retryWrites=true&w=majority
```

---

## 🎯 Step-by-Step Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create `.env.local`
Create `.env.local` in the project root with at minimum:
```env
MONGODB_URI=your-connection-string-here
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**To generate NEXTAUTH_SECRET:**
```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

# Or use an online generator:
# https://generate-secret.vercel.app/32
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Open Browser
Navigate to: **http://localhost:3000**

---

## ⚠️ Common Issues

### **"Could not connect to MongoDB Atlas"**
- ✅ Check your IP is whitelisted in MongoDB Atlas Network Access
- ✅ Verify your `MONGODB_URI` is correct
- ✅ Make sure you replaced `<password>` in the connection string
- ✅ Wait 1-2 minutes after whitelisting IP

### **"Please define MONGODB_URI"**
- ✅ Make sure `.env.local` exists in the project root
- ✅ Check the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- ✅ Restart the dev server after creating/editing `.env.local`

### **"NEXTAUTH_SECRET is missing"**
- ✅ Add `NEXTAUTH_SECRET` to your `.env.local` file
- ✅ Use a random string (at least 32 characters)

---

## 👤 Creating Authorized User Accounts

### **🔒 Restricted Access Policy**
**Only pre-approved users can access the admin panel.** Users must be manually added to MongoDB before they can sign in.

### **Creating Authorized Users**

**Option 1: Create user with email/password**
```bash
npx tsx scripts/create-admin-user.ts admin@example.com yourpassword123 "Admin Name"
```

**Option 2: Create user for Google OAuth only (no password)**
```bash
npx tsx scripts/create-admin-user.ts user@gmail.com --google-only "User Name"
```

**Examples:**
```bash
# User can sign in with email/password OR Google
npx tsx scripts/create-admin-user.ts admin@glammednailsbyjhen.com mySecurePassword "Admin User"

# User can ONLY sign in with Google OAuth
npx tsx scripts/create-admin-user.ts user@gmail.com --google-only "User Name"
```

**What this does:**
- Creates an authorized user in MongoDB
- For email/password: Hashes the password securely
- Sets email as verified
- User can now sign in with the method you configured

**Important:**
- ❌ **Google sign-in will NOT auto-create accounts** - users must be pre-approved
- ✅ Users must be manually added using the script above
- ✅ Only users in the database can access the admin panel

---

## 📝 Summary

**To start the dev server, you need:**
1. ✅ Node.js installed
2. ✅ Dependencies installed (`npm install`)
3. ✅ `.env.local` file with `MONGODB_URI` and `NEXTAUTH_SECRET`
4. ✅ MongoDB Atlas cluster created and IP whitelisted
5. ✅ Run `npm run dev`

**MongoDB doesn't need to be "started"** - it's a cloud service that's always running! You just need the connection string.

**For email/password login:** Create users first using the script above.
**For Google login:** Users are created automatically on first sign-in.
