# MongoDB Schema Reference

This document describes all MongoDB collections and their schemas as used by the app (Mongoose models). Use it to understand the database structure, fix data, or migrate.

**Stack:** Next.js + Mongoose. All collections use `timestamps: true` (auto `createdAt`, `updatedAt`) unless noted.

---

## Collection: `nailtechs` (NailTech)

Nail technicians / staff who perform services.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse. From Firebase migration. |
| `name` | String | yes | Trimmed. No "Ms." prefix. |
| `role` | String | yes | Enum: `'Owner' \| 'Junior Tech' \| 'Senior Tech'` |
| `serviceAvailability` | String | yes | Enum: `'Studio only' \| 'Home service only' \| 'Studio and Home Service'` |
| `workingDays` | [String] | no | Default `[]` |
| `discount` | Number | no | |
| `commissionRate` | Number | no | |
| `status` | String | yes | Enum: `'Active' \| 'Inactive'`, default `'Active'` |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** `status`, `role`.

**Relations:** Referenced by `bookings.nailTechId`, `slots.nailTechId`, `users.assignedNailTechId`.

---

## Collection: `users` (User)

Admin/staff app users (auth + roles).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse. From Firebase migration. |
| `email` | String | yes | Unique, lowercase, trimmed. |
| `password` | String | no | Hashed; often `select: false`. |
| `name` | String | no | |
| `image` | String | no | e.g. OAuth profile picture. |
| `emailVerified` | Boolean | no | Default `false`. |
| `role` | String | no | Enum: `'admin' \| 'staff'`, default `'admin'`. |
| `assignedNailTechId` | String | no | For staff: which NailTech they manage. |
| `status` | String | no | Enum: `'active' \| 'inactive'`, default `'active'`. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** Unique on `email`.

**Relations:** `assignedNailTechId` → NailTech `_id`.

---

## Collection: `customers` (Customer)

Clients who make bookings.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse. From Firebase migration. |
| `name` | String | yes | |
| `firstName` | String | no | |
| `lastName` | String | no | |
| `email` | String | no | Lowercase, trimmed. |
| `phone` | String | no | |
| `socialMediaName` | String | no | |
| `referralSource` | String | no | |
| `referralSourceOther` | String | no | |
| `isRepeatClient` | Boolean | no | |
| `clientType` | String | no | Enum: `'NEW' \| 'REPEAT'`, default `'NEW'`. |
| `totalBookings` | Number | no | Default `0`. |
| `completedBookings` | Number | no | Default `0`. |
| `totalSpent` | Number | no | Default `0`. |
| `totalTips` | Number | no | Default `0`. |
| `totalDiscounts` | Number | no | Default `0`. |
| `lastVisit` | Date | no | Default `null`. |
| `notes` | String | no | |
| `nailHistory` | Object | no | `hasRussianManicure`, `hasGelOverlay`, `hasSoftgelExtensions` (Boolean). |
| `healthInfo` | Object | no | `allergies`, `nailConcerns`, `nailDamageHistory` (String). |
| `inspoDescription` | String | no | |
| `waiverAccepted` | Boolean | no | |
| `isActive` | Boolean | no | Default `true`. |
| `isVIP` | Boolean | no | Default `false`. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** `email`, `phone`, `name`. Runtime: sparse `email` (`customer_email_sparse`), sparse `socialMediaName` (`customer_socialMediaName_sparse`), `isActive`.

**Relations:** Referenced by `bookings.customerId`.

---

## Collection: `slots` (Slot)

Time slots (per nail tech, per date) that can be booked.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse. From Firebase migration. |
| `date` | String | yes | Format `YYYY-MM-DD`. |
| `time` | String | yes | Format `HH:mm`. |
| `status` | String | yes | Enum: `'available' \| 'blocked' \| 'pending' \| 'confirmed'`. |
| `slotType` | String | no | Enum: `'regular' \| 'with_squeeze_fee'`. |
| `notes` | String | no | |
| `isHidden` | Boolean | no | Default `false`. |
| `nailTechId` | String | yes | References NailTech `_id`. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** `{ date, time }`, `{ nailTechId, date }`, `{ date, status }`, `{ nailTechId, date, status }`. Runtime: `{ date, nailTechId }`, `{ status, date }`.

**Relations:** `nailTechId` → NailTech. Bookings reference slots via `booking.slotIds` (array of Slot `_id` strings).

---

## Collection: `quotations` (Quotation)

Invoices/quotations (line items, totals). Bookings can link to one via `invoice.quotationId`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse, indexed. From Firebase migration. |
| `quotationNumber` | String | no | Unique, indexed. Auto-generated if missing (e.g. `QN-YYYYMMDDxxx`). |
| `customerName` | String | yes | |
| `customerPhone` | String | no | |
| `customerEmail` | String | no | |
| `items` | Array | no | See QuotationItem below. |
| `subtotal` | Number | yes | Default `0`. |
| `discountRate` | Number | no | Default `0`. |
| `discountAmount` | Number | no | Default `0`. |
| `squeezeInFee` | Number | no | Default `0`. |
| `totalAmount` | Number | yes | Default `0`. |
| `notes` | String | no | |
| `status` | String | no | Enum: `'draft' \| 'sent' \| 'accepted' \| 'expired'`, default `'draft'`, indexed. |
| `createdBy` | String | no | |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**QuotationItem (embedded in `items`):**

| Field | Type | Required |
|-------|------|----------|
| `description` | String | yes |
| `quantity` | Number | no, default 1, min 1 |
| `unitPrice` | Number | yes, min 0 |
| `total` | Number | yes, min 0 |

**Indexes:** `firebaseId`, unique `quotationNumber`, `status`.

**Relations:** `bookings.invoice.quotationId` stores Quotation `_id` (as string).

---

## Collection: `bookings` (Booking)

Appointments: link customer, nail tech, and one or more slots.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `firebaseId` | String | no | Sparse. From Firebase migration. |
| `bookingCode` | String | yes | Unique, indexed (e.g. `GN-YYYYMMDDNNN`). |
| `customerId` | String | yes | References Customer `_id`. |
| `nailTechId` | String | yes | References NailTech `_id`. |
| `slotIds` | [String] | yes | Array of Slot `_id`s. |
| `service` | Object | yes | See Service sub-document below. |
| `status` | String | yes | Enum: `'pending' \| 'confirmed' \| 'completed' \| 'cancelled' \| 'no_show'`, default `'pending'`. |
| `paymentStatus` | String | yes | Enum: `'unpaid' \| 'partial' \| 'paid' \| 'refunded'`, default `'unpaid'`. |
| `pricing` | Object | yes | See Pricing sub-document below. |
| `payment` | Object | no | See Payment sub-document below. |
| `clientNotes` | String | no | Default `''`. |
| `adminNotes` | String | no | Default `''`. |
| `clientPhotos` | Object | no | `inspiration`, `currentState` arrays of `{ url, publicId, uploadedAt }`. |
| `completedAt` | Date | no | Default `null`; set when appointment is marked completed (effectively immutable once set). Indexed. |
| `confirmedAt` | Date | no | Default `null`. Indexed. |
| `invoice` | Object | no | `quotationId` (Quotation _id), `total`, `createdAt`. |
| `statusReason` | String | no | Default `''`. Reason for cancel/no_show/etc. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Service (embedded):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | String | yes | Enum: `'manicure' \| 'pedicure' \| 'mani_pedi' \| 'home_service_2slots' \| 'home_service_3slots'`. |
| `location` | String | yes | Enum: `'homebased_studio' \| 'home_service'`. |
| `clientType` | String | yes | Enum: `'new' \| 'repeat'`. |

**Pricing (embedded):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `total` | Number | yes | Default `0`. |
| `depositRequired` | Number | yes | Default `0`. |
| `paidAmount` | Number | yes | Default `0`. |
| `tipAmount` | Number | yes | Default `0`. |
| `discountAmount` | Number | no | Default `0`. |

**Payment (embedded):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `method` | String | no | Enum: `'PNB' \| 'CASH' \| 'GCASH'`. |
| `depositPaidAt` | Date | no | |
| `fullyPaidAt` | Date | no | When fully paid. Used with `paymentStatus === 'paid'` to derive "completed". |
| `paymentProofUrl` | String | no | e.g. Cloudinary URL. |
| `paymentProofPublicId` | String | no | For Cloudinary delete. |

**Indexes:** `bookingCode` (unique), `customerId`, `nailTechId`, `slotIds`, `status`, `paymentStatus`, `createdAt` (-1), `{ nailTechId, createdAt }`, `{ status, completedAt }`. Runtime: `{ nailTechId, status }`, `{ status, createdAt }`.

**Relations:** `customerId` → Customer; `nailTechId` → NailTech; `slotIds[]` → Slot; `invoice.quotationId` → Quotation.

**Business rules:** When `paymentStatus === 'paid'` and `payment.fullyPaidAt != null`, status is typically treated as or set to `'completed'`. Balance = `invoice.total - pricing.paidAmount` (min 0).

---

## Collection: `bookingcounters` (BookingCounter)

Per-day sequence for generating unique `bookingCode` (e.g. GN-YYYYMMDD001).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `dateKey` | String | yes | Unique. Format `YYYYMMDD`. |
| `seq` | Number | yes | Default `0`. Incremented per booking created that day. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** Unique on `dateKey`.

---

## Collection: `settings` (Settings)

Single-document app settings (e.g. business name, fees, notifications). Uses a fixed `_id`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | String | no | Default `'global'`. |
| `businessName` | String | no | Default `'Glammed Nails by Jhen'`. |
| `reservationFee` | Number | no | Default `500`. |
| `adminCommissionRate` | Number | no | Default `10`, min 0, max 100. |
| `emailNotifications` | Boolean | no | Default `true`. |
| `smsNotifications` | Boolean | no | Default `false`. |
| `reminderHoursBefore` | Number | no | Default `24`. |
| `googleSheetsId` | String | no | Default `''`. |
| `googleSheetsEnabled` | Boolean | no | Default `false`. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

---

## Collection: `auditlogs` (AuditLog)

Audit trail of user actions. TTL: documents expire 90 days after `createdAt`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `userId` | String | no | Indexed. |
| `userEmail` | String | no | |
| `userName` | String | no | |
| `action` | String | yes | Indexed. |
| `resource` | String | yes | Indexed. |
| `resourceId` | String | no | Indexed. |
| `details` | Mixed | no | |
| `ipAddress` | String | no | |
| `userAgent` | String | no | |
| `createdAt` | Date | auto | TTL index. |
| `updatedAt` | Date | auto | |

**Indexes:** `userId`, `action`, `resource`, `resourceId`, `createdAt` (-1), `{ resource, resourceId }`, `{ userId, createdAt }`. TTL on `createdAt` (90 days).

---

## Collection: `notificationlogs` (NotificationLog)

Log of sent notifications (payment reminders, appointment reminders).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `bookingId` | String | yes | Indexed. |
| `type` | String | yes | e.g. `'payment_6h'`, `'payment_12h'`, `'appt_24h'`, etc. |
| `scheduledFor` | Date | yes | |
| `sentAt` | Date | yes | |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:** `bookingId`, unique compound `{ bookingId, type }`.

---

## Reference / Enums (from app types)

- **BookingStatus:** `'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'`
- **PaymentStatus:** `'unpaid' | 'partial' | 'paid' | 'refunded'`
- **SlotStatus:** `'available' | 'blocked' | 'pending' | 'confirmed'`
- **Service type (Booking):** `'manicure' | 'pedicure' | 'mani_pedi' | 'home_service_2slots' | 'home_service_3slots'`
- **Quotation status:** `'draft' | 'sent' | 'accepted' | 'expired'`

---

## Migration notes (Firebase → MongoDB)

- Models that were migrated from Firebase have optional `firebaseId` (sparse) for idempotency and lookup.
- Foreign keys are stored as strings (ObjectId hex): `customerId`, `nailTechId`, `slotIds[]`, `invoice.quotationId`, `assignedNailTechId`.
- Rollback scripts only delete from MongoDB; they do not touch Firebase.
