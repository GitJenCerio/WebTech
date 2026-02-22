# Production System Analysis
## glammednailsbyjhen - Booking System

**Last Updated:** 2024  
**Status:** Production-Ready Requirements

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Client-Side Pages](#client-side-pages)
3. [Admin-Side Pages](#admin-side-pages)
4. [Data Models](#data-models)
5. [User Flows](#user-flows)
6. [Edge Cases & Validations](#edge-cases--validations)
7. [Component Library](#component-library)

---

## System Overview

### Core Functionality
- **Booking System:** Time-slot based appointments with double-booking prevention
- **Client Types:** New clients vs. returning clients (auto-detection)
- **Service Types:** Manicure, Pedicure, Mani+Pedi, Home Service (2-3 slots)
- **Slot Management:** Consecutive slot booking, squeeze-in fees, blocked dates
- **Admin Management:** Services, slots, bookings, customers, nail techs

### Design System
- **Colors:** White, black, gray only
- **Style:** Clean, modern, minimal with subtle shadows
- **Buttons:** Soft "shiny" effect with hover states
- **Responsive:** Mobile-first approach

### Technology Stack
- Next.js 14 (App Router)
- MongoDB (Mongoose)
- NextAuth (Authentication)
- Firebase/Firestore (Secondary storage)
- Tailwind CSS

---

## Client-Side Pages

### 1. Home Page (`/`)
**Purpose:** Marketing landing page with service information and booking CTA

**Components:**
- `Header` - Navigation with logo, menu, booking CTA
- `Hero` - Main banner with headline and primary CTA
- `Services` - Service offerings grid/list
- `About` - Business information
- `Gallery` - Image showcase
- `Pricing` - Service pricing table
- `FAQ` - Frequently asked questions
- `Footer` - Contact info, links, social media
- `CookieConsent` - GDPR/privacy compliance

**Data Required:**
- Service list (name, description, duration, price)
- Gallery images
- FAQ items
- Business contact information

**States:**
- Loading: Skeleton loaders for lazy-loaded sections
- Error: Fallback message if content fails to load
- Empty: Placeholder for missing content

**Validations:**
- None (static content)

---

### 2. Booking Page (`/booking`)
**Purpose:** Primary booking interface where clients select slots and complete reservations

**Components:**
- `Header` - Navigation
- `NailTechSelectionModal` - Initial modal to select nail technician
- `CalendarGrid` - Monthly calendar view with available dates
- `SlotList` - Time slots for selected date
- `ClientTypeSelectionModal` - **First step:** Multi-step modal
  - Step 1: New or Repeat client selection
  - Step 2: Service location selection (Home Studio or Home Service)
  - Step 3: Client information collection
    - New client: Facebook/Instagram name input + Contact number input
    - Repeat client: Contact number input + Lookup button
- `NailTechSelectionModal` - Select nail technician (filtered by service location, shown after client info)
- `CalendarGrid` - Monthly calendar view with available dates
- `SlotList` - Time slots for selected date
- `SlotModal` - Final booking confirmation modal
  - Service type selector (options based on location selected earlier)
  - Squeeze fee acknowledgment
  - Deposit notice
  - Book Now button
- `NoRecordFoundModal` - Confirmation when repeat client not found
- `RecordFoundModal` - Confirmation when repeat client found
- `Footer` - Site footer

**Data Required:**
- Customer records (for repeat client lookup by contact number)
- Active nail techs (id, name, role, discount, serviceAvailability) - filtered by service location
- Available slots (filtered by nail tech, date, status)
- Blocked dates (ranges)
- Google Forms URLs (separate for new vs repeat clients)
- Service options based on location:
  - Home Studio: Manicure, Pedicure, Mani+Pedi
  - Home Service: Manicure 2 pax, Pedicure 2 pax, Mani+Pedi, Mani+Pedi 2 pax

**States:**
- **Loading:**
  - Initial: Full page spinner
  - Nail techs: Loading state in modal
  - Slots: Skeleton cards or spinner
  - Customer lookup: Button shows "Checking..."
- **Empty:**
  - No nail techs: Error message in modal
  - No slots for date: "No available slots" message
  - No compatible slots: Service requirement message
- **Error:**
  - API failures: Error message with retry button
  - Slot no longer available: Alert + refresh slots
  - Network error: Retry mechanism
- **Success:**
  - Booking created: Redirect to Google Form
  - Customer found: Green confirmation badge

**Validations:**
- **Slot Selection:**
  - Must select nail tech before viewing calendar
  - Must select date before viewing slots
  - Slot must be `available` status
  - Slot must not be in blocked date range
  - For multi-slot services: consecutive slots must be available
- **Service Selection:**
  - Service options depend on location (Studio vs Home Service)
  - Home Service: Manicure/Pedicure require 2 slots (2 pax)
  - Studio: Manicure/Pedicure require 1 slot
  - Mani+Pedi always requires 2 slots regardless of location
  - Multi-slot services must have consecutive availability
- **Client Information:**
  - **New client:** 
    - Facebook/Instagram name required
    - Contact number required
  - **Repeat client:** 
    - Contact number required for lookup
    - Must verify contact number OR confirm "no record" to proceed as new
  - Contact number format validation (phone number)
- **Squeeze Fee:**
  - Must acknowledge checkbox if slot has squeeze fee
- **Form Submission:**
  - All required fields filled
  - Linked slots validated (for multi-slot services)
  - Slot still available (server-side validation)

**Edge Cases:**
- **Double Booking:** Server validates slot availability atomically
- **Concurrent Users:** Optimistic locking on slot status
- **Form Abandonment:** Slots released after timeout (15 minutes pending status)
- **Past Dates:** Calendar disables past dates
- **No Consecutive Slots:** Clear error message with available times
- **Blocked Dates:** Calendar shows blocked dates visually
- **Hidden Slots:** Not shown to clients (admin-only)

**User Flow (Updated):**
1. User clicks "Book Appointment" → **Client Type Selection Modal** appears first
2. **Select Client Type:**
   - **New Client** or **Returning Client**
3. **Select Service Location:**
   - **Home Studio** or **Home Service** (+₱1,000)
4. **Client Information Collection:**
   - **New Client:** 
     - Enter Facebook/Instagram name (required)
     - Enter contact number (required)
     - Click "Continue"
   - **Repeat Client:**
     - Enter contact number used in previous booking
     - Click "Check" → System verifies if repeat client
     - If found: Green confirmation with customer name
     - If not found: Option to proceed as new client
5. **Nail Tech Selection** → Modal appears (filtered by service location)
   - Only shows techs available for selected location (Studio/Home Service)
6. Select nail tech → Calendar appears
7. **Service Selection** → Select service type:
   - **Home Studio:** Manicure, Pedicure, Mani+Pedi
   - **Home Service:** Manicure 2 pax, Pedicure 2 pax, Mani+Pedi, Mani+Pedi 2 pax
8. Select date → Slots list appears
9. Click available slot → Slot selection confirmed
10. Linked slots calculated based on service type
11. Acknowledge squeeze fee (if applicable)
12. Click "Book Now" → Server validates → Creates booking
13. **Redirect to Google Form:**
    - **New Client:** Full form with all fields
    - **Repeat Client:** Pre-filled form with existing data (name, email, phone, etc.)
14. Booking status: `pending_form` → Updates to `pending_payment` or `confirmed` after form submission

---

### 3. Privacy Policy (`/privacy-policy`)
**Purpose:** Legal compliance page

**Components:**
- `Header`
- Content section (static text)
- `Footer`

**Data Required:**
- Static legal text

---

### 4. Cookies Policy (`/cookies-policy`)
**Purpose:** GDPR compliance for cookie usage

**Components:**
- `Header`
- Content section (static text)
- `Footer`

**Data Required:**
- Static legal text

---

## Admin-Side Pages

### 1. Admin Login (`/admin`)
**Purpose:** Authentication gateway for admin access

**Components:**
- Login form
  - Email input
  - Password input
  - Google OAuth button
- Error messages
- Logo/branding

**Data Required:**
- User credentials (MongoDB)
- OAuth configuration

**States:**
- **Loading:**
  - Form submission: Button shows spinner
  - Google OAuth: Button shows spinner
- **Error:**
  - Invalid credentials: Error message
  - OAuth failure: Error message with reason
  - Access denied: "Not authorized" message
- **Success:**
  - Redirect to `/admin/overview`

**Validations:**
- Email format validation
- Password required
- User must exist in database (pre-approved)
- User must be active

**Edge Cases:**
- OAuth callback errors
- Network failures
- Session expiration

---

### 2. Admin Overview (`/admin/overview`)
**Purpose:** Dashboard with key metrics and today's schedule

**Components:**
- `StatCard` (4 cards):
  - Today's Appointments (count + upcoming)
  - Available Slots Today (count + total)
  - Completed Today (count + time)
  - Estimated Income Today (amount + source)
- `ChartPlaceholder` - Weekly appointments chart
- `ChartPlaceholder` - Slot utilization pie chart
- `DataTable` - Today's appointments (limited rows)
- Navigation to full bookings page

**Data Required:**
- Today's bookings (count, status breakdown)
- Today's slots (available, booked, total)
- Completed bookings today
- Estimated income (from bookings)
- Weekly appointment data (for chart)
- Slot utilization data (for pie chart)

**States:**
- **Loading:**
  - Initial: Skeleton cards
  - Charts: Loading placeholder
- **Empty:**
  - No appointments: "No appointments today"
  - No data: Empty state messages
- **Error:**
  - API failure: Error message with retry

**Validations:**
- Date filtering (today only)
- Permission checks (role-based access)

---

### 3. Bookings & Slots (`/admin/bookings`)
**Purpose:** Manage all bookings and time slots

**Components:**
- `NailTechFilter` - Filter by nail tech (if admin)
- `CalendarPanel` - Date selector
- `SlotList` - Time slots for selected date
  - `SlotItem` - Individual slot card
- `BookingDetailsModal` - View/edit booking details
- `AddSlotModal` - Create new slots
- `FilterBar` - Search and status filters
- `DataTable` - All bookings list
- `Pagination` - Page navigation
- `ActionDropdown` - Row actions (View, Edit, Cancel)

**Data Required:**
- Slots (by date, nail tech, status)
- Bookings (all with filters)
- Nail techs list
- Customer data (for bookings)
- Blocked dates

**States:**
- **Loading:**
  - Slots: Skeleton cards
  - Bookings table: Loading spinner
- **Empty:**
  - No slots: "No slots for this date"
  - No bookings: "No bookings found"
- **Error:**
  - Load failure: Error message
  - Save failure: Error toast
- **Success:**
  - Slot added: Success message + refresh
  - Booking updated: Success message

**Validations:**
- **Add Slot:**
  - Date must be future or today
  - Time must be valid slot time
  - Nail tech required
  - No duplicate slots (same date, time, tech)
- **Edit Booking:**
  - Status transitions valid
  - Payment amounts valid
  - Dates/times not conflicting
- **Cancel Booking:**
  - Confirmation required
  - Release linked slots

**Edge Cases:**
- Multiple slots for same time (different techs)
- Overlapping blocked dates
- Booking with linked slots
- Past date slot creation (admin override)

**User Flow:**
1. Select date → Slots load
2. View slots → Click to see booking details
3. Add slot → Modal → Fill form → Save
4. Filter bookings → Search/status/date range
5. View booking → Modal with full details
6. Edit booking → Update status/payment
7. Cancel booking → Confirm → Release slots

---

### 4. Customers (`/admin/clients` or `/admin/customers`)
**Purpose:** Manage customer database

**Components:**
- `FilterBar` - Search (name, email, phone)
- `DataTable` - Customer list
  - Columns: Name, Email, Phone, Social Media, Type, Bookings Count, Actions
- `ActionDropdown` - View, Edit, Delete
- Customer detail modal (if needed)
- Add customer button (if needed)

**Data Required:**
- Customers list (paginated)
- Booking counts per customer
- Search/filter parameters

**States:**
- **Loading:**
  - Table: Loading spinner
- **Empty:**
  - No customers: "No customers found"
- **Error:**
  - Load failure: Error message
  - Delete failure: Error toast

**Validations:**
- Email format (if provided)
- Phone format (if provided)
- Name required
- Duplicate email/phone check (warning, not error)

**Edge Cases:**
- Customers with no bookings
- Duplicate customers (same email/phone)
- Missing contact information

---

### 5. Nail Techs (`/admin/nail-techs`)
**Purpose:** Manage nail technician profiles

**Components:**
- `DataTable` - Nail tech list
  - Columns: Name, Role, Service Availability, Working Days, Discount, Status, Actions
- `ActionDropdown` - Edit, Deactivate
- Add nail tech button
- Edit modal/form

**Data Required:**
- Nail techs list
- Roles list
- Service availability options
- Working days options

**States:**
- **Loading:**
  - Table: Loading spinner
- **Empty:**
  - No techs: "No nail technicians"
- **Error:**
  - Save failure: Error toast
  - Delete failure: Error (if has bookings)

**Validations:**
- Name required
- Role must be valid enum
- Service availability must be valid
- Working days array (non-empty)
- Discount: 0-100 if provided
- Commission rate: 0-1 if provided
- Cannot delete tech with active bookings

**Edge Cases:**
- Tech with no slots
- Tech with all slots booked
- Deactivating tech (hide from client selection)

---

### 6. Finance (`/admin/finance`)
**Purpose:** Financial tracking and reporting

**Components:**
- `StatCard` - Revenue metrics
- `FilterBar` - Date range, payment status
- `DataTable` - Financial transactions
  - Columns: Date, Booking ID, Customer, Service, Amount, Deposit, Payment Status, Payment Method
- Charts (revenue over time, payment methods)
- Export button (CSV/PDF)

**Data Required:**
- Bookings with payment data
- Aggregated revenue (by period)
- Payment method breakdown
- Deposit tracking
- Tip tracking

**States:**
- **Loading:**
  - Stats: Skeleton cards
  - Table: Loading spinner
  - Charts: Loading placeholder
- **Empty:**
  - No transactions: "No financial data"
- **Error:**
  - Load failure: Error message
  - Export failure: Error toast

**Validations:**
- Date range valid
- Amounts positive numbers
- Payment status transitions valid
- Payment methods valid enum

**Edge Cases:**
- Refunded bookings
- Partial payments
- Multiple payment methods
- Unpaid bookings

---

### 7. Settings (`/admin/settings`)
**Purpose:** System configuration

**Components:**
- Settings form sections:
  - Business information
  - Email configuration
  - Google Forms integration
  - Slot time configuration
  - Booking rules
- Save button
- Test email button

**Data Required:**
- Settings (stored in database or env)
- Business details
- Integration credentials

**States:**
- **Loading:**
  - Save: Button spinner
  - Test: Button spinner
- **Error:**
  - Validation errors: Inline messages
  - Save failure: Error toast
- **Success:**
  - Saved: Success toast

**Validations:**
- Email format
- URL format (for forms)
- Required fields
- Slot times valid format

---

### 8. Users (`/admin/users`)
**Purpose:** Manage admin user accounts

**Components:**
- `DataTable` - Users list
  - Columns: Name, Email, Role, Assigned Tech, Status, Last Login, Actions
- `AddUserModal` - Create new admin user
- `EditUserModal` - Edit user details
- `ActionDropdown` - Edit, Deactivate, Delete

**Data Required:**
- Users list
- Roles list
- Nail techs (for assignment)
- Last login timestamps

**States:**
- **Loading:**
  - Table: Loading spinner
  - Modal: Form loading
- **Empty:**
  - No users: "No users"
- **Error:**
  - Email already exists: Validation error
  - Save failure: Error toast
  - Delete failure: Error (if last admin)

**Validations:**
- Email required and unique
- Password strength (if email/password)
- Role required
- Cannot delete last admin user
- Cannot delete yourself

**Edge Cases:**
- Google OAuth only users (no password)
- Users with no assigned tech
- Inactive users

---

## Data Models

### 1. User (Admin)
**Collection:** `users`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `name` (string, required) - Full name
- `email` (string, required, unique, lowercase) - Login email
- `password` (string, optional) - Hashed password (if email/password auth)
- `role` (string, enum) - 'Owner', 'Admin', 'Staff'
- `assignedNailTechId` (string, optional) - If staff, assigned tech
- `isActive` (boolean, default: true) - Account status
- `lastLogin` (Date, optional) - Last login timestamp
- `createdAt` (Date) - Account creation
- `updatedAt` (Date) - Last update

**Indexes:**
- `email` (unique)
- `role`
- `assignedNailTechId`

**Why:**
- Authentication and authorization
- Role-based access control
- Staff assignment to specific techs

---

### 2. NailTech
**Collection:** `nailtechs`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `name` (string, required) - Name without "Ms." prefix
- `role` (string, enum, required) - 'Owner', 'Junior Tech', 'Senior Tech'
- `serviceAvailability` (string, enum, required) - 'Studio only', 'Home service only', 'Studio and Home Service'
- `workingDays` (array of strings, required) - ['Monday', 'Tuesday', ...]
- `discount` (number, optional) - Discount percentage (0-100)
- `commissionRate` (number, optional) - Commission rate (0-1)
- `status` (string, enum, required) - 'Active', 'Inactive'
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes:**
- `status`
- `role`

**Why:**
- Client selection
- Slot assignment
- Commission calculation
- Availability filtering

---

### 3. Slot
**Collection:** `slots`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `date` (string, required) - YYYY-MM-DD format
- `time` (string, required) - HH:mm format
- `status` (string, enum, required) - 'available', 'blocked', 'pending', 'confirmed'
- `slotType` (string, enum, optional) - 'regular', 'with_squeeze_fee'
- `notes` (string, optional) - Admin notes
- `isHidden` (boolean, default: false) - Hide from clients
- `nailTechId` (string, required) - Assigned nail tech
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes:**
- `{ date: 1, time: 1 }` - Fast date/time lookup
- `{ nailTechId: 1, date: 1 }` - Tech-specific queries
- `{ date: 1, status: 1 }` - Availability queries
- `{ nailTechId: 1, date: 1, status: 1 }` - Composite for booking

**Why:**
- Time slot management
- Availability checking
- Double-booking prevention
- Multi-slot service support

**Edge Cases:**
- Slots with same time, different techs (allowed)
- Past date slots (admin can create)
- Hidden slots (not shown to clients)

---

### 4. BlockedDate
**Collection:** `blockeddates`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `startDate` (string, required) - YYYY-MM-DD
- `endDate` (string, required) - YYYY-MM-DD
- `reason` (string, optional) - Why blocked
- `scope` (string, enum, required) - 'single', 'range', 'month'
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes:**
- `{ startDate: 1, endDate: 1 }` - Range queries
- `startDate`
- `endDate`

**Why:**
- Holiday blocking
- Maintenance days
- Personal time off
- Prevents booking on blocked dates

---

### 5. Customer
**Collection:** `customers`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `name` (string, required) - Full name
- `firstName` (string, optional) - First name
- `lastName` (string, optional) - Last name
- `email` (string, optional, lowercase) - Contact email
- `phone` (string, optional) - Contact number
- `socialMediaName` (string, optional) - FB/IG handle
- `referralSource` (string, optional) - How they found us
- `isRepeatClient` (boolean, default: false) - Repeat customer flag
- `isVIP` (boolean, default: false) - VIP tagging (optional, future feature - not in current types)
- `notes` (string, optional) - Admin notes
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes:**
- `email` (sparse) - Fast email lookup
- `phone` (sparse) - Fast phone lookup
- `name` - Name search
- `isRepeatClient` - Filtering
- `isVIP` - VIP filtering

**Why:**
- Customer database
- Repeat client detection
- Contact information
- Booking history linking
- VIP special treatment (future feature)

---

### 6. Booking
**Collection:** `bookings`

**Fields:**
- `id` (string, unique) - MongoDB ObjectId
- `slotId` (string, required) - Primary slot
- `pairedSlotId` (string, optional) - Legacy paired slot
- `linkedSlotIds` (array of strings, optional) - All linked slots
- `bookingId` (string, required, unique) - GN-00001 format
- `customerId` (string, required) - Customer reference
- `nailTechId` (string, required) - Assigned tech
- `status` (string, enum, required) - 'pending_form', 'pending_payment', 'confirmed', 'cancelled'
- `serviceType` (string, enum, optional) - Service type
- `clientType` (string, enum, optional) - 'new', 'repeat'
- `serviceLocation` (string, enum, optional) - 'homebased_studio', 'home_service'
- `customerData` (object, optional) - Form data backup
- `customerDataOrder` (array, optional) - Form field order
- `formResponseId` (string, optional) - Google Form response ID
- `dateChanged` (boolean, optional) - Rescheduled flag
- `timeChanged` (boolean, optional) - Time changed flag
- `validationWarnings` (array, optional) - Data quality warnings
- `invoice` (object, optional) - Invoice details
- `paymentStatus` (string, enum, optional) - 'unpaid', 'partial', 'paid', 'refunded', 'forfeited'
- `paidAmount` (number, optional) - Total paid
- `depositAmount` (number, optional) - Deposit amount
- `tipAmount` (number, optional) - Tip amount
- `depositDate` (string, optional) - ISO date
- `paidDate` (string, optional) - ISO date
- `tipDate` (string, optional) - ISO date
- `depositPaymentMethod` (string, enum, optional) - 'PNB', 'CASH', 'GCASH'
- `paidPaymentMethod` (string, enum, optional) - 'PNB', 'CASH', 'GCASH'
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes:**
- `customerId` - Customer bookings
- `slotId` - Slot lookup
- `bookingId` (unique) - Fast booking lookup
- `createdAt` (descending) - Recent bookings
- `{ nailTechId: 1, createdAt: -1 }` - Tech-specific recent
- `status` - Status filtering
- `paymentStatus` - Payment filtering

**Why:**
- Booking records
- Payment tracking
- Service history
- Commission calculation
- Financial reporting

**Edge Cases:**
- Bookings with multiple linked slots
- Cancelled bookings (release slots)
- Rescheduled bookings (dateChanged/timeChanged flags)

---

## User Flows

### Client Booking Flow
1. **Landing** → Home page → Click "Book Appointment"
2. **Nail Tech Selection** → Modal → Select tech → Calendar appears
3. **Date Selection** → Click date → Slots list appears
4. **Slot Selection** → Click available slot → Slot modal opens
5. **Service Configuration:**
   - Select location (Studio/Home Service)
   - Select service type
   - System calculates linked slots
6. **Client Information:**
   - **New Client:** Enter social media name
   - **Repeat Client:** Enter email/phone → Click "Confirm" → Lookup
     - **Found:** Green confirmation → Proceed
     - **Not Found:** Modal → "Proceed as new" → Enter social media name
7. **Squeeze Fee** → Acknowledge if applicable
8. **Submit** → Click "Proceed to Booking Form"
9. **Server Validation:**
   - Slot still available (atomic check)
   - Linked slots available
   - Customer created/found
   - Booking created with `pending_form` status
10. **Redirect** → Google Form with pre-filled data

### Admin Daily Workflow
1. **Login** → `/admin` → Authenticate
2. **Overview** → `/admin/overview` → Check today's schedule
3. **Bookings** → `/admin/bookings` → View/manage appointments
4. **Add Slots** → Create slots for upcoming dates
5. **Customer Lookup** → `/admin/clients` → Find customer info
6. **Update Booking** → Mark complete, update payment
7. **Finance** → `/admin/finance` → Review revenue

### Slot Release Flow (Form Abandonment)
**Status:** Required but may need implementation

1. Booking created with `pending_form` status
2. Timer starts (15 minutes) - **Needs implementation: Background job or scheduled task**
3. If form not completed:
   - Status changes to `cancelled`
   - Slots released (status → `available`)
   - Customer notified (optional)
4. If form completed:
   - Status changes to `pending_payment` or `confirmed`
   - Slots remain `pending` or `confirmed`

**Implementation Options:**
- Cron job checking `pending_form` bookings older than 15 minutes
- Vercel Cron (if deployed on Vercel)
- Background worker process
- API endpoint called periodically

---

## Edge Cases & Validations

### Booking Edge Cases

**1. Double Booking Prevention**
- **Problem:** Two users book same slot simultaneously
- **Solution:** Atomic slot status update (MongoDB transaction)
- **Validation:** Server checks slot status before booking
- **Error:** "Slot no longer available" → Refresh slots

**2. Consecutive Slot Booking**
- **Problem:** Multi-slot service needs consecutive slots
- **Solution:** Client-side validation + server-side atomic reservation
- **Validation:** Check all linked slots available before booking
- **Error:** Clear message with available times

**3. Form Abandonment**
- **Problem:** User starts booking but doesn't complete form
- **Solution:** 15-minute timeout → Release slots
- **Implementation:** Background job or scheduled task (needs implementation)
- **Status:** `pending_form` → `cancelled` after timeout
- **Note:** Currently bookings remain `pending_form` indefinitely - implement cleanup job

**4. Past Date Selection**
- **Problem:** User tries to book past date
- **Solution:** Calendar disables past dates
- **Validation:** Client-side + server-side date check

**5. Blocked Date Booking**
- **Problem:** User tries to book blocked date
- **Solution:** Calendar shows blocked dates, slots hidden
- **Validation:** Server checks blocked date ranges

**6. Hidden Slots**
- **Problem:** Admin creates slots not visible to clients
- **Solution:** `isHidden` flag filters slots in client API
- **Validation:** Only admin can see hidden slots

**7. Slot Time Conflicts**
- **Problem:** Same time, different techs
- **Solution:** Allowed (different techs can work simultaneously)
- **Validation:** Only same tech + same time = conflict

**8. Home Service Requirements**
- **Problem:** Home service needs specific service types
- **Solution:** Service options filtered by location
- **Validation:** Home service requires Mani+Pedi or Home Service package

**9. Repeat Client Not Found**
- **Problem:** User claims to be repeat but not in database
- **Solution:** Modal confirmation → Proceed as new
- **Validation:** Email/phone lookup, fallback to new client

**10. Squeeze Fee Acknowledgment**
- **Problem:** User books squeeze-in slot without acknowledging fee
- **Solution:** Checkbox required before proceeding
- **Validation:** Client-side + server-side check

### Admin Edge Cases

**1. Delete Nail Tech with Bookings**
- **Problem:** Cannot delete tech with active bookings
- **Solution:** Check for bookings before deletion
- **Error:** "Cannot delete tech with active bookings"

**2. Delete Last Admin User**
- **Problem:** System needs at least one admin
- **Solution:** Prevent deletion of last admin
- **Error:** "Cannot delete last admin user"

**3. Overlapping Blocked Dates**
- **Problem:** Multiple blocked date ranges overlap
- **Solution:** Allow overlaps (union of blocked dates)
- **Validation:** Show warning if overlaps exist

**4. Slot Creation for Past Dates**
- **Problem:** Admin creates slots for past dates
- **Solution:** Allow with warning (for data correction)
- **Validation:** Show warning, allow override

**5. Booking Status Transitions**
- **Problem:** Invalid status changes (e.g., cancelled → confirmed)
- **Solution:** Define valid transitions
- **Validation:** Status transition rules

**6. Payment Amount Validation**
- **Problem:** Payment exceeds invoice total
- **Solution:** Validate payment amounts
- **Error:** "Payment amount exceeds total"

**7. Commission Calculation**
- **Problem:** Commission on cancelled bookings
- **Solution:** Only calculate on confirmed/completed
- **Validation:** Commission = 0 for cancelled

---

## Component Library

### Shared Components

**1. Header**
- Logo
- Navigation menu
- Booking CTA button
- Mobile hamburger menu
- Responsive design

**2. Footer**
- Contact information
- Social media links
- Legal links (Privacy, Cookies)
- Copyright

**3. Button (Shiny Effect)**
- Base: Black background, white text
- Hover: White background, black text, border
- Shadow: Subtle shadow on hover
- Disabled: Gray, no interaction
- Loading: Spinner + disabled

**4. Modal**
- Backdrop: Black/60 opacity
- Container: White, rounded, shadow
- Close button: Top-right X
- Responsive: Max width, scrollable
- Animation: Scale + fade in

**5. StatusBadge**
- Colors: Green (available), Red (booked), Gray (blocked)
- Icons: Optional
- Size: Small, medium

**6. DataTable**
- Columns: Configurable
- Sorting: Click header
- Pagination: Bottom
- Empty state: Message
- Loading: Skeleton rows

**7. FilterBar**
- Search input
- Filter dropdowns
- Date pickers
- Clear filters button

**8. CalendarGrid**
- Month view
- Date selection
- Available dates highlighted
- Blocked dates grayed out
- Past dates disabled
- Navigation: Previous/next month

**9. SlotCard**
- Time display
- Status badge
- Service info (if booked)
- Click handler
- Hover effect

**10. FormInput**
- Label
- Input field
- Error message
- Validation state
- Required indicator

---

## Authentication

### Required: Yes
- **Client Side:** No authentication needed
- **Admin Side:** NextAuth with email/password + Google OAuth
- **User Management:** Pre-approved users only (no public registration)

### Implementation:
- MongoDB user collection
- Password hashing (bcrypt)
- Session management (NextAuth)
- Role-based access control

---

## Missing Features (Intentionally Excluded)

1. **Payment Integration:** Not required initially (handled via Google Form)
2. **Email Notifications:** Optional (Resend integration exists but not required)
3. **SMS Notifications:** Not included
4. **Client Portal:** Clients don't have accounts
5. **Booking Modifications by Client:** Admin-only
6. **Reviews/Ratings:** Not in scope
7. **Loyalty Program:** VIP tagging exists but no points system
8. **Multi-language:** English only
9. **Analytics Dashboard:** Basic stats only, not full analytics

---

## Google Sheets Backup System

### Overview
All data is backed up to Google Sheets in real-time for redundancy and easy access. MongoDB (Mongoose) is the primary database, and Google Sheets serves as a backup/export system.

### Collections Backed Up:
1. **Slots** - All time slots with status, dates, times, nail tech assignments
2. **Customers** - Customer database with contact info, social media names, repeat client flags
3. **Bookings** - All booking records with status, payment info, service details
4. **Users** - Admin user accounts (credentials excluded for security)
5. **Nail Techs** - Technician profiles, roles, availability, discounts
6. **Services** - Service types, pricing, descriptions
7. **Finance** - Financial transactions, payments, revenue data

### Implementation:
- **Write Operations:** Every create/update operation writes to both MongoDB and Google Sheets
- **Error Handling:** MongoDB operations succeed even if Google Sheets write fails (non-blocking)
- **Sheets Structure:** Each collection has its own sheet/tab
- **Real-time Sync:** Data written immediately on create/update
- **Read Operations:** Primary reads from MongoDB (Google Sheets used for backup/export only)

### Google Sheets Configuration:
- Service account authentication required
- Spreadsheet ID in environment variables
- Separate sheets for each collection
- Automatic row appending on create
- Row updates on document updates

### Benefits:
- Easy data export for reporting
- Backup in case of database issues
- Non-technical users can view data in Sheets
- Historical data preservation
- Easy integration with other tools

---

## Security Considerations

1. **Slot Booking:** Atomic transactions prevent double-booking
2. **Admin Access:** Pre-approved users only
3. **Input Validation:** Client + server-side
4. **SQL Injection:** Mongoose prevents (NoSQL injection protection)
5. **XSS:** React escapes by default
6. **CSRF:** NextAuth handles
7. **Rate Limiting:** Consider for booking API

---

## Testing Checklist

### Client Side
- [ ] Nail tech selection
- [ ] Calendar date selection
- [ ] Slot selection
- [ ] Service type selection
- [ ] Repeat client lookup
- [ ] New client form
- [ ] Multi-slot booking
- [ ] Squeeze fee acknowledgment
- [ ] Form submission
- [ ] Error handling
- [ ] Mobile responsiveness

### Admin Side
- [ ] Login (email/password)
- [ ] Login (Google OAuth)
- [ ] Overview dashboard
- [ ] Bookings list
- [ ] Slot creation
- [ ] Booking details
- [ ] Customer management
- [ ] Nail tech management
- [ ] Finance tracking
- [ ] Settings
- [ ] User management

### Edge Cases
- [ ] Double booking prevention
- [ ] Form abandonment (slot release)
- [ ] Past date blocking
- [ ] Blocked date handling
- [ ] Consecutive slot validation
- [ ] Repeat client not found
- [ ] Network errors
- [ ] Invalid data handling

---

## Google Sheets Backup System

### Overview
All data is backed up to Google Sheets in real-time for redundancy and easy access. MongoDB (Mongoose) is the primary database, and Google Sheets serves as a backup/export system.

### Collections Backed Up:
1. **Slots** - All time slots with status, dates, times, nail tech assignments
2. **Customers** - Customer database with contact info, social media names, repeat client flags
3. **Bookings** - All booking records with status, payment info, service details
4. **Users** - Admin user accounts (credentials excluded for security)
5. **Nail Techs** - Technician profiles, roles, availability, discounts
6. **Services** - Service types, pricing, descriptions
7. **Finance** - Financial transactions, payments, revenue data

### Implementation:
- **Write Operations:** Every create/update operation writes to both MongoDB and Google Sheets
- **Error Handling:** MongoDB operations succeed even if Google Sheets write fails (non-blocking)
- **Sheets Structure:** Each collection has its own sheet/tab
- **Real-time Sync:** Data written immediately on create/update
- **Read Operations:** Primary reads from MongoDB (Google Sheets used for backup/export only)

### Google Sheets Configuration:
- Service account authentication required
- Spreadsheet ID in environment variables
- Separate sheets for each collection
- Automatic row appending on create
- Row updates on document updates

### Benefits:
- Easy data export for reporting
- Backup in case of database issues
- Non-technical users can view data in Sheets
- Historical data preservation
- Easy integration with other tools

---

## Deployment Checklist

1. **Environment Variables:**
   - MongoDB URI
   - NextAuth secret
   - Google OAuth credentials
   - Google Service Account credentials (for Sheets backup)
   - Google Sheets ID (backup spreadsheet)
   - Resend API key (optional)
   - Firebase config (if used)

2. **Database:**
   - Create indexes
   - Seed initial data (admin user, nail techs)
   - Backup strategy (Google Sheets + MongoDB backups)

3. **Monitoring:**
   - Error tracking
   - Performance monitoring
   - Booking success rate
   - Slot utilization

4. **Backup:**
   - Database backups
   - Firestore backups (if used)

---

**End of Analysis**
