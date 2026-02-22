# 🎯 GLAMMED NAILS BY JHEN - Development Standards & Guidelines

> **IMPORTANT:** Reference this document in all prompts to ensure consistent development practices.
> 
> **Quick Reference:** `@DEVELOPMENT_STANDARDS.md - Follow all guidelines`

---

## 📱 1. MOBILE-FIRST RESPONSIVE DESIGN (MANDATORY)

### ⚠️ CRITICAL RULE: ALWAYS MOBILE-FRIENDLY
**Every feature, component, and page MUST be responsive and mobile-optimized.**

### Responsive Design Requirements

#### Breakpoints (Bootstrap 5)
```css
/* Extra small devices (phones, less than 576px) */
/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) { ... }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { ... }

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) { ... }

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) { ... }
```

#### Mobile-First Checklist
- [ ] **Touch-friendly**: Minimum 44x44px tap targets
- [ ] **Readable text**: Minimum 16px font size on mobile
- [ ] **Responsive images**: Use `img-fluid` class or max-width: 100%
- [ ] **Stack columns**: Use `col-12 col-md-6 col-lg-4` patterns
- [ ] **Hamburger menus**: Collapse navigation on mobile
- [ ] **Scrollable tables**: Wrap tables in `.table-responsive`
- [ ] **Form inputs**: Full width on mobile (`form-control`)
- [ ] **Buttons**: Full width or adequate spacing on mobile
- [ ] **Modals**: Properly sized for mobile screens
- [ ] **No horizontal scroll**: Test on 375px width minimum

#### Bootstrap Utilities for Responsive Design
```html
<!-- Responsive columns -->
<div class="col-12 col-md-6 col-lg-4">Content</div>

<!-- Responsive text alignment -->
<div class="text-center text-md-start">Text</div>

<!-- Responsive spacing -->
<div class="mb-3 mb-md-4 mb-lg-5">Content</div>

<!-- Display utilities -->
<div class="d-none d-md-block">Desktop only</div>
<div class="d-md-none">Mobile only</div>

<!-- Responsive tables -->
<div class="table-responsive">
  <table class="table">...</table>
</div>
```

---

## 🎨 2. BRANDING & DESIGN SYSTEM

### Brand Identity: glammednailsbyjhen

**Design Philosophy:** Sophisticated monochrome luxury - Black & White minimalism with bold framed accents

**Key Visual Elements:**
- **Double Border Effect:** White border + black shadow (signature look)
- **High Contrast:** Pure black text on white backgrounds
- **Clean Lines:** Sharp, geometric borders and frames
- **Elegant Typography:** Mix of custom display fonts and clean sans-serifs
- **Minimalist Aesthetic:** Less is more - sophisticated simplicity

#### Primary Color Palette
```css
:root {
  /* Primary Brand Colors - MONOCHROME LUXURY */
  --brand-black: #000000;        /* Pure Black - Primary brand color */
  --brand-dark: #212529;         /* Dark Gray-Black - Headers, buttons */
  --brand-charcoal: #2c2c2c;     /* Charcoal - Admin UI, cards */
  --brand-white: #ffffff;        /* Pure White - Backgrounds, text */
  
  /* Neutral Grays */
  --gray-dark: #495057;          /* Dark gray - Secondary text */
  --gray-medium: #6c757d;        /* Medium gray - Muted text */
  --gray-light: #ced4da;         /* Light gray - Borders */
  --gray-lighter: #e0e0e0;       /* Lighter gray - Dividers */
  --gray-lightest: #f8f9fa;      /* Lightest gray - Subtle backgrounds */
  
  /* Semantic Colors (Status only) */
  --success: #28a745;            /* Green - CONFIRMED status */
  --warning: #ffc107;            /* Yellow - PENDING_PAYMENT status */
  --danger: #dc3545;             /* Red - CANCELLED status */
  --info: #17a2b8;               /* Blue - Information */
  --primary: #007bff;            /* Blue - COMPLETED status */
}
```

#### Typography
```css
/* Brand Fonts (Custom) */
--font-balgor: 'Balgor', sans-serif;          /* Display font */
--font-acollia: 'Acollia', sans-serif;        /* Decorative font */
--font-ladinta: 'Ladinta', sans-serif;        /* Decorative font */

/* Google Fonts */
--font-playfair: 'Playfair Display', serif;   /* Elegant serif for headings */
--font-lato: 'Lato', sans-serif;              /* Clean sans-serif for body text */

/* Fallbacks */
--font-primary: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-headings: 'Playfair Display', Georgia, serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Button Styles
```html
<!-- Primary Action (Black) -->
<button class="btn btn-dark">Primary Action</button>

<!-- With Signature Border Effect -->
<button class="px-6 py-3 bg-black text-white font-semibold border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300">
  Book Now
</button>

<!-- Secondary Action -->
<button class="btn btn-outline-dark">Secondary Action</button>

<!-- Danger/Delete -->
<button class="btn btn-outline-danger">Delete</button>

<!-- Success/Confirm -->
<button class="btn btn-success">Confirm</button>

<!-- Mobile-friendly buttons -->
<button class="btn btn-dark w-100 w-md-auto">Mobile Full Width</button>
```

#### Card Design Pattern
```html
<div class="card shadow-sm">
  <div class="card-header bg-white">
    <h5 class="mb-0" style="fontWeight: 600, color: '#212529'">Card Title</h5>
  </div>
  <div class="card-body">
    Card content here
  </div>
</div>
```

#### Status Badge Colors
```html
<span class="badge bg-warning">PENDING_PAYMENT</span>
<span class="badge bg-success">CONFIRMED</span>
<span class="badge bg-primary">COMPLETED</span>
<span class="badge bg-danger">CANCELLED</span>
<span class="badge bg-secondary">NO_SHOW</span>
```

---

## 🧩 3. COMPONENT MODULARITY & REUSABILITY

### Component Structure

#### File Organization
```
app/
├── components/           # Shared components
│   ├── ui/              # UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   ├── forms/           # Form components
│   │   ├── BookingForm.tsx
│   │   └── ClientForm.tsx
│   └── layout/          # Layout components
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── (admin)/             # Admin pages
└── (public)/            # Public pages
```

#### Component Best Practices

**1. Single Responsibility**
```typescript
// ✅ GOOD: One component, one purpose
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge bg-${getStatusColor(status)}`}>{status}</span>;
}

// ❌ BAD: Component doing too much
export function BookingCard({ booking }) {
  // 500 lines of code handling everything
}
```

**2. Props Interface**
```typescript
// ✅ GOOD: Well-defined props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size = 'md', fullWidth, loading, children, onClick }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} ${size && `btn-${size}`} ${fullWidth && 'w-100'}`}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

**3. Reusable Utilities**
```typescript
// utils/formatting.ts
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;
  return parseFloat(String(value).replace(/[₱$,\s]/g, '')) || 0;
}
```

---

## 📐 4. UI/UX BEST PRACTICES

### Loading States
```typescript
// Always show loading states
{loading && (
  <div className="d-flex justify-content-center p-4">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)}
```

### Error States
```typescript
// Always handle errors gracefully
{error && (
  <div className="alert alert-danger" role="alert">
    <strong>Error:</strong> {error}
    <br />
    <small>Please try again or contact support if the problem persists.</small>
  </div>
)}
```

### Empty States
```typescript
// Always show meaningful empty states
{items.length === 0 && (
  <div className="text-center py-5">
    <p className="text-muted mb-3">No items found.</p>
    <button className="btn btn-dark" onClick={handleCreate}>
      Create New Item
    </button>
  </div>
)}
```

### Form Validation
```typescript
// Always validate inputs
const schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Show validation errors
{errors.email && (
  <small className="text-danger">{errors.email.message}</small>
)}
```

### Toast Notifications
```typescript
// Provide feedback for user actions
const handleSave = async () => {
  try {
    await saveData();
    // ✅ Show success
    toast.success('Data saved successfully!');
  } catch (error) {
    // ❌ Show error
    toast.error('Failed to save data. Please try again.');
  }
};
```

---

## 🚀 5. PERFORMANCE OPTIMIZATION

### Image Optimization
```html
<!-- ✅ GOOD: Responsive images -->
<img 
  src="/image.jpg" 
  alt="Description" 
  className="img-fluid" 
  loading="lazy"
  width="800"
  height="600"
/>

<!-- Use Cloudinary transformations -->
<!-- w_800,h_600,c_fill,q_auto,f_auto -->
```

### Code Splitting
```typescript
// ✅ GOOD: Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false,
});
```

### Database Queries
```typescript
// ✅ GOOD: Efficient queries
const bookings = await Booking.find({ status: 'CONFIRMED' })
  .select('bookingNumber client service date') // Only needed fields
  .limit(20)
  .lean(); // Convert to plain objects

// ❌ BAD: Fetching everything
const bookings = await Booking.find({});
```

---

## ♿ 6. ACCESSIBILITY (A11Y)

### Semantic HTML
```html
<!-- ✅ GOOD: Semantic structure -->
<header>
  <nav aria-label="Main navigation">
    <ul>...</ul>
  </nav>
</header>

<main>
  <article>...</article>
</main>

<footer>...</footer>
```

### ARIA Labels
```html
<!-- Icons need labels -->
<button aria-label="Close modal">
  <i className="bi bi-x"></i>
</button>

<!-- Images need alt text -->
<img src="nail-art.jpg" alt="Red gel polish with gold accents" />

<!-- Form inputs need labels -->
<label htmlFor="email">Email Address</label>
<input type="email" id="email" name="email" />
```

### Keyboard Navigation
```typescript
// Ensure keyboard accessibility
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
>
  Click or press Enter
</div>
```

---

## 🔒 7. SECURITY BEST PRACTICES

### Input Sanitization
```typescript
// Always sanitize user inputs
import { sanitize } from '@/utils/security';

const cleanedInput = sanitize(userInput);
```

### Authentication Checks
```typescript
// Always verify authentication on protected routes
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated logic
}
```

### Environment Variables
```typescript
// ✅ GOOD: Never expose secrets
const apiKey = process.env.API_SECRET_KEY; // Server-side only

// ❌ BAD: Exposing secrets
const apiKey = 'sk_live_123456789'; // Hardcoded!
```

---

## 📝 8. CODE QUALITY STANDARDS

### Naming Conventions
```typescript
// Components: PascalCase
export function BookingCard() {}

// Functions: camelCase
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

// Interfaces: PascalCase with I prefix (optional)
interface BookingData {}
```

### Comments
```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use rate limiting to prevent spam attacks on public booking endpoint
const limiter = rateLimit({ max: 5, windowMs: 60000 });

// ❌ BAD: Stating the obvious
// This is a button
<button>Click me</button>
```

### Error Handling
```typescript
// ✅ GOOD: Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Error in riskyOperation:', error);
  
  if (error instanceof ValidationError) {
    throw new Error('Invalid data provided');
  }
  
  throw new Error('Operation failed. Please try again.');
}
```

---

## 📦 9. FILE UPLOAD STANDARDS

### Image Upload Requirements
```typescript
// Admin uploads (Payment proofs)
const ADMIN_UPLOAD_RULES = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimensions: { width: 1500, height: 1500 },
};

// Client uploads (Nail photos)
const CLIENT_UPLOAD_RULES = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxCount: 6, // 3 inspiration + 3 current state
};
```

### Validation
```typescript
function validateFile(file: File, rules: UploadRules): boolean {
  // Check file size
  if (file.size > rules.maxSize) {
    throw new Error(`File size exceeds ${rules.maxSize / 1024 / 1024}MB limit`);
  }
  
  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }
  
  return true;
}
```

---

## 🎯 10. TESTING CHECKLIST

### Before Every Feature Release

#### Responsive Testing
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 12/13 (390px)
- [ ] Test on iPad (768px)
- [ ] Test on Desktop (1920px)
- [ ] Test landscape orientation
- [ ] No horizontal scrolling on any device

#### Functionality Testing
- [ ] All buttons work
- [ ] Forms validate correctly
- [ ] Error messages display properly
- [ ] Loading states show
- [ ] Success messages appear
- [ ] Data persists correctly

#### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible

---

## 📋 11. QUICK REFERENCE CHECKLIST

### For Every New Component/Feature

```markdown
✅ Mobile-First Design
- [ ] Responsive on all breakpoints (375px - 1920px)
- [ ] Touch-friendly (44x44px minimum)
- [ ] Readable text (16px minimum on mobile)
- [ ] No horizontal scroll

✅ Branding
- [ ] Uses approved color palette
- [ ] Consistent typography
- [ ] Matches existing design patterns
- [ ] Professional and polished

✅ Modularity
- [ ] Component is reusable
- [ ] Single responsibility
- [ ] Well-defined props
- [ ] No hardcoded values

✅ User Experience
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Success feedback

✅ Performance
- [ ] Optimized images
- [ ] Efficient queries
- [ ] Lazy loading where appropriate
- [ ] No unnecessary re-renders

✅ Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard accessible
- [ ] Alt text on images

✅ Code Quality
- [ ] Proper naming conventions
- [ ] Meaningful comments
- [ ] Error handling
- [ ] TypeScript types defined
```

---

## 🚨 CRITICAL REMINDERS

### 1. ALWAYS MOBILE-FIRST
**Every single feature must work perfectly on mobile devices. No exceptions.**

### 2. CONSISTENT BRANDING
**Use the defined color palette and design patterns. Consistency = professionalism.**

### 3. USER FEEDBACK
**Always provide feedback for user actions (loading, success, error states).**

### 4. SECURITY
**Never expose secrets, always validate inputs, always check authentication.**

### 5. PERFORMANCE
**Optimize images, queries, and code. Fast = better user experience.**

---

## 📞 HOW TO USE THIS DOCUMENT

### In Your Prompts:
```
@DEVELOPMENT_STANDARDS.md - Follow all guidelines for [feature name]
```

### Specific Sections:
```
@DEVELOPMENT_STANDARDS.md - Ensure mobile-responsive design
@DEVELOPMENT_STANDARDS.md - Apply branding guidelines
@DEVELOPMENT_STANDARDS.md - Follow modularity best practices
```

---

## 🎨 EXAMPLE: WELL-STRUCTURED COMPONENT

```typescript
'use client';

import { useState } from 'react';

// Well-defined interface
interface ServiceCardProps {
  serviceName: string;
  price: number;
  description?: string;
  imageUrl?: string;
  onSelect?: (serviceName: string) => void;
}

// Single responsibility: Display a service card
export function ServiceCard({ 
  serviceName, 
  price, 
  description, 
  imageUrl,
  onSelect 
}: ServiceCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    if (!onSelect) return;
    
    setLoading(true);
    try {
      await onSelect(serviceName);
    } catch (error) {
      console.error('Error selecting service:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mobile-responsive card
    <div className="col-12 col-md-6 col-lg-4 mb-3">
      <div className="card h-100 shadow-sm">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={serviceName}
            className="card-img-top"
            loading="lazy"
          />
        )}
        <div className="card-body">
          <h5 className="card-title" style={{ fontWeight: 600 }}>
            {serviceName}
          </h5>
          {description && (
            <p className="card-text text-muted">{description}</p>
          )}
          <p className="h4 mb-3" style={{ color: '#212529', fontWeight: 600 }}>
            ₱{price.toLocaleString('en-PH')}
          </p>
          <button 
            className="btn btn-dark w-100"
            onClick={handleSelect}
            disabled={loading}
          >
            {loading ? 'Selecting...' : 'Select Service'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🌟 FINAL NOTE

**This document is the foundation of quality development for glammednailsbyjhen.**

When in doubt:
1. Is it mobile-friendly? ✅
2. Does it match the branding? ✅
3. Is it modular and reusable? ✅
4. Does it provide good UX? ✅
5. Is it secure and performant? ✅

If all answers are YES, you're building it right! 🎯

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Project:** glammednailsbyjhen Booking System
