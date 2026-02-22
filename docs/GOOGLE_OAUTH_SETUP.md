# Google OAuth Setup for Sign-In

Your application already has Google Sign-In configured in the code. You just need to add OAuth credentials.

## Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project: **"glammednailsbyjhen-9a6f2"** (or create a new one)

## Step 2: Enable Required APIs

1. Go to **"APIs & Services"** > **"Library"**
2. Search and enable these APIs if not already enabled:
   - ✅ **Google+ API** (for user profile info)
   - ✅ **People API** (for user information)

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **User Type:**
   - **Internal** - Only for Google Workspace users in your organization
   - **External** - For anyone with a Google account (recommended for you)
3. Click **"Create"**

### Fill in the App Information:
- **App name:** glammednailsbyjhen
- **User support email:** admin@glammednailsbyjhen.com
- **App logo:** (Optional) Upload your logo
- **Application home page:** https://glammednailsbyjhen.vercel.app (or your domain)
- **Authorized domains:** 
  - `glammednailsbyjhen.vercel.app`
  - `localhost` (for development)
- **Developer contact email:** admin@glammednailsbyjhen.com

4. Click **"Save and Continue"**
5. **Scopes:** Click "Add or Remove Scopes" and add:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
6. Click **"Save and Continue"**
7. **Test users:** (If using External - Testing mode)
   - Add your email and any test user emails
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Client ID

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** glammednailsbyjhen Web Client
5. **Authorized JavaScript origins:** Add these URLs:
   ```
   http://localhost:3000
   https://glammednailsbyjhen.vercel.app
   ```
   (Add any other domains you'll use)

6. **Authorized redirect URIs:** Add these EXACT URLs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://glammednailsbyjhen.vercel.app/api/auth/callback/google
   ```
   ⚠️ **CRITICAL:** The path must be exactly `/api/auth/callback/google`

7. Click **"Create"**

## Step 5: Copy Your Credentials

After creating, a popup will show:
- **Your Client ID:** `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
- **Your Client Secret:** `GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ`

✅ **Copy both values** - you'll add them to your `.env` file

## Step 6: Update Your .env File

Add these two lines to your `.env` file:

```env
# Google OAuth (for Sign-In)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 7: Test Google Sign-In

1. Restart your Next.js dev server: `npm run dev`
2. Go to your login page: `http://localhost:3000/admin`
3. You should see a "Sign in with Google" button
4. Click it and sign in with your Google account

## Security Features Already Built In ✅

Your code already has these security measures:
- ✅ **Restricted Access:** Only users who exist in your database can sign in
- ✅ **Email Verification:** Auto-verifies email on Google sign-in
- ✅ **Profile Sync:** Updates user profile with Google info
- ✅ **Session Management:** 30-day JWT sessions

## Important Notes

### For Production:
1. Update authorized domains in OAuth consent screen
2. Submit app for verification if needed (for production use)
3. Update redirect URIs with your production domain
4. Keep Client Secret secure - never commit to Git

### Access Control:
Users must be pre-added to your database to sign in. To add a new user:
```bash
# Use your admin panel or MongoDB directly to create user record
# User model needs: email, name, role
```

### Troubleshooting:

**"Error 400: redirect_uri_mismatch"**
- Check that redirect URI is EXACTLY: `/api/auth/callback/google`
- Verify the domain matches (http vs https, with/without www)

**"Access Denied"**
- User email not in database - add them first
- Check console logs for detailed error messages

**"The app is not verified"**
- Normal for development/testing
- Click "Advanced" > "Go to [App Name] (unsafe)" to proceed
- For production, submit for Google verification
