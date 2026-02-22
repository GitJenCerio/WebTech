# Integration Architecture Summary
## glammednailsbyjhen - Booking System

**Last Updated:** February 6, 2026  
**Project:** MO-IT149 Web Technology Application

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Decision: Client vs Admin Uploads](#architecture-decision-client-vs-admin-uploads)
3. [Cloudinary Integration Strategy](#cloudinary-integration-strategy)
4. [API Endpoints Summary](#api-endpoints-summary)
5. [Security Model](#security-model)
6. [Cost Analysis](#cost-analysis)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

### System Purpose
Admin dashboard for managing nail appointment bookings with dual image upload capabilities:
- **Admin uploads:** Payment proof images
- **Client uploads:** Nail inspiration and current nail state photos

### Technology Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Backend:** Next.js API Routes, MongoDB with Mongoose
- **Authentication:** NextAuth.js with JWT
- **File Storage:** Cloudinary (unified solution for all uploads)
- **Email:** Resend API
- **Data Backup:** Google Sheets API

---

## Architecture Decision: Client vs Admin Uploads

### Why Cloudinary for BOTH Use Cases?

#### ✅ Chosen Solution: Cloudinary with Dual Upload Presets

**Benefits:**
1. **Single Integration** - One API to learn and maintain
2. **Cost Effective** - Free tier (25GB) sufficient for 1-2 years
3. **Automatic Optimization** - Reduces bandwidth and storage costs
4. **Security Flexibility** - Signed URLs for client uploads, JWT auth for admin
5. **Built-in CDN** - Fast image delivery worldwide
6. **Thumbnail Generation** - Automatic thumbnail creation for galleries
7. **Production Ready** - Enterprise-grade reliability

#### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|-------------|--------------|
| **AWS S3 Direct** | More complex setup, no built-in optimization, requires CloudFront for CDN |
| **Firebase Storage** | Overkill if not using Firebase ecosystem, higher cost at scale |
| **ImgBB/Imgur** | Not reliable for business use, limited features |
| **Local File System** | Not scalable, no CDN, storage limitations |
| **Database (Base64)** | Extremely inefficient, bloats database size |

---

## Cloudinary Integration Strategy

### Upload Presets Configuration

#### 1. Payment Proofs Preset (Admin Only)

```javascript
Preset Name: payment_proofs
Signing Mode: Signed (requires authentication)
Access Control: Authenticated users only (admin JWT required)

Configuration:
{
  "folder": "payment_proofs",
  "allowed_formats": ["jpg", "png", "webp"],
  "max_file_size": 5242880,  // 5MB
  "transformation": [
    { "width": 1500, "crop": "limit" },
    { "quality": "auto:good", "fetch_format": "auto" }
  ],
  "access_mode": "authenticated",
  "unique_filename": true,
  "overwrite": false
}
```

**Usage Flow:**
1. Admin logs in → JWT token issued
2. Admin selects payment proof file
3. Frontend validates file (type, size)
4. API route `/api/integrations/storage/upload-payment` receives file
5. Middleware verifies JWT and admin role
6. Backend uploads to Cloudinary with `payment_proofs` preset
7. URL stored in `booking.payment.paymentProofUrl`
8. Old payment proof automatically deleted

#### 2. Nail Photos Preset (Client Accessible)

```javascript
Preset Name: nail_photos
Signing Mode: Signed (secure, time-limited)
Access Control: Public with signed URLs

Configuration:
{
  "folder": "nail_photos",
  "allowed_formats": ["jpg", "png", "webp", "heic"],
  "max_file_size": 10485760,  // 10MB (high-res phone cameras)
  "transformation": [
    { "width": 2000, "crop": "limit" },
    { "quality": "auto:eco", "fetch_format": "auto" }
  ],
  "eager": [
    { 
      "width": 300, 
      "height": 300, 
      "crop": "fill",
      "gravity": "auto"  // AI-based cropping
    }
  ],
  "access_mode": "public",
  "unique_filename": true,
  "overwrite": false
}
```

**Usage Flow:**
1. Client fills booking form
2. Client clicks "Upload Nail Inspo"
3. Frontend requests signed URL from `/api/integrations/storage/generate-signature`
4. Backend validates booking exists and upload limit not exceeded
5. Backend generates signature (expires in 15 minutes)
6. Frontend uploads directly to Cloudinary using signed URL
7. After successful upload, frontend sends URL to backend
8. Backend stores in `booking.clientPhotos.inspiration[]`
9. Thumbnail automatically generated for gallery view

---

## API Endpoints Summary

### File Upload Endpoints

#### Admin Payment Proof Upload
```http
POST /api/integrations/storage/upload-payment
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

Body:
- file: [binary]
- bookingId: string

Response:
{
  "url": "https://res.cloudinary.com/.../proof.jpg",
  "publicId": "payment_proofs/booking_GN-001/proof_123",
  "width": 1500,
  "height": 1000,
  "format": "jpg",
  "size": 245678,
  "message": "Payment proof uploaded successfully"
}
```

#### Client Nail Photo - Step 1: Get Signature
```http
POST /api/integrations/storage/generate-signature

Body:
{
  "bookingId": "65a1b2c3d4e5f6g7h8i9j0k5",
  "photoType": "inspiration" | "currentState"
}

Response:
{
  "signature": "abc123...",
  "timestamp": 1707220800,
  "cloudName": "your-cloud-name",
  "apiKey": "123456789",
  "uploadPreset": "nail_photos",
  "folder": "nail_inspo/booking_GN-20260205001",
  "expiresIn": 900  // 15 minutes
}
```

#### Client Nail Photo - Step 2: Upload to Cloudinary
```http
POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
Content-Type: multipart/form-data

Body:
- file: [binary]
- upload_preset: "nail_photos"
- folder: "nail_inspo/booking_GN-20260205001"
- timestamp: 1707220800
- signature: "abc123..."
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

#### Client Nail Photo - Step 3: Save to Database
```http
POST /api/bookings/{bookingId}/add-photo

Body:
{
  "photoType": "inspiration" | "currentState",
  "url": "https://res.cloudinary.com/.../inspo_1.jpg",
  "publicId": "nail_inspo/booking_GN-20260205001/inspo_1",
  "thumbnailUrl": "https://res.cloudinary.com/.../inspo_1_thumb.jpg"
}

Response:
{
  "success": true,
  "photoId": "photo_123",
  "message": "Photo added successfully"
}
```

#### Delete Image (Admin Only)
```http
DELETE /api/integrations/storage/delete
Authorization: Bearer {jwt_token}

Body:
{
  "publicId": "payment_proofs/booking_GN-001/proof_123"
}

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## Security Model

### Admin Uploads (Payment Proofs)

**Authentication:** JWT Token (HTTP-only cookie)
**Authorization:** ADMIN, SUPER_ADMIN roles only
**Validation:**
- File type: JPEG, PNG, WebP only
- File size: Max 5MB
- Booking exists and belongs to authenticated admin
- Rate limit: 100 uploads per hour per admin

**Implementation:**
```javascript
// Middleware chain
authMiddleware → roleMiddleware(['ADMIN', 'SUPER_ADMIN']) → fileValidation → uploadHandler
```

### Client Uploads (Nail Photos)

**Authentication:** Signed URLs with expiration
**Authorization:** Valid booking ID required
**Validation:**
- File type: JPEG, PNG, WebP, HEIC
- File size: Max 10MB
- Max 3 inspiration photos + 3 current state photos per booking
- Signed URL expires in 15 minutes
- Rate limit: 10 signature requests per hour per booking

**Security Benefits of Signed URLs:**
1. **Time-Limited:** Signature expires after 15 minutes
2. **Scope-Limited:** Can only upload to specific folder
3. **Tamper-Proof:** Signature invalid if parameters modified
4. **No Backend Load:** Upload happens directly to Cloudinary
5. **Trackable:** Each upload tied to specific booking

**Implementation:**
```javascript
// Frontend flow
requestSignature() → validateFile() → uploadToCloudinary() → saveToDatabase()

// Signature generation (backend)
const signature = cloudinary.utils.api_sign_request(
  {
    timestamp,
    upload_preset: 'nail_photos',
    folder: `nail_inspo/${bookingId}`
  },
  process.env.CLOUDINARY_API_SECRET
);
```

---

## Cost Analysis

### Cloudinary Pricing Tiers

#### Free Tier (First 1-2 Years)
- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Cost:** $0/month

**Capacity Estimate:**
- Payment proofs: 500 KB avg × 50/month = 25 MB/month
- Nail photos: 2 MB avg × 2 photos × 50 bookings = 200 MB/month
- Total: ~225 MB/month = 2.7 GB/year
- **Conclusion:** Free tier sufficient for 9+ years at current volume

#### Plus Tier (If Scaling Needed)
- **Storage:** 97 GB
- **Bandwidth:** 97 GB/month
- **Transformations:** 100,000/month
- **Cost:** $89/month (annual) or $99/month (monthly)

**When to Upgrade:**
- Processing 300+ bookings/month consistently
- Storing 2+ years of historical images
- High traffic website (10K+ visitors/month)

### Cost Optimization Strategies

1. **Auto-Cleanup Policy**
   - Delete client photos 30 days after booking completion
   - Keep payment proofs indefinitely (legal/accounting requirement)
   - Estimated savings: Stay on free tier indefinitely

2. **Aggressive Compression**
   - Use `quality: auto:eco` for client uploads
   - Use `quality: auto:good` for payment proofs
   - Estimated savings: 50-70% storage reduction

3. **Lazy Loading**
   - Only load images when visible in viewport
   - Estimated savings: 40% bandwidth reduction

4. **Thumbnail Caching**
   - Generate and cache 300×300 thumbnails
   - Use in gallery lists, full image only on click
   - Estimated savings: 90% bandwidth for gallery views

**Total Estimated Cost:**
- **Year 1:** $0 (free tier)
- **Year 2:** $0 (with cleanup policy)
- **Year 3+:** $0-89/month (depends on scale)

---

## Implementation Checklist

### Phase 1: Cloudinary Setup ✅
- [ ] Create Cloudinary account
- [ ] Get Cloud Name, API Key, API Secret
- [ ] Create `payment_proofs` upload preset
- [ ] Create `nail_photos` upload preset
- [ ] Configure transformations and eager transformations
- [ ] Test signed upload URL generation
- [ ] Add environment variables to `.env.local`

### Phase 2: Admin Upload Implementation ✅
- [ ] Create `/api/integrations/storage/upload-payment` endpoint
- [ ] Implement JWT authentication middleware
- [ ] Add role-based authorization (ADMIN, SUPER_ADMIN)
- [ ] Implement file validation (type, size)
- [ ] Test payment proof upload flow
- [ ] Implement auto-delete old payment proofs
- [ ] Add error handling and logging

### Phase 3: Client Upload Implementation ✅
- [ ] Create `/api/integrations/storage/generate-signature` endpoint
- [ ] Implement booking validation
- [ ] Add upload limit checks (max 6 photos per booking)
- [ ] Create frontend upload component with preview
- [ ] Implement direct-to-Cloudinary upload
- [ ] Create `/api/bookings/{id}/add-photo` endpoint
- [ ] Test nail photo upload flow (inspiration + current state)
- [ ] Add progress indicators and error messages

### Phase 4: Image Management ✅
- [ ] Create `/api/integrations/storage/delete` endpoint
- [ ] Implement admin-only deletion
- [ ] Create cron job for auto-cleanup (30 days after completion)
- [ ] Add image gallery view in admin dashboard
- [ ] Implement thumbnail generation and caching
- [ ] Add lazy loading for image lists
- [ ] Test image retrieval performance

### Phase 5: Security & Optimization ✅
- [ ] Implement rate limiting on signature generation
- [ ] Add CSRF protection
- [ ] Set up Content Security Policy headers
- [ ] Configure CORS for Cloudinary domain
- [ ] Test signed URL expiration
- [ ] Implement content moderation (optional, Cloudinary AI)
- [ ] Add audit logging for uploads/deletions
- [ ] Performance testing under load

### Phase 6: Testing & Deployment ✅
- [ ] Unit tests for upload utilities
- [ ] Integration tests for API endpoints
- [ ] E2E tests for upload flows
- [ ] Test with various file types and sizes
- [ ] Test upload failure scenarios
- [ ] Test cleanup cron job
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Database Schema Updates

### Booking Model - Add Client Photos

```javascript
const BookingSchema = new mongoose.Schema({
  // ... existing fields ...
  
  clientPhotos: {
    inspiration: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      thumbnailUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    currentState: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      thumbnailUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    deletedAt: Date  // When photos were auto-deleted
  },
  
  payment: {
    // ... existing payment fields ...
    paymentProofUrl: String,
    paymentProofPublicId: String,
    paymentProofUploadedAt: Date
  }
});
```

---

## Frontend Component Examples

### Client Upload Component

```tsx
// components/booking/NailPhotoUpload.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface NailPhotoUploadProps {
  bookingId: string;
  photoType: 'inspiration' | 'currentState';
  maxPhotos?: number;
}

export function NailPhotoUpload({ 
  bookingId, 
  photoType, 
  maxPhotos = 3 
}: NailPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (photos.length >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and HEIC images are allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Get signed upload URL
      const signatureRes = await fetch('/api/integrations/storage/generate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, photoType })
      });

      if (!signatureRes.ok) {
        throw new Error('Failed to generate upload signature');
      }

      const { signature, timestamp, cloudName, apiKey, uploadPreset, folder } = 
        await signatureRes.json();

      // Step 2: Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('api_key', apiKey);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadRes.json();

      // Step 3: Save to database
      const saveRes = await fetch(`/api/bookings/${bookingId}/add-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoType,
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          thumbnailUrl: uploadData.eager?.[0]?.secure_url
        })
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save photo');
      }

      setPhotos([...photos, uploadData.secure_url]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={url}
              alt={`Nail ${photoType} ${index + 1}`}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        ))}
      </div>

      {photos.length < maxPhotos && (
        <label className="block">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            disabled={uploading}
            className="hidden"
          />
          <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500">
            {uploading ? 'Uploading...' : `Upload ${photoType} photo (${photos.length}/${maxPhotos})`}
          </div>
        </label>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
}
```

---

## Monitoring & Maintenance

### Key Metrics to Track

1. **Storage Usage**
   - Monitor Cloudinary dashboard monthly
   - Alert when approaching 80% of free tier (20GB)

2. **Upload Success Rate**
   - Target: >99% success rate
   - Alert if drops below 95%

3. **Image Load Performance**
   - Target: <2s for page with 10 images
   - Monitor Core Web Vitals (LCP)

4. **Cleanup Job Success**
   - Verify cron job runs daily
   - Monitor number of images deleted
   - Alert on failures

### Maintenance Tasks

**Weekly:**
- [ ] Review error logs for upload failures
- [ ] Check storage usage trend

**Monthly:**
- [ ] Review and optimize slow image queries
- [ ] Update Cloudinary transformation settings if needed
- [ ] Review image CDN cache hit rate

**Quarterly:**
- [ ] Review and adjust cleanup policy
- [ ] Analyze cost trends and optimize
- [ ] Security audit of signed URL implementation

---

## Quick Reference

### Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET_PAYMENT=payment_proofs
CLOUDINARY_UPLOAD_PRESET_CLIENT=nail_photos
```

### File Size Limits
- Payment proofs (admin): 5MB
- Nail photos (client): 10MB

### Upload Limits
- Inspiration photos: 3 per booking
- Current state photos: 3 per booking
- Total: 6 photos per booking

### Image Retention
- Payment proofs: Indefinite
- Client photos: 30 days after booking completion

### Rate Limits
- Admin uploads: 100/hour
- Client signature requests: 10/hour per booking
- Image deletions: 50/hour

---

## Support & Documentation

### Internal Docs
- [Integration Plan Worksheet](./integration_plan_worksheet.md)
- [API Integration Plan](./api_integration_plan_resend.md)
- [Best Practices Guide](./BEST_PRACTICES.md)
- [Google Sheets Setup](./GOOGLE_SHEETS_SETUP.md)

### External Docs
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary Signed Uploads](https://cloudinary.com/documentation/upload_images#signed_uploads)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

### Support Contacts
- Cloudinary Support: https://support.cloudinary.com
- Internal Team: #web-tech-team

---

**Document Version:** 1.0  
**Last Review:** February 6, 2026  
**Next Review:** May 6, 2026
