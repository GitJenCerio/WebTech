import { google } from 'googleapis';
import type { Slot, Customer, Booking, NailTech } from '@/lib/types';

const sheets = google.sheets('v4');
const SHEET_RANGE = 'A:ZZ';

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.warn('Google Sheets backup: Missing service account credentials. Backup will be skipped.');
    return null;
  }

  // Handle private key formatting
  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }
  
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch (error: any) {
    console.error('Google Sheets backup: Auth error:', error.message);
    return null;
  }
}

function getSpreadsheetId(): string | null {
  const sheetId = process.env.GOOGLE_SHEETS_BACKUP_ID || process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    console.warn('Google Sheets backup: Missing spreadsheet ID. Backup will be skipped.');
    return null;
  }
  return sheetId;
}

/**
 * Append a row to a Google Sheet
 * Non-blocking: Errors are logged but don't throw
 */
async function appendRow(sheetName: string, values: any[]): Promise<void> {
  try {
    const auth = getAuthClient();
    const spreadsheetId = getSpreadsheetId();
    
    if (!auth || !spreadsheetId) {
      return; // Silently skip if not configured
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!${SHEET_RANGE}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      auth,
      requestBody: {
        values: [values],
      },
    });
  } catch (error: any) {
    console.error(`Google Sheets backup: Failed to append to ${sheetName}:`, error.message);
    // Don't throw - backup failures shouldn't break the app
  }
}

/**
 * Update a row in Google Sheets by finding it via ID
 * Non-blocking: Errors are logged but don't throw
 */
async function updateRow(sheetName: string, id: string, values: any[]): Promise<void> {
  try {
    const auth = getAuthClient();
    const spreadsheetId = getSpreadsheetId();
    
    if (!auth || !spreadsheetId) {
      return;
    }

    // Get all rows to find the one with matching ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${SHEET_RANGE}`,
      auth,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return;

    // Find row index (assuming ID is in first column)
    const rowIndex = rows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) {
      // Row not found, append instead
      await appendRow(sheetName, values);
      return;
    }

    // Update the row (rowIndex + 1 because Sheets is 1-indexed, +1 for header)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex + 2}:ZZ${rowIndex + 2}`,
      valueInputOption: 'RAW',
      auth,
      requestBody: {
        values: [values],
      },
    });
  } catch (error: any) {
    console.error(`Google Sheets backup: Failed to update ${sheetName} row ${id}:`, error.message);
  }
}

/**
 * Backup a Slot to Google Sheets
 */
export async function backupSlot(slot: Slot, operation: 'create' | 'update' = 'create'): Promise<void> {
  const values = [
    slot.id,
    slot.date,
    slot.time,
    slot.status,
    slot.slotType || '',
    slot.notes || '',
    slot.isHidden ? 'Yes' : 'No',
    slot.nailTechId,
    slot.createdAt,
    slot.updatedAt,
  ];

  if (operation === 'create') {
    await appendRow('Slots', values);
  } else {
    await updateRow('Slots', slot.id, values);
  }
}

/**
 * Backup a Customer to Google Sheets
 */
export async function backupCustomer(customer: Customer, operation: 'create' | 'update' = 'create'): Promise<void> {
  const values = [
    customer.id,
    customer.name,
    customer.firstName || '',
    customer.lastName || '',
    customer.email || '',
    customer.phone || '',
    customer.socialMediaName || '',
    customer.referralSource || '',
    customer.isRepeatClient ? 'Yes' : 'No',
    customer.clientType || '',
    customer.totalBookings ?? 0,
    customer.completedBookings ?? 0,
    customer.totalSpent ?? 0,
    customer.totalTips ?? 0,
    customer.totalDiscounts ?? 0,
    customer.lastVisit || '',
    customer.isActive === false ? 'No' : 'Yes',
    customer.notes || '',
    customer.createdAt,
    customer.updatedAt,
  ];

  if (operation === 'create') {
    await appendRow('Customers', values);
  } else {
    await updateRow('Customers', customer.id, values);
  }
}

/**
 * Backup a Booking to Google Sheets
 */
type BookingBackupInput =
  | Booking
  | {
      _id?: { toString?: () => string } | string;
      id?: string;
      bookingCode?: string;
      bookingId?: string;
      slotId?: string;
      slotIds?: string[];
      pairedSlotId?: string | null;
      linkedSlotIds?: string[];
      customerId: string;
      nailTechId: string;
      status: string;
      serviceType?: string;
      clientType?: string;
      serviceLocation?: string;
      service?: {
        type?: string;
        clientType?: string;
        location?: string;
      };
      formResponseId?: string;
      dateChanged?: boolean;
      timeChanged?: boolean;
      validationWarnings?: string[];
      paymentStatus?: string;
      paidAmount?: number;
      depositAmount?: number;
      tipAmount?: number;
      pricing?: {
        paidAmount?: number;
        depositRequired?: number;
        tipAmount?: number;
      };
      depositDate?: string;
      paidDate?: string;
      tipDate?: string;
      payment?: {
        depositPaidAt?: Date;
        fullyPaidAt?: Date;
        method?: 'PNB' | 'CASH' | 'GCASH';
        paymentProofUrl?: string;
        paymentProofPublicId?: string;
      };
      clientPhotos?: {
        inspiration?: Array<{ url?: string; publicId?: string }>;
        currentState?: Array<{ url?: string; publicId?: string }>;
      };
      completedAt?: string | Date | null;
      depositPaymentMethod?: 'PNB' | 'CASH' | 'GCASH';
      paidPaymentMethod?: 'PNB' | 'CASH' | 'GCASH';
      createdAt: string | Date;
      updatedAt: string | Date;
    };

function normalizeId(id: unknown): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof (id as any).toString === 'function') return (id as any).toString();
  return '';
}

function normalizeDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function backupBooking(booking: BookingBackupInput, operation: 'create' | 'update' = 'create'): Promise<void> {
  const id = booking.id || normalizeId(booking._id);
  const bookingIdentifier = booking.bookingId || booking.bookingCode || '';
  const primarySlotId = booking.slotId || booking.slotIds?.[0] || '';
  const linkedSlotIds =
    booking.linkedSlotIds && booking.linkedSlotIds.length > 0
      ? booking.linkedSlotIds
      : (booking.slotIds || []).slice(1);
  const serviceType = booking.serviceType || booking.service?.type || '';
  const clientType = booking.clientType || booking.service?.clientType || '';
  const serviceLocation = booking.serviceLocation || booking.service?.location || '';
  const paidAmount = booking.paidAmount ?? booking.pricing?.paidAmount ?? 0;
  const depositAmount = booking.depositAmount ?? booking.pricing?.depositRequired ?? 0;
  const tipAmount = booking.tipAmount ?? booking.pricing?.tipAmount ?? 0;
  const depositDate = booking.depositDate || normalizeDate(booking.payment?.depositPaidAt);
  const paidDate = booking.paidDate || normalizeDate(booking.payment?.fullyPaidAt);
  const depositPaymentMethod = booking.depositPaymentMethod || booking.payment?.method || '';
  const paidPaymentMethod = booking.paidPaymentMethod || booking.payment?.method || '';
  const paymentProofUrl = booking.payment?.paymentProofUrl || '';
  const paymentProofPublicId = booking.payment?.paymentProofPublicId || '';
  const inspirationPhotoUrls = (booking.clientPhotos?.inspiration || [])
    .map((photo) => photo?.url || '')
    .filter(Boolean)
    .join(',');
  const currentPhotoUrls = (booking.clientPhotos?.currentState || [])
    .map((photo) => photo?.url || '')
    .filter(Boolean)
    .join(',');
  const completedAt = normalizeDate(booking.completedAt);

  const values = [
    id,
    bookingIdentifier,
    primarySlotId,
    booking.pairedSlotId || '',
    linkedSlotIds.join(','),
    booking.customerId,
    booking.nailTechId,
    booking.status,
    serviceType,
    clientType,
    serviceLocation,
    booking.formResponseId || '',
    booking.dateChanged ? 'Yes' : 'No',
    booking.timeChanged ? 'Yes' : 'No',
    (booking.validationWarnings || []).join(';'),
    booking.paymentStatus || '',
    paidAmount,
    depositAmount,
    tipAmount,
    depositDate,
    paidDate,
    booking.tipDate || '',
    depositPaymentMethod,
    paidPaymentMethod,
    normalizeDate(booking.createdAt),
    normalizeDate(booking.updatedAt),
    paymentProofUrl,
    paymentProofPublicId,
    inspirationPhotoUrls,
    currentPhotoUrls,
    completedAt,
  ];

  if (operation === 'create') {
    await appendRow('Bookings', values);
  } else {
    await updateRow('Bookings', id, values);
  }
}

/**
 * Backup a Nail Tech to Google Sheets
 */
export async function backupNailTech(tech: NailTech, operation: 'create' | 'update' = 'create'): Promise<void> {
  const values = [
    tech.id,
    tech.name,
    tech.role,
    tech.serviceAvailability,
    (tech.workingDays || []).join(','),
    tech.discount || 0,
    tech.commissionRate || 0,
    tech.status,
    tech.createdAt,
    tech.updatedAt,
  ];

  if (operation === 'create') {
    await appendRow('NailTechs', values);
  } else {
    await updateRow('NailTechs', tech.id, values);
  }
}

/**
 * Backup a User to Google Sheets (without password)
 */
export async function backupUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedNailTechId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}, operation: 'create' | 'update' = 'create'): Promise<void> {
  const values = [
    user.id,
    user.name,
    user.email,
    user.role,
    user.assignedNailTechId || '',
    user.isActive ? 'Yes' : 'No',
    user.lastLogin || '',
    user.createdAt,
    user.updatedAt,
  ];

  if (operation === 'create') {
    await appendRow('Users', values);
  } else {
    await updateRow('Users', user.id, values);
  }
}

/**
 * Initialize Google Sheets with headers (run once to set up sheets)
 * This should be called manually or during initial setup
 */
export async function initializeSheets(): Promise<void> {
  try {
    const auth = getAuthClient();
    const spreadsheetId = getSpreadsheetId();
    
    if (!auth || !spreadsheetId) {
      console.warn('Google Sheets backup: Cannot initialize - missing credentials');
      return;
    }

    const headers = {
      Slots: ['ID', 'Date', 'Time', 'Status', 'Slot Type', 'Notes', 'Is Hidden', 'Nail Tech ID', 'Created At', 'Updated At'],
      Customers: ['ID', 'Name', 'First Name', 'Last Name', 'Email', 'Phone', 'Social Media Name', 'Referral Source', 'Is Repeat Client', 'Client Type', 'Total Bookings', 'Completed Bookings', 'Total Spent', 'Total Tips', 'Total Discounts', 'Last Visit', 'Is Active', 'Notes', 'Created At', 'Updated At'],
      Bookings: ['ID', 'Booking ID', 'Slot ID', 'Paired Slot ID', 'Linked Slot IDs', 'Customer ID', 'Nail Tech ID', 'Status', 'Service Type', 'Client Type', 'Service Location', 'Assistant Name', 'Assistant Commission Rate', 'Form Response ID', 'Date Changed', 'Time Changed', 'Validation Warnings', 'Payment Status', 'Paid Amount', 'Deposit Amount', 'Tip Amount', 'Deposit Date', 'Paid Date', 'Tip Date', 'Deposit Payment Method', 'Paid Payment Method', 'Created At', 'Updated At', 'Payment Proof URL', 'Payment Proof Public ID', 'Inspiration Photo URLs', 'Current Nail Photo URLs', 'Completed At'],
      NailTechs: ['ID', 'Name', 'Role', 'Service Availability', 'Working Days', 'Discount', 'Commission Rate', 'Status', 'Created At', 'Updated At'],
      Users: ['ID', 'Name', 'Email', 'Role', 'Assigned Nail Tech ID', 'Is Active', 'Last Login', 'Created At', 'Updated At'],
    };

    // Create or update headers for each sheet
    for (const [sheetName, headerRow] of Object.entries(headers)) {
      try {
        // Check if sheet exists by trying to read it
        await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1`,
          auth,
        });
        
        // Sheet exists, update headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:ZZ1`,
          valueInputOption: 'RAW',
          auth,
          requestBody: {
            values: [headerRow],
          },
        });
      } catch (error: any) {
        // Sheet might not exist, try to create it
        // Note: This requires the spreadsheet to already exist
        // You may need to manually create the sheets first
        console.warn(`Google Sheets backup: Could not initialize ${sheetName}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('Google Sheets backup: Initialization error:', error.message);
  }
}
