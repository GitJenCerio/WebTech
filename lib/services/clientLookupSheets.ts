// Google Sheets Client Lookup (Alternative to Database)
// =====================================================
// Use this if you want to avoid database complexity
// Good for: <500 clients, occasional lookups
// Limitations: Slower, 300 requests/minute quota

import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENTS_SHEET_NAME = 'Clients';

// In-memory cache to reduce Sheets API calls
const sheetsCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
let lastFetchTime = 0;
let allClients: any[] = [];

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Fetch all clients once, cache in memory
async function fetchAllClients(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (!forceRefresh && allClients.length > 0 && (now - lastFetchTime) < CACHE_TTL) {
    return allClients;
  }

  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${CLIENTS_SHEET_NAME}!A2:Z`, // Skip header row
  });

  const rows = response.data.values || [];
  
  // Assuming columns: Name | Phone | Email | Repeat Client
  allClients = rows.map((row, index) => ({
    id: index + 2, // Row number in sheet
    name: row[0] || '',
    phone: row[1] || '',
    email: row[2] || '',
    isRepeatClient: row[3]?.toLowerCase() === 'yes' || row[3] === 'true',
  }));

  lastFetchTime = now;
  return allClients;
}

// Find client by phone (uses in-memory cache)
export async function findClientByPhone(phone: string) {
  const clients = await fetchAllClients();
  
  // Normalize phone for comparison
  const normalizedPhone = phone.replace(/\D/g, '');
  
  return clients.find(client => 
    client.phone.replace(/\D/g, '') === normalizedPhone
  );
}

// Check if client exists
export async function clientExists(phone: string): Promise<boolean> {
  const client = await findClientByPhone(phone);
  return !!client;
}

// Force refresh cache (call this after adding new client)
export async function refreshClientCache() {
  return await fetchAllClients(true);
}

// Add new client to sheet
export async function addClientToSheet(clientData: {
  name: string;
  phone: string;
  email?: string;
  isRepeatClient?: boolean;
}) {
  const sheets = await getSheets();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${CLIENTS_SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        clientData.name,
        clientData.phone,
        clientData.email || '',
        clientData.isRepeatClient ? 'Yes' : 'No',
      ]],
    },
  });

  // Refresh cache
  await refreshClientCache();
}

// PERFORMANCE NOTES:
// ==================
// - First call: 1 Sheets API read (fetches all 300+ clients)
// - Subsequent calls: 0 API calls (uses in-memory cache for 30 min)
// - Cache refreshes every 30 minutes automatically
// - Memory usage: ~100KB for 300 clients
// - Quota: 300 reads/min (plenty for your use case)
// - Latency: ~200-500ms first call, <1ms cached calls

export { allClients };
