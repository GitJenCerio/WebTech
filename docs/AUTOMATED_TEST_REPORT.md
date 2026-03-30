# Automated test report (Jest)

This document lists **each automated test**, what it verifies, and the **latest recorded result** from a local run.

## Latest run (local)

- **Command**: `npm test -- --runInBand`
- **Result**: **PASS**
- **Summary**: 7 suites passed, 24 tests passed

```text
Test Suites: 7 passed, 7 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        12.203 s, estimated 17 s
Ran all test suites.
Jest did not exit one second after the test run has completed.
```

> Note: Jest’s “did not exit” warning indicates some background async work continues after tests finish (likely from non-awaited background tasks in route handlers). The assertions still passed.

---

## Unit tests

### `__tests__/rbac.test.ts` (PASS)

- ✅ `defaults to STAFF for undefined`
- ✅ `normalizes case-insensitively`
- ✅ `falls back to STAFF for unknown roles`
- ✅ `maps MANAGER to ADMIN (not assignable)`
- ✅ `keeps other roles unchanged`
- ✅ `returns false when user missing`
- ✅ `compares by role hierarchy`

### `__tests__/notificationService.test.ts` (PASS)

- ✅ `returns null for missing inputs`
- ✅ `converts Manila local date+time to UTC Date (UTC = Manila - 8h)`
- ✅ `handles midnight rollover correctly`
- ✅ `is true when within ±20 minutes`
- ✅ `is false when outside ±20 minutes`

---

## Integration tests (real MongoDB)

### `__tests__/integration/auth.passwordReset.integration.test.ts` (PASS)

- ✅ `forgot-password rejects invalid email (boundary/validation)`
  - **Verifies**: invalid input returns **400**
- ✅ `forgot-password is anti-enumeration (security) for unknown email`
  - **Verifies**: returns **200** with generic message; does not reveal existence
- ✅ `end-to-end: creates token; reset updates password; token deleted (functional + integration)`
  - **Verifies**: token record created; password hash updated; token removed after reset

---

## Functional tests (API handler flows)

### `__tests__/functional/booking.lifecycle.functional.test.ts` (PASS)

- ✅ `creates booking (pending) from customer submission and then confirms it (functional)`
  - **Verifies**:
    - booking creation returns **200/201**
    - booking status starts as `pending`
    - PATCH action `manual_confirm` transitions booking to `confirmed`

---

## Security tests

### `__tests__/security/middleware.security.test.ts` (PASS)

- ✅ `adds security headers to responses`
  - **Verifies**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- ✅ `blocks protected API routes when no token (401)`
  - **Verifies**: protected API returns **401** + JSON error
- ✅ `redirects protected admin routes to /admin when no token`
  - **Verifies**: protected admin pages redirect to login
- ✅ `blocks deactivated accounts (403) on API routes`
  - **Verifies**: `isActive=false` blocks with **403**

---

## Boundary / validation tests

### `__tests__/boundary/storage.generateSignature.boundary.test.ts` (PASS)

- ✅ `rejects missing bookingId (400)`
  - **Verifies**: schema validation
- ✅ `enforces max 3 photos per type (400)`
  - **Verifies**: photo count limit logic

### `__tests__/boundary/bookings.uploadProof.boundary.test.ts` (PASS)

- ✅ `rejects missing file (400)`
  - **Verifies**: request must include `file`
- ✅ `rejects unsupported content type (400)`
  - **Verifies**: only JPEG/PNG/WebP accepted

