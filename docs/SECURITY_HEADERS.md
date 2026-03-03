# Security Headers & HTTP Security Documentation

**Document Purpose:** Documents the HTTP security headers and related security measures in the application for mentor review. Use this to verify MO-IT149 Milestone 2 security requirements (Helmet.js equivalence, error handling, input validation).

**Reference:** MO-IT149 Integration Plan — Weeks 6–9, Milestone 2

---

## Executive Summary

| Category | Plan Status | Implementation Status |
|----------|-------------|------------------------|
| HTTP Security Headers | Required | Implemented (`next.config.js` + `middleware.ts`) |
| Helmet.js Equivalence | Required | Equivalent via Next.js (no Express) |
| Centralized Error Handling | Required | Implemented (`lib/apiError.ts`) |
| Input Validation | Required | Implemented (Zod on API routes) |
| Authentication / RBAC | Required | Implemented |

---

## 1. Security Headers

### 1.1 Requirements

- Helmet.js or equivalent security headers
- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Secure headers on all responses

### 1.2 Implemented Headers

| Header | Value | Location |
|--------|-------|----------|
| X-Content-Type-Options | nosniff | `next.config.js`, `middleware.ts` |
| X-Frame-Options | DENY | `next.config.js`, `middleware.ts` |
| X-XSS-Protection | 1; mode=block | `next.config.js`, `middleware.ts` |
| Referrer-Policy | strict-origin-when-cross-origin | `next.config.js` |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | `next.config.js` |
| X-Powered-By | Removed | `poweredByHeader: false` |

---

## 2. Implementation Details

### 2.1 Global Headers — `next.config.js`

Headers are applied to all responses (pages, API routes, static assets):

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

### 2.2 Middleware — `middleware.ts`

The `withSecurityHeaders()` function adds security headers to all responses processed by the middleware:

```javascript
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};
```

### 2.3 Image Content Security Policy — `next.config.js`

A restricted CSP is applied to optimized images:

```
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
```

---

## 3. Helmet.js Equivalence

### 3.1 Requirement

Helmet.js for secure HTTP headers.

### 3.2 Implementation Approach

The application uses **Next.js** (not Express). Helmet.js targets Express, so equivalent protections are implemented via Next.js configuration:

| Helmet.js Default | Implementation Status | Notes |
|-------------------|------------------------|-------|
| X-Content-Type-Options | Implemented | Same value |
| X-Frame-Options | Implemented | DENY (stricter than SAMEORIGIN) |
| X-XSS-Protection | Implemented | 1; mode=block (legacy browsers) |
| Referrer-Policy | Implemented | Same intent |
| Permissions-Policy | Implemented | Same intent |
| Content-Security-Policy | Partial | Images only |

Helmet.js is not used because the Next.js App Router and API Routes do not use Express. Headers are configured in `next.config.js` and `middleware.ts` as recommended for Next.js applications.

---

## 4. Related Security Measures

| Measure | Location |
|---------|----------|
| Authentication | `middleware.ts`, NextAuth |
| Route protection | `middleware.ts` |
| RBAC (4 roles) | `lib/rbac.ts`, `lib/api-rbac.ts` |
| Input validation (Zod) | API routes |
| Centralized error handling | `lib/apiError.ts` |
| Rate limiting | Login, forgot-password |

---

## 5. Verification

To verify headers in a running application:

1. Open browser DevTools (F12) → Network tab
2. Load any page or call any API
3. Select a request → Headers → Response Headers
4. Confirm presence of: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

---

## 6. References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Helmet.js Documentation](https://helmetjs.github.io/)
