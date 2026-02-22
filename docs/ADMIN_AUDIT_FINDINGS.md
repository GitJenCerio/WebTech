# WebTech Admin — Full Audit Findings Table

## Document 1 — AUDIT FINDINGS TABLE

| # | File | Issue | Category | Breakpoint(s) | Severity |
|---|------|-------|----------|---------------|----------|
| 1 | `app/admin/bookings/page.tsx` L265 | `window.prompt()` for cancel/reschedule/no_show reason | Broken | all | Critical |
| 2 | `app/admin/bookings/page.tsx` L269 | `alert('Reason is required.')` | Broken | all | Critical |
| 3 | `app/admin/bookings/page.tsx` L328 | `alert()` on booking action error | Broken | all | Critical |
| 4 | `app/admin/bookings/page.tsx` L379 | `alert()` on verify payment proof error | Broken | all | Critical |
| 5 | `app/admin/bookings/page.tsx` L406 | `alert()` on save notes error | Broken | all | Critical |
| 6 | `app/admin/bookings/page.tsx` L519 | `alert()` on invoice save success | Broken | all | Critical |
| 7 | `app/admin/bookings/page.tsx` L248 | `window.location.href` for View Client — should use `router.push()` | Broken | all | High |
| 8 | `app/admin/calendar/page.tsx` L484 | `window.location.href` for View Client | Broken | all | High |
| 9 | `app/admin/calendar/page.tsx` L501-532 | `window.prompt()` + `alert()` for booking actions | Broken | all | Critical |
| 10 | `app/admin/calendar/page.tsx` L583, 610, 786 | `alert()` for errors and invoice success | Broken | all | Critical |
| 11 | `app/admin/clients/page.tsx` L255 | Edit button `onClick={() => {}}` — empty stub, no handler | Broken | all | Critical |
| 12 | `app/admin/clients/page.tsx` L257 | `window.location.href` for Bookings button | Broken | all | High |
| 13 | `app/admin/clients/page.tsx` | Add Note action missing (was in original ActionDropdown) | Missing Feature | all | Medium |
| 14 | `app/admin/nail-techs/page.tsx` L119-125 | `window.location.href` for View Slots / View Bookings | Broken | all | High |
| 15 | `app/admin/nail-techs/page.tsx` L225 | `confirm()` for delete — should be Dialog | Broken | all | Critical |
| 16 | `app/admin/nail-techs/page.tsx` L193, 202 | `setError()` on save/status/delete — no user feedback beyond inline error | UX | all | Medium |
| 17 | `app/admin/quotation/page.tsx` L108-164, 185-202, 272, 298 | Multiple `alert()` and `confirm()` | Broken | all | Critical |
| 18 | `app/admin/quotation/page.tsx` L137 | `confirm()` in handleDeleteQuotation | Broken | all | Critical |
| 19 | `app/admin/page.tsx` L49, 75 | `window.location.href` after login (acceptable for auth redirect) | UX | all | Low |
| 20 | `app/admin/bookings/page.tsx` | Does NOT read `customerId` or `techId` from URL — Bookings/View Slots links broken | Broken | all | Critical |
| 21 | `app/admin/settings/page.tsx` | Entire page is stub "Settings coming soon..." | Missing Feature | all | High |
| 22 | `app/admin/overview/page.tsx` | Mock data only — no live API for todayBookings, Available Slots, Completed Today, Estimated Income | Missing Feature | all | High |
| 23 | `app/admin/overview/page.tsx` | ChartPlaceholder for Weekly Appointments and Slot Utilization — not real charts | Missing Feature | all | High |
| 24 | `app/admin/overview/page.tsx` | No date range selector | Missing Feature | all | Medium |
| 25 | `app/admin/bookings/page.tsx` | No manual "Add Booking" button | Missing Feature | all | High |
| 26 | `app/admin/bookings/page.tsx` | No bulk actions (export, status update) | Missing Feature | all | Medium |
| 27 | `app/admin/clients/page.tsx` | No Add Client button; no Edit Client modal/form | Missing Feature | all | High |
| 28 | `app/admin/clients/page.tsx` | No inline booking history per client | Missing Feature | all | Medium |
| 29 | `app/admin/clients/page.tsx` | Client deactivation not implemented | Missing Feature | all | Medium |
| 30 | `app/admin/staff/page.tsx` | Staff table has only Edit — no Reset Password, no Enable/Disable inline buttons | Missing Feature | all | High |
| 31 | `app/admin/staff/page.tsx` | EditUserModal has status — Enable/Disable is via Edit modal, not inline | UX | all | Medium |
| 32 | `app/admin/finance/page.tsx` | No CSV/PDF export | Missing Feature | all | Medium |
| 33 | `app/admin/finance/page.tsx` | No revenue breakdown by nail tech | Missing Feature | all | Medium |
| 34 | `app/admin/finance/page.tsx` | No income trend chart | Missing Feature | all | Medium |
| 35 | `app/admin/finance/page.tsx` | Finance table has no Actions column — no View booking | Missing Feature | all | Low |
| 36 | `app/admin/calendar/page.tsx` | Can view all nail techs via filter — week view option missing | Missing Feature | all | Medium |
| 37 | `app/admin/calendar/page.tsx` | Hidden/blocked slots not visually distinct | Missing Feature | all | Low |
| 38 | `app/admin/quotation/page.tsx` | Cannot email quotation to client | Missing Feature | all | Medium |
| 39 | `app/admin/quotation/page.tsx` | Cannot link quotation to booking | Missing Feature | all | Medium |
| 40 | `app/admin/quotation/page.tsx` | Download is PNG/JPEG only — no PDF | Missing Feature | all | Medium |
| 41 | `app/admin/quotation/page.tsx` | Cannot update quotation status from saved list | Missing Feature | all | Low |
| 42 | Global | No toast/notification system — all messages via `alert()` | Missing Feature | all | Critical |
| 43 | Global | No global search | Missing Feature | all | Low |
| 44 | Global | No loading skeletons — spinner/text only | Missing Feature | all | Medium |
| 45 | Global | No role-based UI differentiation (admin vs staff) beyond useUserRole | Missing Feature | all | Low |
| 46 | Global | No breadcrumb navigation | Missing Feature | all | Low |
| 47 | `app/admin/dashboard/page.tsx` | Uses Bootstrap `d-flex`, `spinner-border`, `text-muted`, `visually-hidden` | UX | all | Medium |
| 48 | `app/admin/overview/page.tsx` | Uses DataTable (not unified inline pattern) | UX | all | Medium |
| 49 | `app/admin/overview/page.tsx` L115 | Typo/encoding: `â‚±12,500` instead of `₱12,500` | UX | all | Low |
| 50 | `app/admin/nail-techs/page.tsx` | Bootstrap modal pattern `modal fade show d-block`, `modal-dialog`, `form-control`, `form-select`, `row`, `col-md-6`, `fw-medium`, `text-muted`, `d-flex`, `mb-3` | UX | all | High |
| 51 | `app/admin/nail-techs/page.tsx` | Inline `style={{ }}` for colors (#212529, #495057, #6c757d, #e0e0e0), borderRadius, padding | UX | all | Medium |
| 52 | `app/admin/calendar/page.tsx` | Bootstrap: `d-flex`, `row`, `col-12`, `col-lg-8`, `alert`, `spinner-border`, `card`, `text-muted`, `visually-hidden`, `position-fixed`, `fs-5` | UX | all | High |
| 53 | `app/admin/calendar/page.tsx` | Inline `style={{ }}` for layout, zIndex, colors | UX | all | Medium |
| 54 | `app/admin/quotation/page.tsx` | Bootstrap: `container-fluid`, `d-flex`, `btn`, `card`, `table`, `form-control`, `form-label`, `fw-medium`, `text-muted`, `spinner-border` | UX | all | High |
| 55 | `app/admin/quotation/page.tsx` | Inline `style={{ }}` for colors (#212529, #495057, #6c757d, #000000, #e0e0e0) | UX | all | Medium |
| 56 | `app/admin/bookings/page.tsx`, `calendar/page.tsx` | Duplicate: `cleanCurrencyValue`, `normalizeServiceName`, `findPricingRow`, `getUnitPriceForService`, nail tech fetch, invoice logic | Duplication | all | High |
| 57 | `components/admin/DataTable.tsx` | Used only by overview page — other pages use inline table | Duplication | all | Low |
| 58 | `components/admin/FilterBar.tsx`, `Pagination.tsx` | No longer used — all table pages use inline pattern | Dead Code | all | Low |
| 59 | `components/admin/ActionDropdown.tsx` | No longer used — replaced with inline buttons | Dead Code | all | Low |
| 60 | `app/admin/bookings/page.tsx` L36 | `useUserRole()` imported but `userRole` never used | Dead Code | all | Low |
| 61 | `app/admin/bookings/page.tsx`, etc. | Reservation fee hardcoded 500 in bookings, calendar, InvoiceModal, EditSlotModal | UX | all | Medium |
| 62 | `app/admin/quotation/page.tsx` L496-507 | Terms & conditions hardcoded | UX | all | Low |
| 63 | All table pages | No mobile card view — tables scroll horizontally on xs/sm | Responsiveness | xs, sm | Critical |
| 64 | All filter pages | Filter bar uses `flex-wrap` — may overflow on xs; no `flex-col sm:flex-row` | Responsiveness | xs | High |
| 65 | All pages | Page headers not responsive — no `flex-col sm:flex-row`, CTA not `w-full sm:w-auto` | Responsiveness | xs | High |
| 66 | All pages | No `p-4 sm:p-5 md:p-6` or `max-w-screen-xl mx-auto` on page wrapper | Spacing | all | Medium |
| 67 | `app/admin/admin.css` | Mobile sidebar uses `transform: translateX(-100%)` — overlay exists; hamburger visible | Responsiveness | xs, sm | — |
| 68 | `app/admin/admin.css` L354 | `min-width: 600px` on data-table — forces horizontal scroll on mobile | Responsiveness | xs, sm | Critical |
| 69 | `components/admin/bookings/BookingDetailsModal.tsx` | `DialogContent` no bottom-sheet pattern on mobile | Responsiveness | xs | High |
| 70 | `components/admin/bookings/InvoiceModal.tsx` | No bottom-sheet on mobile | Responsiveness | xs | High |
| 71 | `app/admin/nail-techs/page.tsx` | Bootstrap modal — not responsive bottom-sheet | Responsiveness | xs | High |
| 72 | Pagination (all table pages) | Page number buttons may overflow on xs; no `current/total` mobile pattern | Responsiveness | xs | Medium |
| 73 | `app/admin/calendar/page.tsx` | Slot list + calendar side-by-side on lg — may not stack on xs/sm | Responsiveness | xs, sm | High |
| 74 | `app/admin/calendar/page.tsx` | `calendar-day` min-height 78-82px — may be small on xs | Responsiveness | xs | Medium |
| 75 | `app/admin/quotation/page.tsx` | Add Services + Preview side-by-side — may not stack on mobile | Responsiveness | xs, sm | High |
| 76 | `app/admin/quotation/page.tsx` | Saved quotations table — horizontal scroll on mobile | Responsiveness | xs, sm | High |
| 77 | `app/admin/overview/page.tsx` | KPI grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — correct | Responsiveness | — | — |
| 78 | `app/admin/finance/page.tsx` | Stat cards `grid-cols-1 md:grid-cols-3` | Responsiveness | — | — |
| 79 | `components/admin/EditSlotModal.tsx` L88 | `confirm()` for delete slot | Broken | all | Critical |
| 80 | `components/admin/AddUserModal.tsx` | Uses Dialog, no `alert` — OK | — | — | — |
| 81 | `components/admin/EditUserModal.tsx` | Has status (Enable/Disable via Edit) — no Reset Password | Missing Feature | all | High |
