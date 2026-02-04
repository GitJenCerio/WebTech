import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

const sheets = google.sheets('v4');

/**
 * Get Google Sheets authentication client
 * Returns null if credentials are missing (non-blocking)
 */
function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } catch (error: any) {
    console.error('Quotation pricing: Auth error:', error.message);
    return null;
  }
}

/**
 * GET /api/quotation/pricing
 * Fetch pricing data from Google Sheets for quotation calculations
 * 
 * ============================================================================
 * STRICT SEPARATION RULES (NON-NEGOTIABLE):
 * ============================================================================
 * - This endpoint is ONLY for quotation price estimation
 * - NO relationship to bookings, customers, or invoices
 * - NO database persistence
 * - NO booking ID generation
 * - NO invoice conversion
 * - Data is fetched live from Google Sheets (no caching)
 * - Quotation data exists only in client-side state
 * ============================================================================
 */
export async function GET(request: Request) {
  try {
    const auth = getAuthClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_PRICING_ID || process.env.GOOGLE_SHEETS_BACKUP_ID || process.env.GOOGLE_SHEETS_ID;

    if (!auth || !spreadsheetId) {
      return NextResponse.json(
        { 
          error: 'Google Sheets pricing data is not configured',
          available: false 
        },
        { status: 503 }
      );
    }

    // Fetch pricing sheet (adjust sheet name as needed)
    // Expected format: Service Name | Price | Location | Notes
    const sheetName = process.env.GOOGLE_SHEETS_PRICING_SHEET || 'Pricing';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      auth,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Pricing sheet is empty',
          available: false 
        },
        { status: 503 }
      );
    }

    // Parse pricing data (assuming first row is headers)
    // Format: [Service Name, Price, Location, Add-ons, Notes, ...]
    const headers = rows[0] || [];
    const pricingData = rows.slice(1).map((row) => {
      const item: Record<string, any> = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || '';
      });
      return item;
    });

    return NextResponse.json({
      available: true,
      pricing: pricingData,
      headers,
    });
  } catch (error: any) {
    console.error('Error fetching quotation pricing:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pricing data from Google Sheets',
        available: false,
        details: error.message 
      },
      { status: 500 }
    );
  }
}
