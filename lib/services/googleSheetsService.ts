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

/** Find 1-based row number in column A by Booking ID (booking code, e.g. NB-2024-001). */
export async function findRowByBookingId(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
  bookingIdOrCode: string
): Promise<number | null> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!A:A`,
    });
    const rows = res.data.values as string[][] | undefined;
    if (!rows || !Array.isArray(rows)) return null;
    const needle = String(bookingIdOrCode).trim();
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i]?.[0];
      if (cell && String(cell).trim() === needle) {
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

/** Format appointment date as "February 01, 2026" */
function formatAppointmentDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/** Format as YYYY-MM-DD HH:mm:ss for Updated at column */
function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const s = date.toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 19)}`;
}

/** Location label for sheet: home_service -> HS, homebased_studio -> ST */
function locationLabel(loc?: 'homebased_studio' | 'home_service' | string): string {
  if (loc === 'home_service') return 'HS';
  if (loc === 'homebased_studio') return 'ST';
  return '';
}

export async function syncBookingToSheet(
  booking: {
    bookingCode?: string;
    service?: { type?: string; location?: 'homebased_studio' | 'home_service' };
    status?: string;
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

    const bookingId = String(booking.bookingCode ?? '').trim();
    if (!bookingId) return;

    const timeStr = Array.isArray(appointmentTimes) && appointmentTimes.length > 0
      ? [...appointmentTimes].sort((a, b) => {
          const toMins = (s: string) => {
            const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!m) return 0;
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const ap = (m[3] || '').toUpperCase();
            if (ap === 'PM' && h !== 12) h += 12;
            if (ap === 'AM' && h === 12) h = 0;
            return h * 60 + min;
          };
          return toMins(a) - toMins(b);
        }).join(', ')
      : '';

    // Columns: Booking ID, Date, Time, Client, Social Name, Service, Location, Nail Tech, Status, Updated at
    const row: (string | number)[] = [
      bookingId,
      formatAppointmentDate(appointmentDate),
      timeStr,
      customerName ?? '',
      socialMediaName ?? '',
      booking.service?.type ?? '',
      locationLabel(booking.service?.location),
      nailTechName ?? '',
      booking.status ?? '',
      formatDateTime(booking.updatedAt),
    ];

    const rowIndex = await findRowByBookingId(sheets, spreadsheetId, BOOKINGS_TAB, bookingId);
    const rangeCol = 'J'; // 10 columns

    if (rowIndex != null) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${BOOKINGS_TAB}'!A${rowIndex}:${rangeCol}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${BOOKINGS_TAB}'!A:${rangeCol}`,
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
    bookingCode?: string;
    status?: string;
    paymentStatus?: string;
    service?: { type?: string };
    invoice?: { total?: number };
    pricing?: { paidAmount?: number; tipAmount?: number; discountAmount?: number };
    completedAt?: Date | null;
    updatedAt?: Date;
  },
  customerName: string,
  _socialMediaName: string,
  _nailTechName: string,
  appointmentDate: string,
  _appointmentTimes: string[],
  _adminCommissionRate: number
): Promise<void> {
  try {
    // Sync when booking is completed, or when payment was received (paid/partial)
    const hasPayment = booking.paymentStatus === 'paid' || booking.paymentStatus === 'partial';
    if (booking.status !== 'completed' && !hasPayment) return;

    const spreadsheetId = await getSpreadsheetId();
    if (!spreadsheetId) return;

    const sheets = await getSheetsClient();
    if (!sheets) return;

    const totalInvoice = booking.invoice?.total ?? 0;
    const paidAmount = booking.pricing?.paidAmount ?? 0;
    const tipAmount = booking.pricing?.tipAmount ?? 0;
    const discountAmount = booking.pricing?.discountAmount ?? 0;
    const balance = Math.max(0, totalInvoice - paidAmount);

    const bookingId = String(booking.bookingCode ?? '').trim();
    if (!bookingId) return;

    // Columns: Booking ID (booking code), Date, Client, Service, Total, Paid, Tip, Discount, Balance, Status, Updated at
    const row: (string | number)[] = [
      bookingId,
      formatAppointmentDate(appointmentDate),
      customerName ?? '',
      booking.service?.type ?? '',
      totalInvoice,
      paidAmount,
      tipAmount,
      discountAmount,
      balance,
      booking.paymentStatus ?? '',
      formatDateTime(booking.updatedAt),
    ];

    const rowIndex = await findRowByBookingId(sheets, spreadsheetId, FINANCE_TAB, bookingId);
    const rangeCol = 'K'; // 11 columns

    if (rowIndex != null) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${FINANCE_TAB}'!A${rowIndex}:${rangeCol}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${FINANCE_TAB}'!A:${rangeCol}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    }
  } catch (err) {
    console.error('[GoogleSheets]', err);
  }
}
