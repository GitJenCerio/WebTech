# MO-IT149 Web Technology Application
## Integration Plan: File Storage, Authentication, and Access Control

**Project:** glammednailsbyjhen - Nail Appointment Booking System  
**Prepared by:** Jennifer B. Cerio  
**Date:** February 6, 2026

---

## Instructions

✅ **Completed:** This worksheet has been tailored to the nail appointment booking admin dashboard project.  
✅ All sections completed based on project requirements and best practices.  
✅ Ready for implementation and testing phases.

---

## Section 1: Project Overview

| Feature | Current State | Planned Integration |
|---------|---------------|---------------------|
| **File Storage** | No file storage system implemented | Use **Cloudinary** cloud storage to store payment proof images uploaded by admin when confirming client reservations AND nail inspiration/current state photos uploaded by clients during booking creation |
| **File Upload/Retrieval** | No file upload functionality exists | Implement validation to support image formats (JPEG, PNG, WebP, HEIC), limit file size (5MB for admin, 10MB for clients), and allow secure retrieval and deletion of images with automatic optimization |
| **User Authentication** | Basic NextAuth.js authentication with Credentials provider only (email/password), JWT tokens (30-day expiration), password hashing with bcrypt | Add Google OAuth as alternative login method, enhance authentication with HTTP-only cookies (currently uses default), reduce token expiration to 24 hours for better security, add lastLogin tracking, and implement account status checking (isActive field) |
| **Authentication Tokens** | JWT tokens exist but inconsistently validated across routes; some API routes check authentication manually (like `/api/users`) while others don't (like `/api/bookings`) | Implement centralized middleware for automatic token validation on ALL admin routes, ensure consistent authentication checking across all protected endpoints, reduce token expiration from 30 days to 24 hours |
| **Middleware Validation** | No `middleware.ts` file exists; auth checking done manually in individual API routes (inconsistent coverage) | Create `middleware.ts` at root level to automatically protect all `/admin/*` and `/api/*` routes (except auth routes), validate JWT tokens, check user session and account status, add security headers to all responses |
| **Role-Based Access Control (RBAC)** | Basic 2-role system exists ('admin' and 'staff' in User model) but no permissions enforcement; all authenticated users have same access regardless of role | Expand to 4-role system (SUPER_ADMIN, ADMIN, MANAGER, STAFF), create comprehensive permissions matrix, implement role checking middleware, enforce role-based restrictions on API routes and UI components, add audit logging for authorization failures |

---

## Section 2: Integration Details

### Part I: File Storage and Retrieval

#### Which provider will you use?

We will use **Cloudinary**, a cloud-based media management platform with automatic image optimization and CDN delivery. Cloudinary is ideal for our nail booking system because it offers a generous free tier that provides 25GB storage and 25GB bandwidth per month, which is sufficient for our needs for 1-2 years. The platform automatically optimizes images, reducing storage costs and improving performance without requiring manual intervention. It includes a built-in CDN for fast global delivery, ensuring quick image loading for users worldwide. For security, Cloudinary supports signed upload URLs, which we'll use for client nail photo uploads to prevent unauthorized access. The platform also provides powerful transformation APIs for creating thumbnails and resizing images on-the-fly, which is essential for generating gallery previews and optimizing page load times. Additionally, Cloudinary offers enterprise-grade reliability and uptime, making it a dependable choice for production use.

#### What types of files will you store?
1. **Payment proof images** (Admin uploads)
   - Screenshots of GCash transactions
   - Bank transfer receipts
   - Digital payment confirmations
   - Size: ~500KB average per file
   
2. **Nail inspiration photos** (Client uploads)
   - Reference designs clients want
   - Photos from social media
   - Custom design ideas
   - Size: ~2MB average per file
   
3. **Current nail state photos** (Client uploads)
   - Photos of client's current nails
   - Used by nail techs to assess condition
   - Plan appropriate services
   - Size: ~2MB average per file

4. **Client profile pictures** (Optional future feature)

#### How will files be structured?

**Folder Structure:**
```
cloudinary_root/
├── payment_proofs/
│   ├── booking_GN-20260205001_proof.jpg
│   ├── booking_GN-20260205002_proof.jpg
│   └── booking_GN-20260205003_proof.jpg
├── nail_inspo/
│   ├── booking_GN-20260205001_inspo_1.jpg
│   ├── booking_GN-20260205001_inspo_2.jpg
│   └── booking_GN-20260205001_inspo_3.jpg
└── nail_current/
    ├── booking_GN-20260205001_current_1.jpg
    ├── booking_GN-20260205001_current_2.jpg
    └── booking_GN-20260205001_current_3.jpg
```

**Naming Convention:**
- Payment proofs: `booking_{BOOKING_NUMBER}_proof.{extension}`
- Inspiration: `booking_{BOOKING_NUMBER}_inspo_{INDEX}.{extension}`
- Current state: `booking_{BOOKING_NUMBER}_current_{INDEX}.{extension}`

**File Retention:**
- Payment proofs: Retained indefinitely (legal/accounting requirement)
- Client nail photos: Auto-deleted 30 days after booking completion
- Old payment proofs: Automatically deleted when new one uploaded for same booking

#### Routes to implement

**Admin Upload Routes:**
```javascript
POST /api/integrations/storage/upload-payment
- Purpose: Upload payment proof image
- Authentication: Required (JWT)
- Authorization: ADMIN, SUPER_ADMIN roles only
- Body: multipart/form-data (file, bookingId)
- Response: { url, publicId, width, height, format, size, message }

DELETE /api/integrations/storage/delete
- Purpose: Delete image from Cloudinary
- Authentication: Required (JWT)
- Authorization: ADMIN, SUPER_ADMIN roles only
- Body: { publicId }
- Response: { success, message }
```

**Client Upload Routes:**
```javascript
POST /api/integrations/storage/generate-signature
- Purpose: Generate signed upload URL for secure client uploads
- Body: { bookingId, photoType: 'inspiration' | 'currentState' }
- Validation: Booking exists, photo limit not exceeded (max 3 per type)
- Response: { 
    signature, timestamp, cloudName, apiKey, 
    uploadPreset, folder, expiresIn: 900 
  }

POST /api/bookings/[id]/add-photo
- Purpose: Save uploaded photo URL to booking record
- Body: { photoType, url, publicId, thumbnailUrl }
- Response: { success, photoId, message }

DELETE /api/bookings/[id]/remove-photo
- Purpose: Remove photo from booking and Cloudinary
- Body: { photoId }
- Response: { success, message }
```

**Retrieval:**
- Payment proof URLs stored in `booking.payment.paymentProofUrl`
- Client photos stored in `booking.clientPhotos.inspiration[]` and `booking.clientPhotos.currentState[]`
- All image URLs retrieved via `GET /api/bookings/:id`

#### Validation rules

**Admin Payment Proof Uploads:**
- ✅ File type: JPEG, PNG, WebP only
- ✅ File size: Maximum 5MB per image
- ✅ Booking validation: Must include valid booking ID that exists in database
- ✅ Authentication: JWT token required (admin roles only)
- ✅ Auto-optimization: Resize to max 1500px width, compress quality 80%
- ✅ Unique filename: Generate UUID to prevent collisions
- ✅ Old proof cleanup: Delete previous payment proof when new one uploaded

**Client Nail Photo Uploads:**
- ✅ File type: JPEG, PNG, WebP, HEIC (mobile camera support)
- ✅ File size: Maximum 10MB per image (high-res phone cameras)
- ✅ Upload limit: Maximum 3 inspiration photos + 3 current state photos per booking
- ✅ Security: Signed upload URLs with 15-minute expiration
- ✅ Auto-optimization: Resize to max 2000px width, compress quality 75%
- ✅ Thumbnail generation: Automatically create 300x300px thumbnails for gallery view
- ✅ Validation: Both client-side (immediate feedback) and server-side (security)
- ✅ Rate limiting: Maximum 10 signature requests per hour per booking

**Both Upload Types:**
- ✅ Content-Type validation
- ✅ File extension validation
- ✅ MIME type verification
- ✅ Error handling with user-friendly messages
- ✅ Upload progress tracking

---

### Part II: User Authentication (NextAuth.js with Credentials)

#### How will users log in?

**Current Implementation:** ✅ Already have NextAuth.js with Credentials provider (email/password)

**Planned Authentication Methods:** NextAuth.js with dual authentication options:
1. **Credentials Provider:** Email and password ✅ **(Already implemented)**
2. **Google OAuth Provider:** Sign in with Google ❌ **(New - mentor recommended)** - Will restrict to pre-approved users only

**Login Flow:**
1. Admin enters email and password on login page (`/admin/login`)
2. Frontend validates inputs (email format, password length)
3. POST request sent to `/api/auth/callback/credentials`
4. NextAuth.js calls authorize function in auth configuration
5. Backend queries User model in MongoDB
6. Password verified using bcrypt comparison (10 salt rounds)
7. If valid:
   - JWT token generated with user data (id, email, name, role)
   - Token stored in HTTP-only cookie (prevents XSS attacks)
   - User redirected to `/admin/dashboard`
8. If invalid:
   - Error message displayed: "Invalid email or password"
   - Failed attempt logged for security monitoring

**Password Security:**
- Passwords hashed using bcrypt with 10 salt rounds
- Minimum 8 characters required
- Stored securely in MongoDB (never plain text)

**Session Management:**
- JWT tokens stored in HTTP-only cookies
- Token expires after 24 hours
- Session validated on every protected route
- User can log out to invalidate token immediately

#### What user data will you retrieve?

**Currently Retrieved (Existing Implementation):**
```javascript
// From session
{
  id: user._id.toString(),
  email: user.email,
  name: user.name || user.email.split('@')[0],
  image: user.image  // From Google OAuth
}
```

**Current User Model Fields:**
- ✅ email (unique, indexed)
- ✅ password (hashed with bcrypt, select: false)
- ✅ name
- ✅ image (Google OAuth profile picture)
- ✅ emailVerified (boolean)
- ✅ role ('admin' | 'staff')
- ✅ assignedNailTechId (for staff members)
- ✅ status ('active' | 'inactive')
- ✅ createdAt, updatedAt

**Planned Additions to User Model:**
- ❌ lastLogin timestamp (not tracked currently)
- ❌ Expand roles to: SUPER_ADMIN, ADMIN, MANAGER, STAFF
- ❌ isActive field (currently using 'status', will rename for consistency)

**Privacy & Security:**
- Password NEVER included in session or response
- Sensitive data not stored in JWT payload
- User data only accessible to authenticated users
- Role information used for access control

#### Token management plan

**Current Token Implementation:**
- ✅ JWT tokens issued by NextAuth.js upon successful authentication
- ✅ Signed with NEXTAUTH_SECRET (stored in .env)
- ✅ Session strategy: 'jwt'
- ⚠️ Current expiration: 30 days (too long for security)
- ✅ Include user data: id (token.sub), email, name, image
- ❌ Missing in token: role, isActive status

**Current Token Storage:**
- ✅ NextAuth.js default cookie storage
- ⚠️ Not explicitly configured as HTTP-only (relying on NextAuth defaults)
- Cookie name: `next-auth.session-token`
- ⚠️ Secure flag: depends on NextAuth defaults

**Planned Improvements:**
- ❌ Reduce expiration from 30 days to 24 hours
- ❌ Explicitly configure HTTP-only cookies
- ❌ Add role and isActive to JWT payload
- ❌ Add custom cookie configuration for better security

**Token Validation:**
- Middleware checks cookie on every protected route
- NextAuth.js automatically validates signature
- Checks expiration timestamp
- Verifies user still exists and isActive=true
- Invalid/expired tokens trigger redirect to login

**Token Refresh:**
- Current: User must re-authenticate after 24 hours
- Future enhancement: Refresh token rotation for extended sessions
- Sliding session (extends on activity) - optional implementation

**Token Invalidation:**
- User logout: Token removed from cookie
- Password change: All tokens invalidated
- Account deactivation: isActive=false blocks access
- Role change: Takes effect on next token validation

**Security Measures:**
- HTTPS enforced in production
- CSRF protection via NextAuth.js built-in tokens
- Rate limiting on login endpoint (5 attempts/minute per IP)
- Failed login attempts logged
- Suspicious activity monitoring

#### Routes to implement

**Authentication Routes (NextAuth.js):**
```javascript
POST /api/auth/callback/credentials
- Purpose: Handle login (email + password)
- Body: { email, password }
- Response: Sets HTTP-only cookie, returns user session
- Rate limit: 5 requests/minute per IP

GET /api/auth/session
- Purpose: Get current authenticated user session
- Authentication: Required (checks cookie)
- Response: { user: { id, email, name, role, isActive } }

POST /api/auth/signout
- Purpose: Logout user
- Authentication: Required
- Action: Removes session cookie
- Response: { success: true }

GET /api/auth/csrf
- Purpose: Get CSRF token for form submissions
- Response: { csrfToken }
```

**Password Management Routes:**
```javascript
POST /api/auth/forgot-password
- Purpose: Request password reset email
- Body: { email }
- Action: Generate reset token, send email via Resend
- Rate limit: 3 requests/hour per email
- Response: { message: 'Password reset link sent' }

POST /api/auth/reset-password
- Purpose: Reset password with token
- Body: { token, newPassword }
- Validation: Token valid and not expired (<1 hour old)
- Action: Hash new password, update database, invalidate token
- Response: { success: true, message: 'Password updated' }

POST /api/auth/change-password
- Purpose: Change password (authenticated user)
- Authentication: Required (JWT)
- Body: { currentPassword, newPassword }
- Validation: Verify current password before updating
- Response: { success: true, message: 'Password changed' }
```

**Session Management Routes:**
```javascript
GET /api/auth/me
- Purpose: Get current user details
- Authentication: Required (JWT)
- Response: { 
    id, email, name, role, isActive, lastLogin, createdAt 
  }

PUT /api/auth/profile
- Purpose: Update user profile (name, email)
- Authentication: Required (JWT)
- Body: { name, email }
- Response: { user: { updated fields }, message }
```

---

### Part III: Middleware Validation

#### Middleware function details

The middleware will extract JWT tokens from HTTP-only cookies, validate the token signature using NextAuth.js built-in validation, and check the token expiration timestamp. It will also verify that the user account is active by checking the isActive status from the database. For protected routes, the middleware will extract user information (id, email, role) from the token and attach it to the request object for use by API handlers. If validation fails, appropriate error responses will be returned. Additionally, the middleware will implement rate limiting to prevent brute force attacks (5 login attempts per minute) and add security headers to all responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection).

#### Routes requiring middleware

All routes under `/admin/*` (dashboard, bookings management, clients, nail-techs, quotations, reports, settings) require authentication middleware. For API routes, the following endpoints require middleware validation: `/api/availability/*` (admin manages time slots), `/api/bookings/:id` PUT/DELETE (edit/delete bookings - admin only), `/api/bookings/:id/confirm-payment` (admin confirms bookings), `/api/clients/*` (all client management routes), `/api/nail-techs/*` (all nail tech management routes), `/api/quotations/*` (quotation creation and management), `/api/dashboard/*` (dashboard statistics and analytics), `/api/reports/*` (revenue and analytics reports), and `/api/integrations/storage/upload-payment` (payment proof uploads by admin). Public routes that do not require middleware include `/api/auth/login`, `/api/auth/forgot-password`, `/api/bookings` POST (client-facing booking creation), `/api/availability` GET (view available slots), and `/api/integrations/storage/generate-signature` (for client photo uploads with signed URLs).

#### Error handling plan

| Error Type | Status Code | Response Message | Action |
|------------|-------------|------------------|--------|
| Token missing | 401 Unauthorized | "Authentication required. Please log in." | Redirect to login page |
| Token invalid | 401 Unauthorized | "Invalid session. Please log in again." | Clear cookie, redirect to login |
| Token expired | 401 Unauthorized | "Session expired. Please log in again." | Clear cookie, redirect to login |
| Account inactive | 403 Forbidden | "Account has been deactivated. Contact administrator." | Show support contact information |
| Insufficient role | 403 Forbidden | "You do not have permission to perform this action." | Show error message, log attempt |

All failed authentication and authorization attempts will be logged with user ID, attempted action, and timestamp for security monitoring and auditing purposes.

---

### Part IV: Role-Based Access Control (RBAC)

#### User roles

**1. SUPER_ADMIN**
- Full platform access including system administration
- Can manage all admin users (create, edit, delete)
- Access to system settings and configuration
- View audit logs and system activity
- Perform all actions without restriction
- Default first user created during setup

**2. ADMIN**
- Manage time slot availability (create slots for booking)
- View and manage bookings created by clients
- Edit, cancel, and delete bookings
- Confirm payments and upload payment proofs
- Mark bookings as completed or no-show
- Manage clients: create, edit (but not delete)
- Manage nail techs: create, edit, update commission rates
- Create and manage quotations/invoices
- Generate and export reports
- View dashboard statistics
- Cannot manage other admin users
- Cannot delete clients
- Note: Clients create their own bookings from available slots

**3. MANAGER**
- **Read-only access** to bookings and clients
- View all booking details and history
- View client information and booking history
- View reports and analytics
- Search and filter data
- Export reports
- **Cannot** create, edit, or delete any records
- Good for owners/managers who need visibility but not operational control

**4. STAFF**
- Basic access for frontline employees
- Can view booking details
- Can update booking status (mark as completed, no-show)
- Can view client information
- Can assist clients with booking if needed
- **Cannot** delete bookings
- **Cannot** access reports
- **Cannot** confirm payments
- **Cannot** manage clients or nail techs
- **Cannot** manage availability slots
- Note: Most bookings are created by clients directly, not staff

**Role Hierarchy:**
```
SUPER_ADMIN (Level 4) - Full access
    ↓
ADMIN (Level 3) - Operational management
    ↓
MANAGER (Level 2) - Read-only oversight
    ↓
STAFF (Level 1) - Basic operations
```

#### Role-based permissions

**SUPER_ADMIN Permissions:**
```javascript
Users:
- ✅ Create admin users
- ✅ Edit any admin user
- ✅ Delete admin users
- ✅ Change user roles
- ✅ Activate/deactivate accounts
- ✅ View audit logs

Bookings:
- ✅ All CRUD operations
- ✅ Override any restriction
- ✅ Force delete bookings

Clients:
- ✅ All CRUD operations
- ✅ Permanently delete clients
- ✅ Merge duplicate clients

Nail Techs:
- ✅ All CRUD operations
- ✅ Set commission rates
- ✅ View all earnings data

Reports:
- ✅ Access all reports
- ✅ Export all data
- ✅ View financial analytics

System:
- ✅ Access system settings
- ✅ Configure integrations
- ✅ Manage cron jobs
- ✅ View system logs
```

**ADMIN Permissions:**
```javascript
Availability Management:
- ✅ Create/edit time slots for booking
- ✅ Block unavailable dates
- ✅ Manage nail tech schedules

Booking Management:
- ✅ View all bookings (created by clients)
- ✅ Edit bookings (date, time, service)
- ✅ Cancel bookings
- ✅ Delete bookings
- ✅ Confirm payments
- ✅ Upload payment proofs
- ✅ Mark as completed/no-show
- Note: Clients create their own bookings from available slots

Clients:
- ✅ Create new clients
- ✅ Edit client information
- ✅ Update preferences and health info
- ✅ View booking history
- ❌ Cannot delete clients

Nail Techs:
- ✅ Create nail techs
- ✅ Edit nail tech info
- ✅ Update commission rates
- ✅ Update discount rates
- ✅ Activate/deactivate nail techs
- ❌ Cannot permanently delete

Quotations:
- ✅ Create quotations
- ✅ Edit quotations
- ✅ Apply discounts
- ✅ Preview invoices

Reports:
- ✅ View revenue reports
- ✅ View booking statistics
- ✅ View client analytics
- ✅ Export reports (CSV, PDF)

File Storage:
- ✅ Upload payment proofs
- ✅ Delete uploaded images
```

**MANAGER Permissions:**
```javascript
Bookings:
- ✅ View all bookings
- ✅ Search and filter
- ✅ View booking details
- ❌ Cannot create bookings
- ❌ Cannot edit bookings
- ❌ Cannot delete bookings
- ❌ Cannot confirm payments

Clients:
- ✅ View all clients
- ✅ View client details
- ✅ View booking history
- ✅ Search clients
- ❌ Cannot create clients
- ❌ Cannot edit clients

Nail Techs:
- ✅ View nail tech list
- ✅ View nail tech stats
- ✅ View schedules
- ❌ Cannot create/edit nail techs

Reports:
- ✅ View all reports
- ✅ Revenue analytics
- ✅ Booking statistics
- ✅ Client analytics
- ✅ Export reports

Dashboard:
- ✅ View statistics
- ✅ View activity feed
- ✅ View charts
```

**STAFF Permissions:**
```javascript
Bookings:
- ✅ View booking details
- ✅ Update booking status (completed, no-show)
- ✅ Add admin notes
- ✅ Assist clients with booking process if needed
- ❌ Cannot edit booking details (date, time)
- ❌ Cannot delete bookings
- ❌ Cannot cancel bookings
- ❌ Cannot confirm payments
- Note: Most bookings created by clients directly through public booking form

Clients:
- ✅ View client list
- ✅ View client details
- ✅ Search clients
- ❌ Cannot create clients
- ❌ Cannot edit clients

Nail Techs:
- ✅ View nail tech list (for booking assignment)
- ✅ View schedules
- ❌ Cannot view stats/earnings

Dashboard:
- ✅ View basic stats
- ✅ View today's bookings
- ❌ Cannot view financial data

Reports:
- ❌ No access to reports
```

**Permission Matrix:**

| Feature | SUPER_ADMIN | ADMIN | MANAGER | STAFF | PUBLIC (Clients) |
|---------|-------------|-------|---------|-------|------------------|
| **Users Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Manage Availability Slots** | ✅ | ✅ | ❌ | ❌ | ❌ View only |
| **Bookings Create** | ❌ | ❌ | ❌ | ❌ | ✅ Yes (client booking) |
| **Bookings Edit** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bookings Delete** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bookings View** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Own only |
| **Confirm Payment** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Mark Completed** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Clients Create** | ✅ | ✅ | ❌ | ❌ |
| **Clients Edit** | ✅ | ✅ | ❌ | ❌ |
| **Clients Delete** | ✅ | ❌ | ❌ | ❌ |
| **Clients View** | ✅ | ✅ | ✅ | ✅ |
| **Nail Techs CRUD** | ✅ | ✅ | ❌ | ❌ |
| **Commission Rates** | ✅ | ✅ | ❌ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ❌ |
| **Export Reports** | ✅ | ✅ | ✅ | ❌ |
| **Upload Files** | ✅ | ✅ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ❌ | ❌ | ❌ |

#### Routes requiring role-based restrictions

**SUPER_ADMIN Only Routes:**
```javascript
// User Management
GET    /api/admin/users              // List all admin users
POST   /api/admin/users              // Create new admin user
PUT    /api/admin/users/:id          // Edit user (including role change)
DELETE /api/admin/users/:id          // Delete admin user

// System Settings
GET    /api/admin/settings           // View system settings
PUT    /api/admin/settings           // Update system settings

// Client Deletion
DELETE /api/clients/:id              // Permanently delete client

// System Jobs
POST   /api/admin/jobs/payment-reminder     // Trigger payment reminder job
POST   /api/admin/jobs/appointment-reminder // Trigger appointment reminder
POST   /api/admin/jobs/auto-cancel         // Trigger auto-cancel job
POST   /api/admin/jobs/cleanup-photos      // Trigger photo cleanup

// Audit Logs
GET    /api/admin/audit-logs         // View audit logs
```

**ADMIN and SUPER_ADMIN Routes:**
```javascript
// Booking Management
PUT    /api/bookings/:id             // Edit booking details
DELETE /api/bookings/:id             // Delete/cancel booking
POST   /api/bookings/:id/confirm-payment  // Confirm payment

// Client Management
POST   /api/clients                  // Create new client
PUT    /api/clients/:id              // Edit client

// Nail Tech Management
POST   /api/nail-techs               // Create nail tech
PUT    /api/nail-techs/:id           // Edit nail tech (including commission)

// Quotations
POST   /api/quotations               // Create quotation

// File Uploads
POST   /api/integrations/storage/upload-payment  // Upload payment proof
DELETE /api/integrations/storage/delete          // Delete images
```

**MANAGER, ADMIN, and SUPER_ADMIN Routes:**
```javascript
// Reports
GET    /api/reports/revenue          // Revenue reports
GET    /api/reports/bookings         // Booking statistics
GET    /api/reports/clients          // Client analytics
POST   /api/reports/export           // Export reports

// Nail Tech Stats
GET    /api/nail-techs/:id/stats     // View nail tech earnings
```

**STAFF and Above Routes:**
```javascript
// Basic Booking Operations
POST   /api/bookings                 // Create booking
POST   /api/bookings/:id/complete    // Mark as completed
POST   /api/bookings/:id/no-show     // Mark as no-show

// View Access
GET    /api/bookings                 // List bookings
GET    /api/bookings/:id             // View booking details
GET    /api/clients                  // List clients
GET    /api/clients/:id              // View client details
GET    /api/nail-techs               // List nail techs (for assignment)
GET    /api/dashboard/stats          // Dashboard statistics
```

**Public Routes (No Role Required):**
```javascript
POST   /api/auth/callback/credentials     // Login
POST   /api/integrations/storage/generate-signature  // Client uploads
```

#### Error handling plan

**Insufficient Permissions (403 Forbidden):**

1. **STAFF attempts to delete booking:**
```javascript
Status: 403 Forbidden
Response: {
  error: "You do not have permission to perform this action.",
  code: "INSUFFICIENT_ROLE",
  requiredRole: "ADMIN",
  currentRole: "STAFF",
  message: "Only Admins and Super Admins can delete bookings."
}
UI Action: Show error toast, keep user on current page
Logging: {
  userId: "user123",
  email: "staff@nails.com",
  role: "STAFF",
  attemptedAction: "DELETE /api/bookings/GN-001",
  requiredRole: "ADMIN",
  timestamp: "2026-02-06T10:30:00Z",
  ipAddress: "192.168.1.100"
}
```

2. **STAFF attempts to access reports:**
```javascript
Status: 403 Forbidden
Response: {
  error: "Reports access is restricted to Manager level and above.",
  code: "REPORTS_ACCESS_DENIED",
  currentRole: "STAFF",
  message: "Contact your administrator to request Manager access."
}
UI Action: Don't show reports menu item for STAFF role
```

3. **ADMIN attempts to delete client:**
```javascript
Status: 403 Forbidden
Response: {
  error: "You are not authorized to delete this resource.",
  code: "DELETE_FORBIDDEN",
  resource: "Client",
  message: "Only Super Admins can permanently delete clients."
}
UI Action: Hide delete button for ADMIN role
```

4. **MANAGER attempts to create booking:**
```javascript
Status: 403 Forbidden
Response: {
  error: "You do not have permission to create bookings.",
  code: "CREATE_FORBIDDEN",
  currentRole: "MANAGER",
  message: "Managers have read-only access. Contact an Admin to create bookings."
}
UI Action: Show all forms in read-only mode for MANAGER
```

5. **ADMIN attempts to access user management:**
```javascript
Status: 403 Forbidden
Response: {
  error: "This action requires Super Admin privileges.",
  code: "SUPER_ADMIN_REQUIRED",
  attemptedRoute: "/admin/users",
  message: "Contact the Super Admin to manage admin users."
}
UI Action: Don't display Users menu item unless SUPER_ADMIN
```

**Authorization Failure Logging:**

All authorization failures logged with complete context:
```javascript
{
  // Who
  userId: "65a1b2c3d4e5f6g7h8i9j0k1",
  email: "staff@nails.com",
  role: "STAFF",
  
  // What
  attemptedAction: "DELETE",
  attemptedRoute: "/api/bookings/GN-20260205001",
  requiredRole: "ADMIN",
  errorCode: "INSUFFICIENT_ROLE",
  
  // When
  timestamp: "2026-02-06T10:30:45.123Z",
  
  // Where
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  
  // Additional Context
  resource: "Booking",
  resourceId: "GN-20260205001",
  sessionId: "session123"
}
```

**Security Alerts Triggered When:**
- Same user attempts unauthorized action >5 times in 10 minutes
- User attempts SUPER_ADMIN routes repeatedly
- Multiple different users from same IP attempt elevated actions
- User role changed recently then attempts elevated actions (potential account compromise)

**UI/UX Best Practices:**
1. **Hide Unauthorized Actions:** Don't show buttons/links user can't use
2. **Disable vs Hide:** Sometimes disable with tooltip explaining why
3. **Clear Error Messages:** Tell user exactly what they need (role level)
4. **Suggest Alternative:** "Contact Admin" or "Request Manager Access"
5. **Graceful Degradation:** Show read-only view instead of error page when possible

---

## Section 3: Testing Plan

| Feature | Testing Method | Expected Results |
|---------|----------------|------------------|
| **File Upload & Retrieval** | **Method 1: Postman API Testing**<br>1. POST to `/api/integrations/storage/upload-payment` with multipart form-data (file + bookingId)<br>2. Upload JPEG image (3MB)<br>3. GET `/api/bookings/:id` to retrieve booking<br><br>**Method 2: Frontend Testing**<br>1. Login as ADMIN<br>2. Navigate to booking detail<br>3. Click "Confirm Payment"<br>4. Upload payment proof image<br>5. Submit confirmation | **Expected:**<br>✅ Image uploads to Cloudinary successfully<br>✅ Response includes: url, publicId, width, height, format<br>✅ URL saved in `booking.payment.paymentProofUrl`<br>✅ Image accessible via returned URL<br>✅ Image optimized (max 1500px width)<br>✅ Old payment proof deleted automatically<br>✅ File size validation: Reject 7MB file with 400 error<br>✅ File type validation: Reject .txt file with 400 error<br>✅ Booking status changes to CONFIRMED |
| **Client Photo Upload** | **Method 1: Client Flow Simulation**<br>1. POST to `/api/integrations/storage/generate-signature` with {bookingId, photoType: "inspiration"}<br>2. Upload image directly to Cloudinary using signature<br>3. POST to `/api/bookings/:id/add-photo` with returned URL<br><br>**Method 2: Upload Limit Testing**<br>1. Upload 3 inspiration photos<br>2. Attempt to upload 4th photo<br>3. Upload 3 current state photos | **Expected:**<br>✅ Signature generated with 15-minute expiration<br>✅ Direct upload to Cloudinary succeeds<br>✅ Photo saved in booking.clientPhotos array<br>✅ Thumbnail generated (300x300px)<br>✅ 4th photo upload rejected with "Maximum 3 photos allowed"<br>✅ Can upload up to 6 total photos (3+3)<br>✅ 10MB image uploads successfully<br>✅ 11MB image rejected with size error |
| **User Authentication** | **Method 1: Valid Login**<br>1. POST to `/api/auth/callback/credentials`<br>2. Body: {email: "admin@nails.com", password: "correct_password"}<br>3. Check response cookies<br><br>**Method 2: Invalid Login**<br>1. POST with wrong password<br>2. POST with non-existent email<br><br>**Method 3: Session Persistence**<br>1. Login successfully<br>2. Close browser<br>3. Reopen and visit /admin/dashboard<br><br>**Method 4: Token Expiration**<br>1. Login and wait 24 hours<br>2. Attempt to access protected route | **Expected:**<br>✅ Valid login returns 200 OK<br>✅ HTTP-only cookie set: `next-auth.session-token`<br>✅ User redirected to `/admin/dashboard`<br>✅ Session data includes: id, email, name, role<br>✅ Invalid password returns 401 with "Invalid email or password"<br>✅ Non-existent email returns 401 (same message for security)<br>✅ Session persists across browser sessions<br>✅ Dashboard accessible without re-login<br>✅ Expired token redirects to login with "Session expired" message<br>✅ Password never included in response |
| **Middleware Validation** | **Method 1: Protected Route Access**<br>1. Logout (clear cookies)<br>2. GET `/admin/dashboard` without token<br>3. GET `/api/bookings` without token<br><br>**Method 2: Valid Token Access**<br>1. Login as ADMIN<br>2. GET `/api/bookings` with valid token<br>3. GET `/admin/dashboard`<br><br>**Method 3: Expired Token**<br>1. Manually set expired token in cookie<br>2. Attempt to access protected route<br><br>**Method 4: Inactive Account**<br>1. Super Admin sets user.isActive = false<br>2. User attempts to login<br>3. Previously logged-in user tries to access route | **Expected:**<br>✅ No token → 302 redirect to `/admin/login`<br>✅ API without token → 401 "Authentication required"<br>✅ Valid token → 200 OK, data returned<br>✅ Dashboard loads successfully<br>✅ Expired token → 401 "Session expired"<br>✅ Redirect to login with error message<br>✅ Inactive account login → 403 "Account deactivated"<br>✅ Existing session cleared<br>✅ Message: "Contact administrator"<br>✅ Security headers added to all responses |
| **Role-Based Access Control (RBAC)** | **Method 1: SUPER_ADMIN Access**<br>1. Login as SUPER_ADMIN<br>2. Attempt all operations:<br>   - Create/edit/delete users<br>   - Delete client<br>   - Access system settings<br>   - View audit logs<br><br>**Method 2: ADMIN Access**<br>1. Login as ADMIN<br>2. Attempt operations:<br>   - Create time slots ✅<br>   - Confirm payment ✅<br>   - Edit bookings ✅<br>   - Delete client ❌<br>   - Create admin user ❌<br><br>**Method 3: MANAGER Access**<br>1. Login as MANAGER<br>2. Attempt operations:<br>   - View bookings ✅<br>   - Create time slots ❌<br>   - Edit booking ❌<br>   - View reports ✅<br><br>**Method 4: STAFF Access**<br>1. Login as STAFF<br>2. Attempt operations:<br>   - Mark booking completed ✅<br>   - View bookings ✅<br>   - Delete booking ❌<br>   - Create time slots ❌ | **Expected:**<br>✅ SUPER_ADMIN can perform ALL operations<br>✅ All routes accessible<br>✅ No 403 errors<br><br>✅ ADMIN can create time slots and confirm payments<br>✅ Client delete returns 403 "Super Admin privileges required"<br>✅ User management returns 403<br>✅ Can edit bookings created by clients<br><br>✅ MANAGER can view all data<br>✅ Create time slots returns 403 "Admin privileges required"<br>✅ Edit booking returns 403<br>✅ Reports accessible<br><br>✅ STAFF can mark bookings as completed<br>✅ Can view booking details<br>✅ Delete returns 403 "Required role: ADMIN"<br>✅ Time slot creation returns 403<br><br>✅ UI hides unauthorized buttons<br>✅ Tooltips explain required role<br>✅ All failures logged to audit log |
| **Error Handling** | **Method 1: File Upload Errors**<br>1. Upload .txt file (wrong format)<br>2. Upload 7MB image (exceeds 5MB limit)<br>3. Upload without bookingId<br>4. Upload with non-existent bookingId<br><br>**Method 2: Authentication Errors**<br>1. Login with wrong password (5 times)<br>2. Login with expired token<br>3. Access route with tampered token<br>4. Login to inactive account<br><br>**Method 3: Authorization Errors**<br>1. STAFF attempts to delete booking<br>2. ADMIN attempts to delete client<br>3. MANAGER attempts to edit booking<br>4. User with invalid role in token | **Expected:**<br>✅ Wrong format → 400 "Only JPEG, PNG, WebP allowed"<br>✅ Large file → 400 "File size exceeds 5MB limit"<br>✅ Missing bookingId → 400 "Booking ID required"<br>✅ Invalid bookingId → 404 "Booking not found"<br><br>✅ Wrong password → 401 "Invalid email or password"<br>✅ 5th attempt → 429 "Too many attempts. Try in 1 minute"<br>✅ Expired token → 401 "Session expired"<br>✅ Tampered token → 401 "Invalid session"<br>✅ Inactive account → 403 "Account deactivated"<br><br>✅ All return descriptive error messages<br>✅ Error codes included (INSUFFICIENT_ROLE, etc.)<br>✅ UI displays error toasts with actionable messages<br>✅ All failures logged with user ID, timestamp, IP |
| **Rate Limiting** | **Method 1: Login Rate Limit**<br>1. POST to login endpoint 10 times within 1 minute with wrong password<br>2. Check response after 5th attempt<br>3. Wait 60 seconds<br>4. Try login again<br><br>**Method 2: API Rate Limit**<br>1. Send 150 GET requests to `/api/bookings` within 15 minutes<br>2. Check response after 100th request<br><br>**Method 3: Upload Rate Limit**<br>1. Upload 15 images in quick succession<br>2. Check response after 10th upload | **Expected:**<br>✅ First 5 login attempts return normal responses<br>✅ 6th attempt returns 429 "Too many requests"<br>✅ Response includes: retryAfter: 60<br>✅ Headers: X-RateLimit-Limit: 5, X-RateLimit-Remaining: 0<br>✅ After 60 seconds, can login again<br><br>✅ First 100 API requests succeed<br>✅ 101st request returns 429<br>✅ Message: "Try again in X minutes"<br><br>✅ Upload rate limit enforced<br>✅ Clear error message with retry time<br>✅ UI disables actions when rate limited |
| **File Size Validation** | **Method 1: Various File Sizes**<br>1. Upload 500KB image (valid)<br>2. Upload 1MB image (valid)<br>3. Upload 3MB image (valid)<br>4. Upload 5MB image (edge case)<br>5. Upload 6MB image (invalid)<br>6. Upload 10MB client photo (valid for clients)<br>7. Upload 11MB client photo (invalid) | **Expected:**<br>✅ 500KB, 1MB, 3MB upload successfully<br>✅ 5MB admin upload succeeds (edge case passes)<br>✅ 6MB admin upload rejected with 400<br>✅ Error: "File size exceeds 5MB limit"<br>✅ 10MB client photo uploads successfully<br>✅ 11MB client photo rejected<br>✅ Error: "File size exceeds 10MB limit"<br>✅ File size checked before upload to Cloudinary<br>✅ User-friendly error message shown immediately |
| **Payment Proof Replacement** | **Method 1: Upload New Proof**<br>1. Create booking GN-20260205001<br>2. Upload payment proof (proof_1.jpg)<br>3. Verify URL saved in database<br>4. Upload new payment proof (proof_2.jpg)<br>5. Check booking record<br>6. Check Cloudinary<br><br>**Method 2: Verify Old Deletion**<br>1. Note publicId of first upload<br>2. Upload replacement<br>3. Attempt to access old URL<br>4. Verify only new URL in database | **Expected:**<br>✅ First proof uploads successfully<br>✅ URL saved: `booking.payment.paymentProofUrl`<br>✅ publicId saved: `booking.payment.paymentProofPublicId`<br>✅ Second proof uploads successfully<br>✅ Old proof automatically deleted from Cloudinary<br>✅ Database updated with new URL and publicId<br>✅ Old URL returns 404 Not Found<br>✅ Only one payment proof per booking<br>✅ Booking updated timestamp reflects change<br>✅ Both uploads logged in audit log |

---

## Section 4: Additional Implementation Notes

### Environment Variables Required

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/nail-booking-prod

# NextAuth.js
NEXTAUTH_SECRET=minimum-32-character-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
# Production: NEXTAUTH_URL=https://glamnails.com

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PRICING_SHEET_ID=1abc...xyz
BOOKINGS_BACKUP_SHEET_ID=1abc...xyz

# Resend API (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@glamnails.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET_PAYMENT=payment_proofs
CLOUDINARY_UPLOAD_PRESET_CLIENT=nail_photos

# Optional: Rate Limiting (if using Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: Error Tracking
SENTRY_DSN=https://...
```

### Security Checklist

**Admin Security:**
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] JWT tokens in HTTP-only cookies
- [x] HTTPS enforced in production
- [x] Input validation with Zod schemas
- [x] XSS protection (React auto-escapes)
- [x] CSRF protection (NextAuth.js built-in)
- [x] Rate limiting on authentication endpoints
- [x] File upload validation (type, size)
- [x] Environment variables for secrets
- [x] Role-based access control middleware
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] Audit logging for critical actions

**Client-Side Booking Security (Anti-Spam Measures):**
- [x] Google reCAPTCHA v3 on booking form (invisible, score-based)
- [x] Rate limiting by IP address (max 3 bookings per hour)
- [x] Rate limiting by email/phone (max 5 bookings per day)
- [x] Email verification required before booking confirmation
- [x] Phone number verification (SMS OTP optional)
- [x] Honeypot field detection (hidden field to catch bots)
- [x] Request fingerprinting (track suspicious patterns)
- [x] Input sanitization and validation (prevent injection)
- [x] File upload limits (max 6 photos, 10MB each)
- [x] Cloudinary signed URLs with expiration (15 minutes)
- [x] Admin approval required (bookings pending until confirmed)
- [x] Duplicate booking prevention (same email/phone/date)
- [x] Blacklist mechanism for repeat offenders
- [x] IP-based blocking for suspicious activity

### Deployment Considerations

**Vercel Deployment:**
1. Connect GitHub repository
2. Configure environment variables in Vercel dashboard
3. Set Node.js version to 18+
4. Configure custom domain
5. Enable automatic deployments on main branch

**MongoDB Atlas:**
1. Whitelist Vercel IP addresses (or allow all with caution)
2. Create database user with appropriate permissions
3. Enable connection pooling
4. Set up automated backups

**Cloudinary:**
1. Verify upload presets configured correctly
2. Set up webhook for upload notifications (optional)
3. Monitor usage via dashboard

---

## Section 5: Client-Side Security & Anti-Spam Measures

Since booking creation is public and does not require authentication, implementing robust security measures is critical to prevent spam, abuse, and malicious activities.

### Multi-Layer Security Strategy

#### Layer 1: Bot Prevention

**Google reCAPTCHA v3 (Invisible)**
- Integrated on booking form submission
- Score-based validation (0.0 = bot, 1.0 = human)
- Threshold: Reject requests with score < 0.5
- No user interaction needed (invisible verification)
- Implementation: Add reCAPTCHA token to booking API request
- Cost: Free for up to 1 million assessments/month

**Honeypot Field Technique**
- Add hidden form field (e.g., "website" field)
- Position off-screen with CSS (invisible to humans)
- Bots typically fill all fields, humans skip hidden ones
- Reject any submission with honeypot field filled
- Zero cost, effective against simple bots

#### Layer 2: Rate Limiting

**IP-Based Rate Limiting**
- Maximum 3 booking attempts per hour per IP address
- Maximum 10 booking attempts per day per IP address
- Sliding window algorithm (more accurate than fixed window)
- Return 429 Too Many Requests with retry-after header
- Implementation using Upstash Redis or in-memory store

**Email/Phone Rate Limiting**
- Maximum 5 bookings per day per email address
- Maximum 5 bookings per day per phone number
- Prevents single user from creating multiple spam bookings
- Check against existing bookings in database

**Example Rate Limit Response:**
```javascript
Status: 429 Too Many Requests
Response: {
  error: "Too many booking attempts. Please try again later.",
  retryAfter: 3600, // seconds
  maxAttempts: 3,
  timeWindow: "1 hour"
}
```

#### Layer 3: Identity Verification

**Email Verification (Required)**
- Send verification email with unique token after booking creation
- Booking status: PENDING_VERIFICATION
- Token expires in 24 hours
- Booking automatically cancelled if not verified
- Prevents fake email addresses
- Implementation: Use Resend API for email delivery

**Phone Verification (Optional - Enhanced Security)**
- Send SMS with 6-digit OTP code
- Use services like Twilio, AWS SNS, or Semaphore (Philippines)
- Required for high-value bookings or new customers
- Cost consideration: ~₱0.50-2.00 per SMS in Philippines
- Alternative: WhatsApp verification (free)

#### Layer 4: Request Validation

**Input Sanitization & Validation**
```javascript
// Server-side validation with Zod
const bookingSchema = z.object({
  customerName: z.string().min(2).max(100).regex(/^[a-zA-Z\s'-]+$/),
  email: z.string().email().max(255),
  phone: z.string().regex(/^(\+639|09)\d{9}$/), // Philippine format
  service: z.enum(['Manicure', 'Pedicure', 'Mani+Pedi']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  notes: z.string().max(500).optional(),
  // Honeypot field
  website: z.string().max(0), // Should be empty
});
```

**Request Fingerprinting**
- Track device fingerprint (browser, OS, screen resolution)
- Flag suspicious patterns (same fingerprint, different IPs)
- Use libraries like FingerprintJS
- Store fingerprint hash with booking
- Helps identify coordinated bot attacks

#### Layer 5: Duplicate Prevention

**Check for Duplicate Bookings**
```javascript
// Before creating booking, check for duplicates
const duplicateCheck = await Booking.findOne({
  $or: [
    { email: requestData.email },
    { phone: requestData.phone }
  ],
  appointmentDate: requestData.date,
  appointmentTime: requestData.time,
  status: { $in: ['PENDING_VERIFICATION', 'PENDING_PAYMENT', 'CONFIRMED'] }
});

if (duplicateCheck) {
  return Response.json({
    error: "You already have a booking for this date and time.",
    existingBooking: duplicateCheck.bookingNumber
  }, { status: 400 });
}
```

#### Layer 6: Admin Approval Workflow

**Two-Stage Booking Process**
1. **Client Creates Booking** → Status: PENDING_VERIFICATION
2. **Client Verifies Email** → Status: PENDING_PAYMENT
3. **Admin Reviews Booking** → Can approve or reject
4. **Client Pays** → Upload proof
5. **Admin Confirms Payment** → Status: CONFIRMED

Benefits:
- Admin can reject suspicious bookings before confirmation
- Reduces wasted time slots from spam bookings
- Provides manual oversight layer

#### Layer 7: Blacklist Mechanism

**Automated Blacklist System**
```javascript
// Track suspicious behavior
const suspiciousActivity = {
  ipAddress: requestIP,
  reasons: [],
  score: 0
};

// Increment score for suspicious patterns
if (multipleFailedAttempts) suspiciousActivity.score += 10;
if (reCaptchaScore < 0.3) suspiciousActivity.score += 20;
if (honeypotFieldFilled) suspiciousActivity.score += 30;
if (rapidBookingAttempts) suspiciousActivity.score += 15;

// Auto-block if score exceeds threshold
if (suspiciousActivity.score >= 50) {
  await BlacklistIP.create({
    ipAddress: requestIP,
    reason: suspiciousActivity.reasons.join(', '),
    blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
}
```

**Manual Blacklist (Admin)**
- Admin dashboard with blacklist management
- Add email, phone, or IP to blacklist
- Set expiration time or permanent block
- View blacklist history and reason

#### Layer 8: File Upload Security

**Client Photo Upload Security**
- Signed URLs with 15-minute expiration
- Maximum 6 photos per booking (3 inspiration + 3 current state)
- Maximum 10MB per photo
- File type validation: JPEG, PNG, WebP, HEIC only
- Rate limit: 10 signature requests per hour per booking
- Automatic cleanup: Delete photos if booking cancelled/expired

#### Layer 9: Monitoring & Alerting

**Real-Time Monitoring**
- Track booking creation rate (bookings per minute)
- Alert admin if >10 bookings in 5 minutes (potential attack)
- Log all rejected bookings with reason
- Dashboard showing rejection statistics
- Email notification for suspicious patterns

**Metrics to Monitor:**
```javascript
{
  bookingsPerHour: number,
  rejectedByReCaptcha: number,
  rejectedByRateLimit: number,
  rejectedByHoneypot: number,
  duplicateAttempts: number,
  blacklistedIPs: number,
  averageReCaptchaScore: number
}
```

### Implementation Priority

**Phase 1: Essential (Week 7)**
1. ✅ Basic rate limiting (IP-based)
2. ✅ Input validation with Zod
3. ✅ Honeypot field
4. ✅ Email verification
5. ✅ Duplicate prevention

**Phase 2: Recommended (Week 8)**
6. ✅ Google reCAPTCHA v3
7. ✅ Request fingerprinting
8. ✅ Admin approval workflow
9. ✅ Basic monitoring

**Phase 3: Advanced (Week 9)**
10. ✅ Automated blacklist system
11. ✅ Phone verification (optional)
12. ✅ Advanced monitoring & alerts
13. ✅ Admin blacklist management dashboard

### Cost Analysis

| Security Measure | Cost | Effectiveness |
|-----------------|------|---------------|
| Google reCAPTCHA v3 | Free (1M/month) | High (blocks 90% bots) |
| Honeypot field | Free | Medium (simple bots) |
| Rate limiting (Upstash Redis) | Free (10K commands/day) | High |
| Email verification (Resend) | Free (100/day) | High |
| Phone verification (Twilio) | ~₱1/SMS | Very High |
| Request fingerprinting | Free (FingerprintJS Open Source) | Medium |
| IP blacklist | Free (database storage) | High |
| **Total Monthly Cost** | **₱0-500** | **Very High** |

### Security Testing Checklist

Before deployment, test these scenarios:

**Bot Prevention:**
- [ ] Submit form with honeypot field filled → Rejected
- [ ] Submit with reCAPTCHA score < 0.5 → Rejected
- [ ] Automated script attempts → Blocked

**Rate Limiting:**
- [ ] 4 bookings in 1 hour from same IP → 4th rejected
- [ ] 6 bookings in 1 day from same email → 6th rejected

**Verification:**
- [ ] Booking created without email verification → PENDING_VERIFICATION
- [ ] Booking not verified in 24 hours → Auto-cancelled

**Duplicate Prevention:**
- [ ] Same email + date + time → Rejected with helpful message
- [ ] Different email, same phone + date + time → Rejected

**Blacklist:**
- [ ] Blacklisted IP attempts booking → Rejected immediately
- [ ] Blacklisted email attempts booking → Rejected

**File Upload:**
- [ ] Expired signed URL (>15 min) → Upload fails
- [ ] 7th photo upload attempt → Rejected (max 6)
- [ ] 11MB photo → Rejected (max 10MB)

### Environment Variables for Security

```env
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...xyz
RECAPTCHA_SECRET_KEY=6Lc...xyz_secret

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# SMS Verification (Optional - Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+63...

# Fingerprinting (Optional - FingerprintJS Pro)
FINGERPRINT_API_KEY=...

# Security Settings
MAX_BOOKINGS_PER_IP_PER_HOUR=3
MAX_BOOKINGS_PER_EMAIL_PER_DAY=5
RECAPTCHA_THRESHOLD=0.5
HONEYPOT_FIELD_NAME=website
EMAIL_VERIFICATION_EXPIRY_HOURS=24
```

---

## Conclusion

This integration plan provides a comprehensive roadmap for implementing:

✅ **Dual file upload system** (admin payment proofs + client nail photos)  
✅ **Secure authentication** with NextAuth.js and JWT tokens  
✅ **Role-based access control** with 4 distinct user roles  
✅ **Comprehensive middleware validation** protecting all admin routes  
✅ **Extensive error handling** with user-friendly messages  
✅ **Complete testing strategy** covering all scenarios  

**Implementation Priority:**
1. Week 4: Database models and authentication
2. Week 5-6: API endpoints with middleware
3. Week 7: File upload integration (Cloudinary)
4. Week 8: Email and Google Sheets integration
5. Week 9: Security hardening and rate limiting
6. Week 10-11: Comprehensive testing
7. Week 12: Production deployment

**Estimated Development Time:** 12 weeks (3-4 developers)  
**Estimated Cost:** $0-12/month (first 6 months, free tier services)

---

**Document Status:** ✅ COMPLETE AND READY FOR SUBMISSION  
**Last Updated:** February 6, 2026  
**Prepared By:** Jennifer B. Cerio  
**Course:** MO-IT149 Web Technology Application
