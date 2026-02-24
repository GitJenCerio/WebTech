# 🚀 Implementation Plan — Glammed Nails by Jhen
## Cursor AI Phased Development Guide

> **How to use this file:** Open it in Cursor, then for each task say:
> *"Implement Phase 1, Task 1.1 — follow the instructions in the implementation plan"*
> Cursor will read this file as context and execute the task precisely.

---

## 📐 Project Context (Read Before Every Task)

**Stack:** Next.js 14 App Router · TypeScript · MongoDB/Mongoose · NextAuth v4 · Tailwind CSS · Cloudinary · `sonner` toasts · `recharts` · `lucide-react`

**Key rules Cursor must follow at all times:**
- All API routes must check `getServerSession(authOptions)` and return 401 if no session
- Always call `await connectDB()` before any Mongoose query
- Add `export const dynamic = 'force-dynamic'` to every API route
- Never `await` background tasks (Sheets sync, emails) — use `.catch(console.error)`
- Use `toast.success()` / `toast.error()` from `sonner` — never `alert()`
- All monetary values are **PHP ₱** — always display with `₱` symbol
- Dates displayed to users must be in **Asia/Manila** timezone
- `Slot.date` is a plain string `'YYYY-MM-DD'` — never convert to JS Date
- The Settings document always has `_id: 'global'` — use `findById('global')`
- Mobile-first: every page needs desktop table view + mobile card view
- Use skeleton loaders (`animate-pulse bg-[#e5e5e5]`) — never spinners
- Color palette: text `#1a1a1a`, borders `#e5e5e5`, bg `#fafafa`, cards `white`

---

## ✅ What's Already Built (Do NOT Rebuild)

- Full booking CRUD (create, view, edit, cancel, reschedule, mark complete)
- Customer profiles with full contact info + booking history aggregates
- Nail tech profiles and booking assignment
- Invoice creation and management
- Payment proof upload via Cloudinary
- Client inspiration + current-state photos upload
- Calendar view of bookings
- Finance table with date filter + basic CSV export (basic columns only)
- Revenue breakdown by nail tech on Finance page
- Staff user management with password reset
- Quotation / pricing spreadsheet page
- Audit log with action/resource filters
- NextAuth with Credentials + Google (pre-approved allowlist)
- Email notifications on booking creation
- Cron jobs for slot cleanup + appointment reminders

---

## 🗄️ Current MongoDB Models Reference

```typescript
// Settings (_id: 'global')
{ businessName, reservationFee, emailNotifications, smsNotifications, reminderHoursBefore }
// MISSING: adminCommissionRate, googleSheetsId, googleSheetsEnabled

// Booking
{ bookingCode, customerId, nailTechId, slotIds[], service{type,location,clientType},
  status, paymentStatus, pricing{total,depositRequired,paidAmount,tipAmount,discountAmount,balance},
  invoice{quotationId?,total?,createdAt?}, clientNotes, adminNotes, clientPhotos,
  paymentProofUrl, slotType, completedAt, confirmedAt, createdAt, updatedAt }

// Customer
{ name, firstName, lastName, email, phone, socialMediaName, referralSource, clientType,
  totalBookings, completedBookings, totalSpent, totalTips, totalDiscounts,
  lastVisit, notes, waiverAccepted, isActive }

// Slot
{ date (string 'YYYY-MM-DD'), time (string), nailTechId, isBooked, bookingId, slotType }

// The GET /api/bookings response already includes these joined fields:
// customerName, customerEmail, customerPhone, customerSocialMediaName,
// appointmentDate, appointmentTime, appointmentTimes[]
```

---
---

# PHASE 1 — Finance Improvements
## Priority: 🔴 Critical | Estimated: 1–2 days

> These are the highest-priority features. Complete Phase 1 before anything else.

---

### Task 1.1 — Add Admin Commission Rate to Settings

**What to build:** Add `adminCommissionRate` (number, default: 10) to the Settings system so finance exports can calculate commissions dynamically.

**Files to modify:**

**`lib/models/Settings.ts`**
- Add field: `adminCommissionRate: { type: Number, default: 10, min: 0, max: 100 }`

**`app/api/settings/route.ts`** — GET handler
- Include `adminCommissionRate: settings.adminCommissionRate ?? 10` in the returned JSON

**`app/api/settings/route.ts`** — PATCH handler
- Accept and validate: `if (typeof body.adminCommissionRate === 'number' && body.adminCommissionRate >= 0 && body.adminCommissionRate <= 100) update.adminCommissionRate = body.adminCommissionRate;`

**`admin/admin/settings/page.tsx`**
- Add `adminCommissionRate: number` to the `SettingsData` interface (default: 10)
- Add it to `DEFAULT_SETTINGS`
- Add it to `fetchSettings` mapping
- In the General tab `<CardContent>`, add a new input field after the Reservation Fee:
  ```
  Label: "Admin Commission Rate (%)"
  Input: type="number", min=0, max=100, step=0.5, max-width 120px
  Description text: "Applied to Total Invoice for commission calculation in finance exports"
  ```
- Include `adminCommissionRate` in the `handleSaveGeneral` PATCH body

**Acceptance criteria:**
- Settings page shows the commission rate field
- Saving updates it in MongoDB
- GET /api/settings returns the value
- Default is 10 (%)

---

### Task 1.2 — Enhanced Finance CSV Export

**What to build:** Replace the current basic CSV export with a 9-column export that includes appointment details and admin commission.

**Files to modify:**

**`admin/admin/finance/page.tsx`**

Step 1 — Add `adminCommissionRate` state:
```typescript
const [adminCommissionRate, setAdminCommissionRate] = useState(10);
```

Step 2 — Fetch settings on mount (add to the existing `fetchSummary` useEffect or create a new one):
```typescript
const settingsRes = await fetch('/api/settings');
if (settingsRes.ok) {
  const s = await settingsRes.json();
  setAdminCommissionRate(s.adminCommissionRate ?? 10);
}
```

Step 3 — Replace the `exportToCsv` function entirely with this logic:

The new CSV must have exactly these columns in this order:
1. **Date** — `booking.date` (the record/transaction date: `completedAt` or `createdAt`)
2. **Date of Appointment** — `booking.appointmentDate` (from the slot)
3. **Time** — `booking.appointmentTimes` array joined with `, ` (or `booking.appointmentTime`)
4. **Social Media Name** — `booking.customerSocialMediaName`
5. **Total Invoice** — `booking.invoice?.total ?? booking.pricing?.total ?? 0`
6. **Paid Amount** — `booking.pricing?.paidAmount ?? 0`
7. **Tip** — `booking.pricing?.tipAmount ?? 0`
8. **Total Bill + Tip** — `Total Invoice + Tip`
9. **Admin Com X%** — `Total Invoice × (adminCommissionRate / 100)`, label the header dynamically as `Admin Com ${adminCommissionRate}%`

For the CSV function, also apply a month/date range label in the filename: `finance-export-{dateFrom || 'all'}-to-{dateTo || 'all'}.csv`

Step 4 — Update the Export button label to show `Export CSV (${filteredTransactions.length})` so the user sees how many rows will export.

**Acceptance criteria:**
- CSV has exactly 9 columns in the specified order
- Commission column uses the live rate from Settings
- Social media name is populated (not empty)
- Appointment time shows the actual slot time(s)
- Filename includes the date range

---

### Task 1.3 — Month Quick-Filter for Finance Page

**What to build:** Add a month picker dropdown to the Finance page filter bar so admins can quickly select "January 2026", "February 2026", etc. instead of manually picking a date range.

**Files to modify:**

**`admin/admin/finance/page.tsx`**

Add a new `Select` dropdown in the filter bar (before the DateRangePicker):
- Label: "Quick Select"
- Options:
  - "Custom Range" (default, value: `''`)  
  - Current month: "February 2026" (value: `2026-02`)
  - Last 6 months dynamically generated (value: `YYYY-MM`)
  - "All Time" (value: `all`)

When a month option is selected:
- Calculate `dateFrom` = first day of that month (`YYYY-MM-01`)
- Calculate `dateTo` = first day of next month (`YYYY-MM-01` of next month)
- Set both `dateFrom` and `dateTo` state automatically
- When "Custom Range" is selected, clear the quick select and let the DateRangePicker work normally
- When "All Time" is selected, clear both `dateFrom` and `dateTo`

Also update the Export CSV button to show the selected period in its label:
- If a month is selected: `Export January 2026`
- If custom range: `Export CSV`
- If all time: `Export All`

**Acceptance criteria:**
- Month dropdown generates options dynamically (current month + 5 previous months)
- Selecting a month auto-sets the date range and triggers data fetch
- "All Time" clears the filter
- Export button reflects the selected period

---
---

# PHASE 2 — Google Sheets Integration
## Priority: 🟠 High | Estimated: 2–3 days

> Implement automatic real-time backup of booking and finance data to Google Sheets.
> Every create/update/complete action syncs to the Sheet instantly in the background.

---

### Task 2.1 — Google Sheets Service File

**What to build:** Create the core service that handles all communication with Google Sheets API.

**Install required package first:**
```bash
npm install googleapis
```

**Create new file: `lib/services/googleSheetsService.ts`**

This file must be server-only (never import it in a `'use client'` component).

Implement the following functions:

**`getSheetsClient()`**
- Authenticate using `google.auth.JWT` with `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` env vars
- Scope: `https://www.googleapis.com/auth/spreadsheets`
- Return a `google.sheets({ version: 'v4', auth })` client

**`getSpreadsheetId()`**
- Fetch from Settings: `const s = await Settings.findById('global').lean(); return s?.googleSheetsId`
- Return `null` if not configured or disabled (`!s?.googleSheetsEnabled`)

**`findRowByBookingId(sheets, spreadsheetId, tab, bookingId)`**
- Read column A of the given tab to find the row index with the matching booking ID
- Return the 1-based row number, or `null` if not found

**`syncBookingToSheet(booking, customerName, socialMediaName, nailTechName, appointmentDate, appointmentTimes)`**
- Get spreadsheet ID — if null, return early silently
- Tab name: `"Bookings"`
- Columns (in order): `Booking ID | Booking Code | Date Created | Appointment Date | Appointment Time | Client Name | Social Media Name | Nail Tech | Service | Status | Payment Status | Total Invoice | Paid Amount | Tip | Balance | Notes | Last Updated`
- Find existing row by Booking ID in column A
- If found: update that row with `spreadsheets.values.update`
- If not found: append a new row with `spreadsheets.values.append`
- Format all monetary values as plain numbers (no ₱ symbol — Sheets will format)
- Format dates as `YYYY-MM-DD`

**`syncFinanceToSheet(booking, socialMediaName, nailTechName, appointmentDate, appointmentTimes, adminCommissionRate)`**
- Only sync if `booking.status === 'completed'`
- Tab name: `"Finance"`
- Columns (in order): `Date | Appointment Date | Time | Social Media Name | Total Invoice | Paid Amount | Tip | Total Bill + Tip | Admin Com % | Nail Tech | Booking Code | Payment Status`
- The "Admin Com %" value = `(invoice.total ?? 0) * (adminCommissionRate / 100)`
- "Total Bill + Tip" = `(invoice.total ?? 0) + (tipAmount ?? 0)`
- Upsert by Booking Code in the Booking Code column (column K)

**Error handling:** All functions must be wrapped in try/catch. Log errors with `console.error('[GoogleSheets]', err)`. Never throw — always return gracefully.

---

### Task 2.2 — Hook Sheets Sync into Booking API Routes

**What to build:** Call the Google Sheets sync functions at the right moments in the booking lifecycle.

**Files to modify:**

**`app/api/bookings/route.ts`** — POST handler (booking creation)
After the booking is created and saved to DB, add a non-blocking sync call:
```typescript
// After: return NextResponse.json({ booking: ... }, { status: 201 });
// Before the return, add:
import { syncBookingToSheet } from '@/lib/services/googleSheetsService';
// Then after saving the booking:
syncBookingToSheet(/* pass required params */).catch(err => console.error('[Sheets] Booking sync failed:', err));
```

To get the customer, nail tech, and slot data needed for Sheets, reuse what's already fetched in the route (or do a quick lookup).

**`app/api/bookings/[id]/route.ts`** — PATCH handler (status updates, payment updates, completion)
After a successful update, add:
```typescript
// Fire both syncs — Finance sync will self-filter (only runs if status === 'completed')
syncBookingToSheet(...).catch(err => console.error('[Sheets] Booking sync failed:', err));
syncFinanceToSheet(...).catch(err => console.error('[Sheets] Finance sync failed:', err));
```

Fetch `adminCommissionRate` from Settings for the finance sync:
```typescript
const settings = await Settings.findById('global').lean();
const commissionRate = settings?.adminCommissionRate ?? 10;
```

**Important:** Both sync calls must be completely non-blocking. The API response must return before Sheets sync completes.

---

### Task 2.3 — Bulk Sync API Endpoint

**What to build:** A one-time "sync all" endpoint for backfilling historical data into Sheets.

**Create new file: `app/api/integrations/sheets/sync-all/route.ts`**

- Auth required (admin session only)
- Fetches all bookings from DB in pages of 50
- For each booking, calls `syncBookingToSheet` and `syncFinanceToSheet`
- Returns `{ synced: number, errors: number }` when complete
- Timeout-safe: use `for...of` loop with `await` (not Promise.all) to avoid rate limits
- Add a 100ms delay between each Sheets write to respect Google's rate limits: `await new Promise(r => setTimeout(r, 100))`

---

### Task 2.4 — Google Sheets Settings UI (Integrations Tab)

**What to build:** A new "Integrations" tab in the Settings page for configuring and testing the Google Sheets connection.

**Files to modify:**

**`lib/models/Settings.ts`**
- Add: `googleSheetsId: { type: String, default: '' }`
- Add: `googleSheetsEnabled: { type: Boolean, default: false }`

**`app/api/settings/route.ts`**
- Include `googleSheetsId` and `googleSheetsEnabled` in both GET response and PATCH handler

**`admin/admin/settings/page.tsx`**

Add `"integrations"` as a new tab to the existing `<TabsList>`:
```
General | Services | Notifications | Team | Integrations
```

The Integrations tab content should include:

**Google Sheets Backup section:**
- Toggle: "Enable Google Sheets Backup" (Switch component)
- Input: "Google Sheet URL" — user pastes the full Sheet URL, the code extracts the Spreadsheet ID from it
  - Parse ID from URL: `url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1]`
  - Show the extracted ID below the input in small gray text: "Spreadsheet ID: 1BxiM..."
- Last Synced: show a timestamp if available (store in state, not in DB)
- "Test Connection" button — calls `GET /api/integrations/sheets/test` and shows success/error toast
- "Sync All Historical Data" button — calls `POST /api/integrations/sheets/sync-all`
  - Show a loading state while syncing: "Syncing... (this may take a minute)"
  - On complete, show: "Synced 142 bookings successfully"

**Create new file: `app/api/integrations/sheets/test/route.ts`**
- Tries to read the first cell of the Bookings tab
- Returns `{ success: true }` or `{ success: false, error: string }`

**Acceptance criteria:**
- User can paste a Google Sheet URL and it auto-extracts the ID
- Test connection confirms Sheets access works
- Sync All button backfills all existing bookings
- Toggle enables/disables all automatic syncing

---
---

# PHASE 3 — Code Quality & Security
## Priority: 🟠 High | Estimated: 2 days

---

### Task 3.1 — Add MongoDB Indexes

**What to build:** Add database indexes for performance. This is a one-time migration.

**Create new file: `lib/db/ensureIndexes.ts`**

Call this from `lib/mongodb.ts` after connection is established (only once on startup).

Add the following indexes:

```typescript
// Booking indexes
await Booking.collection.createIndex({ nailTechId: 1, status: 1 });
await Booking.collection.createIndex({ customerId: 1 });
await Booking.collection.createIndex({ createdAt: -1 });
await Booking.collection.createIndex({ status: 1, createdAt: -1 });

// Slot indexes  
await Slot.collection.createIndex({ date: 1, nailTechId: 1 });
await Slot.collection.createIndex({ isBooked: 1, date: 1 });
await Slot.collection.createIndex({ bookingId: 1 });

// Customer indexes
await Customer.collection.createIndex({ email: 1 }, { sparse: true });
await Customer.collection.createIndex({ socialMediaName: 1 }, { sparse: true });
await Customer.collection.createIndex({ isActive: 1 });

// AuditLog TTL index (auto-delete after 90 days)
await AuditLog.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

Wrap all in try/catch — index creation failures must not crash the app.

---

### Task 3.2 — Input Validation with Zod

**What to build:** Add Zod schema validation to the 4 most critical API routes.

**Install:** `npm install zod`

**Routes to protect (in priority order):**

**`app/api/bookings/route.ts`** — POST
```typescript
import { z } from 'zod';
const createBookingSchema = z.object({
  slotIds: z.array(z.string()).min(1),
  nailTechId: z.string().min(1),
  customerId: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    socialMediaName: z.string().optional(),
  }).optional(),
  service: z.object({
    type: z.string().min(1),
    location: z.enum(['homebased_studio', 'home_service']),
    clientType: z.enum(['NEW', 'REPEAT']),
  }),
  pricing: z.object({
    total: z.number().min(0),
    depositRequired: z.number().min(0),
  }).optional(),
  clientNotes: z.string().max(1000).optional(),
  adminNotes: z.string().max(1000).optional(),
});
// Use: const parsed = createBookingSchema.safeParse(body);
// If !parsed.success: return 400 with parsed.error.flatten()
```

**`app/api/customers/route.ts`** — POST

**`app/api/slots/route.ts`** — POST

**`app/api/settings/route.ts`** — PATCH

For each route, add `safeParse` at the top of the handler, before any DB operations. Return structured errors: `{ error: 'Validation failed', details: parsed.error.flatten() }` with status 400.

---

### Task 3.3 — Auto-Refresh on Bookings Page

**What to build:** Automatically refresh the bookings list every 30 seconds so data stays current without a manual page reload.

**Files to modify:**

**`admin/admin/bookings/page.tsx`**

Add a polling interval to the existing booking fetch:
```typescript
// After the initial fetch useEffect, add:
useEffect(() => {
  const interval = setInterval(() => {
    fetchBookings(); // call your existing fetch function
  }, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [/* same deps as your fetch useEffect */]);
```

Also add a manual refresh button next to the "Add Booking" button:
- Icon: `RefreshCw` from lucide-react
- Shows a spinning animation while loading
- `title="Refresh bookings"`
- Same styling as the secondary outline button pattern

Also add a small "Last updated X seconds ago" text that updates every second using a separate `setInterval`.

**Acceptance criteria:**
- Page auto-refreshes every 30 seconds
- Manual refresh button works
- "Last updated" text is visible and accurate
- Refresh doesn't reset the current page or filters

---

### Task 3.4 — Audit Log Pagination

**What to build:** Wire up proper pagination to the Audit Log page (the API already supports `limit` and `skip` params — the UI just doesn't use them).

**Files to modify:**

**`admin/admin/audit/page.tsx`**

Add state:
```typescript
const [currentPage, setCurrentPage] = useState(1);
const PAGE_SIZE = 20;
```

Update the `fetchLogs` function to include:
```typescript
params.set('limit', String(PAGE_SIZE));
params.set('skip', String((currentPage - 1) * PAGE_SIZE));
```

The API response should include a `total` count — use it to calculate `totalPages`.

Add pagination UI below the table — match the exact same pagination pattern used in `admin/admin/finance/page.tsx` (chevron buttons + page numbers + "Showing X–Y of Z" text).

---
---

# PHASE 4 — Finance Dashboard Enhancement
## Priority: 🟡 Medium | Estimated: 1–2 days

---

### Task 4.1 — Finance Page Revenue Charts

**What to build:** Add a revenue trend chart to the Finance page showing daily revenue over the selected date range.

**Files to modify:**

**`admin/admin/finance/page.tsx`**

Add a `LineChart` from `recharts` (already installed) below the stat cards and above the Revenue by Nail Tech section.

Chart requirements:
- X-axis: dates in the selected range (formatted as "Jan 5", "Jan 6", etc.)
- Y-axis: revenue in ₱
- Two lines: "Total Invoice" (dark `#1a1a1a`) and "Paid Amount" (gray `#a3a3a3`)
- Tooltip showing: date, total, paid, tip for that day
- Responsive container (use `ResponsiveContainer` with `width="100%"` and `height={220}`)
- Wrapped in a `Card` with title "Revenue Trend"
- Only show if there are transactions in the filtered range

Derive chart data from `filteredTransactions` using `useMemo`:
```typescript
const chartData = useMemo(() => {
  // Group transactions by date
  // For each date, sum: total, paid, tip
  // Return array of { date: string, total: number, paid: number, tip: number }
}, [filteredTransactions]);
```

---

### Task 4.2 — Finance Summary Stats Enhancement

**What to build:** Add two new stat cards to the Finance page summary row.

**Files to modify:**

**`admin/admin/finance/page.tsx`**

Change the summary section from 3 cards to 5 cards in a responsive grid (`grid-cols-2 md:grid-cols-5`):

Existing cards (keep):
1. Today's Income
2. This Week's Income  
3. Pending Payments

New cards to add:
4. **Total Tips** — sum of `tipAmount` from filtered transactions with status `paid`
   - Icon: `bi-heart`
   - Subtext: "From paid appointments"
5. **Admin Commission** — sum of `(total × adminCommissionRate/100)` for paid transactions
   - Icon: `bi-percent`
   - Subtext: `${adminCommissionRate}% of total invoices`

Both new cards derive their values from `filteredTransactions` using `useMemo`.

---
---

# PHASE 5 — UX Polish
## Priority: 🟢 Low | Estimated: 1–2 days

---

### Task 5.1 — Squeeze Fee Visual Indicator

**What to build:** Show a visible "Squeeze" badge on bookings that have `slotType === 'with_squeeze_fee'` in the Bookings table and Booking Details modal.

**Files to modify:**

**`admin/admin/bookings/page.tsx`**
- In the desktop table row, after the time column, check if `booking.slotType === 'with_squeeze_fee'`
- If yes, show a small badge: `<span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">Squeeze</span>`

**`components/admin/bookings/BookingDetailsModal.tsx`**
- Show the same badge next to the appointment time in the modal header/details section

---

### Task 5.2 — Empty State Improvements

**What to build:** Replace the generic "No results found" empty states with contextual, helpful messages.

**Files to modify:** `bookings/page.tsx`, `finance/page.tsx`, `clients/page.tsx`, `calendar/page.tsx`

For each page, when there are no results:
- If filters are active: "No bookings match your current filters. Try adjusting the date range or clearing the search."
- If no filters and truly empty: "No bookings yet. Click '+ Add Booking' to get started."

Use a consistent layout:
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
  <div className="h-12 w-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
    <CalendarDays className="h-6 w-6 text-gray-300" />
  </div>
  <p className="text-sm font-medium text-gray-500">No bookings found</p>
  <p className="text-xs text-gray-400 max-w-[240px]">Try adjusting your filters or add a new booking</p>
</div>
```

---

### Task 5.3 — Booking Page Inline Status Update

**What to build:** Allow admins to click a status badge directly in the bookings table to quickly change status, without opening the full details modal.

**Files to modify:**

**`admin/admin/bookings/page.tsx`**

Make the status badge in the table row a clickable dropdown:
- On click, show a small popover/dropdown with available next statuses
- For `pending`: show [Confirm, Cancel]
- For `confirmed`: show [Complete, Cancel, No Show]
- Other statuses: no dropdown (badge is not clickable)
- On selection, PATCH the booking status via the existing API
- Show a loading spinner on the badge while the PATCH is in flight
- On success: refresh just that row (update local state), show `toast.success`

---
---

## 📋 Task Completion Tracker

Copy this checklist and check off tasks as they're completed:

```
PHASE 1 — Finance Improvements
[ ] 1.1 Admin Commission Rate in Settings
[ ] 1.2 Enhanced Finance CSV Export (9 columns)
[ ] 1.3 Month Quick-Filter for Finance

PHASE 2 — Google Sheets Integration
[ ] 2.1 Google Sheets Service File (lib/services/googleSheetsService.ts)
[ ] 2.2 Hook Sheets Sync into Booking API Routes
[ ] 2.3 Bulk Sync API Endpoint (/api/integrations/sheets/sync-all)
[ ] 2.4 Google Sheets Settings UI (Integrations Tab)

PHASE 3 — Code Quality & Security
[ ] 3.1 MongoDB Indexes (lib/db/ensureIndexes.ts)
[ ] 3.2 Zod Input Validation on 4 API routes
[ ] 3.3 Auto-Refresh on Bookings Page (30s polling)
[ ] 3.4 Audit Log Pagination

PHASE 4 — Finance Dashboard Enhancement
[ ] 4.1 Finance Page Revenue Chart (LineChart with recharts)
[ ] 4.2 Finance Summary — 2 new stat cards (Tips + Commission)

PHASE 5 — UX Polish
[ ] 5.1 Squeeze Fee Visual Badge
[ ] 5.2 Empty State Improvements (all pages)
[ ] 5.3 Inline Status Update from Bookings Table
```

---

## 🔧 Environment Variables Needed (Add to .env)

```bash
# Already configured (do not change):
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# New — required for Phase 2 (Google Sheets):
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Note: GOOGLE_SHEETS_SPREADSHEET_ID is stored in MongoDB Settings, not .env
```

---

## 💡 Cursor Tips

- **Start each session** by saying: *"Read the implementation plan file and implement [Phase X, Task X.X]"*
- **For Phase 2**, make sure `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are in your `.env` before asking Cursor to test the Sheets connection
- **Always test** each task in the browser before moving to the next
- **Phases are ordered by priority** — do not skip ahead unless Phase 1 is complete
- If Cursor asks about a model schema, refer it to the **Current MongoDB Models Reference** section above
