# API Integration Plan
## Nail Appointment Booking Admin Dashboard

---

## External API Integrations

| Feature | API | Endpoint | HTTP Method | Parameters | Response Fields |
|---------|-----|----------|-------------|------------|-----------------|
| Fetch pricing data from spreadsheet | Google Sheets API | `/v4/spreadsheets/{spreadsheetId}/values/{range}` | GET | spreadsheetId, range, key | range, majorDimension, values |
| Append booking to backup sheet | Google Sheets API | `/v4/spreadsheets/{spreadsheetId}/values/{range}:append` | POST | spreadsheetId, range, valueInputOption, values | spreadsheetId, tableRange, updates.updatedRows |
| Update booking in backup sheet | Google Sheets API | `/v4/spreadsheets/{spreadsheetId}/values/{range}` | PUT | spreadsheetId, range, valueInputOption, values | spreadsheetId, updatedRange, updatedRows |
| Send booking confirmation email | Resend API | `/emails` | POST | from, to, subject, html | id, from, to, created_at |
| Send payment reminder email | Resend API | `/emails` | POST | from, to, subject, html | id, from, to, created_at |
| Send appointment reminder email | Resend API | `/emails` | POST | from, to, subject, html | id, from, to, created_at |
| Upload payment proof image (Admin) | Cloudinary API | `/v1_1/{cloud_name}/image/upload` | POST | file, upload_preset (payment_proofs), cloud_name | public_id, secure_url, width, height, format |
| Upload nail photo (Client) | Cloudinary API | `/v1_1/{cloud_name}/image/upload` | POST | file, upload_preset (nail_photos), cloud_name, signature, timestamp | public_id, secure_url, width, height, format, eager (thumbnail) |
| Delete image | Cloudinary API | `/v1_1/{cloud_name}/image/destroy` | POST | public_id, api_key, timestamp, signature | result |


---

## API Type Classification

| API | Type | Purpose |
|-----|------|---------|
| Google Sheets API | RESTful API | External data storage and pricing management |
| Resend API | RESTful API | Email notification service |
| Cloudinary API | RESTful API | Cloud image storage and management |
| PayMongo API | RESTful API | Philippine payment gateway |


---

## Why These APIs Were Chosen

### Google Sheets API
- **Purpose:** Store pricing data and backup bookings
- **Why:** Easy for non-technical staff to update prices; provides secondary backup
- **Type:** RESTful API (Open API)
- **Cost:** Free (within quotas)

### Resend API
- **Purpose:** Send automated email notifications
- **Why:** Modern developer-friendly API, better deliverability than SendGrid, React email templates support
- **Type:** RESTful API (Third-Party Service)
- **Cost:** 100 emails/day free, then $20/month for 50k emails

### Cloudinary API
- **Purpose:** Upload and store payment proof images (admin) and nail inspiration/current state photos (client)
- **Why:** Free tier available, automatic image optimization, CDN delivery, thumbnail generation, signed uploads for security
- **Type:** RESTful API (Third-Party Service)
- **Cost:** 25GB storage free (sufficient for ~25,000 images), paid plans from $99/month


---

## Authentication Methods

| API | Authentication Type | Required Credentials |
|-----|-------------------|---------------------|
| Google Sheets API | OAuth 2.0 Service Account | Service Account Email, Private Key |
| Resend API | API Key | API Key (Bearer Token) |
| Cloudinary API | API Key + Secret | Cloud Name, API Key, API Secret |


---

## Rate Limits & Pricing

| API | Free Tier | Rate Limit | Paid Plans |
|-----|-----------|------------|------------|
| Google Sheets API | Yes | 100 requests/100 seconds/user | Free (quota limits apply) |
| Resend API | 100 emails/day | 10 requests/second | $20/month for 50k emails |
| Cloudinary API | 25GB storage, 25GB bandwidth | No specific limit | From $99/month |
| PayMongo API | No free tier | Transaction-based | 3.5% + ₱15 per transaction |

---

## Integration Priority

### Phase 1 (Essential - Week 1-2)
1. ✅ **Google Sheets API** - Critical for pricing and backup
2. ✅ **Resend API** - Essential for email notifications

### Phase 2 (Important - Week 3-4)
3. ✅ **Cloudinary API** - Important for payment proof uploads



---

## Sample API Requests

### Example 1: Google Sheets API - Fetch Pricing
```javascript
GET https://sheets.googleapis.com/v4/spreadsheets/1abc...xyz/values/pricing!A2:C100?key=YOUR_API_KEY

Response:
{
  "range": "pricing!A2:C100",
  "majorDimension": "ROWS",
  "values": [
    ["Gel Manicure", "500", "Manicure"],
    ["Nail Art Design", "300", "Add-ons"],
    ["Chrome Finish", "200", "Add-ons"]
  ]
}
```

### Example 2: Resend API - Send Email
```javascript
POST https://api.resend.com/emails
Headers: Authorization: Bearer YOUR_API_KEY

Body:
{
  "from": "Glam Nails <noreply@glamnails.com>",
  "to": ["client@email.com"],
  "subject": "Booking Confirmation - GN-20260205001",
  "html": "<h2>Your appointment is confirmed!</h2><p>Booking Number: GN-20260205001</p><p>Date: February 10, 2026</p><p>Time: 2:00 PM</p>"
}

Response:
{
  "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
  "from": "noreply@glamnails.com",
  "to": ["client@email.com"],
  "created_at": "2026-02-05T14:00:00.000Z"
}
```

### Example 3a: Cloudinary API - Upload Payment Proof (Admin)
```javascript
POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
Body: multipart/form-data
- file: [binary image data]
- upload_preset: "payment_proofs"
- folder: "payment_proofs/booking_GN-20260205001"

Response:
{
  "public_id": "payment_proofs/booking_GN-20260205001/proof_123",
  "secure_url": "https://res.cloudinary.com/.../proof_123.jpg",
  "width": 1920,
  "height": 1080,
  "format": "jpg"
}
```

### Example 3b: Cloudinary API - Upload Nail Photo (Client with Signed URL)
```javascript
// Step 1: Get signed upload parameters from your API
POST /api/integrations/storage/generate-signature
Body: { "bookingId": "65a1b2c3d4e5f6g7h8i9j0k5", "photoType": "inspiration" }

Response:
{
  "signature": "abc123signature",
  "timestamp": 1707220800,
  "cloudName": "your-cloud-name",
  "apiKey": "123456789",
  "uploadPreset": "nail_photos",
  "folder": "nail_inspo/booking_GN-20260205001",
  "expiresIn": 900
}

// Step 2: Upload directly to Cloudinary with signature
POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
Body: multipart/form-data
- file: [binary image data]
- upload_preset: "nail_photos"
- folder: "nail_inspo/booking_GN-20260205001"
- timestamp: 1707220800
- signature: "abc123signature"
- api_key: "123456789"

Response:
{
  "public_id": "nail_inspo/booking_GN-20260205001/inspo_1",
  "secure_url": "https://res.cloudinary.com/.../inspo_1.jpg",
  "width": 2000,
  "height": 1500,
  "format": "jpg",
  "eager": [
    {
      "secure_url": "https://res.cloudinary.com/.../inspo_1_thumb.jpg",
      "width": 300,
      "height": 300
    }
  ]
}
```

### Example 4: Google Sheets API - Append Booking Backup
```javascript
POST https://sheets.googleapis.com/v4/spreadsheets/1abc...xyz/values/Bookings!A:Z:append?valueInputOption=USER_ENTERED
Headers: Authorization: Bearer YOUR_ACCESS_TOKEN

Body:
{
  "values": [
    [
      "GN-20260205001",
      "Maria Santos",
      "+639123456789",
      "Manicure",
      "2026-02-10",
      "14:00",
      "HOME",
      "1000",
      "CONFIRMED",
      "2026-02-05T14:00:00Z"
    ]
  ]
}

Response:
{
  "spreadsheetId": "1abc...xyz",
  "tableRange": "Bookings!A1:Z156",
  "updates": {
    "updatedRows": 1
  }
}
```

### Example 5: PayMongo API - Create Payment Source
```javascript
POST https://api.paymongo.com/v1/sources
Headers: Authorization: Basic [Base64(secret_key:)]

Body:
{
  "data": {
    "attributes": {
      "type": "gcash",
      "amount": 100000,
      "currency": "PHP",
      "redirect": {
        "success": "https://glamnails.com/payment/success",
        "failed": "https://glamnails.com/payment/failed"
      }
    }
  }
}

Response:
{
  "data": {
    "id": "src_abc123xyz",
    "attributes": {
      "status": "pending",
      "type": "gcash",
      "amount": 100000,
      "checkout_url": "https://pay.gcash.com/checkout/abc123xyz"
    }
  }
}
```

---

## Environment Variables Required

```env
# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PRICING_SHEET_ID=1abc...xyz
BOOKINGS_BACKUP_SHEET_ID=1abc...xyz

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@glamnails.com

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateway (Optional - Future)
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

---

## Integration Steps

### Step 1: Google Sheets API Setup
1. Go to Google Cloud Console
2. Create new project
3. Enable Google Sheets API
4. Create Service Account
5. Download JSON credentials
6. Share your pricing/backup sheets with service account email

### Step 2: Resend API Setup
1. Sign up at resend.com
2. Verify your domain
3. Get API key from dashboard
4. Test with 100 free emails/day

### Step 3: Cloudinary API Setup
1. Sign up at cloudinary.com
2. Get Cloud Name, API Key, and API Secret from dashboard
3. Create two upload presets:
   
   **Preset 1: payment_proofs (Admin uploads)**
   - Preset name: `payment_proofs`
   - Signing mode: Signed
   - Folder: `payment_proofs`
   - Allowed formats: jpg, png, webp
   - Max file size: 5MB
   - Transformations: Resize to max 1500px width, quality auto:good
   
   **Preset 2: nail_photos (Client uploads)**
   - Preset name: `nail_photos`
   - Signing mode: Signed (for security)
   - Folder: `nail_photos`
   - Allowed formats: jpg, png, webp, heic
   - Max file size: 10MB
   - Transformations: Resize to max 2000px width, quality auto:eco
   - Eager transformations: Create 300x300 thumbnail
   
4. Enable signed uploads for both presets for security

### Step 4: PayMongo API Setup (Optional - Future)
1. Sign up at paymongo.com
2. Complete business verification
3. Get API keys (test and live)
4. Configure webhook endpoints
5. Test with test mode first

---

## Why Resend Over SendGrid?

| Feature | Resend | SendGrid |
|---------|--------|----------|
| Free Tier | 100 emails/day | 100 emails/day |
| Pricing | $20/month for 50k emails | $19.95/month for 40k emails |
| Developer Experience | Modern, simple API | Complex, legacy API |
| React Email Support | Built-in | Requires setup |
| Email Templates | React components | HTML templates |
| Deliverability | Excellent | Good |
| Documentation | Clear, modern | Comprehensive but complex |

**Verdict:** Resend is more developer-friendly, has better modern tooling, and similar pricing.
