# WebTech Admin — Quick Wins List

Things fixable in under 30 minutes each. Sorted by effort (fastest first).

```
[ ] app/admin/overview/page.tsx — Fix currency typo â‚±12,500 → ₱12,500 — 2 min
[ ] app/admin/bookings/page.tsx — Remove unused useUserRole import and variable — 3 min
[ ] app/admin/layout.tsx — Add p-4 sm:p-6 to admin-content wrapper (if missing) — 3 min
[ ] app/admin/overview/page.tsx — Add p-4 sm:p-6 to page wrapper div — 5 min
[ ] app/admin/settings/page.tsx — Add subtitle under "Settings" to match other pages — 5 min
[ ] app/admin/clients/page.tsx — Replace window.location.href with router.push for Bookings button — 5 min
[ ] app/admin/nail-techs/page.tsx — Replace window.location.href with router.push for Slots button (both handlers) — 5 min
[ ] app/admin/bookings/page.tsx — Replace window.location.href with router.push for View Client — 5 min
[ ] app/admin/calendar/page.tsx — Replace window.location.href with router.push for View Client — 5 min
[ ] app/admin/bookings/page.tsx — Read customerId from useSearchParams, pass to API — 10 min
[ ] app/admin/bookings/page.tsx — Read techId (nailTechId) from useSearchParams, pass to API — 10 min
[ ] app/admin/clients/page.tsx — Wire Edit onClick to open edit modal (stub handler that shows "Edit coming soon" toast) — 10 min
[ ] app/admin/staff/page.tsx — Add Enable/Disable inline button that opens EditUserModal with status toggle — 15 min
[ ] app/admin/admin.css — Remove or reduce .data-table-card .table min-width: 600px — 5 min
[ ] app/admin/finance/page.tsx — Add max-w-screen-xl mx-auto to main wrapper — 5 min
[ ] app/admin/bookings/page.tsx — Add max-w-screen-xl mx-auto to main wrapper — 5 min
[ ] app/admin/clients/page.tsx — Add max-w-screen-xl mx-auto to main wrapper — 5 min
[ ] app/admin/nail-techs/page.tsx — Add max-w-screen-xl mx-auto to main wrapper — 5 min
[ ] app/admin/staff/page.tsx — Add max-w-screen-xl mx-auto to main wrapper — 5 min
[ ] All table pages — Add flex-col sm:flex-row to page header, w-full sm:w-auto to CTA — 15 min
[ ] app/admin/dashboard/page.tsx — Replace Bootstrap spinner with Tailwind Loader2 — 5 min
[ ] app/admin/overview/page.tsx — Add subtitle "Key metrics and today's appointments" — 3 min
[ ] components/admin/AdminLayout.tsx — Ensure sidebar toggle has min 44px touch target — 5 min
[ ] app/admin/bookings/page.tsx — Add space-y-4 sm:space-y-6 between sections — 5 min
[ ] Pagination — Add order-2 sm:order-1 to result count, order-1 sm:order-2 to buttons for mobile stacking — 5 min
```

**Total: 25 quick wins. Fastest 10 = ~45 min. All 25 ≈ 3–4 hours.**
