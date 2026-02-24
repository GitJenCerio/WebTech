/**
 * Email utility for sending invitation emails
 * Supports multiple email providers:
 * 1. Resend (recommended for production)
 * 2. Console logging (fallback for development)
 */

import { Resend } from 'resend';
import { createUploadProofToken } from '@/lib/uploadProofToken';

/** Brand logo - direct image URL for email embedding */
const BRAND_LOGO_URL = 'https://i.imgur.com/igZLzzU.png';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'glammednailsbyjhen';

/**
 * Wrap email content in branded template with logo
 */
function getBrandedEmailTemplate(content: string, title?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || APP_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 24px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  <img src="${BRAND_LOGO_URL}" alt="${APP_NAME}" width="180" height="auto" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px; color: #333; line-height: 1.6; font-size: 16px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

interface SendInviteEmailParams {
  email: string;
  displayName: string;
  resetLink: string;
  role?: string;
}

/**
 * Send invitation email to a new user
 */
export async function sendInviteEmail(params: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  const { email, displayName, resetLink, role } = params;

  // Try Resend first (if API key is configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Use same from address as other app emails (verified domain required for delivery)
      const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL 
        || (process.env.RESEND_FROM_DOMAIN ? `noreply@${process.env.RESEND_FROM_DOMAIN}` : null)
        || 'onboarding@resend.dev';
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'glammednailsbyjhen'} - Admin Access`,
        html: getInviteEmailTemplate(email, displayName, resetLink, role),
      });

      if (result.data) {
        console.log(`✅ Invitation email sent via Resend to ${email} (ID: ${result.data.id})`);
        return { success: true };
      } else if (result.error) {
        console.error('Resend API error:', result.error);
        return { success: false, error: result.error.message || 'Failed to send email' };
      }
    } catch (error: any) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Try Firebase Auth built-in email (if action code settings are configured)
  // Note: Firebase Admin SDK doesn't directly send emails, but we can use
  // the client SDK's sendPasswordResetEmail if we have a way to call it
  // For now, we'll log the link as a fallback

  // Fallback: Log the link (for development)
  console.log('\n📧 ============================================');
  console.log('📧 INVITATION EMAIL (Development Mode - Email Service Not Configured)');
  console.log('📧 ============================================');
  console.log(`To: ${email}`);
  console.log(`Subject: Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'glammednailsbyjhen'} - Admin Access`);
  console.log(`\nHello ${displayName},\n`);
  console.log(`You have been invited to join ${process.env.NEXT_PUBLIC_APP_NAME || 'glammednailsbyjhen'} as a ${role || 'user'}.`);
  console.log(`\n⚠️  EMAIL SERVICE NOT CONFIGURED`);
  console.log(`\nPlease share this invitation link with the user:\n`);
  console.log(`🔗 ${resetLink}\n`);
  console.log(`\nTo enable email sending, add RESEND_API_KEY to your .env.local file.`);
  console.log(`Get your API key at: https://resend.com/api-keys`);
  console.log('📧 ============================================\n');

  return { success: true, error: 'Email service not configured - link logged to console' };
}

/**
 * Generate HTML email template for invitation
 */
function getInviteEmailTemplate(email: string, displayName: string, resetLink: string, role?: string): string {
  const content = `
    <p style="margin: 0 0 16px;">Hello ${displayName},</p>
    <p style="margin: 0 0 16px;">
      You have been invited to join ${APP_NAME}${role ? ` as a <strong>${role}</strong>` : ''}.
    </p>
    <p style="margin: 0 0 24px;">
      To get started, please click the button below to sign in with your Google account:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetLink}" 
         style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In with Google
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 8px 0 0;">
      ${resetLink}
    </p>
    <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">
      You can sign in using the same Google account (${email}) that received this invitation. If you didn't request this invitation, you can safely ignore this email.
    </p>
  `;
  return getBrandedEmailTemplate(content, `Welcome to ${APP_NAME}`);
}

function getUploadProofLink(booking: any): string {
  const bookingId = booking?._id?.toString?.() || booking?.id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.glammednailsbyjhen.com';
  const uploadProofToken = bookingId ? createUploadProofToken(bookingId) : '';
  return uploadProofToken ? `${baseUrl}/booking/upload-proof?token=${encodeURIComponent(uploadProofToken)}` : '';
}

/** QR code URLs for payment - use direct image links (e.g. i.imgur.com/xxx.jpg) for email embedding */
function getPaymentQrUrls(): { gcash: string; pnb: string } {
  return {
    gcash: process.env.PAYMENT_QR_GCASH_URL || 'https://i.imgur.com/kxV0B0P.jpeg',
    pnb: process.env.PAYMENT_QR_PNB_URL || 'https://i.imgur.com/5MR7dcR.jpeg',
  };
}

export async function sendBookingPendingEmail(booking: any, customer: any) {
  try {
    if (!customer?.email) {
      console.warn(`Booking pending email skipped for ${booking?.bookingCode || 'unknown'}: missing customer email`);
      return { emailSent: false, error: 'Missing customer email' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('Resend not configured - skipping booking pending email');
      return { emailSent: false };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const uploadProofLink = getUploadProofLink(booking);
    const depositRequired = booking.pricing?.depositRequired ?? 0;
    const qr = getPaymentQrUrls();

    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">Your Booking is Pending</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 16px;">Thank you for booking! Your reservation has been received. <strong>To secure your slot, the required reservation deposit must be paid within 48 hours.</strong></p>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #92400e;">⚠️ Required: Reservation Deposit</p>
        <p style="margin: 0; font-size: 15px; color: #78350f;">Amount due: <strong>PHP ${depositRequired.toLocaleString()}</strong></p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #78350f;">Non-refundable but deductible from total. Your slot will be automatically cancelled if payment proof is not uploaded within 48 hours.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Booking Code</td><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${booking.bookingCode}</td></tr>
        <tr><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Status</td><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${booking.status}</td></tr>
        <tr><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Deposit due</td><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><strong>PHP ${depositRequired.toLocaleString()}</strong></td></tr>
      </table>

      <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #374151;">Scan to pay via InstaPay</p>
        <table style="margin: 0 auto; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; text-align: center; vertical-align: top;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">GCash</p>
              <a href="${qr.gcash}" target="_blank" style="display: inline-block;"><img src="${qr.gcash}" alt="GCash QR Code" width="180" height="180" style="border-radius: 8px;" /></a>
            </td>
            <td style="padding: 12px; text-align: center; vertical-align: top;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">PNB Debit Savings</p>
              <a href="${qr.pnb}" target="_blank" style="display: inline-block;"><img src="${qr.pnb}" alt="PNB QR Code" width="180" height="180" style="border-radius: 8px;" /></a>
            </td>
          </tr>
        </table>
        <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">Transfer fees may apply. Pay via GCash or PNB Bank Transfer.</p>
      </div>

      ${uploadProofLink ? `
      <p style="margin-top: 20px;"><strong>After paying, upload your proof here:</strong></p>
      <p style="margin: 16px 0;">
        <a href="${uploadProofLink}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">This link is valid for 14 days. Your slot is confirmed only after we receive your proof of payment.</p>
      ` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Thank you for choosing ${APP_NAME}!</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `Your Booking is Pending - Deposit Required - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });

    if (error) {
      console.error('Email send error:', error);
      return { emailSent: false, error: error.message };
    }
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    console.error('Booking pending email failed:', error);
    return { emailSent: false, error: error.message };
  }
}

export async function sendPaymentReminderEmail(booking: any, customer: any) {
  try {
    if (!process.env.RESEND_API_KEY || !customer.email) {
      return { emailSent: false };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const uploadProofLink = getUploadProofLink(booking);
    const hasInvoice = Boolean(booking.invoice?.quotationId || booking.invoice?.total != null);
    const amountDue = hasInvoice
      ? Math.max(0, (booking.invoice?.total ?? booking.pricing?.total ?? 0) - (booking.pricing?.paidAmount || 0))
      : Math.max(0, (booking.pricing?.depositRequired ?? 0) - (booking.pricing?.paidAmount || 0));

    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">Payment Reminder</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 16px;">This is a reminder for your upcoming appointment.</p>
      <p style="margin: 0 0 8px;"><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      <p style="margin: 0 0 8px;"><strong>Amount Due:</strong> PHP ${amountDue.toLocaleString()}</p>
      <p style="margin: 0 0 16px;"><strong>Payment Methods:</strong> GCash or PNB Bank Transfer</p>
      ${uploadProofLink ? `
      <p style="margin-top: 20px;">Upload your proof of payment here:</p>
      <p style="margin: 16px 0;">
        <a href="${uploadProofLink}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
      </p>` : ''}
      <p style="color: #6b7280; font-size: 14px;">Please complete your payment to confirm your booking.</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `Payment Reminder - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });

    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    console.error('Payment reminder email failed:', error);
    return { emailSent: false, error: error.message };
  }
}

export async function sendBookingConfirmedEmail(booking: any, customer: any) {
  try {
    if (!process.env.RESEND_API_KEY || !customer?.email) {
      return { emailSent: false };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">Booking Confirmed</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 16px;">Your booking has been confirmed by our team.</p>
      <p style="margin: 0 0 24px;"><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for choosing ${APP_NAME}!</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `Booking Confirmed - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });
    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    return { emailSent: false, error: error.message };
  }
}

export async function sendBookingRescheduledEmail(booking: any, customer: any, reason?: string) {
  try {
    if (!process.env.RESEND_API_KEY || !customer?.email) {
      return { emailSent: false };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">Booking Rescheduled</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 16px;">Your booking was rescheduled by our team.</p>
      <p style="margin: 0 0 8px;"><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      ${reason ? `<p style="margin: 0 0 16px;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <p style="color: #6b7280; font-size: 14px; margin: 0;">Please contact us if you have questions.</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `Booking Rescheduled - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });
    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    return { emailSent: false, error: error.message };
  }
}

export async function sendPaymentUrgentEmail(booking: any, customer: any, subjectLabel: string) {
  try {
    if (!process.env.RESEND_API_KEY || !customer.email) {
      return { emailSent: false };
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const uploadProofLink = getUploadProofLink(booking);
    const hasInvoice = Boolean(booking.invoice?.quotationId || booking.invoice?.total != null);
    const amountDue = hasInvoice
      ? Math.max(0, (booking.invoice?.total ?? booking.pricing?.total ?? 0) - (booking.pricing?.paidAmount || 0))
      : Math.max(0, (booking.pricing?.depositRequired ?? 0) - (booking.pricing?.paidAmount || 0));
    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">${subjectLabel}</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 8px;"><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      <p style="margin: 0 0 16px;"><strong>Amount Due:</strong> PHP ${amountDue.toLocaleString()}</p>
      ${uploadProofLink ? `
      <p style="margin-top: 20px;">Upload your proof of payment here:</p>
      <p style="margin: 16px 0;">
        <a href="${uploadProofLink}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
      </p>` : ''}
      <p style="color: #6b7280; font-size: 14px;">Please settle your payment to keep the booking active.</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `${subjectLabel} - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });
    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    return { emailSent: false, error: error.message };
  }
}

export async function sendAppointmentReminderEmail(booking: any, customer: any, subjectLabel: string) {
  try {
    if (!process.env.RESEND_API_KEY || !customer.email) {
      return { emailSent: false };
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const content = `
      <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px;">${subjectLabel}</h1>
      <p style="margin: 0 0 16px;">Hi ${customer.name},</p>
      <p style="margin: 0 0 16px;">This is a reminder for your upcoming appointment.</p>
      <p style="margin: 0 0 24px;"><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">We look forward to seeing you.</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@glammednailsbyjhen.com>`,
      to: customer.email,
      subject: `${subjectLabel} - ${booking.bookingCode}`,
      html: getBrandedEmailTemplate(content),
    });
    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    return { emailSent: false, error: error.message };
  }
}

