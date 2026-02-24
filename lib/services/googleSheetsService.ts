/**
 * Google Sheets sync service — server-only.
 * Do not import in 'use client' components.
 */

import { google } from 'googleapis';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const BOOKINGS_TAB = 'Bookings';
const FINANCE_TAB = 'Finance';

export async function getSheetsClient(): Promise<ReturnType<typeof google.sheets> | null> {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!email || !key) {
      console.error('[GoogleSheets] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
      return null;
    }
    const auth = new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, '\n'),
      scopes: [SCOPE],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (err) {
    console.error('[GoogleSheets]', err);
    return null;
  }
}

export async function getSpreadsheetId(): Promise<string | null> {
  try {
    await connectDB();
    const s = await Settings.findById('global').lean();
    if (!s?.googleSheetsEnabled || !(s as { googleSheetsId?: string }).googleSheetsId) {
      return null;
    }
    return (s as { googleSheetsId?: string }).googleSheetsId || null;
  } catch (err) {
    console.error('[GoogleSheets]', err);
    return null;
  }
}

export async function findRowByBookingId(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
  bookingId: string
): Promise<number | null> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!A:A`,
    });
    const rows = res.data.values as string[][] | undefined;
    if (!rows || !Array.isArray(rows)) return null;
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i]?.[0];
      if (cell && String(cell).trim() === String(bookingId).trim()) {
        return i + 1; // 1-based row number
      }
    }
    return null;
  } catch (err) {
    console.error('[GoogleSheets]', err);
    return null;
  }
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export async function syncBookingToSheet(
  booking: {
    _id: unknown;
    bookingCode?: string;
    createdAt?: Date;
    service?: { type?: string };
    status?: string;
    paymentStatus?: string;
    pricing?: { total?: number; paidAmount?: number; tipAmount?: number };
    invoice?: { total?: number };
    clientNotes?: string;
    adminNotes?: string;
    updatedAt?: Date;
  },
  customerName: string,
  socialMediaName: string,
  nailTechName: string,
  appointmentDate: string,
  appointmentTimes: string[]
): Promise<void> {
  try {
    const spreadsheetId = await getSpreadsheetId();
    if (!spreadsheetId) return;

    const sheets = await getSheetsClient();
    if (!sheets) return;

    const bookingId = String(booking._id);
    const totalInvoice = booking.invoice?.total ?? booking.pricing?.total ?? 0;
    const paidAmount = booking.pricing?.paidAmount ?? 0;
    const tipAmount = booking.pricing?.tipAmount ?? 0;
    const balance = Math.max(0, totalInvoice - paidAmount);
    const timeStr = Array.isArray(appointmentTimes) && appointmentTimes.length > 0
      ? appointmentTimes.join(', ')
      : '';

    const row: (string | number)[] = [
      bookingId,
      booking.bookingCode ?? '',
      formatDate(booking.createdAt),
      formatDate(appointmentDate),
      timeStr,
      customerName ?? '',
      socialMediaName ?? '',
      nailTechName ?? '',
      booking.service?.type ?? '',
      booking.status ?? '',
      booking.paymentStatus ?? '',
      totalInvoice,
      paidAmount,
      tipAmount,
      balance,
      (booking.clientNotes || booking.adminNotes || '').slice(0, 500),
      formatDate(booking.updatedAt),
    ];

    const rowIndex = await findRowByBookingId(sheets, spreadsheetId, BOOKINGS_TAB, bookingId);

    if (rowIndex != null) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${BOOKINGS_TAB}'!A${rowIndex}:Q${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${BOOKINGS_TAB}'!A:Q`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    }
  } catch (err) {
    console.error('[GoogleSheets]', err);
  }
}

export async function syncFinanceToSheet(
  booking: {
    status?: string;
    bookingCode?: string;
    paymentStatus?: string;
    invoice?: { total?: number };
    pricing?: { tipAmount?: number };
    completedAt?: Date | null;
    updatedAt?: Date;
  },
  socialMediaName: string,
  nailTechName: string,
  appointmentDate: string,
  appointmentTimes: string[],
  adminCommissionRate: number
): Promise<void> {
  try {
    if (booking.status !== 'completed') return;

    const spreadsheetId = await getSpreadsheetId();
    if (!spreadsheetId) return;

    const sheets = await getSheetsClient();
    if (!sheets) return;

    const totalInvoice = booking.invoice?.total ?? 0;
    const tipAmount = booking.pricing?.tipAmount ?? 0;
    const paidAmount = booking.pricing?.paidAmount ?? 0;
    const totalBillPlusTip = totalInvoice + tipAmount;
    const adminCom = (paidAmount + tipAmount) * (adminCommissionRate / 100);
    const timeStr = Array.isArray(appointmentTimes) && appointmentTimes.length > 0
      ? appointmentTimes.join(', ')
      : '';

    const row: (string | number)[] = [
      formatDate(booking.completedAt ?? booking.updatedAt),
      formatDate(appointmentDate),
      timeStr,
      socialMediaName ?? '',
      totalInvoice,
      booking.pricing?.paidAmount ?? 0,
      tipAmount,
      totalBillPlusTip,
      adminCom,
      nailTechName ?? '',
      booking.bookingCode ?? '',
      booking.paymentStatus ?? '',
    ];

    // Upsert by Booking Code in column K (11)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${FINANCE_TAB}'!K:K`,
    });
    const rows = res.data.values as string[][] | undefined;
    let rowIndex: number | null = null;
    if (rows && Array.isArray(rows)) {
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i]?.[0];
        if (cell && String(cell).trim() === String(booking.bookingCode ?? '').trim()) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    if (rowIndex != null) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${FINANCE_TAB}'!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${FINANCE_TAB}'!A:L`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    }
  } catch (err) {
    console.error('[GoogleSheets]', err);
  }
}
