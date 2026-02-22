/**
 * Email utility for sending invitation emails
 * Supports multiple email providers:
 * 1. Resend (recommended for production)
 * 2. Console logging (fallback for development)
 */

import { Resend } from 'resend';
import { createUploadProofToken } from '@/lib/uploadProofToken';

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
        subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'Glammed Nails'} - Admin Access`,
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
  console.log(`Subject: Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'Glammed Nails'} - Admin Access`);
  console.log(`\nHello ${displayName},\n`);
  console.log(`You have been invited to join ${process.env.NEXT_PUBLIC_APP_NAME || 'Glammed Nails'} as a ${role || 'user'}.`);
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
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Glammed Nails';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${appName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${appName}!</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Hello ${displayName},</p>
        
        <p style="font-size: 16px;">
          You have been invited to join ${appName}${role ? ` as a <strong>${role}</strong>` : ''}.
        </p>
        
        <p style="font-size: 16px;">
          To get started, please click the button below to sign in with your Google account:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Sign In with Google
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
          ${resetLink}
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          You can sign in using the same Google account (${email}) that received this invitation. If you didn't request this invitation, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getUploadProofLink(booking: any): string {
  const bookingId = booking?._id?.toString?.() || booking?.id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.glammednailsbyjhen.com';
  const uploadProofToken = bookingId ? createUploadProofToken(bookingId) : '';
  return uploadProofToken ? `${baseUrl}/booking/upload-proof?token=${encodeURIComponent(uploadProofToken)}` : '';
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

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `Booking Pending - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">Booking Pending</h1>
          <p>Hi ${customer.name},</p>
          <p>Your booking has been received and is pending payment.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Booking Code</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${booking.bookingCode}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Status</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${booking.status}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Total</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">PHP ${booking.pricing?.total?.toLocaleString() || '0'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Deposit due</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">PHP ${depositRequired.toLocaleString()}</td></tr>
          </table>
          <p><strong>Payment methods:</strong> GCash or PNB Bank Transfer</p>
          ${uploadProofLink ? `
          <p style="margin-top: 20px;">After paying the deposit, you can upload your proof of payment here:</p>
          <p style="margin: 16px 0;">
            <a href="${uploadProofLink}" style="display: inline-block; background: #212529; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
          </p>
          <p style="color: #6c757d; font-size: 13px;">This link is valid for 14 days. You can also upload proof later from this email.</p>
          ` : ''}
          <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">Thank you for choosing Glammed Nails by Jhen!</p>
        </div>
      `,
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
    const amountDue = (booking.pricing?.total || 0) - (booking.pricing?.paidAmount || 0);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `Payment Reminder - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">Payment Reminder</h1>
          <p>Hi ${customer.name},</p>
          <p>This is a reminder for your upcoming appointment.</p>
          <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
          <p><strong>Amount Due:</strong> PHP ${amountDue.toLocaleString()}</p>
          <p><strong>Payment Methods:</strong> GCash or PNB Bank Transfer</p>
          ${uploadProofLink ? `
          <p style="margin-top: 20px;">Upload your proof of payment here:</p>
          <p style="margin: 16px 0;">
            <a href="${uploadProofLink}" style="display: inline-block; background: #212529; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
          </p>` : ''}
          <p style="color: #6c757d; font-size: 14px;">Please complete your payment to confirm your booking.</p>
        </div>
      `,
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
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `Booking Confirmed - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">Booking Confirmed</h1>
          <p>Hi ${customer.name},</p>
          <p>Your booking has been confirmed by our team.</p>
          <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
          <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">Thank you for choosing Glammed Nails by Jhen!</p>
        </div>
      `,
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
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `Booking Rescheduled - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">Booking Rescheduled</h1>
          <p>Hi ${customer.name},</p>
          <p>Your booking was rescheduled by our team.</p>
          <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">Please contact us if you have questions.</p>
        </div>
      `,
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
    const amountDue = (booking.pricing?.total || 0) - (booking.pricing?.paidAmount || 0);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `${subjectLabel} - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">${subjectLabel}</h1>
          <p>Hi ${customer.name},</p>
          <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
          <p><strong>Amount Due:</strong> PHP ${amountDue.toLocaleString()}</p>
          ${uploadProofLink ? `
          <p style="margin-top: 20px;">Upload your proof of payment here:</p>
          <p style="margin: 16px 0;">
            <a href="${uploadProofLink}" style="display: inline-block; background: #212529; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Upload proof of payment</a>
          </p>` : ''}
          <p style="color: #6c757d; font-size: 14px;">Please settle your payment to keep the booking active.</p>
        </div>
      `,
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
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Glammed Nails <noreply@glammednailsbyjhen.com>',
      to: customer.email,
      subject: `${subjectLabel} - ${booking.bookingCode}`,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #212529;">${subjectLabel}</h1>
          <p>Hi ${customer.name},</p>
          <p>This is a reminder for your upcoming appointment.</p>
          <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
          <p style="color: #6c757d; font-size: 14px;">We look forward to seeing you.</p>
        </div>
      `,
    });
    if (error) return { emailSent: false, error: error.message };
    return { emailSent: true, id: data?.id };
  } catch (error: any) {
    return { emailSent: false, error: error.message };
  }
}

