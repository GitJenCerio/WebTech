# WebTech Admin — Implementation Plan

## PHASE 1 — CRITICAL FIXES (broken right now)

| # | Task | What | Where | Why | Effort | Depends |
|---|------|------|-------|-----|--------|---------|
| 1.1 | Replace alert/prompt/confirm with toast + Dialog | Install `sonner`, add `<Toaster />` to root layout. Create `ReasonInputDialog` for cancel/reschedule/no_show. Replace all `alert()`, `window.prompt()`, `window.confirm()` with `toast.success()`, `toast.error()`, or `<Dialog>`. | `app/layout.tsx`, `app/admin/bookings/page.tsx`, `app/admin/calendar/page.tsx`, `app/admin/quotation/page.tsx`, `app/admin/nail-techs/page.tsx`, `components/admin/bookings/EditSlotModal.tsx`, new `components/admin/ReasonInputDialog.tsx` | Eliminates poor UX and browser-native dialogs | L | — |
| 1.2 | Wire Clients Edit button | Replace `onClick={() => {}}` with `openEditClientModal(item)`. Add EditClientModal or extend client Dialog with edit mode. Wire PATCH `/api/customers/:id`. | `app/admin/clients/page.tsx` | Edit action is completely non-functional | M | — |
| 1.3 | Fix Bookings URL params | Read `customerId` and `nailTechId` from `useSearchParams()`. Pass to fetch `/api/bookings?customerId=…` or `?nailTechId=…`. | `app/admin/bookings/page.tsx` | View Bookings from Clients, View Slots from Nail Techs currently do nothing | S | — |
| 1.4 | Replace window.location.href with router.push | Use `useRouter()` and `router.push()` for all internal nav: View Client, Bookings, View Slots. Keep login redirect as-is (auth flow). | `app/admin/bookings/page.tsx`, `app/admin/calendar/page.tsx`, `app/admin/clients/page.tsx`, `app/admin/nail-techs/page.tsx` | Client-side navigation, no full reload | S | — |

**Phase 1 Total: ~2.5 days**

---

## PHASE 2 — RESPONSIVENESS (one dedicated pass)

| # | Task | What | Where | Why | Effort | Depends |
|---|------|------|-------|-----|--------|---------|
| 2.1 | Sidebar mobile collapse | Verify hamburger always visible on xs/sm, backdrop closes on tap, z-index correct. AdminLayout already has overlay. | `components/admin/AdminLayout.tsx`, `app/admin/admin.css` | Ensure mobile nav works | S | — |
| 2.2 | Page headers responsive | Apply pattern: `flex-col sm:flex-row`, CTA `w-full sm:w-auto`, min 44px touch targets. | All admin pages | Mobile-friendly headers | M | — |
| 2.3 | KPI stat card grids | Ensure `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (or 3 for finance), `gap-4`. | `app/admin/overview/page.tsx`, `app/admin/finance/page.tsx` | Consistent card layout | S | — |
| 2.4 | Tables → mobile card view | Dual render: `hidden sm:block` desktop table + `sm:hidden` mobile card list. One card per row with primary info, body rows, action buttons. | Bookings, Clients, Nail Techs, Staff, Finance, Quotation saved list | Tables must NOT scroll horizontally on mobile | XL | — |
| 2.5 | Filter bar responsive | `flex-col sm:flex-row sm:flex-wrap`, inputs `w-full sm:w-auto`, native date inputs. | All filter pages | Mobile-friendly filters | M | — |
| 2.6 | Modals → bottom sheet on mobile | Apply responsive Dialog pattern: bottom sheet on xs, centered on sm+. Drag handle, scrollable body, sticky footer. | BookingDetailsModal, InvoiceModal, nail tech modal, client modal, AddUserModal, EditUserModal | Modals usable on small screens | L | — |
| 2.7 | Spacing & padding | `p-4 sm:p-5 md:p-6` on page wrapper, `space-y-4 sm:space-y-6`, `max-w-screen-xl mx-auto`, `pb-6` on last element. | All pages | Consistent spacing | M | — |
| 2.8 | Pagination mobile | Show `current / total` on mobile, Prev/Next chevrons. | All table pages | Pagination fits on mobile | S | — |
| 2.9 | Calendar mobile | Stack slot list below calendar on xs/sm. Ensure day cells min 40px. | `app/admin/calendar/page.tsx`, `components/admin/bookings/CalendarPanel.tsx`, `components/admin/bookings/SlotList.tsx` | Calendar usable on mobile | M | — |
| 2.10 | Quotation mobile | Stack Add Services above preview on mobile. Download buttons full-width. Saved list as cards. | `app/admin/quotation/page.tsx` | Quotation usable on mobile | M | — |
| 2.11 | Remove data-table min-width | Remove or reduce `min-width: 600px` on `.data-table-card .table` to avoid forced scroll before dual-render. | `app/admin/admin.css` | Prep for mobile cards | S | — |

**Phase 2 Total: ~4 days**

---

## PHASE 3 — CONSISTENCY & CLEANUP

| # | Task | What | Where | Why | Effort | Depends |
|---|------|------|-------|-----|--------|---------|
| 3.1 | Extract shared utilities | Move `cleanCurrencyValue`, `normalizeServiceName`, `getUnitPriceForService` to `/lib/utils/`. Create `useNailTechs()`, `useInvoice()` hooks. | `lib/utils/`, `lib/hooks/`, `app/admin/bookings/page.tsx`, `app/admin/calendar/page.tsx` | Eliminate duplication | M | — |
| 3.2 | Replace Bootstrap modal (nail techs) | Convert nail tech Add/Edit/View modal to shadcn `<Dialog>`. | `app/admin/nail-techs/page.tsx` | Consistent modal pattern | M | — |
| 3.3 | Replace Bootstrap forms | Replace `form-control`, `form-select` with shadcn `<Input>`, `<Select>` in nail-techs, quotation. | `app/admin/nail-techs/page.tsx`, `app/admin/quotation/page.tsx` | Consistent form components | M | — |
| 3.4 | Replace Bootstrap layout (calendar, quotation, dashboard) | Replace `row`, `col-*`, `d-flex`, `mb-4` with Tailwind. | `app/admin/calendar/page.tsx`, `app/admin/quotation/page.tsx`, `app/admin/dashboard/page.tsx` | Single design system | M | — |
| 3.5 | Overview page unified table | Replace DataTable with inline table pattern (or add mobile cards). | `app/admin/overview/page.tsx` | Consistency with other pages | S | 2.4 |
| 3.6 | Fix overview currency typo | Replace `â‚±12,500` with `₱12,500`. | `app/admin/overview/page.tsx` | Display bug | S | — |
| 3.7 | Remove dead code | Remove or deprecate DataTable, FilterBar, Pagination if unused. Remove unused `useUserRole` from bookings. | `app/admin/bookings/page.tsx`, components | Cleanup | S | — |

**Phase 3 Total: ~2 days**

---

## PHASE 4 — MISSING CORE FEATURES

| # | Task | What | Where | Why | Effort | Depends |
|---|------|------|-------|-----|--------|---------|
| 4.1 | Manual Add Booking | Add "Add Booking" button, Dialog form, POST `/api/bookings`. | `app/admin/bookings/page.tsx` | Core admin workflow | L | 1.1 |
| 4.2 | Edit Client | Wire Edit, Dialog form, PATCH `/api/customers/:id`. VIP tagging included (isVIP checkbox in edit form, badge in table). | `app/admin/clients/page.tsx` | Core client management | M | 1.2 |
| 4.3 | Add Client | Add "Add Client" button, Dialog form, POST `/api/customers`. | `app/admin/clients/page.tsx` | Manual client creation | M | — |
| 4.4 | Staff Enable/Disable | Add inline Enable/Disable button or ensure Edit modal status works. EditUserModal already has status. | `app/admin/staff/page.tsx` | Quick status toggle | S | — |
| 4.5 | Staff Reset Password | Add Reset Password Dialog, POST `/api/users/:id/reset-password` (or equivalent). | `app/admin/staff/page.tsx`, `components/admin/EditUserModal.tsx` or new component | Password reset for staff | M | — |
| 4.6 | Finance CSV Export | Export button, client-side CSV from filtered transactions. | `app/admin/finance/page.tsx` | Financial reporting | M | — |
| 4.7 | Overview live data | Fetch today's appointments, slots, income from API. Replace mock data. | `app/admin/overview/page.tsx` | Real dashboard | M | — |
| 4.8 | Overview charts | Replace ChartPlaceholder with recharts (bar + pie) using live data. | `app/admin/overview/page.tsx` | Visual analytics | L | 4.7 |

**Phase 4 Total: ~3 days**

---

## PHASE 5 — ENHANCEMENTS

| # | Task | What | Where | Why | Effort | Depends |
|---|------|------|-------|-----|--------|---------|
| 5.1 | Loading skeletons | Replace spinner/text with `<Skeleton>` on tables and cards. | All table pages, overview | Better loading UX | M | — |
| 5.2 | Settings page | Tabs: General (reservation fee, business name), Services, Notifications, Team. | `app/admin/settings/page.tsx` | Configurable settings | L | — |
| 5.3 | Quotation PDF | Replace html2canvas PNG with jsPDF for proper PDF download. | `app/admin/quotation/page.tsx` | Professional quotation output | M | — |
| 5.4 | Quotation status | Update status (Draft → Sent → Accepted/Expired) from saved list. | `app/admin/quotation/page.tsx` | Quotation workflow | S | — |
| 5.5 | Finance revenue by nail tech | Grouped breakdown section. | `app/admin/finance/page.tsx` | Analytics | M | — |
| 5.6 | Bookings bulk actions | Checkbox column, bulk export CSV, bulk status update. | `app/admin/bookings/page.tsx` | Efficiency | L | — |
| 5.7 | Calendar week view | Month / Week toggle. | `app/admin/calendar/page.tsx` | Alternative view | M | — |
| 5.8 | Audit log page | `/admin/audit`, read from `/api/audit-log`. | New page, API | Compliance / tracking | L | — |

**Phase 5 Total: ~4 days**

---

## Summary by Phase

| Phase | Focus | Total Effort |
|-------|-------|--------------|
| 1 | Critical Fixes | ~2.5 days |
| 2 | Responsiveness | ~4 days |
| 3 | Consistency & Cleanup | ~2 days |
| 4 | Missing Core Features | ~3 days |
| 5 | Enhancements | ~4 days |
| **Total** | | **~15.5 days** |
