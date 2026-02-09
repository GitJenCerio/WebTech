# 📧 Email Setup Guide

## Why emails aren't being sent

The invitation email system requires an email service to be configured. Currently, it's set up to use **Resend** (a modern email API service).

## Current Status

**If you don't have `RESEND_API_KEY` configured:**
- ✅ User is still created successfully
- ❌ Email is NOT sent
- 📝 Invitation link is logged to the console (check your terminal/server logs)
- 💡 The modal will show you the invitation link if email service isn't configured

## How to Enable Email Sending

### Option 1: Use Resend (Recommended)

1. **Sign up for Resend** (Free tier available)
   - Go to [https://resend.com](https://resend.com)
   - Sign up for a free account
   - Free tier: 3,000 emails/month, 100 emails/day

2. **Get your API Key**
   - Go to [Resend API Keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Copy the API key

3. **Add to `.env.local`**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   
   # Optional: Use your own domain
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   # OR
   RESEND_FROM_DOMAIN=yourdomain.com
   ```

4. **Verify your domain** (Optional, for production)
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain
   - Add the DNS records they provide
   - Once verified, you can use `noreply@yourdomain.com`

5. **Restart your dev server**
   ```bash
   npm run dev
   ```

### Option 2: Use Another Email Service

You can modify `lib/email.ts` to use:
- **SendGrid**
- **Mailgun**
- **AWS SES**
- **Nodemailer** (with SMTP)

## Testing Email Sending

1. **Check your terminal/console** when creating a user
   - If email service is configured: You'll see `✅ Invitation email sent via Resend`
   - If not configured: You'll see the invitation link in the console

2. **Check the modal response**
   - Success message will indicate if email was sent
   - If not configured, the invitation link will be shown

3. **Check the recipient's inbox**
   - Check spam/junk folder
   - For Resend free tier, emails might go to spam initially
   - Verify your domain to improve deliverability

## Troubleshooting

### Email not received?

1. **Check if API key is set**
   - Look in your terminal for "Email service not configured" message
   - Verify `RESEND_API_KEY` is in `.env.local`

2. **Check Resend dashboard**
   - Go to [Resend Emails](https://resend.com/emails)
   - See if email was sent and delivery status

3. **Check spam folder**
   - Emails might be filtered as spam
   - Especially if using `onboarding@resend.dev` (default)

4. **Check console logs**
   - Look for error messages
   - Check if API key is valid

### Common Issues

**"Email service not configured"**
- Add `RESEND_API_KEY` to `.env.local`
- Restart dev server

**"Invalid API key"**
- Verify the API key is correct
- Make sure there are no extra spaces
- Regenerate the key if needed

**"Domain not verified"**
- Use `onboarding@resend.dev` for testing (no verification needed)
- Or verify your domain in Resend dashboard

## Quick Setup (Development)

For quick testing without setting up Resend:

1. Create a user via the modal
2. Check your terminal/console for the invitation link
3. Copy the link and share it with the user manually
4. User can sign in with Google using that link

The link format is: `http://localhost:3000/admin` (or your `NEXTAUTH_URL`)

## Production Setup

For production, you should:

1. ✅ Set up Resend with your domain
2. ✅ Verify your domain in Resend
3. ✅ Use `RESEND_FROM_EMAIL=noreply@yourdomain.com`
4. ✅ Set up SPF/DKIM records for better deliverability
5. ✅ Monitor email delivery in Resend dashboard

---

**Need help?** Check the [Resend Documentation](https://resend.com/docs) or your server logs for detailed error messages.
