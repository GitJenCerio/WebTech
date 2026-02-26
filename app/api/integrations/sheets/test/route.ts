import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSheetsClient, getSpreadsheetId } from '@/lib/services/googleSheetsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const spreadsheetId = await getSpreadsheetId();
    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets not configured or disabled. Turn on "Enable Google Sheets Backup", paste your Sheet URL, and click Save in Integrations first.',
      }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: false, error: 'Failed to create Sheets client. Check service account env vars.' }, { status: 500 });
    }

    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Bookings'!A1",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Sheets] test error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Could not read Bookings tab',
    }, { status: 500 });
  }
}
