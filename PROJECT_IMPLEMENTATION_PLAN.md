# Project Implementation Plan
## Glammed Nails by Jhen - Complete Integration Roadmap

**Project:** MO-IT149 Web Technology Application  
**Start Date:** February 10, 2026  
**Target Completion:** May 5, 2026 (12 weeks)  
**Team Size:** 3-4 developers  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Development Approach](#development-approach)
3. [Technology Stack](#technology-stack)
4. [Phase Breakdown](#phase-breakdown)
5. [Sprint Details](#sprint-details)
6. [Dependencies & Critical Path](#dependencies--critical-path)
7. [Risk Management](#risk-management)
8. [Quality Assurance](#quality-assurance)
9. [Deployment Strategy](#deployment-strategy)

---

## Project Overview

### Objectives
Build a complete nail appointment booking system with:
- ✅ Admin dashboard for managing bookings, clients, and nail techs
- ✅ Client-facing booking interface with photo uploads
- ✅ Payment proof management system
- ✅ Automated email notifications
- ✅ Google Sheets integration for pricing and backups
- ✅ Role-based access control (SUPER_ADMIN, ADMIN, MANAGER, STAFF)

### Success Criteria
- [ ] All CRUD operations functional for bookings, clients, nail techs
- [ ] Secure authentication and authorization working
- [ ] File uploads (admin payment proofs + client nail photos) operational
- [ ] Email notifications sending automatically
- [ ] Google Sheets sync working bidirectionally
- [ ] System handles 100+ concurrent users
- [ ] 99.9% uptime in production
- [ ] All security measures implemented
- [ ] Complete test coverage (>80%)

---

## Development Approach

### Methodology: Agile with 2-Week Sprints

**Why This Approach:**
1. **UI-First Development** - Validate designs and user flows early
2. **Iterative Integration** - Connect frontend to backend incrementally
3. **Continuous Testing** - Test each feature as it's built
4. **Risk Mitigation** - Address critical features first

### Team Structure

```
Frontend Lead (1 developer)
├── UI/UX Implementation
├── Component Development
└── Client-side Validation

Backend Lead (1 developer)
├── API Development
├── Database Design
└── External Integrations

Full-Stack Developer (1-2 developers)
├── Feature Integration
├── Testing
└── Deployment

DevOps/QA (Shared responsibility)
├── CI/CD Pipeline
├── Testing
└── Monitoring
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context + SWR for data fetching
- **Image Upload:** React Dropzone

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Next.js API Routes
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js v5
- **File Storage:** Cloudinary SDK
- **Email:** Resend API
- **Spreadsheets:** Google Sheets API (googleapis)
- **Validation:** Zod

### DevOps
- **Hosting:** Vercel (Frontend + API)
- **Database:** MongoDB Atlas
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + Sentry

---

## Phase Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT TIMELINE (12 WEEKS)                  │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: Foundation & UI (Weeks 1-3)                            │
│ Phase 2: Backend Core (Weeks 4-6)                              │
│ Phase 3: Integrations (Weeks 7-9)                              │
│ Phase 4: Testing & Polish (Weeks 10-11)                        │
│ Phase 5: Deployment & Launch (Week 12)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint Details

# PHASE 1: FOUNDATION & UI (Weeks 1-3)

## Sprint 1: Project Setup & Design System (Week 1)

### Goals
- Set up development environment
- Create design system and reusable components
- Build basic layouts and navigation

### Tasks

#### Day 1-2: Project Initialization
```bash
Priority: CRITICAL
Assigned: Full Team
```

**Tasks:**
- [x] Initialize Next.js project with TypeScript
  ```bash
  npx create-next-app@latest glammednails --typescript --tailwind --app
  ```
- [x] Set up Git repository and branching strategy
- [x] Configure ESLint, Prettier, and Husky pre-commit hooks
- [x] Create `.env.local` template with all required variables
- [x] Set up project folder structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   │   ├── login/
  │   │   └── layout.tsx
  │   ├── (admin)/
  │   │   ├── dashboard/
  │   │   ├── bookings/
  │   │   ├── clients/
  │   │   ├── nail-techs/
  │   │   └── layout.tsx
  │   └── api/
  ├── components/
  │   ├── ui/           # shadcn components
  │   ├── booking/
  │   ├── client/
  │   └── layout/
  ├── lib/
  │   ├── db/
  │   ├── utils/
  │   └── validations/
  └── types/
  ```
- [x] Install core dependencies:
  ```bash
  npm install mongoose next-auth@beta bcryptjs zod
  npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
  npm install react-hook-form @hookform/resolvers
  npm install -D @types/bcryptjs
  ```

**Deliverable:** Working Next.js project with proper structure

---

#### Day 3-4: Design System & UI Components
```bash
Priority: HIGH
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Install and configure shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Create color palette and typography system in `tailwind.config.ts`
- [ ] Add shadcn components:
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add table
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add select
  npx shadcn-ui@latest add calendar
  npx shadcn-ui@latest add form
  npx shadcn-ui@latest add badge
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add avatar
  npx shadcn-ui@latest add toast
  ```
- [ ] Create custom components:
  - `PageHeader` - Reusable page title with actions
  - `DataTable` - Reusable table with sorting/filtering
  - `LoadingSpinner` - Loading states
  - `EmptyState` - Empty list states
  - `StatusBadge` - Booking status badges
- [ ] Create layout components:
  - `AdminLayout` - Sidebar + header for admin pages
  - `Sidebar` - Navigation menu
  - `Header` - Top bar with user menu

**Deliverable:** Complete design system with reusable components

---

#### Day 5: Authentication UI
```bash
Priority: HIGH
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Create login page (`app/(auth)/login/page.tsx`)
  - Email and password fields
  - Form validation with Zod
  - Loading states
  - Error messages
- [ ] Create password reset request page
- [ ] Create password reset form page
- [ ] Style authentication pages with gradient background
- [ ] Add logo and branding

**Deliverable:** Complete authentication UI (no backend yet)

---

### Sprint 1 Deliverables
- ✅ Working Next.js project
- ✅ Design system with 15+ reusable components
- ✅ Authentication UI screens
- ✅ Admin layout structure

**Sprint Review Checklist:**
- [ ] All components documented with Storybook or examples
- [ ] Design system matches brand colors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Code passes linting and formatting checks

---

## Sprint 2: Dashboard & Booking UI (Week 2)

### Goals
- Build dashboard overview page
- Create booking management UI
- Implement time slot management (availability)
- Implement booking confirmation UI

### Tasks

#### Day 1-2: Dashboard Overview
```bash
Priority: HIGH
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Create dashboard page (`app/(admin)/dashboard/page.tsx`)
- [ ] Build stats cards component:
  - Today's bookings (count)
  - Today's revenue (amount)
  - New clients today (count)
  - Pending payments (count)
- [ ] Create recent activity feed component
- [ ] Add quick actions section
- [ ] Create revenue chart component (Chart.js or Recharts)
- [ ] Mock data for testing UI

**Deliverable:** Dashboard with stats and activity feed

---

#### Day 3-4: Booking List & Management
```bash
Priority: CRITICAL
Assigned: Frontend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Create bookings list page (`app/(admin)/bookings/page.tsx`)
- [ ] Build bookings data table:
  - Columns: Booking #, Client, Service, Date/Time, Status, Actions
  - Sortable columns
  - Status filter dropdown
  - Date range filter
  - Search by client name or booking number
- [ ] Add status badges with colors:
  - PENDING_PAYMENT (yellow)
  - CONFIRMED (green)
  - COMPLETED (blue)
  - CANCELLED (red)
  - NO_SHOW (gray)
- [ ] Create booking actions dropdown:
  - View details
  - Edit
  - Confirm payment
  - Cancel
  - Mark as completed/no-show
- [ ] Add pagination controls

**Deliverable:** Functional booking list with filters

---

#### Day 5: Time Slot Management UI
```bash
Priority: CRITICAL
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Create time slot management page (`app/(admin)/availability/page.tsx`)
- [ ] Build calendar view component:
  - Monthly calendar display
  - Date picker for quick navigation
  - Visual indicators for slot availability
- [ ] Build time slot creation form:
  - Date selection (single or range)
  - Time slot picker (start time, end time)
  - Nail tech assignment
  - Location (HOME/STUDIO)
  - Max bookings per slot
  - Recurring slot options (daily, weekly)
- [ ] Create time slot list view:
  - Filter by date range, nail tech, location
  - Show booked vs. available slots
  - Edit/delete slot actions
  - Bulk operations (delete multiple slots)
- [ ] Add slot conflict validation:
  - Check nail tech availability
  - Prevent overlapping slots
  - Show warnings for existing bookings
- [ ] Add form validation with React Hook Form + Zod
- [ ] Handle form submission (mock for now)

**Deliverable:** Complete time slot management UI

**Note:** Clients will book from available slots on the PUBLIC booking page (to be built in Phase 3)

---

### Sprint 2 Deliverables
- ✅ Dashboard with stats and charts
- ✅ Booking list with filters and search
- ✅ Time slot management UI
- ✅ Booking confirmation UI

**Sprint Review Checklist:**
- [ ] All forms have proper validation
- [ ] Loading states shown during data fetching
- [ ] Error states handled gracefully
- [ ] Mobile-responsive design
- [ ] Admin can create/manage time slots
- [ ] Admin can confirm client bookings

---

## Sprint 3: Client & Nail Tech UI (Week 3)

### Goals
- Build client management UI
- Create nail tech management UI
- Implement quotation/invoice UI

### Tasks

#### Day 1-2: Client Management
```bash
Priority: HIGH
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Create clients list page (`app/(admin)/clients/page.tsx`)
- [ ] Build clients data table:
  - Columns: Name, Email, Phone, Type, Total Bookings, Total Spent, Actions
  - Search by name, email, or phone
  - Filter by client type (NEW/REPEAT)
  - Sort by total spent, last visit
- [ ] Create client detail page (`app/(admin)/clients/[id]/page.tsx`)
  - Client info card
  - Booking history table
  - Stats (total spent, completed bookings, average booking value)
  - Edit button
- [ ] Create client form dialog:
  - Personal info (name, email, phone)
  - Address fields
  - Preferences (location, time)
  - Health info (allergies, skin sensitivity)
- [ ] Add client deletion confirmation dialog

**Deliverable:** Complete client management UI

---

#### Day 3: Nail Tech Management
```bash
Priority: MEDIUM
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Create nail techs list page (`app/(admin)/nail-techs/page.tsx`)
- [ ] Build nail techs data table:
  - Columns: Name, Email, Phone, Commission Rate, Status, Actions
  - Filter by active/inactive
- [ ] Create nail tech detail page:
  - Profile info
  - Stats (monthly earnings, completed bookings)
  - Schedule view (calendar of appointments)
  - Monthly earnings chart
- [ ] Create nail tech form dialog:
  - Name, email, phone
  - Commission rate slider (percentage)
  - Discount rate slider
  - Active/inactive toggle
- [ ] Add nail tech stats dashboard

**Deliverable:** Nail tech management interface

---

#### Day 4-5: Quotation/Invoice UI
```bash
Priority: MEDIUM
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Create quotation page (`app/(admin)/quotations/create/page.tsx`)
- [ ] Build quotation form:
  - Booking selection dropdown
  - Itemized services table (add/remove rows)
    - Description, quantity, unit price, total
  - Subtotal calculation
  - Discount percentage input
  - Total amount (auto-calculated)
  - Commission preview (nail tech share)
  - Salon revenue preview
  - Notes textarea
- [ ] Create quotation preview modal:
  - Professional invoice layout
  - Print button
  - Download PDF button (future)
  - Email to client button
- [ ] Create quotations list page:
  - Table with invoice number, client, amount, status
  - Search and filters
- [ ] Integrate Google Sheets pricing data:
  - Fetch services from Google Sheets
  - Populate dropdown with prices
  - Allow price override

**Deliverable:** Quotation/invoice creation system

---

### Sprint 3 Deliverables
- ✅ Client management (list, detail, CRUD)
- ✅ Nail tech management (list, detail, CRUD)
- ✅ Quotation/invoice system

**Sprint Review Checklist:**
- [ ] All CRUD operations have UI (backend pending)
- [ ] Forms validate properly
- [ ] Responsive on all screen sizes
- [ ] Navigation between pages works smoothly

---

# PHASE 2: BACKEND CORE (Weeks 4-6)

## Sprint 4: Database & Authentication (Week 4)

### Goals
- Set up MongoDB and create all models
- Implement authentication with NextAuth.js
- Connect login UI to backend

### Tasks

#### Day 1-2: Database Setup & Models
```bash
Priority: CRITICAL
Assigned: Backend Lead
```

**Tasks:**
- [ ] Set up MongoDB Atlas account and cluster
- [ ] Configure MongoDB connection in `lib/db/connection.ts`
- [ ] Create Mongoose models based on database plan:
  
  **User Model** (`lib/db/models/User.ts`)
  ```typescript
  - email (String, unique, required)
  - password (String, required, hashed)
  - name (String, required)
  - role (Enum: SUPER_ADMIN, ADMIN, MANAGER, STAFF)
  - isActive (Boolean, default: true)
  - lastLogin (Date)
  - createdAt, updatedAt (timestamps)
  ```
  
  **Client Model** (`lib/db/models/Client.ts`)
  ```typescript
  - firstName, lastName (String, required)
  - email (String, unique, required)
  - phone (String, unique, required)
  - address (Object: street, city, province, zipCode)
  - clientType (Enum: NEW, REPEAT, default: NEW)
  - totalBookings, completedBookings (Number, default: 0)
  - totalSpent (Number, default: 0)
  - lastVisit (Date)
  - preferences (Object: preferredLocation, preferredTime)
  - healthInfo (Object: allergies[], skinSensitivity)
  - isActive (Boolean, default: true)
  - createdAt, updatedAt
  ```
  
  **NailTech Model** (`lib/db/models/NailTech.ts`)
  ```typescript
  - name (String, required)
  - email (String, unique, required)
  - phone (String, required)
  - commissionRate (Number, required, default: 40)
  - discountRate (Number, default: 10)
  - isActive (Boolean, default: true)
  - createdAt, updatedAt
  ```
  
  **Service Model** (`lib/db/models/Service.ts`)
  ```typescript
  - name (String, unique, enum: Manicure, Pedicure, Mani+Pedi)
  - isActive (Boolean, default: true)
  - createdAt, updatedAt
  ```
  
  **TimeSlot Model** (`lib/db/models/TimeSlot.ts`)
  ```typescript
  - date (String, required, format: YYYY-MM-DD, indexed)
  - startTime (String, required, format: HH:MM)
  - endTime (String, required, format: HH:MM)
  - nailTech (ObjectId, ref: NailTech, required, indexed)
  - location (Enum: HOME, STUDIO, required)
  - maxBookings (Number, default: 1)
  - currentBookings (Number, default: 0)
  - isActive (Boolean, default: true)
  - isRecurring (Boolean, default: false)
  - recurringDays (Array of Numbers: 0-6 for Sun-Sat)
  - createdBy (ObjectId, ref: User)
  - createdAt, updatedAt
  - Compound Index: { date: 1, nailTech: 1 }
  - Validation: startTime < endTime, prevent overlapping slots
  ```
  
  **Booking Model** (`lib/db/models/Booking.ts`)
  ```typescript
  - bookingNumber (String, unique, required, indexed)
  - timeSlot (ObjectId, ref: TimeSlot, required, indexed)
  - client (ObjectId, ref: Client, required, indexed)
  - service (ObjectId, ref: Service, required, indexed)
  - nailTech (ObjectId, ref: NailTech, required, indexed)
  - appointmentDate (String, required, format: YYYY-MM-DD, indexed)
  - appointmentTime (String, required, format: HH:MM)
  - locationType (Enum: HOME, STUDIO, required)
  - address (String)
  - serviceDescription (String, required)
  - status (Enum: PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, indexed)
  - pricing (Object: totalPrice, reservationFee, balanceDue)
  - payment (Object: reservationPaid, paidAt, method, reference, proofUrl, proofPublicId)
  - clientPhotos (Object: inspiration[], currentState[])
  - specialRequests (String)
  - clientNotes (String)
  - adminNotes (String)
  - createdBy (ObjectId, ref: User)
  - confirmedBy (ObjectId, ref: User)
  - expiresAt (Date, indexed for TTL)
  - createdAt, updatedAt
  ```
  
  **QuotationInvoice Model** (`lib/db/models/QuotationInvoice.ts`)
  ```typescript
  - invoiceNumber (String, unique, required, indexed)
  - booking (ObjectId, ref: Booking, required)
  - client (ObjectId, ref: Client, required)
  - nailTech (ObjectId, ref: NailTech, required)
  - items (Array of Objects: description, quantity, unitPrice, totalPrice)
  - subtotal, discountPercentage, discountAmount, totalAmount (Number)
  - commissionRate, nailTechCommission, salonRevenue (Number)
  - notes (String)
  - createdBy (ObjectId, ref: User)
  - createdAt, updatedAt
  ```
  
  **Notification Model** (`lib/db/models/Notification.ts`)
  ```typescript
  - recipient (String, required)
  - type (Enum: EMAIL, SMS)
  - category (Enum: BOOKING_CONFIRMATION, PAYMENT_REMINDER, etc.)
  - subject (String)
  - content (String)
  - status (Enum: PENDING, SENT, FAILED)
  - sentAt (Date)
  - createdAt, updatedAt
  ```

- [ ] Add indexes to all models:
  ```typescript
  // Time slot availability checking
  TimeSlotSchema.index({ date: 1, nailTech: 1, isActive: 1 });
  
  // Booking lookup and filtering
  BookingSchema.index({ timeSlot: 1, status: 1 });
  BookingSchema.index({ appointmentDate: 1, nailTech: 1, status: 1 });
  
  // Text index for search
  ClientSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
  
  // Email uniqueness and lookup
  ClientSchema.index({ email: 1 }, { unique: true });
  ```

- [ ] Create database seeder script (`scripts/seed-database.ts`):
  - Create 1 super admin user
  - Create 3 nail techs
  - Create 3 services (Manicure, Pedicure, Mani+Pedi)
  - Create 10 sample clients
  - Create 15 time slots (various dates/times)
  - Create 20 sample bookings (linked to time slots)

- [ ] Test database connection and models

**Deliverable:** All database models created and tested

---

#### Day 3-4: Authentication Implementation
```bash
Priority: CRITICAL
Assigned: Backend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Install NextAuth.js and dependencies:
  ```bash
  npm install next-auth@beta
  ```

- [ ] Create NextAuth configuration (`app/api/auth/[...nextauth]/route.ts`):
  ```typescript
  - Credentials provider
  - JWT strategy
  - Session callback (include user role and id)
  - Sign-in callback (update lastLogin)
  - Configure cookies (httpOnly, secure in production)
  ```

- [ ] Create authentication utilities (`lib/auth/`):
  - `hash-password.ts` - bcrypt hashing
  - `verify-password.ts` - password verification
  - `get-session.ts` - Get current user session
  - `auth-options.ts` - NextAuth configuration

- [ ] Create authentication middleware (`middleware.ts`):
  ```typescript
  - Protect all /admin/* routes
  - Redirect to login if not authenticated
  - Check user isActive status
  ```

- [ ] Create role-based middleware (`lib/auth/role-middleware.ts`):
  ```typescript
  - requireRole(['ADMIN', 'SUPER_ADMIN'])
  - Check if user has required role
  - Return 403 if unauthorized
  ```

- [ ] Connect login UI to authentication:
  - Update login page to use NextAuth signIn
  - Handle login errors (invalid credentials, inactive account)
  - Redirect to dashboard on success
  - Show loading state during login

- [ ] Create auth API routes:
  - `/api/auth/session` - Get current session
  - `/api/auth/forgot-password` - Request password reset
  - `/api/auth/reset-password` - Reset password with token

- [ ] Test authentication flow:
  - Login with valid credentials
  - Login with invalid credentials
  - Session persistence
  - Logout
  - Protected routes redirect

**Deliverable:** Working authentication system

---

#### Day 5: Role-Based Access Control
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create RBAC utility functions (`lib/auth/rbac.ts`):
  ```typescript
  - canAccessRoute(userRole, route)
  - canPerformAction(userRole, action, resource)
  - getRolePermissions(role)
  ```

- [ ] Define permissions matrix:
  ```typescript
  SUPER_ADMIN: {
    users: ['create', 'read', 'update', 'delete'],
    timeSlots: ['create', 'read', 'update', 'delete'],
    bookings: ['read', 'update', 'delete', 'confirm'],  // NO create - clients create
    clients: ['create', 'read', 'update', 'delete'],
    nailTechs: ['create', 'read', 'update', 'delete'],
    reports: ['read', 'export']
  },
  ADMIN: {
    timeSlots: ['create', 'read', 'update', 'delete'],
    bookings: ['read', 'update', 'delete', 'confirm'],  // NO create - clients create
    clients: ['create', 'read', 'update'],
    nailTechs: ['create', 'read', 'update'],
    reports: ['read', 'export']
  },
  MANAGER: {
    timeSlots: ['read'],
    bookings: ['read'],
    clients: ['read'],
    nailTechs: ['read'],
    reports: ['read', 'export']
  },
  STAFF: {
    timeSlots: ['read'],
    bookings: ['read', 'update', 'markCompleted'],  // NO create - clients create
    clients: ['read']
  },
  PUBLIC: {
    timeSlots: ['read'],  // View available slots
    bookings: ['create']  // Clients create their own bookings
  }
  ```

- [ ] Implement UI-level role checks:
  - Hide/show buttons based on permissions
  - Disable actions user can't perform
  - Show role-appropriate navigation items

- [ ] Test RBAC:
  - Login as each role
  - Verify correct permissions
  - Test unauthorized access attempts

**Deliverable:** Complete RBAC system

---

### Sprint 4 Deliverables
- ✅ MongoDB connected with all models
- ✅ Authentication working with NextAuth.js
- ✅ Role-based access control implemented
- ✅ Login UI connected to backend

**Sprint Review Checklist:**
- [ ] All models have proper indexes
- [ ] Authentication flow works end-to-end
- [ ] Session persists across page refreshes
- [ ] Role restrictions enforced on UI and API

---

## Sprint 5: Booking & Client APIs (Week 5)

### Goals
- Implement booking CRUD APIs
- Implement client CRUD APIs
- Connect UI to backend APIs

### Tasks

#### Day 1-2: Booking APIs
```bash
Priority: CRITICAL
Assigned: Backend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Create booking API routes:

  **GET `/api/bookings`** - List bookings with filters
  ```typescript
  Query params: page, limit, status, search, dateFrom, dateTo, 
                serviceId, nailTechId, locationType
  Response: { bookings: [], pagination: {} }
  ```

  **GET `/api/bookings/[id]`** - Get single booking
  ```typescript
  Params: id
  Populate: client, service, nailTech
  Response: { booking: {} }
  ```

  **POST `/api/bookings`** - Create booking (PUBLIC - Client-side)
  ```typescript
  Body: { clientName, clientEmail, clientPhone, timeSlotId, 
          serviceId, specialRequests, inspirationPhotos[], 
          currentStatePhotos[] }
  Validation: Zod schema, rate limiting, CAPTCHA verification
  - Check time slot availability
  - Generate booking number (GN-YYYYMMDDXXX)
  - Set status to PENDING_PAYMENT
  - Set expiresAt (24 hours from creation)
  - Send confirmation email to client
  - Notify admin of new booking
  Response: { booking: {}, message: 'Booking created successfully' }
  Note: PUBLIC endpoint - no auth required. Security via rate limiting & CAPTCHA
  ```

  **PUT `/api/bookings/[id]`** - Update booking
  ```typescript
  Body: { appointmentDate, appointmentTime, serviceDescription, 
          totalPrice, adminNotes }
  Validation: Check if booking can be modified (not completed/cancelled)
  Response: { booking: {}, message: 'Booking updated' }
  ```

  **POST `/api/bookings/[id]/confirm-payment`** - Confirm payment
  ```typescript
  Body: { paymentMethod, reference, proofUrl, proofPublicId }
  Actions:
  - Update payment status
  - Change booking status to CONFIRMED
  - Send confirmation email
  - Backup to Google Sheets
  Response: { booking: {}, message: 'Payment confirmed' }
  ```

  **POST `/api/bookings/[id]/cancel`** - Cancel booking
  ```typescript
  Body: { reason, refundIssued }
  Actions:
  - Update status to CANCELLED
  - Send cancellation email
  Response: { booking: {}, message: 'Booking cancelled' }
  ```

- [ ] Create time slot API routes:

  **GET `/api/time-slots`** - List time slots (PUBLIC + ADMIN)
  ```typescript
  Query params: dateFrom, dateTo, nailTechId, available
  Response: { timeSlots: [{ id, date, startTime, endTime, 
                            nailTech, maxBookings, currentBookings, 
                            isAvailable }] }
  Note: PUBLIC endpoint - clients can view available slots
  ```

  **GET `/api/time-slots/available`** - Get only available slots (PUBLIC)
  ```typescript
  Query params: serviceId, date, nailTechId
  Response: { availableSlots: [] }
  Note: PUBLIC endpoint for client booking page
  ```

  **POST `/api/time-slots`** - Create time slot (ADMIN+)
  ```typescript
  Body: { date, startTime, endTime, nailTechId, location, 
          maxBookings, isRecurring, recurringDays[] }
  Validation: Check nail tech availability, prevent overlaps
  Actions:
  - Create slot(s) (single or recurring)
  - Validate no conflicts
  Response: { timeSlots: [], message: 'Time slot(s) created' }
  Auth: ADMIN or SUPER_ADMIN only
  ```

  **PUT `/api/time-slots/[id]`** - Update time slot (ADMIN+)
  ```typescript
  Body: { startTime, endTime, maxBookings, isActive }
  Validation: Check if slot has bookings, prevent conflicts
  Response: { timeSlot: {}, message: 'Time slot updated' }
  Auth: ADMIN or SUPER_ADMIN only
  ```

  **DELETE `/api/time-slots/[id]`** - Delete time slot (ADMIN+)
  ```typescript
  Validation: Cannot delete if slot has confirmed bookings
  Actions:
  - Notify clients if pending bookings exist
  - Delete slot
  Response: { message: 'Time slot deleted' }
  Auth: ADMIN or SUPER_ADMIN only
  ```

  **POST `/api/bookings/[id]/complete`** - Mark as completed
  ```typescript
  Body: { fullPaymentReceived, fullPaymentMethod, notes }
  Actions:
  - Update status to COMPLETED
  - Update client stats (completedBookings++, totalSpent +=)
  - Update nail tech stats
  - Change client type to REPEAT if first booking
  Response: { booking: {}, message: 'Booking completed' }
  ```

  **POST `/api/bookings/[id]/no-show`** - Mark as no-show
  ```typescript
  Body: { notes }
  Response: { booking: {}, message: 'Marked as no-show' }
  ```

  **POST `/api/bookings/check-availability`** - Check time slot
  ```typescript
  Body: { nailTechId, appointmentDate, appointmentTime }
  Response: { available: true/false, conflictingBooking: {} }
  ```

- [ ] Add validation middleware for all routes
- [ ] Add error handling with proper status codes
- [ ] Test all booking endpoints with Postman

**Deliverable:** Complete booking API

---

#### Day 3: Client APIs
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create client API routes:

  **GET `/api/clients`** - List clients
  ```typescript
  Query: page, limit, search, clientType, isActive, sortBy
  Search: firstName, lastName, email, phone
  Response: { clients: [], pagination: {} }
  ```

  **GET `/api/clients/[id]`** - Get single client
  ```typescript
  Params: id
  Response: { client: {} }
  ```

  **POST `/api/clients`** - Create client
  ```typescript
  Body: { firstName, lastName, email, phone, address, 
          preferences, healthInfo }
  Validation: Email and phone unique
  Response: { client: {}, message: 'Client created' }
  ```

  **PUT `/api/clients/[id]`** - Update client
  ```typescript
  Body: { phone, address, preferences, healthInfo }
  Response: { client: {}, message: 'Client updated' }
  ```

  **GET `/api/clients/[id]/bookings`** - Get client bookings
  ```typescript
  Query: page, limit, status
  Response: { bookings: [], pagination: {} }
  ```

  **DELETE `/api/clients/[id]`** - Delete client (SUPER_ADMIN only)
  ```typescript
  Check: No active bookings
  Response: { success: true, message: 'Client deleted' }
  ```

- [ ] Add input validation with Zod
- [ ] Test all client endpoints

**Deliverable:** Complete client API

---

#### Day 4: Connect Booking UI to API
```bash
Priority: CRITICAL
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Create API client utilities (`lib/api/`):
  - `bookings.ts` - Booking API calls
  - `clients.ts` - Client API calls
  - `fetch-wrapper.ts` - Wrapper with error handling

- [ ] Update booking list page:
  - Fetch bookings from API
  - Implement filters and search
  - Add pagination
  - Show loading states
  - Handle errors

- [ ] Update booking detail page:
  - Fetch booking data
  - Display all booking info
  - Add action buttons (confirm payment, cancel, etc.)

- [ ] Update booking creation form:
  - Fetch clients, services, nail techs from API
  - Check availability on date/time change
  - Submit booking to API
  - Show success message
  - Redirect to booking detail

- [ ] Add toast notifications for actions:
  - Success: "Payment confirmed successfully"
  - Success: "Time slot created successfully"
  - Error: "Failed to confirm payment"
  - Error: "Time slot conflict detected"

**Deliverable:** Booking management UI fully connected to API

---

#### Day 5: Connect Client UI to API
```bash
Priority: HIGH
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Update client list page:
  - Fetch clients from API
  - Implement search and filters
  - Add pagination
  - Show client stats

- [ ] Update client detail page:
  - Fetch client data and bookings
  - Display stats
  - Show booking history

- [ ] Update client form:
  - Submit to API
  - Handle validation errors
  - Show success message

- [ ] Add client deletion:
  - Confirmation dialog
  - Call delete API
  - Redirect to list

**Deliverable:** Client UI fully connected to API

---

### Sprint 5 Deliverables
- ✅ Complete booking CRUD API
- ✅ Complete client CRUD API
- ✅ Booking UI connected to backend
- ✅ Client UI connected to backend

**Sprint Review Checklist:**
- [ ] All API endpoints tested with Postman
- [ ] UI shows loading/error states properly
- [ ] Form validation works on both client and server
- [ ] Data persistence verified in MongoDB

---

## Sprint 6: Nail Tech & Dashboard APIs (Week 6)

### Goals
- Implement nail tech CRUD APIs
- Implement dashboard statistics API
- Connect remaining UI to backend

### Tasks

#### Day 1: Nail Tech APIs
```bash
Priority: MEDIUM
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create nail tech API routes:

  **GET `/api/nail-techs`** - List nail techs
  ```typescript
  Query: isActive
  Response: { nailTechs: [] }
  ```

  **GET `/api/nail-techs/[id]`** - Get single nail tech
  ```typescript
  Response: { nailTech: {} }
  ```

  **POST `/api/nail-techs`** - Create nail tech (ADMIN+)
  ```typescript
  Body: { name, email, phone, commissionRate, discountRate }
  Response: { nailTech: {}, message: 'Nail tech created' }
  ```

  **PUT `/api/nail-techs/[id]`** - Update nail tech (ADMIN+)
  ```typescript
  Body: { commissionRate, discountRate, phone, isActive }
  Response: { nailTech: {}, message: 'Nail tech updated' }
  ```

  **GET `/api/nail-techs/[id]/stats`** - Get nail tech stats
  ```typescript
  Query: period (month, quarter, year)
  Response: { 
    monthlyEarnings, completedBookings, averageBookingValue,
    monthlyBreakdown: [] 
  }
  ```

  **GET `/api/nail-techs/[id]/schedule`** - Get schedule
  ```typescript
  Query: startDate, endDate
  Response: { bookings: [] }
  ```

- [ ] Test all nail tech endpoints

**Deliverable:** Complete nail tech API

---

#### Day 2: Dashboard & Statistics APIs
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create dashboard API routes:

  **GET `/api/dashboard/stats`** - Dashboard statistics
  ```typescript
  Query: period (today, week, month)
  Response: {
    today: { bookings, revenue, newClients },
    week: { bookings, revenue },
    month: { bookings, revenue },
    pendingPayments: count,
    averageBookingValue: number
  }
  ```

  **GET `/api/dashboard/activity`** - Recent activity
  ```typescript
  Query: limit
  Response: { 
    activities: [
      { type, description, user, timestamp }
    ] 
  }
  ```

  **GET `/api/dashboard/revenue-chart`** - Revenue data for charts
  ```typescript
  Query: period, groupBy (day, week, month)
  Response: { 
    labels: [], 
    data: [], 
    total: number 
  }
  ```

- [ ] Create reports API routes:

  **GET `/api/reports/revenue`** - Revenue report
  ```typescript
  Query: startDate, endDate, groupBy
  Response: {
    totalRevenue, totalBookings, avgBookingValue,
    dailyRevenue: [], byService: [], byLocation: []
  }
  ```

  **GET `/api/reports/bookings`** - Booking statistics
  ```typescript
  Query: startDate, endDate
  Response: {
    totalBookings, statusBreakdown: {},
    cancellationRate, noShowRate, conversionRate,
    peakHours: [], peakDays: []
  }
  ```

  **GET `/api/reports/clients`** - Client analytics
  ```typescript
  Query: startDate, endDate
  Response: {
    totalClients, newClients, repeatClients,
    retentionRate, averageLifetimeValue,
    topClients: []
  }
  ```

- [ ] Implement aggregation pipelines for efficient queries
- [ ] Cache dashboard stats (5 minutes TTL)

**Deliverable:** Dashboard and reports APIs

---

#### Day 3: Service & Quotation APIs
```bash
Priority: MEDIUM
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create service API routes:

  **GET `/api/services`** - List services
  ```typescript
  Query: isActive
  Response: { services: [] }
  ```

  **PUT `/api/services/[id]`** - Update service status (ADMIN+)
  ```typescript
  Body: { isActive }
  Response: { service: {}, message: 'Service updated' }
  ```

- [ ] Create quotation API routes:

  **GET `/api/quotations`** - List quotations
  ```typescript
  Query: page, limit, bookingId, clientId
  Response: { quotations: [], pagination: {} }
  ```

  **GET `/api/quotations/[id]`** - Get single quotation
  ```typescript
  Populate: booking, client, nailTech
  Response: { quotation: {} }
  ```

  **POST `/api/quotations`** - Create quotation
  ```typescript
  Body: {
    bookingId,
    items: [{ description, quantity, unitPrice }],
    discountPercentage,
    notes
  }
  Actions:
  - Calculate subtotal, discount, total
  - Calculate nail tech commission
  - Generate invoice number (INV-YYYYMMDDXXX)
  Response: { quotation: {}, message: 'Quotation created' }
  ```

- [ ] Test quotation endpoints

**Deliverable:** Service and quotation APIs

---

#### Day 4-5: Connect Remaining UI
```bash
Priority: HIGH
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Connect dashboard to API:
  - Fetch and display stats
  - Render revenue chart
  - Show recent activity
  - Add refresh button

- [ ] Connect nail tech UI:
  - List page fetches from API
  - Detail page shows stats and schedule
  - Form submits to API
  - Add loading states

- [ ] Connect quotation UI:
  - Fetch Google Sheets pricing data
  - Create quotation submits to API
  - List page shows all quotations
  - Detail page shows invoice preview

- [ ] Add error boundaries for graceful error handling

- [ ] Add SWR for data fetching and caching:
  ```bash
  npm install swr
  ```
  ```typescript
  // Example: Auto-refresh dashboard every 30s
  const { data, error, isLoading } = useSWR(
    '/api/dashboard/stats',
    fetcher,
    { refreshInterval: 30000 }
  );
  ```

**Deliverable:** All UI connected to backend

---

### Sprint 6 Deliverables
- ✅ Nail tech CRUD API
- ✅ Dashboard statistics API
- ✅ Reports API
- ✅ All UI screens connected to backend
- ✅ Working end-to-end application (minus integrations)

**Sprint Review Checklist:**
- [ ] Can create, view, update bookings through UI
- [ ] Can manage clients and nail techs
- [ ] Dashboard shows real data
- [ ] All forms submit successfully
- [ ] Error handling works properly

---

## Sprint 6.5: CLIENT-SIDE Public Booking Page (Week 6.5)

### Goals
- Build public-facing booking page for clients
- Implement time slot selection UI
- Create booking form for clients
- Add client-side photo uploads

### Tasks

#### Day 1-2: Public Booking Page UI
```bash
Priority: CRITICAL
Assigned: Frontend Lead
```

**Tasks:**
- [ ] Create public booking page (`app/book/page.tsx`)
- [ ] Build hero section:
  - Welcome message
  - Service highlights
  - Call-to-action
- [ ] Create time slot selection component:
  - Calendar view showing available dates
  - Time slot grid (showing available slots per day)
  - Visual indication of booked vs. available
  - Real-time availability check
- [ ] Build service selection:
  - Service cards with images
  - Price display
  - Service description
  - Add-ons selection

**Deliverable:** Public booking page with time slot selection

---

#### Day 3-4: Client Booking Form
```bash
Priority: CRITICAL
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Create multi-step booking form:
  - Step 1: Select Service & Time Slot
    - Service dropdown
    - Date picker
    - Time slot selection
  - Step 2: Client Information
    - Name (required)
    - Email (required)
    - Phone (required)
    - Special requests (optional)
  - Step 3: Upload Photos
    - Inspiration photos (up to 3)
    - Current nail state photos (up to 3)
    - Drag & drop interface
    - Image preview
    - Client-side validation (file size, type)
  - Step 4: Review & Submit
    - Booking summary
    - Total price display
    - Terms & conditions checkbox
    - CAPTCHA verification
- [ ] Add form validation with React Hook Form + Zod:
  - Email format validation
  - Phone number validation
  - Required field validation
  - File size/type validation
- [ ] Implement CAPTCHA:
  - Google reCAPTCHA v3
  - Verify token on submission
- [ ] Add loading states and success page:
  - Submission loading spinner
  - Success page with booking details
  - Confirmation email notice

**Deliverable:** Complete client booking flow

---

#### Day 5: Security & Rate Limiting
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Implement rate limiting for public booking endpoint:
  - 5 bookings per IP per hour
  - 3 bookings per email per day
  - Exponential backoff on repeated attempts
- [ ] Add CAPTCHA verification:
  - Verify reCAPTCHA token server-side
  - Block submissions without valid token
  - Log suspicious activity
- [ ] Add honeypot fields:
  - Hidden fields to catch bots
  - Reject submissions with honeypot data
- [ ] Implement input sanitization:
  - Sanitize all text inputs
  - Validate file uploads
  - Check for XSS attempts
- [ ] Add booking validation:
  - Check time slot still available
  - Prevent duplicate bookings
  - Validate service availability
- [ ] Create admin notification system:
  - Email admin on new booking
  - Dashboard notification badge
  - Real-time updates (optional)

**Deliverable:** Secure public booking system

---

### Sprint 6.5 Deliverables
- ✅ Public booking page live
- ✅ Clients can book appointments
- ✅ Time slot availability shown in real-time
- ✅ Photo uploads work for clients
- ✅ Rate limiting and security implemented
- ✅ Admin receives notifications for new bookings

**Sprint Review Checklist:**
- [ ] Public booking page accessible without login
- [ ] Time slots show correct availability
- [ ] Client can upload inspiration photos
- [ ] Form validation works correctly
- [ ] CAPTCHA prevents spam submissions
- [ ] Rate limiting blocks excessive requests
- [ ] Admin receives notification email
- [ ] Booking appears in admin dashboard
- [ ] Mobile-responsive design
- [ ] Success page shows booking confirmation

---

# PHASE 3: INTEGRATIONS (Weeks 7-9)

## Sprint 7: File Upload Integration (Week 7)

### Goals
- Integrate Cloudinary for file uploads
- Implement admin payment proof uploads
- Implement client nail photo uploads

### Tasks

#### Day 1-2: Cloudinary Setup & Admin Uploads
```bash
Priority: CRITICAL
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create Cloudinary account and configure:
  - Get Cloud Name, API Key, API Secret
  - Create `payment_proofs` upload preset:
    ```
    Folder: payment_proofs
    Max size: 5MB
    Formats: jpg, png, webp
    Transformation: max width 1500px, quality auto:good
    ```

- [ ] Install Cloudinary SDK:
  ```bash
  npm install cloudinary
  ```

- [ ] Create Cloudinary utility (`lib/cloudinary.ts`):
  ```typescript
  - configureCloudinary()
  - uploadImage(file, folder)
  - deleteImage(publicId)
  - generateSignature(params)
  ```

- [ ] Create admin upload API:
  **POST `/api/integrations/storage/upload-payment`**
  ```typescript
  Middleware: Auth + Admin role
  Body: multipart/form-data (file, bookingId)
  Actions:
  - Validate file (type, size)
  - Upload to Cloudinary
  - Delete old payment proof if exists
  - Update booking.payment.paymentProofUrl
  Response: { url, publicId, message }
  ```

  **DELETE `/api/integrations/storage/delete`**
  ```typescript
  Middleware: Auth + Admin role
  Body: { publicId }
  Actions:
  - Delete from Cloudinary
  - Update database
  Response: { success, message }
  ```

- [ ] Install file upload library:
  ```bash
  npm install react-dropzone
  ```

- [ ] Create upload component (`components/UploadPaymentProof.tsx`):
  - Drag-and-drop area
  - File type validation
  - Size validation
  - Preview image
  - Upload progress
  - Error handling

- [ ] Integrate upload in confirm payment flow:
  - Add upload button to confirm payment dialog
  - Upload proof before confirming
  - Show uploaded image in booking detail

- [ ] Test admin upload flow end-to-end

**Deliverable:** Admin payment proof upload working

---

#### Day 3-4: Client Photo Uploads
```bash
Priority: HIGH
Assigned: Backend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Create `nail_photos` Cloudinary preset:
  ```
  Folder: nail_photos
  Max size: 10MB
  Formats: jpg, png, webp, heic
  Transformation: max width 2000px, quality auto:eco
  Eager: thumbnail 300x300px
  ```

- [ ] Create client upload API:
  **POST `/api/integrations/storage/generate-signature`**
  ```typescript
  Body: { bookingId, photoType: 'inspiration' | 'currentState' }
  Validation:
  - Booking exists
  - Photo limit not exceeded (3 per type)
  Actions:
  - Generate Cloudinary signature
  - Set expiration (15 minutes)
  Response: {
    signature, timestamp, cloudName, apiKey,
    uploadPreset, folder, expiresIn
  }
  ```

  **POST `/api/bookings/[id]/add-photo`**
  ```typescript
  Body: { photoType, url, publicId, thumbnailUrl }
  Validation:
  - Photo limit check
  Actions:
  - Add photo to booking.clientPhotos array
  Response: { success, photoId, message }
  ```

  **DELETE `/api/bookings/[id]/remove-photo`**
  ```typescript
  Body: { photoId }
  Actions:
  - Remove from booking
  - Delete from Cloudinary
  Response: { success, message }
  ```

- [ ] Create client upload component (`components/NailPhotoUpload.tsx`):
  - Support inspiration and current state photos
  - Multi-file upload (up to 3 each)
  - Thumbnail previews
  - Remove photo button
  - Upload progress for each file
  - Client-side validation

- [ ] Integrate in client booking form (public page):
  - Add photo upload section
  - Show uploaded photos
  - Allow removal before submission

- [ ] Create photo gallery component for booking detail:
  - Display inspiration photos
  - Display current state photos
  - Lightbox for full-size view
  - Download button

- [ ] Test client upload flow:
  - Upload from booking form
  - View in booking detail
  - Delete photos

**Deliverable:** Client nail photo upload working

---

#### Day 5: Auto-Cleanup Implementation
```bash
Priority: MEDIUM
Assigned: Backend Lead
```

**Tasks:**
- [ ] Install cron library:
  ```bash
  npm install node-cron
  ```

- [ ] Create cleanup script (`lib/jobs/cleanup-photos.ts`):
  ```typescript
  // Run daily at 2 AM
  // Find completed bookings older than 30 days
  // Delete client photos from Cloudinary
  // Update booking record
  ```

- [ ] Create API route to trigger cleanup manually:
  **POST `/api/admin/cleanup-photos`** (SUPER_ADMIN only)
  ```typescript
  Response: { deletedCount, message }
  ```

- [ ] Schedule cron job in production:
  - Configure Vercel Cron
  - Or use external scheduler (EasyCron, cron-job.org)

- [ ] Add cleanup status to admin dashboard

- [ ] Test cleanup job:
  - Create test bookings with old dates
  - Run cleanup manually
  - Verify photos deleted

**Deliverable:** Auto-cleanup working

---

### Sprint 7 Deliverables
- ✅ Cloudinary integrated
- ✅ Admin payment proof upload working
- ✅ Client nail photo upload working
- ✅ Auto-cleanup implemented

**Sprint Review Checklist:**
- [ ] Admin can upload payment proofs
- [ ] Clients can upload nail photos during booking
- [ ] Photos display in booking detail
- [ ] Old photos auto-delete after 30 days
- [ ] All uploads are secure and validated

---

## Sprint 8: Email & Google Sheets Integration (Week 8)

### Goals
- Integrate Resend for email notifications
- Integrate Google Sheets for pricing and backups
- Implement automated email triggers

### Tasks

#### Day 1-2: Email Integration
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create Resend account:
  - Sign up at resend.com
  - Verify domain (or use test mode)
  - Get API key

- [ ] Install Resend SDK:
  ```bash
  npm install resend
  ```

- [ ] Create email utility (`lib/email/`):
  - `resend-client.ts` - Resend configuration
  - `email-templates.ts` - HTML email templates
  - `send-email.ts` - Send email function

- [ ] Create email templates:
  1. **Booking Confirmation**
     - Subject: "Booking Confirmation - {bookingNumber}"
     - Content: Booking details, date/time, nail tech, address
  
  2. **Payment Reminder**
     - Subject: "Payment Reminder - {bookingNumber}"
     - Content: Reminder to pay within 24 hours
  
  3. **Payment Confirmed**
     - Subject: "Payment Received - {bookingNumber}"
     - Content: Confirmation of payment, appointment details
  
  4. **Appointment Reminder**
     - Subject: "Appointment Tomorrow - {bookingNumber}"
     - Content: Reminder 24 hours before appointment
  
  5. **Cancellation Notice**
     - Subject: "Booking Cancelled - {bookingNumber}"
     - Content: Cancellation confirmation, reason

- [ ] Create email API routes:
  **POST `/api/integrations/email/send`**
  ```typescript
  Middleware: Auth
  Body: { to, subject, template, data }
  Response: { messageId, sentAt, message }
  ```

- [ ] Integrate email sending in booking flow:
  - Send confirmation email on booking creation
  - Send payment confirmation on payment confirm
  - Send cancellation email on cancellation

- [ ] Create notification log:
  - Save to Notifications collection
  - Track sent/failed emails
  - Store messageId from Resend

- [ ] Test email sending:
  - Test all templates
  - Verify emails received
  - Check spam folder
  - Test error handling

**Deliverable:** Email notifications working

---

#### Day 3-4: Google Sheets Integration
```bash
Priority: HIGH
Assigned: Backend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Set up Google Cloud Project:
  - Create project
  - Enable Google Sheets API
  - Create Service Account
  - Download credentials JSON

- [ ] Install Google Sheets SDK:
  ```bash
  npm install googleapis
  ```

- [ ] Create Google Sheets utility (`lib/google-sheets/`):
  - `sheets-client.ts` - Google Sheets configuration
  - `fetch-pricing.ts` - Read pricing data
  - `backup-booking.ts` - Write booking to sheet

- [ ] Create pricing spreadsheet:
  - Sheet name: "Pricing"
  - Columns: Service Name | Price | Location | Notes
  - Share with service account email

- [ ] Create bookings backup spreadsheet:
  - Sheet name: "Bookings"
  - Columns: Booking # | Client | Service | Date | Time | Status | Total Price | Created At

- [ ] Create Google Sheets API routes:
  **GET `/api/integrations/google-sheets/pricing`**
  ```typescript
  Actions:
  - Fetch pricing from sheet
  - Cache for 1 hour
  Response: {
    services: [{ service, price, location, notes }],
    lastUpdated
  }
  ```

  **POST `/api/integrations/google-sheets/backup`**
  ```typescript
  Body: { bookingId }
  Actions:
  - Get booking data
  - Append row to Bookings sheet
  Response: { sheetUrl, rowNumber, message }
  ```

- [ ] Integrate pricing in quotation:
  - Fetch pricing when creating quotation
  - Auto-populate service prices
  - Allow manual override

- [ ] Auto-backup bookings:
  - Backup on booking creation
  - Backup on status change
  - Add backup status to booking model

- [ ] Test Google Sheets integration:
  - Fetch pricing data
  - Create quotation with pricing
  - Backup booking
  - Verify data in sheets

**Deliverable:** Google Sheets integration working

---

#### Day 5: Automated Email Triggers
```bash
Priority: MEDIUM
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create automated email jobs:
  1. **Payment Reminder Job** (`lib/jobs/payment-reminder.ts`)
     ```typescript
     // Run every hour
     // Find PENDING_PAYMENT bookings created 12 hours ago
     // Send payment reminder email
     ```

  2. **Appointment Reminder Job** (`lib/jobs/appointment-reminder.ts`)
     ```typescript
     // Run every hour
     // Find CONFIRMED bookings with appointmentDate = tomorrow
     // Send appointment reminder
     ```

  3. **Auto-Cancel Job** (`lib/jobs/auto-cancel.ts`)
     ```typescript
     // Run every hour
     // Find PENDING_PAYMENT bookings with expiresAt < now
     // Cancel booking
     // Send cancellation email
     ```

- [ ] Create cron job runner (`lib/jobs/scheduler.ts`):
  - Schedule all jobs
  - Log execution
  - Error handling

- [ ] Create API routes to trigger jobs manually (SUPER_ADMIN):
  **POST `/api/admin/jobs/payment-reminder`**
  **POST `/api/admin/jobs/appointment-reminder`**
  **POST `/api/admin/jobs/auto-cancel`**

- [ ] Add job status to admin dashboard:
  - Last run time
  - Success/failure count
  - Trigger manually button

- [ ] Test automated emails:
  - Create test bookings (via client form)
  - Manually trigger jobs
  - Verify emails sent
  - Check notification logs

**Deliverable:** Automated email triggers working

---

### Sprint 8 Deliverables
- ✅ Resend email integration working
- ✅ All email templates created
- ✅ Google Sheets pricing integration
- ✅ Google Sheets backup working
- ✅ Automated email jobs running

**Sprint Review Checklist:**
- [ ] Emails sent for all booking actions
- [ ] Pricing data fetched from Google Sheets
- [ ] Bookings backed up to Google Sheets
- [ ] Automated reminders working
- [ ] Auto-cancel expired bookings

---

## Sprint 9: Rate Limiting & Security (Week 9)

### Goals
- Implement rate limiting
- Add security headers and CORS
- Implement audit logging
- Security testing

### Tasks

#### Day 1-2: Rate Limiting
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Install rate limiting library:
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```
  Or use in-memory solution:
  ```bash
  npm install express-rate-limit
  ```

- [ ] Create rate limit utility (`lib/rate-limit.ts`):
  ```typescript
  - createRateLimiter(requests, window, identifier)
  - checkRateLimit(identifier)
  ```

- [ ] Apply rate limiting to APIs:
  1. **Authentication endpoints:**
     - Login: 5 requests/minute per IP
     - Password reset: 3 requests/hour per email

  2. **Public endpoints:**
     - API routes: 100 requests/15 minutes per IP

  3. **Upload endpoints:**
     - Admin uploads: 100/hour per user
     - Client signature requests: 10/hour per booking

  4. **Export endpoints:**
     - Reports export: 20/hour per user

- [ ] Add rate limit headers to responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1707224400
  ```

- [ ] Create rate limit exceeded response:
  ```typescript
  Status: 429 Too Many Requests
  Body: {
    error: "Too many requests",
    retryAfter: 60
  }
  ```

- [ ] Test rate limiting:
  - Exceed limits
  - Verify 429 responses
  - Check reset times

**Deliverable:** Rate limiting on all endpoints

---

#### Day 3: Security Headers & CORS
```bash
Priority: HIGH
Assigned: Backend Lead
```

**Tasks:**
- [ ] Configure security headers in `middleware.ts`:
  ```typescript
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: (configure based on needs)
  ```

- [ ] Configure CORS:
  ```typescript
  // Allow only your domain in production
  Access-Control-Allow-Origin: https://glamnails.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Allow-Credentials: true
  ```

- [ ] Add Cloudinary domain to CSP:
  ```
  img-src 'self' https://res.cloudinary.com;
  ```

- [ ] Test security headers:
  - Use securityheaders.com
  - Verify CSP not blocking resources
  - Test CORS from different origins

**Deliverable:** Security headers configured

---

#### Day 4: Audit Logging
```bash
Priority: MEDIUM
Assigned: Backend Lead
```

**Tasks:**
- [ ] Create AuditLog model (`lib/db/models/AuditLog.ts`):
  ```typescript
  - user (ObjectId, ref: User)
  - action (String: CREATE, UPDATE, DELETE, LOGIN, etc.)
  - resource (String: Booking, Client, etc.)
  - resourceId (String)
  - changes (Object: before, after)
  - ipAddress (String)
  - userAgent (String)
  - timestamp (Date)
  ```

- [ ] Create audit utility (`lib/audit/log-action.ts`):
  ```typescript
  function logAction(params: {
    userId, action, resource, resourceId,
    changes, req
  })
  ```

- [ ] Add audit logging to critical operations:
  - User login/logout
  - Time slot create/update/delete
  - Booking update/delete (clients create bookings)
  - Client delete
  - Payment confirmation
  - Nail tech commission rate change
  - User role change

- [ ] Create audit log viewer (admin UI):
  - `/admin/audit-logs` page
  - Filter by user, action, resource, date
  - Search functionality
  - Export audit logs

- [ ] Test audit logging:
  - Perform various actions
  - Verify logs created
  - Check all fields populated

**Deliverable:** Audit logging implemented

---

#### Day 5: Security Testing & Hardening
```bash
Priority: HIGH
Assigned: Full Team
```

**Tasks:**
- [ ] Security testing checklist:
  - [ ] SQL injection attempts (should fail - using Mongoose)
  - [ ] XSS attempts (React escapes by default)
  - [ ] CSRF attacks (NextAuth includes protection)
  - [ ] Unauthorized API access (middleware should block)
  - [ ] Role escalation attempts (RBAC should prevent)
  - [ ] File upload malicious files (validation should block)
  - [ ] Brute force login attempts (rate limiting should block)
  - [ ] Session hijacking (httpOnly cookies)
  - [ ] JWT token tampering (signature validation)

- [ ] Use security scanning tools:
  - [ ] OWASP ZAP scan
  - [ ] npm audit
  - [ ] Snyk vulnerability scan

- [ ] Fix any discovered vulnerabilities

- [ ] Create security documentation:
  - Security measures implemented
  - Known limitations
  - Recommendations for production

- [ ] Penetration testing (if budget allows)

**Deliverable:** Security tested and hardened

---

### Sprint 9 Deliverables
- ✅ Rate limiting on all endpoints
- ✅ Security headers configured
- ✅ CORS properly set up
- ✅ Audit logging implemented
- ✅ Security testing completed

**Sprint Review Checklist:**
- [ ] Rate limits prevent abuse
- [ ] Security headers pass online scanners
- [ ] Audit logs capture all critical actions
- [ ] No high-severity vulnerabilities
- [ ] Security documentation complete

---

# PHASE 4: TESTING & POLISH (Weeks 10-11)

## Sprint 10: Testing & Bug Fixes (Week 10)

### Goals
- Write comprehensive tests
- Fix all bugs
- Performance optimization
- Code cleanup

### Tasks

#### Day 1-2: Unit & Integration Tests
```bash
Priority: HIGH
Assigned: Full Team
```

**Tasks:**
- [ ] Set up testing framework:
  ```bash
  npm install -D jest @testing-library/react @testing-library/jest-dom
  npm install -D @testing-library/user-event
  npm install -D jest-environment-jsdom
  ```

- [ ] Configure Jest (`jest.config.js`)

- [ ] Write unit tests for utilities:
  - `lib/utils/` - Helper functions
  - `lib/auth/` - Authentication utilities
  - `lib/validations/` - Zod schemas

- [ ] Write unit tests for components:
  - Form components
  - Button interactions
  - Data display components

- [ ] Write API integration tests:
  - Booking CRUD operations
  - Client CRUD operations
  - Authentication flow
  - File uploads
  - Email sending
  - Google Sheets integration

- [ ] Target: 80% code coverage

- [ ] Run tests in CI:
  - Add to GitHub Actions
  - Fail build on test failures

**Deliverable:** Comprehensive test suite

---

#### Day 3: End-to-End Tests
```bash
Priority: HIGH
Assigned: Full-Stack Dev + QA
```

**Tasks:**
- [ ] Install Playwright:
  ```bash
  npm install -D @playwright/test
  ```

- [ ] Write E2E test scenarios:
  1. **Client Booking → Admin Confirms Payment**
     - Client navigates to public booking page
     - Client selects available time slot
     - Fill form with client details
     - Upload inspiration and current state photos
     - Submit booking
     - Verify booking confirmation email sent
     - Admin logs in
     - Admin views new booking in list
     - Admin confirms payment with proof upload
     - Verify status changes to CONFIRMED

  2. **View Dashboard → Generate Report**
     - Login as admin
     - View dashboard stats
     - Navigate to reports
     - Generate revenue report
     - Export report

  3. **Manage Clients → View Booking History**
     - Create new client
     - View client detail
     - Check booking history
     - Update client info

  4. **Admin Creates Time Slot → Client Books**
     - Admin creates available time slot
     - Client selects slot and books
     - Admin confirms booking
     - Add itemized services
     - Apply discount
     - Preview invoice

  5. **Automated Job Execution**
     - Client creates booking (via public form)
     - Wait for expiration (or mock time)
     - Trigger auto-cancel job
     - Verify booking cancelled
     - Verify email sent

- [ ] Run E2E tests in CI

**Deliverable:** E2E test suite covering critical paths

---

#### Day 4: Bug Bash & Fixes
```bash
Priority: CRITICAL
Assigned: Full Team
```

**Tasks:**
- [ ] Conduct bug bash session:
  - Each team member tests for 2 hours
  - Document all bugs found
  - Prioritize by severity

- [ ] Fix critical bugs (P0):
  - Blocking functionality
  - Data loss issues
  - Security vulnerabilities

- [ ] Fix high-priority bugs (P1):
  - Major features broken
  - Poor UX
  - Performance issues

- [ ] Fix medium-priority bugs (P2):
  - Minor issues
  - Edge cases

- [ ] Document known issues (P3):
  - Low-priority bugs
  - Future enhancements

- [ ] Regression testing after fixes

**Deliverable:** All critical and high-priority bugs fixed

---

#### Day 5: Performance Optimization
```bash
Priority: HIGH
Assigned: Backend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] Run performance audit:
  - Lighthouse score for admin pages
  - API response times
  - Database query performance

- [ ] Optimize frontend:
  - [ ] Code splitting for routes
  - [ ] Lazy load images
  - [ ] Optimize bundle size
  - [ ] Add React.memo where needed
  - [ ] Optimize re-renders

- [ ] Optimize backend:
  - [ ] Add database indexes
  - [ ] Optimize slow queries (use explain)
  - [ ] Add caching for frequently accessed data
  - [ ] Implement connection pooling
  - [ ] Compress API responses

- [ ] Optimize images:
  - [ ] Use Next.js Image component
  - [ ] Lazy load gallery images
  - [ ] Use Cloudinary transformations

- [ ] Target metrics:
  - [ ] Lighthouse score >90
  - [ ] API responses <500ms (95th percentile)
  - [ ] First Contentful Paint <2s
  - [ ] Time to Interactive <3.5s

**Deliverable:** Optimized application

---

### Sprint 10 Deliverables
- ✅ 80% test coverage
- ✅ E2E tests for critical flows
- ✅ All P0/P1 bugs fixed
- ✅ Performance optimized

**Sprint Review Checklist:**
- [ ] All tests passing
- [ ] No critical bugs remaining
- [ ] Performance metrics met
- [ ] Application feels fast and responsive

---

## Sprint 11: Polish & Documentation (Week 11)

### Goals
- UI/UX polish
- Complete documentation
- User training materials
- Pre-launch preparation

### Tasks

#### Day 1-2: UI/UX Polish
```bash
Priority: MEDIUM
Assigned: Frontend Lead + Full-Stack Dev
```

**Tasks:**
- [ ] UI consistency review:
  - Consistent spacing and padding
  - Consistent button styles
  - Consistent form layouts
  - Consistent error messages

- [ ] Improve loading states:
  - Skeleton screens for data loading
  - Smooth transitions
  - Progress indicators

- [ ] Improve error states:
  - Friendly error messages
  - Actionable error states
  - Fallback UI for failures

- [ ] Accessibility improvements:
  - Keyboard navigation
  - ARIA labels
  - Focus indicators
  - Color contrast (WCAG AA)

- [ ] Mobile optimization:
  - Test on real devices
  - Fix layout issues
  - Improve touch targets
  - Optimize for slow networks

- [ ] Add animations and micro-interactions:
  - Button hover effects
  - Page transitions
  - Toast notifications
  - Loading spinners

**Deliverable:** Polished, professional UI

---

#### Day 3: Documentation
```bash
Priority: HIGH
Assigned: Full Team (divide sections)
```

**Tasks:**
- [ ] Technical documentation:
  - **API Documentation** (api-docs.md)
    - All endpoints documented
    - Request/response examples
    - Authentication requirements
    - Error codes
  
  - **Database Schema** (database-schema.md)
    - All models documented
    - Relationships explained
    - Indexes listed
  
  - **Integration Guide** (integrations.md)
    - Cloudinary setup steps
    - Resend configuration
    - Google Sheets setup
  
  - **Deployment Guide** (deployment.md)
    - Vercel deployment steps
    - Environment variables
    - Database setup
    - Domain configuration

- [ ] User documentation:
  - **Admin User Guide** (admin-guide.md)
    - How to manage time slots (availability)
    - How to confirm client bookings
    - How to manage clients
    - How to confirm payments
    - How to generate reports
  
  - **Quick Start Guide** (quick-start.md)
    - Initial setup
    - First booking
    - Common tasks
  
  - **FAQ** (faq.md)
    - Common questions
    - Troubleshooting

- [ ] Code documentation:
  - JSDoc comments for functions
  - README in each major folder
  - Component prop documentation

**Deliverable:** Complete documentation

---

#### Day 4: User Training
```bash
Priority: MEDIUM
Assigned: Full-Stack Dev
```

**Tasks:**
- [ ] Create video tutorials:
  1. System Overview (5 min)
  2. Creating a Booking (10 min)
  3. Managing Clients (7 min)
  4. Payment Confirmation (5 min)
  5. Generating Reports (8 min)

- [ ] Create training presentation:
  - System overview
  - Key features
  - Best practices
  - Tips and tricks

- [ ] Create cheat sheet:
  - Keyboard shortcuts
  - Quick actions
  - Status meanings
  - Common workflows

- [ ] Schedule training session with users:
  - Demo the system
  - Walk through common tasks
  - Answer questions
  - Gather feedback

**Deliverable:** Training materials and session

---

#### Day 5: Pre-Launch Preparation
```bash
Priority: HIGH
Assigned: Full Team
```

**Tasks:**
- [ ] Final testing checklist:
  - [ ] All features working
  - [ ] All tests passing
  - [ ] No console errors
  - [ ] No broken links
  - [ ] Forms validate properly
  - [ ] Emails sending correctly
  - [ ] Files uploading successfully
  - [ ] Google Sheets syncing
  - [ ] Authentication working
  - [ ] Role permissions correct

- [ ] Staging environment setup:
  - Deploy to staging
  - Test with real-like data
  - User acceptance testing

- [ ] Production readiness:
  - [ ] Environment variables set
  - [ ] Database backups configured
  - [ ] Monitoring set up
  - [ ] Error tracking (Sentry)
  - [ ] Analytics configured
  - [ ] Domain configured
  - [ ] SSL certificate

- [ ] Create launch checklist

- [ ] Prepare rollback plan

**Deliverable:** Ready for deployment

---

### Sprint 11 Deliverables
- ✅ Polished UI/UX
- ✅ Complete documentation
- ✅ User training materials
- ✅ Pre-launch checks complete

**Sprint Review Checklist:**
- [ ] UI is polished and professional
- [ ] All documentation complete
- [ ] Training materials ready
- [ ] Application ready for production

---

# PHASE 5: DEPLOYMENT & LAUNCH (Week 12)

## Sprint 12: Production Deployment (Week 12)

### Goals
- Deploy to production
- Post-launch monitoring
- Issue resolution
- Project handoff

### Tasks

#### Day 1: Production Deployment
```bash
Priority: CRITICAL
Assigned: DevOps + Backend Lead
```

**Tasks:**
- [ ] Pre-deployment checks:
  - [ ] All tests passing
  - [ ] Code reviewed and approved
  - [ ] Staging tested and approved
  - [ ] Backup plan ready

- [ ] Deploy to Vercel production:
  ```bash
  # Connect GitHub repo to Vercel
  # Configure production environment variables
  # Deploy main branch
  ```

- [ ] Database migration:
  - Run any pending migrations
  - Create initial data (services, admin user)

- [ ] Configure production integrations:
  - [ ] Cloudinary production credentials
  - [ ] Resend production API key
  - [ ] Google Sheets production sheets
  - [ ] MongoDB production database

- [ ] Configure custom domain:
  - Point DNS to Vercel
  - Configure SSL
  - Test HTTPS

- [ ] Smoke testing:
  - [ ] Homepage loads
  - [ ] Admin login works
  - [ ] Client can create booking
  - [ ] Admin can create time slots
  - [ ] Admin can confirm bookings
  - [ ] Upload works
  - [ ] Email sends

**Deliverable:** Application live in production

---

#### Day 2: Post-Launch Monitoring
```bash
Priority: HIGH
Assigned: Full Team
```

**Tasks:**
- [ ] Set up monitoring:
  - [ ] Vercel Analytics
  - [ ] Sentry error tracking
  - [ ] Uptime monitoring (UptimeRobot)
  - [ ] Database monitoring (MongoDB Atlas)
  - [ ] Cloudinary usage monitoring

- [ ] Set up alerts:
  - [ ] Error rate threshold
  - [ ] Downtime alerts
  - [ ] High latency alerts
  - [ ] Storage usage alerts

- [ ] Monitor key metrics:
  - [ ] Response times
  - [ ] Error rates
  - [ ] Uptime percentage
  - [ ] User activity

- [ ] Create monitoring dashboard:
  - Real-time error feed
  - Performance graphs
  - Usage statistics

**Deliverable:** Monitoring and alerts active

---

#### Day 3-4: Issue Resolution & Support
```bash
Priority: HIGH
Assigned: Full Team (on-call rotation)
```

**Tasks:**
- [ ] Monitor for issues:
  - Check error logs daily
  - Review user feedback
  - Monitor support channels

- [ ] Triage and fix issues:
  - Critical: Fix immediately
  - High: Fix within 24 hours
  - Medium: Fix within week
  - Low: Add to backlog

- [ ] Hotfix deployment process:
  - Create hotfix branch
  - Fix and test
  - Deploy to staging
  - Deploy to production
  - Verify fix

- [ ] User support:
  - Answer questions
  - Provide guidance
  - Document common issues

**Deliverable:** Stable, supported application

---

#### Day 5: Project Handoff & Retrospective
```bash
Priority: MEDIUM
Assigned: Full Team
```

**Tasks:**
- [ ] Project handoff:
  - [ ] Transfer admin credentials
  - [ ] Provide all documentation
  - [ ] Demo the system
  - [ ] Explain maintenance tasks

- [ ] Create maintenance plan:
  - Weekly tasks (check logs, review metrics)
  - Monthly tasks (update dependencies, review security)
  - Quarterly tasks (performance review, feature planning)

- [ ] Project retrospective:
  - What went well?
  - What could be improved?
  - Lessons learned
  - Document for future projects

- [ ] Celebrate launch! 🎉

**Deliverable:** Project complete and handed off

---

### Sprint 12 Deliverables
- ✅ Application deployed to production
- ✅ Monitoring and alerts active
- ✅ Issues resolved
- ✅ Project handed off

**Final Checklist:**
- [ ] Application live and accessible
- [ ] All integrations working
- [ ] Monitoring active
- [ ] Documentation complete
- [ ] Users trained
- [ ] Support plan in place

---

## Dependencies & Critical Path

### Critical Path (Must Complete in Order)

```
Week 1-3:  UI Development
           ↓
Week 4:    Database & Auth (BLOCKING)
           ↓
Week 5-6:  Backend APIs (BLOCKING)
           ↓
Week 7:    File Uploads (CRITICAL)
           ↓
Week 8:    Email & Sheets (CRITICAL)
           ↓
Week 9:    Security (CRITICAL)
           ↓
Week 10-11: Testing & Polish
           ↓
Week 12:   Deploy (FINAL)
```

### Parallel Tracks

**Can Work Simultaneously:**
- UI development (Week 1-3) while planning backend
- Client CRUD and Nail Tech CRUD (Week 6)
- Email integration and Google Sheets (Week 8)
- Testing while doing final polish (Week 10-11)

---

## Risk Management

### High-Risk Items

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Database design changes | HIGH | Finalize schema before Sprint 4 |
| Authentication issues | HIGH | Use proven library (NextAuth), test early |
| File upload failures | MEDIUM | Implement retry logic, good error handling |
| Email delivery problems | MEDIUM | Use reliable service (Resend), test thoroughly |
| API rate limits exceeded | LOW | Implement caching, monitor usage |
| Performance issues | MEDIUM | Load testing, optimization sprint |

### Contingency Plans

**If Behind Schedule:**
1. Cut non-critical features (quotations, advanced reports)
2. Reduce polish time
3. Simplify UI (use basic components)
4. Extend timeline by 1 week

**If Team Member Unavailable:**
1. Cross-train team members
2. Document all work
3. Use pair programming for knowledge transfer

---

## Quality Assurance

### Code Quality Standards

- **ESLint:** All code must pass linting
- **Prettier:** Consistent code formatting
- **TypeScript:** Strict mode enabled
- **Code Review:** All PRs require 1 approval
- **Test Coverage:** Minimum 80%

### Testing Strategy

```
Unit Tests (60%)
- Utilities
- Helper functions
- Validations

Integration Tests (30%)
- API endpoints
- Database operations
- External integrations

E2E Tests (10%)
- Critical user flows
- Complete workflows
```

### Definition of Done

A task is "done" when:
- [ ] Code written and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] QA tested and approved
- [ ] Deployed to staging
- [ ] Product owner approved

---

## Deployment Strategy

### Environments

1. **Development** (`localhost:3000`)
   - Local development
   - Mock data
   - Fast iterations

2. **Staging** (`staging.glamnails.vercel.app`)
   - Production-like environment
   - Real integrations (test mode)
   - UAT testing

3. **Production** (`glamnails.com`)
   - Live environment
   - Real data
   - Real integrations

### Deployment Process

```bash
# 1. Feature development
git checkout -b feature/booking-crud
# ... develop and test ...
git commit -m "feat: implement booking CRUD"
git push origin feature/booking-crud

# 2. Create PR and get approval
# GitHub: Create PR → Review → Approve

# 3. Merge to develop
git checkout develop
git merge feature/booking-crud
# Automatic deploy to staging (Vercel)

# 4. Test in staging
# Manual QA testing

# 5. Merge to main (production)
git checkout main
git merge develop
git push origin main
# Automatic deploy to production (Vercel)

# 6. Monitor production
# Check logs, metrics, errors
```

---

## Success Metrics

### Technical Metrics
- ✅ 99.9% uptime
- ✅ <500ms API response time (95th percentile)
- ✅ Lighthouse score >90
- ✅ 80% test coverage
- ✅ Zero critical security vulnerabilities

### Business Metrics
- ✅ 100+ bookings processed in first month
- ✅ <5% booking cancellation rate
- ✅ User satisfaction >4/5
- ✅ Admin task time reduced by 50%

---

## Project Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: Foundation & UI** | 3 weeks | Complete UI, design system |
| **Phase 2: Backend Core** | 3 weeks | Database, auth, APIs |
| **Phase 3: Integrations** | 3 weeks | Files, email, sheets, security |
| **Phase 4: Testing & Polish** | 2 weeks | Tests, bugs fixed, optimized |
| **Phase 5: Deployment** | 1 week | Live in production |
| **TOTAL** | **12 weeks** | **Fully functional app** |

---

## Resource Allocation

```
Frontend Lead:        40 hours/week × 12 weeks = 480 hours
Backend Lead:         40 hours/week × 12 weeks = 480 hours
Full-Stack Dev:       40 hours/week × 12 weeks = 480 hours
Additional Support:   20 hours/week × 12 weeks = 240 hours
                                        TOTAL: 1,680 hours
```

---

## Next Steps

### Week 0 (Preparation - This Week)
- [ ] Finalize project plan
- [ ] Get stakeholder approval
- [ ] Set up development environment
- [ ] Create GitHub repository
- [ ] Schedule kickoff meeting

### Week 1 (Sprint 1 - Starts Feb 10)
- [ ] Project setup
- [ ] Design system
- [ ] Authentication UI
- [ ] Admin layout

---

## Appendix

### Tools & Services Checklist

**Development:**
- [ ] VS Code or preferred IDE
- [ ] Node.js 18+
- [ ] Git
- [ ] Postman

**Accounts to Create:**
- [ ] MongoDB Atlas
- [ ] Cloudinary
- [ ] Resend
- [ ] Google Cloud (for Sheets API)
- [ ] Vercel
- [ ] GitHub

**Cost Estimate:**
- MongoDB Atlas: Free (512MB)
- Cloudinary: Free (25GB)
- Resend: Free (100 emails/day)
- Google Sheets API: Free
- Vercel: Free (hobby plan)
- **Total: $0/month for first few months**

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Ready to Execute 🚀
