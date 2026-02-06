# API Integration Plan - Nail Appointment Booking Admin Dashboard

| Feature | API | Endpoint | HTTP Method | Parameters | Response Fields |
|---------|-----|----------|-------------|------------|-----------------|
| Admin Login | Authentication API | `/api/auth/login` | POST | email, password | user.id, user.email, user.name, user.role, token, expiresIn |
| Get Current User | Authentication API | `/api/auth/me` | GET | - | id, email, name, role, isActive, lastLogin |
| Admin Logout | Authentication API | `/api/auth/logout` | POST | - | success, message |
| Password Reset Request | Authentication API | `/api/auth/forgot-password` | POST | email | success, message |
| Reset Password | Authentication API | `/api/auth/reset-password` | POST | token, newPassword | success, message |
| Get Dashboard Stats | Dashboard API | `/api/dashboard/stats` | GET | period (optional) | today.bookings, today.revenue, today.newClients, week.bookings, week.revenue, pendingPayments, averageBookingValue |
| Get Recent Activity | Dashboard API | `/api/dashboard/activity` | GET | limit (optional) | activities[].id, activities[].type, activities[].description, activities[].user, activities[].timestamp |
| Get All Bookings | Booking API | `/api/bookings` | GET | page, limit, status, search, dateFrom, dateTo, serviceId, nailTechId, locationType, sortBy, sortOrder | bookings[]._id, bookings[].bookingNumber, bookings[].client, bookings[].service, bookings[].appointmentDate, bookings[].status, pagination.total |
| Get Single Booking | Booking API | `/api/bookings/:id` | GET | id (path) | _id, bookingNumber, client, service, nailTech, appointmentDate, appointmentTime, status, pricing, payment, specialRequests |
| Create Booking | Booking API | `/api/bookings` | POST | clientId, serviceId, nailTechId, appointmentDate, appointmentTime, locationType, address, serviceDescription, totalPrice, reservationFee | _id, bookingNumber, status, expiresAt, createdAt, message |
| Update Booking | Booking API | `/api/bookings/:id` | PUT | id (path), appointmentDate, appointmentTime, serviceDescription, totalPrice, adminNotes | _id, bookingNumber, appointmentDate, appointmentTime, updatedAt, message |
| Check Availability | Booking API | `/api/bookings/check-availability` | POST | nailTechId, appointmentDate, appointmentTime | available, conflictingBooking.bookingNumber, conflictingBooking.clientName |
| Confirm Payment | Booking API | `/api/bookings/:id/confirm-payment` | POST | id (path), paymentMethod, reference, proofUrl | _id, bookingNumber, status, payment.reservationPaid, payment.reservationPaidAt, message |
| Cancel Booking | Booking API | `/api/bookings/:id/cancel` | POST | id (path), reason, refundIssued | _id, bookingNumber, status, updatedAt, message |
| Mark as Completed | Booking API | `/api/bookings/:id/complete` | POST | id (path), fullPaymentReceived, fullPaymentMethod, notes | _id, bookingNumber, status, payment.fullPaymentReceived, pricing.nailTechCommission, message |
| Mark as No-Show | Booking API | `/api/bookings/:id/no-show` | POST | id (path), notes | _id, bookingNumber, status, updatedAt, message |
| Get All Clients | Client API | `/api/clients` | GET | page, limit, search, clientType, isActive, sortBy, sortOrder | clients[]._id, clients[].firstName, clients[].lastName, clients[].email, clients[].phone, clients[].clientType, clients[].totalBookings, clients[].totalSpent, pagination.total |
| Get Single Client | Client API | `/api/clients/:id` | GET | id (path) | _id, firstName, lastName, email, phone, address, clientType, totalBookings, completedBookings, totalSpent, lastVisit, preferences, healthInfo |
| Create Client | Client API | `/api/clients` | POST | firstName, lastName, email, phone, address, preferences, healthInfo | _id, firstName, lastName, email, clientType, createdAt, message |
| Update Client | Client API | `/api/clients/:id` | PUT | id (path), phone, address, preferences | _id, phone, updatedAt, message |
| Get Client Bookings | Client API | `/api/clients/:id/bookings` | GET | id (path), page, limit, status | bookings[]._id, bookings[].bookingNumber, bookings[].service, bookings[].appointmentDate, bookings[].status, pagination.total |
| Delete Client | Client API | `/api/clients/:id` | DELETE | id (path) | success, message |
| Get All Nail Techs | Nail Tech API | `/api/nail-techs` | GET | isActive | nailTechs[]._id, nailTechs[].name, nailTechs[].email, nailTechs[].phone, nailTechs[].commissionRate, nailTechs[].discountRate, nailTechs[].isActive |
| Get Single Nail Tech | Nail Tech API | `/api/nail-techs/:id` | GET | id (path) | _id, name, email, phone, commissionRate, discountRate, isActive, createdAt |
| Create Nail Tech | Nail Tech API | `/api/nail-techs` | POST | name, email, phone, commissionRate, discountRate | _id, name, isActive, createdAt, message |
| Update Nail Tech | Nail Tech API | `/api/nail-techs/:id` | PUT | id (path), commissionRate, discountRate, phone | _id, commissionRate, discountRate, updatedAt, message |
| Get Nail Tech Stats | Nail Tech API | `/api/nail-techs/:id/stats` | GET | id (path), period | monthlyEarnings, completedBookings, averageBookingValue, averageRating, monthlyBreakdown[].month, monthlyBreakdown[].earnings |
| Get Nail Tech Schedule | Nail Tech API | `/api/nail-techs/:id/schedule` | GET | id (path), startDate, endDate | bookings[].bookingNumber, bookings[].appointmentDate, bookings[].appointmentTime, bookings[].clientName, bookings[].service, bookings[].status |
| Get All Services | Service API | `/api/services` | GET | isActive | services[]._id, services[].name, services[].isActive, services[].createdAt |
| Update Service Status | Service API | `/api/services/:id` | PUT | id (path), isActive | _id, name, isActive, updatedAt, message |
| Get All Quotations | Quotation API | `/api/quotations` | GET | page, limit, status, bookingId, clientId | quotations[]._id, quotations[].invoiceNumber, quotations[].booking, quotations[].client, quotations[].totalAmount, quotations[].status, pagination.total |
| Get Single Quotation | Quotation API | `/api/quotations/:id` | GET | id (path) | _id, invoiceNumber, booking, client, itemizedServices[], subtotal, discountAmount, totalAmount, googleSheetUrl, status, sentAt |
| Create Quotation | Quotation API | `/api/quotations` | POST | bookingId, itemizedServices[], discountPercentage | _id, invoiceNumber, subtotal, discountAmount, totalAmount, googleSheetUrl, createdAt, message |
| Get All Notifications | Notification API | `/api/notifications` | GET | page, limit, type, status, bookingId | notifications[]._id, notifications[].booking, notifications[].client, notifications[].type, notifications[].channel, notifications[].status, pagination.total |
| Send Manual Notification | Notification API | `/api/notifications/send` | POST | bookingId, type, channel | _id, status, sentAt, message |
| Get Revenue Report | Reports API | `/api/reports/revenue` | GET | startDate, endDate, groupBy | totalRevenue, totalBookings, avgBookingValue, growthRate, dailyRevenue[], byService[], byLocation[] |
| Get Booking Statistics | Reports API | `/api/reports/bookings` | GET | startDate, endDate | totalBookings, statusBreakdown, cancellationRate, noShowRate, conversionRate, peakHours[], peakDays[] |
| Get Client Analytics | Reports API | `/api/reports/clients` | GET | startDate, endDate | totalClients, newClients, repeatClients, retentionRate, averageLifetimeValue, topClients[] |
| Export Report | Reports API | `/api/reports/export` | POST | reportType, format, startDate, endDate, includeCharts | downloadUrl, expiresAt, message |
| Get Pricing from Google Sheets | Google Sheets API | `/api/integrations/google-sheets/pricing` | GET | - | services[].service, services[].price, services[].category, lastUpdated |
| Backup Booking to Google Sheets | Google Sheets API | `/api/integrations/google-sheets/backup` | POST | bookingId | sheetUrl, rowNumber, message |
| Send Email | Email Service API | `/api/integrations/email/send` | POST | to, subject, template, data | messageId, sentAt, message |
| Send SMS | SMS Service API | `/api/integrations/sms/send` | POST | to, message | messageId, sentAt, status, message |
| Upload Payment Proof (Admin) | Cloud Storage API | `/api/integrations/storage/upload-payment` | POST | file (multipart), bookingId | url, publicId, width, height, format, size, message |
| Upload Nail Photo (Client) | Cloud Storage API | `/api/integrations/storage/upload-client` | POST | file (multipart), bookingId, photoType | url, publicId, width, height, format, size, thumbnail, message |
| Generate Upload Signature | Cloud Storage API | `/api/integrations/storage/generate-signature` | POST | bookingId, photoType | signature, timestamp, cloudName, apiKey, uploadPreset, folder, expiresIn |
| Delete Image | Cloud Storage API | `/api/integrations/storage/delete` | DELETE | publicId | success, message |

---

## Notes

**Authentication:** Most endpoints require JWT token in Authorization header: `Bearer {token}`

**Rate Limits:**
- Login: 5 requests/minute
- GET endpoints: 100 requests/15 minutes  
- POST/PUT endpoints: 100 requests/15 minutes
- Export: 20 requests/hour

**Common HTTP Status Codes:**
- 200: Success
- 400: Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Server Error
