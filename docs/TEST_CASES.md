# End-to-end test cases — Glammed Nails admin & booking

Structured manual and API test cases for regression and release validation. Use the **Actual result** and **Pass/Fail** columns during execution runs.

---

## Scope

- Validate end-to-end booking lifecycle from customer submission through admin confirmation and payment tracking.
- Ensure role-based access control prevents unauthorized operations.
- Verify file upload integrity via Cloudinary.
- Confirm email notification delivery (Resend) where applicable.
- Validate API endpoints for correct response codes, input validation, and error handling.

---

## Test environment

| Item | Value |
|------|--------|
| OS / browser | Windows 10, Chrome (latest) or Edge |
| Back-end | Node.js 18+, Next.js 15, MongoDB Atlas |
| Auth | NextAuth.js ~4.24 |
| Storage | Cloudinary |
| Email | Resend API |

### Tools

| Use | Tool |
|-----|------|
| UI & network | Browser DevTools (Chrome / Edge) |
| API | Postman (see `docs/POSTMAN_BASIC_TESTING.md` and `docs/BasicTesting.postman_collection.json`) |
| Database | MongoDB Compass |
| Automated unit tests | Jest (where tests exist in repo) |

---

## Features covered

- User authentication (credentials + Google OAuth)
- Role-based access control (SUPER_ADMIN, ADMIN, STAFF; legacy MANAGER in DB only)
- Booking creation and lifecycle
- Slot management
- Customer (client) management
- Nail technician management
- File uploads (photos and payment proofs)
- Quotation and invoice generation
- Finance and commission calculations
- Admin settings
- Email notifications
- Audit logging
- Google Sheets integration (where enabled)

### Testing types

Functional, integration, unit (where implemented), security, boundary/validation.

---

## Test cases

### Authentication & access

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-001 | Admin login with valid credentials (email/password) | Admin account exists in DB; user is logged out | 1. Navigate to `/admin`<br>2. Enter valid email and password<br>3. Click Sign In | Email: `admin@glammednails.com`<br>Password: `Admin@1234` | User is redirected to `/admin/overview` (or main admin dashboard); session cookie is set | | |
| TC-002 | Admin login with invalid password | Admin account exists; user is logged out | 1. Navigate to `/admin`<br>2. Enter valid email and wrong password<br>3. Click Sign In | Email: `admin@glammednails.com`<br>Password: `wrongpassword` | Error indicates invalid credentials; no session created | | |
| TC-003 | Rate limiting on login — repeated failed attempts | User is logged out; rate limit not yet triggered for identifier | 1. Attempt login with wrong password repeatedly in under **60 seconds** using same **email** | Email: `admin@glammednails.com`<br>Password: `badpass` (repeat) | After **5 failed** credential checks for that email within the window, further sign-in attempts for that email are blocked until the window resets | | |
| TC-004 | Google OAuth login with pre-approved email | Google OAuth configured; email exists as active user in DB | 1. Click Sign in with Google<br>2. Authenticate with approved Google account | Google account matches whitelisted / pre-created user | User signed in and redirected to admin dashboard; role from DB applied | | |
| TC-005 | Google OAuth login with non-whitelisted email | Google OAuth configured; email is **not** in DB | 1. Click Sign in with Google<br>2. Authenticate with non-approved Google account | e.g. `random@gmail.com` (not in DB) | Sign-in rejected; user sees error / access denied | | |
| TC-006 | Password reset flow (forgot password) | Admin account exists with valid email; mail provider configured | 1. Navigate to `/admin/forgot-password`<br>2. Enter registered email<br>3. Submit<br>4. Open email and follow reset link<br>5. Set new password on reset page | Email: `admin@glammednails.com`<br>New password: `NewPass@5678` | Reset email received; password updated; user can log in with new password | | |

**Tester note (TC-003):** Implementation uses in-memory rate limit per email (5 failed attempts per 60s window). The UI may show a generic credentials error rather than HTTP 429; confirm behavior in Network tab and `lib/auth-options.ts`.

---

### Role-based access control

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-007 | STAFF role cannot access settings | STAFF user logged in | 1. Log in as STAFF<br>2. Navigate to `/admin/settings` | Role: STAFF | Access denied (403 or redirect); settings UI not shown | | |
| TC-008 | SUPER_ADMIN can manage users | SUPER_ADMIN logged in | 1. Navigate to `/admin/staff`<br>2. Create new ADMIN user<br>3. Save | Name: Test Admin<br>Email: `testadmin@salon.com`<br>Role: ADMIN<br>Password: `Test@9999` | New user created; visible in staff list | | |
| TC-029 | STAFF user scoped to assigned nail tech only | STAFF assigned to one nail tech; bookings exist for multiple techs | 1. Log in as STAFF<br>2. Navigate to `/admin/bookings` | Assigned nail tech: e.g. Ms. Jhen | Only that tech’s bookings visible | | |

---

### Booking lifecycle (customer & admin)

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-009 | Customer booking — slot selection and submission | Slots available; booking page reachable | 1. `/booking`<br>2. Select service<br>3. Date/time<br>4. Nail tech<br>5. Customer details<br>6. Submit | Service: e.g. Manicure + Pedicure<br>Date/time: next available<br>Customer: Jane Doe, `jane@example.com`, `09171234567` | Booking created `pending`; confirmation UX; slot held / pending as per product rules | | |
| TC-010 | Admin confirms pending booking | Pending booking exists; admin logged in | 1. `/admin/bookings`<br>2. Open pending booking<br>3. Confirm | Booking code: e.g. `GN-20260329001` | Status `confirmed`; confirmation email to client (if Resend enabled) | | |
| TC-011 | Admin marks booking completed | Confirmed booking; admin logged in | 1. Open booking<br>2. Mark complete<br>3. Confirm if prompted | Booking code: e.g. `GN-20260329001` | Status `completed`; `completedAt` set; customer aggregates updated if implemented | | |
| TC-012 | Admin marks no-show | Confirmed booking; admin logged in | 1. Open booking<br>2. Mark no-show | Booking code: e.g. `GN-20260329001` | Status `no_show`; slot freed per business rules | | |
| TC-013 | Admin cancels booking | Booking `pending` or `confirmed`; admin logged in | 1. Open booking<br>2. Cancel<br>3. Enter reason | Reason: Client requested cancellation | Status `cancelled`; slot available again | | |
| TC-014 | Duplicate slot booking prevention | Slot already `pending`/`confirmed` | 1. Attempt second booking for same slot (UI or `POST /api/bookings`) | Known busy slot ID | Rejected (e.g. 409); no double booking | | |
| TC-037 | Admin reschedules booking | Confirmed booking; new available slot | 1. Open booking<br>2. Reschedule<br>3. Pick new slot<br>4. Confirm | New slot: e.g. 2026-04-05 10:00 | Booking on new slot; old slot released; client notified if configured | | |
| TC-038 | Booking page shows only bookable slots | Mix of available / blocked / taken | 1. `/booking`<br>2. Pick date<br>3. List times | Date with mixed statuses | Only selectable available slots; blocked/taken hidden or disabled | | |

---

### Slots & scheduling

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-015 | Admin creates slots (bulk) | Admin logged in; nail tech exists | 1. Slot management<br>2. Select tech<br>3. Multiple dates/times<br>4. Create | Tech: Ms. Jhen<br>Dates: 2026-04-01, 2026-04-02<br>Times: 09:00, 10:00, 11:00 | Six `available` slots (2×3) | | |
| TC-016 | Admin blocks slot | `available` slot exists | 1. Find slot<br>2. Set blocked<br>3. Save | e.g. 2026-04-01 10:00 | Status `blocked`; not offered on customer booking | | |

---

### Uploads (payment proof & photos)

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-017 | Client uploads payment proof via token link | Booking exists; valid upload token URL | 1. Open token URL<br>2. Upload screenshot | `gcash_proof.jpg` ~1.5MB JPEG | Stored (e.g. Cloudinary); booking payment fields updated | | |
| TC-018 | Payment proof upload — expired token | Token past validity (e.g. 14 days) | 1. Call upload API or page with expired token | Expired token | 401 / rejected; no storage | | |
| TC-019 | Client uploads inspiration / current photos | Valid 14-day token on photo upload flow | 1. `/booking/upload-photos?token=…`<br>2. Upload both photo types | `inspo.jpg`, `current.jpg` | Cloudinary URLs on booking `clientPhotos` (or equivalent) | | |
| TC-020 | Photo upload over size limit | Valid token; page loads | 1. Upload file **>10MB** | e.g. 15MB JPG | Validation error; no persist | | |

---

### Customers, nail techs, quotes, finance

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-021 | Admin creates customer | Admin logged in | 1. `/admin/clients`<br>2. Add client<br>3. Save | Maria Santos, `09181234567`, `maria@example.com`, type NEW | Row in list with correct fields | | |
| TC-022 | Admin searches customer | Customers in DB | 1. `/admin/clients`<br>2. Search by phone | `09181234567` | Correct row(s) returned | | |
| TC-023 | Admin creates nail tech | SUPER_ADMIN or ADMIN | 1. `/admin/nail-techs`<br>2. Add<br>3. Save | Name: Ana Reyes; role; availability; commission 30%; days Mon/Wed/Fri | Profile in list | | |
| TC-024 | Admin updates nail tech commission | Tech exists; ADMIN+ | 1. Edit tech<br>2. Commission 35%<br>3. Save | 35% | Persisted; finance uses new rate for new calculations | | |
| TC-025 | Admin creates quotation | ADMIN+ | 1. `/admin/quotation`<br>2. New<br>3. Lines + discount<br>4. Save | Customer Jane Doe; line items; 10% off | Quotation ID (e.g. `QN-YYYYMMDD###`); math correct (e.g. ₱720 on example) | | |
| TC-026 | Generate invoice from booking | Booking confirmed or completed | 1. Open booking<br>2. Generate invoice | Booking code e.g. `GN-20260329001` | Invoice UI: totals, deposit, balance, discount, tip, commission as designed | | |
| TC-027 | Finance commission correctness | Completed bookings; tech rates set | 1. `/admin/finance`<br>2. Date range incl. completions | e.g. 2026-03-01 — 2026-03-31 | Per-booking commission / admin / net matches rules | | |

---

### Settings, audit, email, integrations, API

| ID | Title | Precondition | Steps | Test data | Expected result | Actual result | Pass/Fail |
|----|--------|--------------|-------|-----------|----------------|---------------|-----------|
| TC-028 | Admin updates global settings | SUPER_ADMIN | 1. `/admin/settings`<br>2. Change reservation fee e.g. ₱500<br>3. Toggle email notifications<br>4. Save | As entered | Settings persist; booking UI reflects fee; toggles honored where wired | | |
| TC-030 | Audit log records action | ADMIN performs action; SUPER_ADMIN views log | 1. Confirm a booking<br>2. `/admin/audit` as SUPER_ADMIN | e.g. confirm booking | Entry: user, action, resource, IP, time | | |
| TC-031 | Email on booking confirmation | Pending booking; mail configured | 1. Admin confirms booking | Code + customer email | Resend delivers email with booking context / payment info as implemented | | |
| TC-032 | Appointment reminder (cron sweep) | Booking `pending` or `confirmed`; customer email; `RESEND_API_KEY` set; appointment in reminder window | 1. `GET /api/cron/notifications` with `x-cron-secret: <CRON_SECRET>` if env set<br>2. Or external scheduler hitting same endpoint on a **frequent** schedule (see note) | Booking whose first slot is ~24h (and ~2h) before send window | Reminder email(s) sent; `NotificationLog` (or equivalent) records `appt_24h` / `appt_2h` | | |
| TC-033 | Google Sheets sync | SUPER_ADMIN; Sheets integration enabled | Trigger sync from UI or `POST /api/integrations/sheets/sync-all` (if that is the live route) | Sheet ID in settings | Rows updated; no hard error | | |
| TC-034 | Booking creation invalid slot ID | Valid nail tech | `POST /api/bookings` with bogus `slotIds` | `slotIds: ['invalid-id-000']` + valid `nailTechId` | 400/404; no booking | | |
| TC-035 | Booking creation missing required fields | API client | `POST /api/bookings` omitting required fields e.g. empty `slotIds` | `slotIds: []` | 400 validation error with clear body | | |
| TC-036 | Unique booking code under concurrency | Two near-simultaneous submissions same day | Fire 2+ parallel `POST /api/bookings` | Same date / flow | Distinct `GN-…` codes; no duplicate key errors | | |

**Tester note (TC-032):** The notification sweep uses a **short time window** around “exactly 24h / 2h before” the slot. Cron must run **often** (e.g. every ~15–20 minutes) or the reminder can be missed. Confirm `vercel.json` / dashboard crons include this route if production relies on Vercel scheduled jobs.

---

## Traceability (summary)

| Area | Cases |
|------|--------|
| Auth | TC-001 — TC-006 |
| RBAC | TC-007, TC-008, TC-029 |
| Bookings | TC-009 — TC-014, TC-037, TC-038 |
| Slots | TC-015, TC-016 |
| Uploads | TC-017 — TC-020 |
| CRM / techs / money | TC-021 — TC-027 |
| Settings / compliance / comms | TC-028 — TC-033 |
| API hardening | TC-034 — TC-036 |

---

## Revision history

| Date | Author | Notes |
|------|--------|-------|
| 2026-03-30 | — | Initial document from master case list; TC-032 aligned to `GET /api/cron/notifications`; TC-003 note on rate-limit UX |
