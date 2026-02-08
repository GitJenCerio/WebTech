# Google Sheets Setup Guide

This guide explains how to set up Google Service Account credentials and configure Google Sheets access for the Quotation pricing feature.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Glammed Nails Booking System")
5. Click **"Create"**
6. Wait for the project to be created and select it

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and click **"Enable"**
4. Wait for the API to be enabled

## Step 3: Create a Service Account

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in the details:
   - **Service account name**: `glammed-nails-sheets` (or any name you prefer)
   - **Service account ID**: Will auto-generate
   - **Description**: (Optional) "Service account for reading pricing data from Google Sheets"
4. Click **"Create and Continue"**
5. Skip the optional steps (Grant access, Grant users access) and click **"Done"**

## Step 4: Create and Download Service Account Key

1. In the **"Credentials"** page, find your newly created service account
2. Click on the service account email (it will look like: `glammed-nails-sheets@your-project-id.iam.gserviceaccount.com`)
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will download automatically - **SAVE THIS FILE SECURELY** (you won't be able to download it again)

## Step 5: Extract Credentials from JSON File

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "glammed-nails-sheets@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Extract these values:**
- `client_email` → This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → This is your `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## Step 6: Create or Get Google Sheets Spreadsheet

### Option A: Create a New Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click **"Blank"** to create a new spreadsheet
3. Name it (e.g., "Glammed Nails Pricing")
4. Create a pricing table with headers in the first row, for example:
   ```
   Service Name | Price | Location | Notes
   Manicure     | 500   | Studio   |
   Pedicure     | 600   | Studio   |
   Mani + Pedi  | 1000  | Studio   |
   ```

### Option B: Use an Existing Spreadsheet

1. Open your existing Google Sheets spreadsheet
2. Make sure it has a pricing table with headers

## Step 7: Get the Spreadsheet ID

1. Open your Google Sheets spreadsheet
2. Look at the URL in your browser. It will look like:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz789DEF456ghi012JKL345mno/edit
   ```
3. The **Spreadsheet ID** is the long string between `/d/` and `/edit`:
   ```
   1ABC123xyz789DEF456ghi012JKL345mno
   ```
4. This is your `GOOGLE_SHEETS_PRICING_ID` (or you can use `GOOGLE_SHEETS_BACKUP_ID` or `GOOGLE_SHEETS_ID`)

## Step 8: Share Spreadsheet with Service Account

**IMPORTANT:** The service account needs access to read your spreadsheet.

1. In your Google Sheets spreadsheet, click the **"Share"** button (top right)
2. In the "Add people and groups" field, paste your **service account email** (from Step 5: `client_email`)
   - Example: `glammed-nails-sheets@your-project-id.iam.gserviceaccount.com`
3. Make sure the permission is set to **"Viewer"** (read-only is sufficient)
4. **Uncheck** "Notify people" (service accounts don't need notifications)
5. Click **"Share"**

## Step 9: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=glammed-nails-sheets@your-project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Sheets Configuration
GOOGLE_SHEETS_PRICING_ID=1ABC123xyz789DEF456ghi012JKL345mno
GOOGLE_SHEETS_PRICING_SHEET=Pricing
```

### Important Notes for Private Key:

1. **Keep the entire private key on ONE line** in `.env.local`
2. **Replace `\n` with actual newlines** OR keep `\n` as-is (the code handles both)
3. **Wrap in double quotes** if it contains special characters
4. The private key should include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers

**Example of properly formatted private key in .env.local:**

```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...your key here...\n-----END PRIVATE KEY-----\n"
```

OR (if your environment supports multiline):

```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...your key here...
-----END PRIVATE KEY-----"
```

## Step 10: Verify Setup

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin/quotation` in your browser

3. If configured correctly, you should see:
   - Pricing data loaded from Google Sheets
   - Service dropdown populated with your services
   - No error messages

4. If you see errors:
   - Check that the service account email has "Viewer" access to the spreadsheet
   - Verify the spreadsheet ID is correct
   - Ensure the private key is properly formatted in `.env.local`
   - Check that Google Sheets API is enabled in your Google Cloud project

## Troubleshooting

### Error: "Missing Google service account credentials"
- Make sure `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in `.env.local`
- Restart your dev server after adding environment variables

### Error: "Pricing data is not available"
- Check that the service account email has access to the spreadsheet
- Verify the spreadsheet ID is correct
- Ensure the sheet name matches (default is "Pricing" or set via `GOOGLE_SHEETS_PRICING_SHEET`)

### Error: "Permission denied" or "Forbidden"
- The service account needs "Viewer" access to the spreadsheet
- Share the spreadsheet with the service account email

### Error: "Invalid private key format"
- Ensure the private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Check that newlines are properly escaped as `\n` or use actual newlines
- Make sure the key is wrapped in quotes if it contains special characters

## Security Best Practices

1. **Never commit `.env.local` to version control** (it should already be in `.gitignore`)
2. **Keep your service account JSON file secure** - treat it like a password
3. **Use "Viewer" permission only** - the service account only needs to read data
4. **Rotate keys periodically** if compromised
5. **Limit spreadsheet access** - only share with the service account, not publicly

## Alternative: Using Existing Google Sheets Backup ID

If you already have `GOOGLE_SHEETS_BACKUP_ID` or `GOOGLE_SHEETS_ID` configured for other features, you can reuse them:

```env
# Use the same spreadsheet ID for pricing
GOOGLE_SHEETS_PRICING_ID=${GOOGLE_SHEETS_BACKUP_ID}
# Or
GOOGLE_SHEETS_PRICING_ID=${GOOGLE_SHEETS_ID}
```

Just make sure:
- The service account has access to that spreadsheet
- The spreadsheet has a sheet/tab named "Pricing" (or specify the name via `GOOGLE_SHEETS_PRICING_SHEET`)
