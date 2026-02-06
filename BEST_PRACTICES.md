# Best Practices Guide
## Nail Appointment Booking Admin Dashboard

---

## Table of Contents
1. [API Integration Best Practices](#api-integration-best-practices)
2. [Security Best Practices](#security-best-practices)
3. [File Upload & Storage Best Practices](#file-upload--storage-best-practices)
4. [Database Design Best Practices](#database-design-best-practices)
5. [Performance Optimization](#performance-optimization)
6. [Error Handling & Logging](#error-handling--logging)
7. [Testing Strategies](#testing-strategies)
8. [Code Quality & Maintainability](#code-quality--maintainability)
9. [Deployment & DevOps](#deployment--devops)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## API Integration Best Practices

### 1. External API Integration

**✅ DO:**
- Always use environment variables for API keys and secrets
- Implement proper error handling for API failures
- Use retry logic with exponential backoff for transient failures
- Cache API responses when appropriate (e.g., pricing data)
- Set appropriate timeout values for API calls
- Validate API responses before using the data
- Use official SDKs when available (Google Sheets, Cloudinary, Resend)

**❌ DON'T:**
- Never hardcode API keys in your code
- Don't expose API keys in client-side code
- Avoid making API calls in loops without rate limiting
- Don't trust API responses without validation

**Example: Proper API Error Handling**

```javascript
// Good: With retry logic and error handling
async function fetchPricingData() {
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      const response = await googleSheetsAPI.get(spreadsheetId);
      
      // Validate response
      if (!response.data?.values) {
        throw new Error('Invalid response format');
      }
      
      return response.data.values;
    } catch (error) {
      attempt++;
      
      if (attempt >= MAX_RETRIES) {
        // Log error for monitoring
        logger.error('Failed to fetch pricing data', { error, attempt });
        throw new Error('Unable to fetch pricing data. Please try again later.');
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}
```

### 2. Internal API Design

**RESTful Conventions:**
- Use proper HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- Use plural nouns for resource names: `/api/bookings`, `/api/clients`
- Use nested routes for relationships: `/api/clients/:id/bookings`
- Return appropriate status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

**Versioning:**
```javascript
// Good: API versioning for future compatibility
/api/v1/bookings
/api/v1/clients
```

**Pagination:**
```javascript
// Good: Always paginate list endpoints
GET /api/bookings?page=1&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Security Best Practices

### 1. Authentication & Authorization

**✅ DO:**
- Use JWT tokens with HTTP-only cookies (prevents XSS attacks)
- Implement token expiration (24 hours recommended)
- Hash passwords with bcrypt (minimum 10 salt rounds)
- Implement rate limiting on authentication endpoints
- Use HTTPS in production (enforced)
- Implement refresh token rotation for extended sessions
- Validate user roles on every protected route

**❌ DON'T:**
- Never store passwords in plain text
- Don't store JWT tokens in localStorage (vulnerable to XSS)
- Don't skip authentication middleware on protected routes
- Never include sensitive data in JWT payload

**Example: Secure Password Hashing**

```javascript
import bcrypt from 'bcryptjs';

// Hashing password during registration
async function hashPassword(password) {
  const SALT_ROUNDS = 10;
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verifying password during login
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
```

### 2. Input Validation & Sanitization

**✅ DO:**
- Validate all user inputs on both client and server side
- Use schema validation libraries (Zod, Joi, Yup)
- Sanitize inputs to prevent XSS and injection attacks
- Validate file uploads (type, size, content)
- Use allowlists instead of blocklists for validation

**Example: Zod Validation Schema**

```javascript
import { z } from 'zod';

// Booking creation validation
const createBookingSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid client ID'),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  nailTechId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid nail tech ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  locationType: z.enum(['HOME', 'STUDIO']),
  address: z.string().min(10).max(200).optional(),
  serviceDescription: z.string().min(10).max(500),
  totalPrice: z.number().min(100).max(50000),
  reservationFee: z.number().min(50).max(10000)
});

// Usage in API route
export async function POST(req) {
  try {
    const body = await req.json();
    const validatedData = createBookingSchema.parse(body);
    
    // Proceed with validated data
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### 3. CSRF & XSS Protection

**CSRF Protection:**
- NextAuth.js includes built-in CSRF tokens
- Verify CSRF tokens on all state-changing requests (POST, PUT, DELETE)

**XSS Protection:**
- React automatically escapes output (prevents XSS)
- Use HTTP-only cookies for tokens
- Sanitize user-generated content before displaying
- Set proper Content Security Policy (CSP) headers

```javascript
// Next.js middleware - Add security headers
export function middleware(request) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https://res.cloudinary.com; script-src 'self' 'unsafe-inline'"
  );
  
  return response;
}
```

---

## File Upload & Storage Best Practices

### 1. Admin Uploads (Payment Proofs)

**Security:**
- Require JWT authentication
- Verify user has admin role
- Validate booking exists before upload
- Generate unique filenames to prevent overwriting

**Validation:**
```javascript
// Server-side file validation
function validatePaymentProof(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  
  return true;
}
```

### 2. Client Uploads (Nail Photos)

**Security:**
- Use signed upload URLs with expiration
- Implement rate limiting (max 6 photos per booking)
- Validate file type and size on both client and server
- Consider content moderation for inappropriate images

**Implementation:**
```javascript
// Generate signed upload URL (server-side)
export async function POST(req) {
  const { bookingId } = await req.json();
  
  // Verify booking exists
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 });
  }
  
  // Check upload limit
  const existingPhotos = booking.clientPhotos?.inspiration?.length || 0;
  if (existingPhotos >= 3) {
    return Response.json(
      { error: 'Maximum 3 inspiration photos allowed' },
      { status: 400 }
    );
  }
  
  // Generate signed URL (expires in 15 minutes)
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      upload_preset: 'nail_photos',
      folder: `nail_inspo/${bookingId}`
    },
    process.env.CLOUDINARY_API_SECRET
  );
  
  return Response.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadPreset: 'nail_photos',
    folder: `nail_inspo/${bookingId}`,
    expiresIn: 900 // 15 minutes
  });
}
```

### 3. Storage Optimization

**Cost Savings:**
- Implement auto-cleanup for old images
- Use aggressive compression for client uploads
- Generate and cache thumbnails for gallery views
- Set appropriate image quality levels

**Cloudinary Upload Presets:**

```javascript
// payment_proofs preset configuration
{
  "folder": "payment_proofs",
  "transformation": [
    { "width": 1500, "crop": "limit" },
    { "quality": "auto:good", "fetch_format": "auto" }
  ],
  "allowed_formats": ["jpg", "png", "webp"],
  "max_file_size": 5242880, // 5MB
  "access_mode": "authenticated"
}

// nail_photos preset configuration
{
  "folder": "nail_photos",
  "transformation": [
    { "width": 2000, "crop": "limit" },
    { "quality": "auto:eco", "fetch_format": "auto" }
  ],
  "eager": [
    { "width": 300, "height": 300, "crop": "fill" } // thumbnail
  ],
  "allowed_formats": ["jpg", "png", "webp", "heic"],
  "max_file_size": 10485760, // 10MB
  "access_mode": "public"
}
```

### 4. Cleanup Policy

**Automated Cleanup:**
```javascript
// Cron job: Clean up old client photos
// Run daily at 2 AM
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Find completed bookings older than 30 days
  const oldBookings = await Booking.find({
    status: 'COMPLETED',
    completedAt: { $lt: thirtyDaysAgo },
    'clientPhotos.inspiration': { $exists: true, $ne: [] }
  });
  
  for (const booking of oldBookings) {
    // Delete inspiration photos
    for (const photo of booking.clientPhotos.inspiration) {
      await cloudinary.uploader.destroy(photo.publicId);
    }
    
    // Delete current state photos
    for (const photo of booking.clientPhotos.currentState) {
      await cloudinary.uploader.destroy(photo.publicId);
    }
    
    // Update booking document
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          'clientPhotos.inspiration': [],
          'clientPhotos.currentState': [],
          'clientPhotos.deletedAt': new Date()
        }
      }
    );
  }
  
  console.log(`Cleaned up photos from ${oldBookings.length} bookings`);
});
```

---

## Database Design Best Practices

### 1. Schema Design

**✅ DO:**
- Use proper data types (String, Number, Date, Boolean, ObjectId)
- Define required fields appropriately
- Use indexes for frequently queried fields
- Implement timestamps (createdAt, updatedAt)
- Use enums for fixed value sets
- Normalize when appropriate, denormalize for performance

**Example: Well-Designed Schema**

```javascript
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    nailTech: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NailTech',
      required: true,
      index: true
    },
    appointmentDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    appointmentTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'PENDING_PAYMENT',
      index: true
    },
    clientPhotos: {
      inspiration: [{
        url: String,
        publicId: String,
        uploadedAt: Date
      }],
      currentState: [{
        url: String,
        publicId: String,
        uploadedAt: Date
      }]
    },
    payment: {
      reservationPaid: {
        type: Boolean,
        default: false
      },
      reservationPaidAt: Date,
      paymentMethod: {
        type: String,
        enum: ['GCASH', 'BANK_TRANSFER', 'CASH', 'PAYMONGO']
      },
      paymentProofUrl: String,
      paymentProofPublicId: String
    },
    expiresAt: {
      type: Date,
      index: true // For TTL cleanup
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Compound index for availability checking
BookingSchema.index({ appointmentDate: 1, nailTech: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
```

### 2. Query Optimization

**✅ DO:**
- Use indexes for frequently queried fields
- Use projection to limit returned fields
- Implement pagination for list queries
- Use aggregation pipelines for complex queries
- Cache frequently accessed data

**Example: Optimized Query**

```javascript
// Bad: No pagination, no projection, inefficient
async function getAllBookings() {
  return await Booking.find()
    .populate('client')
    .populate('service')
    .populate('nailTech');
}

// Good: Paginated, projected, indexed
async function getAllBookings(page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit;
  
  // Build query with filters
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom) query.appointmentDate = { $gte: filters.dateFrom };
  if (filters.nailTechId) query.nailTech = filters.nailTechId;
  
  // Execute query with pagination and projection
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .select('bookingNumber client service nailTech appointmentDate appointmentTime status pricing createdAt')
      .populate('client', 'firstName lastName phone')
      .populate('service', 'name')
      .populate('nailTech', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(), // Returns plain JS objects (faster)
    
    Booking.countDocuments(query)
  ]);
  
  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}
```

### 3. Data Integrity

**Transactions for Critical Operations:**

```javascript
import mongoose from 'mongoose';

// Use transactions for operations that modify multiple documents
async function completeBookingWithCommission(bookingId, paymentDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'COMPLETED',
        'payment.fullPaymentReceived': true,
        'payment.fullPaymentMethod': paymentDetails.method,
        completedAt: new Date()
      },
      { new: true, session }
    );
    
    // Calculate and record nail tech commission
    const commission = booking.pricing.totalPrice * (booking.nailTech.commissionRate / 100);
    
    await NailTech.findByIdAndUpdate(
      booking.nailTech,
      {
        $inc: {
          'stats.totalEarnings': commission,
          'stats.completedBookings': 1
        }
      },
      { session }
    );
    
    // Update client statistics
    await Client.findByIdAndUpdate(
      booking.client,
      {
        $inc: {
          completedBookings: 1,
          totalSpent: booking.pricing.totalPrice
        },
        $set: {
          lastVisit: new Date(),
          clientType: 'REPEAT'
        }
      },
      { session }
    );
    
    // Commit transaction
    await session.commitTransaction();
    return booking;
    
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Performance Optimization

### 1. Caching Strategy

**Redis Caching for Frequently Accessed Data:**

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache pricing data (updates infrequently)
async function getPricingData() {
  const CACHE_KEY = 'pricing_data';
  const CACHE_TTL = 3600; // 1 hour
  
  // Try cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from Google Sheets
  const pricing = await fetchFromGoogleSheets();
  
  // Store in cache
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(pricing));
  
  return pricing;
}

// Cache nail tech list (updates infrequently)
async function getActiveNailTechs() {
  const CACHE_KEY = 'nail_techs_active';
  const CACHE_TTL = 1800; // 30 minutes
  
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const nailTechs = await NailTech.find({ isActive: true })
    .select('name email phone commissionRate')
    .lean();
  
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(nailTechs));
  
  return nailTechs;
}

// Invalidate cache when data changes
async function updateNailTech(id, updates) {
  await NailTech.findByIdAndUpdate(id, updates);
  
  // Invalidate cache
  await redis.del('nail_techs_active');
}
```

### 2. Database Connection Pooling

**Optimize MongoDB Connections:**

```javascript
// lib/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error('Please define DATABASE_URL environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

### 3. Image Optimization

**Lazy Loading & Responsive Images:**

```jsx
// Client-side: Optimize image loading
import Image from 'next/image';

function BookingGallery({ photos }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map((photo) => (
        <Image
          key={photo.publicId}
          src={photo.url}
          alt="Nail design"
          width={300}
          height={300}
          loading="lazy" // Lazy load images
          placeholder="blur"
          blurDataURL="/placeholder.jpg"
          className="rounded-lg"
        />
      ))}
    </div>
  );
}

// Use Cloudinary transformations for responsive images
function getOptimizedImageUrl(publicId, width = 800) {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/${publicId}`;
}
```

---

## Error Handling & Logging

### 1. Structured Error Handling

**Create Custom Error Classes:**

```javascript
// lib/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
```

**Global Error Handler:**

```javascript
// app/api/error-handler.js
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';

export function errorHandler(error, req) {
  // Log error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    path: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Operational errors (expected)
  if (error instanceof AppError && error.isOperational) {
    return Response.json(
      {
        error: error.message,
        details: error.details,
        statusCode: error.statusCode
      },
      { status: error.statusCode }
    );
  }
  
  // Programming errors or unknown errors
  // Don't leak error details to client
  return Response.json(
    {
      error: 'An unexpected error occurred. Please try again later.',
      statusCode: 500
    },
    { status: 500 }
  );
}
```

### 2. Logging Strategy

**Structured Logging with Winston:**

```javascript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'nail-booking-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Write errors to file in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
          }),
          new winston.transports.File({
            filename: 'logs/combined.log'
          })
        ]
      : [])
  ]
});

export default logger;
```

**Usage in API Routes:**

```javascript
import logger from '@/lib/logger';

export async function POST(req) {
  try {
    const body = await req.json();
    
    logger.info('Creating booking', {
      userId: req.user.id,
      clientId: body.clientId,
      serviceId: body.serviceId
    });
    
    const booking = await createBooking(body);
    
    logger.info('Booking created successfully', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber
    });
    
    return Response.json({ booking }, { status: 201 });
    
  } catch (error) {
    logger.error('Failed to create booking', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    throw error;
  }
}
```

---

## Testing Strategies

### 1. Unit Testing

**Test Individual Functions:**

```javascript
// __tests__/utils/booking.test.js
import { generateBookingNumber, calculateCommission } from '@/lib/booking-utils';

describe('Booking Utils', () => {
  describe('generateBookingNumber', () => {
    it('should generate booking number with correct format', () => {
      const bookingNumber = generateBookingNumber();
      expect(bookingNumber).toMatch(/^GN-\d{8}\d{3}$/);
    });
    
    it('should generate unique booking numbers', () => {
      const number1 = generateBookingNumber();
      const number2 = generateBookingNumber();
      expect(number1).not.toBe(number2);
    });
  });
  
  describe('calculateCommission', () => {
    it('should calculate correct commission', () => {
      const commission = calculateCommission(1000, 40);
      expect(commission).toBe(400);
    });
    
    it('should handle decimal rates', () => {
      const commission = calculateCommission(1000, 37.5);
      expect(commission).toBe(375);
    });
  });
});
```

### 2. Integration Testing

**Test API Endpoints:**

```javascript
// __tests__/api/bookings.test.js
import { POST } from '@/app/api/bookings/route';
import { testApiRoute, createMockRequest } from '@/tests/utils';
import connectDB from '@/lib/mongodb';

beforeAll(async () => {
  await connectDB();
});

describe('POST /api/bookings', () => {
  it('should create booking with valid data', async () => {
    const mockRequest = createMockRequest({
      method: 'POST',
      body: {
        clientId: '65a1b2c3d4e5f6g7h8i9j0k3',
        serviceId: '65a1b2c3d4e5f6g7h8i9j0k4',
        nailTechId: '65a1b2c3d4e5f6g7h8i9j0k2',
        appointmentDate: '2026-02-10',
        appointmentTime: '14:00',
        locationType: 'HOME',
        serviceDescription: 'French tips with design',
        totalPrice: 1000,
        reservationFee: 200
      }
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.booking).toHaveProperty('bookingNumber');
    expect(data.booking.status).toBe('PENDING_PAYMENT');
  });
  
  it('should reject booking with invalid data', async () => {
    const mockRequest = createMockRequest({
      method: 'POST',
      body: {
        clientId: 'invalid',
        serviceId: '65a1b2c3d4e5f6g7h8i9j0k4'
        // Missing required fields
      }
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(400);
  });
});
```

### 3. End-to-End Testing

**Test Complete User Flows:**

```javascript
// e2e/booking-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Complete Booking Flow', () => {
  test('Admin can create and confirm booking', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@nailsalon.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to create booking
    await page.goto('/admin/bookings/create');
    
    // Fill booking form
    await page.selectOption('[name="clientId"]', '65a1b2c3d4e5f6g7h8i9j0k3');
    await page.selectOption('[name="serviceId"]', '65a1b2c3d4e5f6g7h8i9j0k4');
    await page.selectOption('[name="nailTechId"]', '65a1b2c3d4e5f6g7h8i9j0k2');
    await page.fill('[name="appointmentDate"]', '2026-02-10');
    await page.fill('[name="appointmentTime"]', '14:00');
    await page.fill('[name="serviceDescription"]', 'French tips with floral design');
    await page.fill('[name="totalPrice"]', '1000');
    
    // Submit booking
    await page.click('button[type="submit"]');
    
    // Verify booking created
    await expect(page.locator('.success-message')).toContainText('Booking created successfully');
    
    // Verify booking appears in list
    await page.goto('/admin/bookings');
    await expect(page.locator('.booking-list')).toContainText('GN-');
  });
});
```

---

## Code Quality & Maintainability

### 1. Code Organization

**Project Structure:**

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── clients/
│   │   └── integrations/
│   └── admin/
├── components/
│   ├── ui/
│   ├── booking/
│   └── client/
├── lib/
│   ├── db/
│   │   ├── models/
│   │   └── connection.js
│   ├── utils/
│   ├── errors.js
│   └── logger.js
├── middleware/
│   ├── auth.js
│   ├── rate-limit.js
│   └── validation.js
└── types/
    └── index.ts
```

### 2. TypeScript for Type Safety

**Define Types:**

```typescript
// types/booking.ts
export interface Booking {
  _id: string;
  bookingNumber: string;
  client: Client | string;
  service: Service | string;
  nailTech: NailTech | string;
  appointmentDate: string;
  appointmentTime: string;
  locationType: 'HOME' | 'STUDIO';
  status: BookingStatus;
  pricing: BookingPricing;
  payment: BookingPayment;
  clientPhotos?: {
    inspiration: CloudinaryImage[];
    currentState: CloudinaryImage[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface BookingPricing {
  totalPrice: number;
  reservationFee: number;
  balanceDue: number;
}

export interface BookingPayment {
  reservationPaid: boolean;
  reservationPaidAt?: Date;
  paymentMethod?: 'GCASH' | 'BANK_TRANSFER' | 'CASH' | 'PAYMONGO';
  paymentProofUrl?: string;
  paymentProofPublicId?: string;
}

export interface CloudinaryImage {
  url: string;
  publicId: string;
  uploadedAt: Date;
}
```

### 3. Environment Variable Validation

**Validate on Startup:**

```javascript
// lib/env.js
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Google Sheets
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(100),
  PRICING_SHEET_ID: z.string().min(20),
  BOOKINGS_BACKUP_SHEET_ID: z.string().min(20),
  
  // Resend
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().email(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(3),
  CLOUDINARY_API_KEY: z.string().min(10),
  CLOUDINARY_API_SECRET: z.string().min(10),
  CLOUDINARY_UPLOAD_PRESET_PAYMENT: z.string(),
  CLOUDINARY_UPLOAD_PRESET_CLIENT: z.string(),
  
  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables on app startup
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.errors);
    process.exit(1);
  }
}

// Call this in your main app file
export const env = validateEnv();
```

---

## Deployment & DevOps

### 1. Environment Setup

**Development, Staging, Production:**

```bash
# .env.local (development)
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/nail-booking-dev

# .env.staging (staging)
NODE_ENV=production
NEXTAUTH_URL=https://staging.glamnails.com
DATABASE_URL=mongodb+srv://...staging...

# .env.production (production)
NODE_ENV=production
NEXTAUTH_URL=https://glamnails.com
DATABASE_URL=mongodb+srv://...production...
```

### 2. CI/CD Pipeline

**GitHub Actions Example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 3. Database Migrations

**Handle Schema Changes:**

```javascript
// scripts/migrate-add-client-photos.js
import connectDB from '../lib/mongodb.js';
import Booking from '../lib/db/models/Booking.js';

async function migrate() {
  await connectDB();
  
  console.log('Adding clientPhotos field to existing bookings...');
  
  const result = await Booking.updateMany(
    { clientPhotos: { $exists: false } },
    {
      $set: {
        clientPhotos: {
          inspiration: [],
          currentState: []
        }
      }
    }
  );
  
  console.log(`Updated ${result.modifiedCount} bookings`);
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

**Health Check Endpoint:**

```javascript
// app/api/health/route.js
import connectDB from '@/lib/mongodb';
import { cloudinary } from '@/lib/cloudinary';
import { Resend } from 'resend';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {}
  };
  
  // Check database connection
  try {
    await connectDB();
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }
  
  // Check Cloudinary
  try {
    await cloudinary.api.ping();
    checks.services.cloudinary = 'healthy';
  } catch (error) {
    checks.services.cloudinary = 'unhealthy';
    checks.status = 'degraded';
  }
  
  // Check Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Resend doesn't have a ping endpoint, just check API key format
    checks.services.resend = process.env.RESEND_API_KEY ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.services.resend = 'unhealthy';
    checks.status = 'degraded';
  }
  
  const statusCode = checks.status === 'healthy' ? 200 : 503;
  
  return Response.json(checks, { status: statusCode });
}
```

### 2. Performance Monitoring

**Track Key Metrics:**

```javascript
// middleware/metrics.js
import logger from '@/lib/logger';

export function metricsMiddleware(handler) {
  return async (req, ...args) => {
    const start = Date.now();
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      
      // Log performance metrics
      logger.info('API Request', {
        method: req.method,
        path: req.url,
        statusCode: response.status,
        duration,
        userId: req.user?.id
      });
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('API Request Failed', {
        method: req.method,
        path: req.url,
        duration,
        error: error.message
      });
      
      throw error;
    }
  };
}
```

### 3. Backup Strategy

**Automated Backups:**

```javascript
// scripts/backup-database.js
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadToCloudStorage } from '../lib/backup-storage';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.gz`;
  
  console.log('Starting database backup...');
  
  try {
    // Create MongoDB dump
    await execAsync(
      `mongodump --uri="${process.env.DATABASE_URL}" --archive=${filename} --gzip`
    );
    
    console.log('Database dump created');
    
    // Upload to cloud storage (S3, Google Cloud Storage, etc.)
    await uploadToCloudStorage(filename);
    
    console.log('Backup uploaded successfully');
    
    // Clean up local file
    await execAsync(`rm ${filename}`);
    
    console.log('Backup completed');
    
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

// Run backup
backupDatabase().catch(console.error);
```

**Schedule with Cron:**

```javascript
import cron from 'node-cron';
import { backupDatabase } from './backup-database';

// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Starting scheduled database backup');
  await backupDatabase();
});
```

---

## Summary Checklist

### Before Deployment

- [ ] All environment variables properly configured
- [ ] Database indexes created
- [ ] Rate limiting implemented
- [ ] Error handling in place
- [ ] Logging configured
- [ ] File upload security tested
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] All tests passing
- [ ] Performance tested under load
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation updated

### Regular Maintenance

- [ ] Review logs weekly
- [ ] Monitor error rates
- [ ] Check storage usage
- [ ] Review security alerts
- [ ] Update dependencies monthly
- [ ] Test backup restoration quarterly
- [ ] Review and optimize slow queries
- [ ] Clean up old data per retention policy

---

## Additional Resources

**Documentation:**
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [NextAuth.js Documentation](https://next-auth.js.org/)

**Security:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

**Performance:**
- [Web Vitals](https://web.dev/vitals/)
- [MongoDB Performance Best Practices](https://www.mongodb.com/docs/manual/administration/analyzing-mongodb-performance/)

---

**Last Updated:** February 6, 2026
