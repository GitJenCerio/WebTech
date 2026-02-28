# MO-IT149 Integration Plan — Gap Analysis

**Document Purpose:** Comprehensive comparison of your current WebTech implementation against the MO-IT149 Weeks 6–7 Integration Plan. Use this to decide what to implement and when.

**Reference:** `MO-IT149 - Web Technology Application _ Integration Plan _ S3101 _ Group 3 _ Cerio - Weeks 6-7 Plan.pdf`

---

## Executive Summary

| Area | Plan Status | Current Status | Priority |
|------|-------------|----------------|----------|
| File Storage | Planned | Partially Implemented | Medium |
| Authentication | Planned enhancements | Basic + Google OAuth done | Low–Medium |
| Middleware | Required | **Not implemented** | **High** |
| RBAC (4 roles) | Required | 2 roles only | Medium |
| API Security | Required | **Gaps in protected routes** | **High** |
| Reports API | Required | **Not implemented** | Medium |
| Admin Jobs API | Required | Not implemented | Low |

---

## 1. File Storage & Retrieval

### What the Plan Specifies

- Cloudinary for payment proofs, nail inspiration, and current-state photos
- Admin: payment proofs (JPEG, PNG, WebP; max 5MB)
- Client: inspiration + current state (JPEG, PNG, WebP, **HEIC**; max **10MB**)
- Folder structure: `payment_proofs/`, `nail_inspo/`, `nail_current/`
- Naming: `booking_{BOOKING_NUMBER}_proof.jpg`, etc.
- Retention: payment proofs indefinite; client photos auto-delete 30 days after completion

### What You Have

| Feature | Status | Notes |
|---------|--------|-------|
| Cloudinary integration | Done | `lib/cloudinary.ts` |
| Admin upload payment proof | Done | `POST /api/integrations/storage/upload-payment` |
| Admin delete image | Done | `POST /api/integrations/storage/delete` |
| Client signed upload URL | Done | `POST /api/integrations/storage/generate-signature` |
| Client add photo to booking | Done | `POST /api/bookings/[id]/photos` |
| Client remove photo | Done | `DELETE /api/bookings/[id]/photos` |
| File type validation | Partial | Admin: JPEG, PNG, WebP. Client: **No HEIC** |
| File size limits | Partial | Admin: 5MB. Client: **5MB** (plan says 10MB) |
| Thumbnail generation | Missing | Plan: 300×300 thumbnails for gallery |
| HEIC support | Missing | Plan: required for mobile cameras |
| Auto-delete client photos (30 days) | Missing | No cron/job for this |
| Naming convention | Partial | Uses folders, not exact `booking_GN-xxx_proof.jpg` |
| Rate limiting (10 signatures/hour) | Missing | No rate limiting on generate-signature |

### Critical Gaps — File Storage

1. **Admin upload and delete have no authentication**
   - Anyone can upload/delete payment proofs via these endpoints.
   - **Security risk:** Immediate fix recommended.

2. **Client photo routes lack auth / validation**
   - `POST /api/bookings/[id]/photos` and `DELETE` have no session/token check.
   - Client photos can be added/removed by anyone with a booking ID.
   - Plan expects signed upload flow; current route supports both multipart and JSON. Decide on a single flow and secure it.

3. **Client limits**
   - Max 10MB per image (plan); current 5MB.
   - HEIC support missing (plan requires it).

4. **Retention**
   - No job to delete client photos 30 days after booking completion.

---

## 2. User Authentication

### What the Plan Specifies

- Credentials (email/password) + Google OAuth
- JWT in HTTP-only cookies
- Token expiry: 24 hours (not 30 days)
- `lastLogin` tracking
- Account status via `isActive`
- Password flows: forgot-password, reset-password, change-password

### What You Have

| Feature | Status | Notes |
|---------|--------|-------|
| Credentials provider | Done | NextAuth.js |
| Google OAuth | Done | Pre-approved users only |
| bcrypt password hashing | Done | 10 salt rounds |
| JWT session | Done | `maxAge: 30 * 24 * 60 * 60` (30 days) |
| HTTP-only cookies | Partial | NextAuth default; not explicitly set |
| lastLogin | Missing | Not stored or updated |
| isActive vs status | Different | Plan: `isActive`. Current: `status: 'active' \| 'inactive'` |
| Role in JWT | Done | `role`, `assignedNailTechId` |
| isActive in JWT | Missing | Plan wants active-status checks |
| POST /api/auth/forgot-password | Missing | Not implemented |
| POST /api/auth/reset-password | Missing | Not implemented |
| POST /api/auth/change-password | Missing | Not implemented |
| GET /api/auth/me | Missing | Plan: current user details |
| PUT /api/auth/profile | Missing | Plan: update name, email |
| Rate limiting (5/min on login) | Missing | No rate limiting |

### Auth Gaps (Priority)

1. **Token lifetime:** Still 30 days; plan says 24 hours.
2. **Password management:** No forgot/reset/change flows.
3. **User model:** No `lastLogin`; uses `status` instead of `isActive`.
4. **Session endpoints:** No `/api/auth/me` or `/api/auth/profile`.

---

## 3. Middleware Validation

### What the Plan Specifies

- Root-level `middleware.ts`
- Protect all `/admin/*` and `/api/*` except auth and public routes
- Validate JWT, check expiry, check account status
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Rate limiting on login
- Centralized error handling for 401/403

### What You Have

| Feature | Status | Notes |
|---------|--------|-------|
| middleware.ts | Missing | No root-level middleware |
| Route protection | Per-route | Auth checked in each API handler via `getServerSession` |
| Coverage | Inconsistent | Some routes protected, others not |
| Security headers | Unknown | Not set in middleware |
| Rate limiting | Missing | None at middleware level |

### Middleware Gaps (High Priority)

1. **No `middleware.ts`** — All protection is manual and easy to miss.
2. **Unprotected routes:**
   - `POST /api/integrations/storage/upload-payment`
   - `POST /api/integrations/storage/delete`
   - `POST /api/integrations/storage/generate-signature` (plan: public for clients; consider booking validation)
   - `POST/DELETE /api/bookings/[id]/photos`
   - `GET/PATCH/DELETE /api/customers/[id]` — **fully unprotected**
   - `GET/POST /api/quotations`, `GET/PATCH/DELETE /api/quotations/[id]` — **no auth**
   - `GET /api/quotation/pricing`

---

## 4. Role-Based Access Control (RBAC)

### What the Plan Specifies

- 4 roles: SUPER_ADMIN, ADMIN, MANAGER, STAFF
- Role hierarchy and a permissions matrix
- Role checks on API routes and UI
- Audit logging of authorization failures

### What You Have

| Feature | Status | Notes |
|---------|--------|-------|
| Roles | 2 roles | `admin`, `staff` only |
| Role hierarchy | Partial | Admin vs staff by `assignedNailTechId` |
| MANAGER | Missing | Read-only role not implemented |
| SUPER_ADMIN | Missing | Full admin not distinguished |
| Role-based API enforcement | Partial | Staff limited by nail tech; no role matrix |
| Audit logging | Done | `GET /api/audit` exists |
| Auth failure logging | Missing | Plan wants failures logged |

### RBAC Gaps

1. **Only 2 roles** — Need SUPER_ADMIN, ADMIN, MANAGER, STAFF.
2. **No role-based route restrictions** — e.g. DELETE customer should be SUPER_ADMIN only.
3. **User management:** Plan expects `/api/admin/users`; you use `/api/users`. Structure differs but function exists.
4. **Client delete:** Any authenticated user can delete; plan: SUPER_ADMIN only.

---

## 5. API Routes — Plan vs Current

### Routes the Plan Expects

| Route | Plan | Current | Gap |
|-------|------|---------|-----|
| POST /api/integrations/storage/upload-payment | ADMIN, SUPER_ADMIN | No auth | Add auth + role check |
| DELETE /api/integrations/storage/delete | ADMIN, SUPER_ADMIN | No auth | Add auth + role check |
| POST /api/integrations/storage/generate-signature | Public (booking validation) | No auth, no rate limit | Add validation + optional rate limit |
| POST /api/bookings/[id]/add-photo | Plan: add-photo | Implemented as /photos | Different path; needs auth/validation |
| DELETE /api/bookings/[id]/remove-photo | Plan: remove-photo | Implemented as DELETE /photos | Different path |
| GET /api/admin/users | SUPER_ADMIN | N/A — use /api/users | Different structure |
| POST /api/admin/users | SUPER_ADMIN | /api/users POST | Exists |
| GET /api/admin/settings | SUPER_ADMIN | /api/settings GET | Exists |
| PUT /api/admin/settings | SUPER_ADMIN | /api/settings POST | Exists |
| DELETE /api/clients/:id | SUPER_ADMIN | /api/customers/[id] DELETE | Exists but no role check, no auth |
| POST /api/admin/jobs/* | SUPER_ADMIN | Not implemented | Missing |
| GET /api/admin/audit-logs | SUPER_ADMIN | /api/audit | Exists |
| GET /api/reports/revenue | MANAGER+ | Not implemented | Missing |
| GET /api/reports/bookings | MANAGER+ | Not implemented | Missing |
| GET /api/reports/clients | MANAGER+ | Not implemented | Missing |
| POST /api/reports/export | MANAGER+ | Not implemented | Missing |
| POST /api/auth/forgot-password | Public | Not implemented | Missing |
| POST /api/auth/reset-password | Public | Not implemented | Missing |
| POST /api/auth/change-password | Auth required | Not implemented | Missing |
| GET /api/auth/me | Auth required | Not implemented | Missing |
| PUT /api/auth/profile | Auth required | Not implemented | Missing |

---

## 6. Additional Observations

### Working Well

1. Booking flow: create, confirm, reschedule, complete, no-show.
2. Payment proof upload for clients (token-based page).
3. Cloudinary: upload, delete, signed URLs.
4. Google OAuth with pre-approved users.
5. Staff filtering by `assignedNailTechId`.
6. Audit log and Google Sheets sync.
7. Cron for cleanup and notifications.

### Naming Differences (Plan vs Codebase)

- Plan: `/api/clients` — Your code: `/api/customers`
- Plan: `add-photo` / `remove-photo` — Your code: `photos` (POST/DELETE)
- Plan: `isActive` — Your User model: `status: 'active' | 'inactive'`

These are implementation choices; alignment with the plan is optional.

---

## 7. Prioritized Recommendations

### Critical (Security)

1. Add auth to:
   - `POST /api/integrations/storage/upload-payment`
   - `POST /api/integrations/storage/delete`
2. Add auth to:
   - `GET/PATCH/DELETE /api/customers/[id]`
   - `GET/POST/PATCH/DELETE /api/quotations` (and `[id]`)
3. Add root-level `middleware.ts` to protect `/admin/*` and admin API routes.
4. Review `POST /api/bookings/[id]/photos` and `DELETE` — add validation (e.g. booking token or ownership).

### High (Plan Alignment)

5. Implement `middleware.ts` with JWT validation, expiry, and security headers.
6. Implement 4-role RBAC (SUPER_ADMIN, ADMIN, MANAGER, STAFF) and enforce on sensitive routes.
7. Restrict `DELETE /api/customers/[id]` to SUPER_ADMIN.
8. Add reports API: revenue, bookings, clients, export.

### Medium (Feature Completeness)

9. Add password flows: forgot-password, reset-password, change-password.
10. Add `/api/auth/me` and `/api/auth/profile`.
11. Add `lastLogin` to User model and update on sign-in.
12. Reduce JWT expiry to 24 hours.
13. Add HEIC support and 10MB limit for client nail photos.
14. Add thumbnail generation or Cloudinary transformations for gallery.

### Lower (Optional)

15. Implement `/api/admin/jobs/*` for manual trigger of payment/appointment reminders, auto-cancel, photo cleanup.
16. Rename User `status` to `isActive` for consistency with the plan.
17. Add rate limiting (e.g. 5/min on login, 10/hour on generate-signature).
18. Add auto-delete job for client photos 30 days after completion.
19. Enforce strict naming convention for Cloudinary assets.

---

## 8. Suggested Implementation Order

1. **Phase 1 — Security**
   - Auth on storage and customer routes.
   - Root `middleware.ts` for admin + API protection.
   - Auth on quotations routes.

2. **Phase 2 — Auth & RBAC**
   - 4-role system.
   - Role checks on sensitive routes.
   - `lastLogin` and token expiry changes.

3. **Phase 3 — Features**
   - Reports API.
   - Password flows.
   - Auth session/profile endpoints.

4. **Phase 4 — Refinements**
   - HEIC and 10MB limit.
   - Thumbnails.
   - Rate limiting.
   - Admin jobs API and photo cleanup job.

---

## 9. Quick Reference: Unprotected Routes

| Route | Action |
|-------|--------|
| POST /api/integrations/storage/upload-payment | Add auth (ADMIN/SUPER_ADMIN) |
| POST /api/integrations/storage/delete | Add auth (ADMIN/SUPER_ADMIN) |
| GET /api/customers/[id] | Add auth |
| PATCH /api/customers/[id] | Add auth |
| DELETE /api/customers/[id] | Add auth + SUPER_ADMIN role |
| GET /api/quotations | Add auth |
| POST /api/quotations | Add auth |
| GET /api/quotations/[id] | Add auth |
| PATCH /api/quotations/[id] | Add auth |
| DELETE /api/quotations/[id] | Add auth |
| GET /api/quotation/pricing | Consider auth if sensitive |
| POST /api/bookings/[id]/photos | Add validation (booking token/ownership) |
| DELETE /api/bookings/[id]/photos | Add validation |

---

*Generated from MO-IT149 Weeks 6–7 Integration Plan comparison with WebTech codebase. Use this document to decide which items to implement and in what order.*
