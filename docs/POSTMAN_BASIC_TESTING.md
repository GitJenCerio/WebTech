# Basic Testing – Postman

Use the **Basic Testing** collection and environment to run all Milestone 2 feature tests in Postman.

## Files

| File | Purpose |
|------|--------|
| `BasicTesting.postman_collection.json` | All requests + test scripts (status, headers, body) |
| `BasicTesting.postman_environment.json` | Environment template with variables |

## Import

1. In Postman: **Import** → drag or select:
   - `BasicTesting.postman_collection.json`
   - `BasicTesting.postman_environment.json`
2. Select the **Basic Testing (Local)** environment (top-right dropdown).
3. Edit the environment (gear icon): set **ADMIN_EMAIL** and **ADMIN_PASSWORD** to your admin credentials.

Optional (for file-storage and some RBAC tests): set **BOOKING_ID**, **CUSTOMER_ID**, **PROOF_TOKEN** (from booking email or DB).

## Getting the session (cookie)

1. Open **2. User Authentication** → **Credentials Login (Valid)**.
2. Ensure **BASE_URL** = `http://localhost:3000`, **ADMIN_EMAIL** and **ADMIN_PASSWORD** are set.
3. Click **Send**.
4. Postman stores the cookie `next-auth.session-token` for `localhost:3000`.
5. Later requests that use `{{BASE_URL}}` on the same host will send this cookie automatically (e.g. **Protected Route (With Token)**, **Get Session**). No need to copy the token.

## Run order

- **Error handling & security:** Run **4. Error Handling** and **5. Security Features** (most work without login).
- **Auth flow:** Run **2. User Authentication** → **Credentials Login (Valid)** first, then **3. Middleware Validation and RBAC** (Protected Route With Token, RBAC).
- **401 test:** Run **3. Protected Route (No Token) - 401** before logging in (or in a new session); its pre-request script clears cookies so the request is sent without a session.
- **File storage:** Set **BOOKING_ID** (and **PROOF_TOKEN** from the booking email), then run **1. File Storage and Retrieval**.

## Variables (environment template)

| Variable | Description | Example |
|----------|-------------|--------|
| BASE_URL | API base URL | `http://localhost:3000` |
| ADMIN_EMAIL | Admin login email | your admin email |
| ADMIN_PASSWORD | Admin login password | your admin password |
| BOOKING_ID | For generate-signature / file tests | from DB or booking list |
| CUSTOMER_ID | For RBAC delete-customer test | customer id |
| PROOF_TOKEN | For upload-proof summary (valid token) | from booking email link |

All requests include test scripts that assert status codes, error messages, headers (e.g. security headers), and body shape where applicable.
