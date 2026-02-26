/**
 * Firebase to MongoDB - FULL Migration Script
 * ===========================================
 *
 * Migrates ALL Firestore collections to MongoDB:
 *   nail_techs, users, customers, slots, bookings
 *   (optionally: blocks, notifications, analytics_events)
 *
 * Order matters: nail_techs → users → customers → slots → bookings
 * (due to foreign key references)
 *
 * SETUP:
 * 1. .env must have: MONGODB_URI, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 2. Or use serviceAccountKey.json in project root
 *
 * USAGE:
 *   node scripts/migrate-all-firebase-to-mongodb.js           # Migrate all
 *   node scripts/migrate-all-firebase-to-mongodb.js --dry-run # Preview only
 *   node scripts/migrate-all-firebase-to-mongodb.js --only=customers,slots  # Specific collections
 *   node scripts/migrate-all-firebase-to-mongodb.js --rollback # Remove migrated data (MongoDB ONLY, never touches Firebase)
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 50,
  DRY_RUN: process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run'),
  SERVICE_ACCOUNT_PATH: './serviceAccountKey.json',
  REPORT_FILE: './migration-full-report.json',
  ERROR_LOG_FILE: './migration-full-errors.log',
};

// Firebase collection → MongoDB model (order matters for FK dependencies)
const COLLECTION_ORDER = ['nail_techs', 'users', 'customers', 'slots', 'quotations', 'bookings', 'blocks'];

// Also try 'clients' as alias for customers (some apps use both)
const CUSTOMER_COLLECTIONS = ['customers', 'clients'];

// Also try 'nailTechs' as alias for nail_techs (Firestore may use camelCase)
const NAIL_TECH_COLLECTIONS = ['nail_techs', 'nailTechs'];

// Also try 'quotes' as alias for quotations
const QUOTATION_COLLECTIONS = ['quotations', 'quotes'];

// ============================================================================
// MONGOOSE SCHEMAS (match lib/models)
// ============================================================================

const NailTechSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['Owner', 'Junior Tech', 'Senior Tech'], required: true },
  serviceAvailability: { type: String, enum: ['Studio only', 'Home service only', 'Studio and Home Service'], required: true },
  workingDays: { type: [String], default: [] },
  discount: Number,
  commissionRate: Number,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  name: String,
  image: String,
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  assignedNailTechId: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  name: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  socialMediaName: String,
  referralSource: String,
  referralSourceOther: String,
  isRepeatClient: Boolean,
  clientType: { type: String, enum: ['NEW', 'REPEAT'], default: 'NEW' },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalTips: { type: Number, default: 0 },
  totalDiscounts: { type: Number, default: 0 },
  lastVisit: Date,
  notes: String,
  nailHistory: { hasRussianManicure: Boolean, hasGelOverlay: Boolean, hasSoftgelExtensions: Boolean },
  healthInfo: { allergies: String, nailConcerns: String, nailDamageHistory: String },
  inspoDescription: String,
  waiverAccepted: Boolean,
  isActive: { type: Boolean, default: true },
  isVIP: { type: Boolean, default: false },
}, { timestamps: true });

const SlotSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true, enum: ['available', 'blocked', 'pending', 'confirmed'] },
  slotType: { type: String, enum: ['regular', 'with_squeeze_fee'] },
  notes: String,
  isHidden: { type: Boolean, default: false },
  nailTechId: { type: String, required: true },
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  bookingCode: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true },
  nailTechId: { type: String, required: true },
  slotIds: [{ type: String, required: true }],
  service: {
    type: { type: String, required: true, enum: ['manicure', 'pedicure', 'mani_pedi', 'home_service_2slots', 'home_service_3slots'] },
    location: { type: String, required: true, enum: ['homebased_studio', 'home_service'] },
    clientType: { type: String, required: true, enum: ['new', 'repeat'] },
  },
  status: { type: String, required: true, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending' },
  paymentStatus: { type: String, required: true, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid' },
  pricing: {
    total: { type: Number, required: true, default: 0 },
    depositRequired: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    tipAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
  },
  payment: { method: String, depositPaidAt: Date, fullyPaidAt: Date, paymentProofUrl: String, paymentProofPublicId: String },
  clientNotes: String,
  adminNotes: String,
  clientPhotos: {
    inspiration: [{ url: String, publicId: String, uploadedAt: Date }],
    currentState: [{ url: String, publicId: String, uploadedAt: Date }],
  },
  completedAt: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
  invoice: { quotationId: String, total: Number, createdAt: Date },
  statusReason: String,
}, { timestamps: true });

// Quotations (invoices) - before bookings so idMap.quotations exists for invoice.quotationId
const QuotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const QuotationSchema = new mongoose.Schema({
  firebaseId: { type: String, sparse: true },
  quotationNumber: { type: String, sparse: true },
  customerName: { type: String, required: true },
  customerPhone: String,
  customerEmail: String,
  items: [QuotationItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discountRate: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  squeezeInFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  notes: String,
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'expired'], default: 'draft' },
  createdBy: String,
}, { timestamps: true });

// Blocked dates (simplified)
const BlockSchema = new mongoose.Schema({
  startDate: String,
  endDate: String,
  reason: String,
  scope: String,
}, { timestamps: true });

const NailTech = mongoose.model('NailTech', NailTechSchema);
const User = mongoose.model('User', UserSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Slot = mongoose.model('Slot', SlotSchema);
const Quotation = mongoose.model('Quotation', QuotationSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Block = mongoose.model('Block', BlockSchema);

// ============================================================================
// UTILITIES
// ============================================================================

function log(msg, level = 'INFO') {
  const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', WARNING: '\x1b[33m', ERROR: '\x1b[31m' };
  console.log(`${colors[level] || ''}[${new Date().toISOString()}] [${level}] ${msg}\x1b[0m`);
}

function toDate(v) {
  if (!v) return null;
  if (v && typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function mapServiceType(fb) {
  const m = {
    'russian manicure': 'manicure', 'manicure': 'manicure',
    'russian pedicure': 'pedicure', 'pedicure': 'pedicure',
    'russian mani + pedi': 'mani_pedi', 'mani_pedi': 'mani_pedi', 'mani pedi': 'mani_pedi',
    'russian mani + pedi': 'mani_pedi', 'russian mani and pedi': 'mani_pedi',
    'home service 2 slots': 'home_service_2slots', 'home_service_2slots': 'home_service_2slots',
    'home service 3 slots': 'home_service_3slots', 'home_service_3slots': 'home_service_3slots',
  };
  const k = String((fb || '').toLowerCase()).trim();
  return m[k] || 'mani_pedi';
}

function mapLocation(fb) {
  const v = String((fb || 'homebased_studio').toLowerCase()).replace(/\s/g, '_');
  if (v.includes('home_service') || v === 'home_service') return 'home_service';
  return 'homebased_studio';
}

function mapClientType(fb) {
  const v = String((fb || 'new').toLowerCase());
  return v === 'repeat' ? 'repeat' : 'new';
}

function mapStatus(s) {
  const m = {
    pending_form: 'pending', pending_payment: 'pending', booked: 'confirmed',
    completed: 'completed', done: 'completed', finished: 'completed',
  };
  const v = String((s || 'pending').toLowerCase());
  return m[v] || v;
}

function mapPaymentStatus(s) {
  const v = String((s || 'unpaid').toLowerCase());
  return ['unpaid','partial','paid','refunded'].includes(v) ? v : 'unpaid';
}

function mapSlotStatus(s) {
  const m = { booked: 'confirmed' };
  const v = String((s || 'available').toLowerCase());
  return m[v] || v;
}

// ============================================================================
// TRANSFORMERS
// ============================================================================

function transformNailTech(doc, idMap) {
  const d = doc.data();
  const name = (d.name || d.displayName || d.fullName || d.clientName || 'Unknown').trim();
  return {
    firebaseId: doc.id,
    name: name || 'Unknown',
    role: d.role || 'Junior Tech',
    serviceAvailability: d.serviceAvailability || 'Studio and Home Service',
    workingDays: Array.isArray(d.workingDays) ? d.workingDays : [],
    discount: typeof d.discount === 'number' ? d.discount : undefined,
    commissionRate: typeof d.commissionRate === 'number' ? d.commissionRate : undefined,
    status: d.status || 'Active',
  };
}

function transformUser(doc, idMap) {
  const d = doc.data();
  const role = mapUserRole(d.role);
  const email = (d.email || d.userEmail || '').toLowerCase().trim() || `firebase-${doc.id}@placeholder.local`;
  const obj = {
    firebaseId: doc.id,
    email,
    name: (d.name || d.displayName || d.fullName || '').trim() || undefined,
    image: d.image || d.photoURL,
    emailVerified: !!d.emailVerified,
    role,
    assignedNailTechId: idMap.nail_techs?.[d.assignedNailTechId] || d.assignedNailTechId,
    status: d.status || 'active',
  };
  if (d.password) obj.password = d.password;
  return obj;
}

function mapUserRole(fb) {
  const v = String((fb || 'admin').toLowerCase());
  if (v === 'viewer' || v === 'staff') return 'staff';
  return v === 'admin' ? 'admin' : 'admin';
}

function transformCustomer(doc, idMap) {
  const d = doc.data();
  const name = (d.name || d.fullName || d.clientName || d.customerName || d.displayName || `${(d.firstName||'')} ${(d.lastName||'')}`.trim() || 'Unknown').trim();
  return {
    firebaseId: doc.id,
    name,
    firstName: d.firstName,
    lastName: d.lastName,
    email: (d.email || '').toLowerCase().trim() || undefined,
    phone: d.phone || d.phoneNumber || d.mobile,
    socialMediaName: d.socialMediaName || d.socialMedia || d.instagram,
    referralSource: d.referralSource || d.howDidYouHear || d.source,
    referralSourceOther: d.referralSourceOther,
    isRepeatClient: !!d.isRepeatClient,
    clientType: d.clientType || (d.isRepeatClient ? 'REPEAT' : 'NEW'),
    totalBookings: d.totalBookings || 0,
    completedBookings: d.completedBookings || 0,
    totalSpent: d.totalSpent || 0,
    totalTips: d.totalTips || 0,
    totalDiscounts: d.totalDiscounts || 0,
    lastVisit: toDate(d.lastVisit),
    notes: d.notes || d.comments,
    nailHistory: d.nailHistory,
    healthInfo: d.healthInfo,
    inspoDescription: d.inspoDescription,
    waiverAccepted: d.waiverAccepted,
    isActive: d.isActive !== false,
    isVIP: !!d.isVIP,
  };
}

function slotTimeToString(v) {
  if (v == null) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (/^\d{1,2}:\d{2}/.test(s)) return s;
    if (/^\d{1,2}:\d{1}$/.test(s)) return s.replace(/^(\d):(\d)$/, '0$1:0$2');
    if (/^\d{1,4}$/.test(s)) {
      const n = parseInt(s, 10);
      if (n >= 0 && n < 24) return `${String(n).padStart(2, '0')}:00`;
      if (n >= 100 && n < 2400) return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
    }
    const iso = s.match(/T(\d{1,2}):(\d{2})/);
    if (iso) return `${iso[1].padStart(2, '0')}:${iso[2]}`;
  }
  if (typeof v === 'object' && typeof v.toDate === 'function') {
    const d = v.toDate();
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (typeof v === 'number' && !isNaN(v)) {
    if (v >= 0 && v < 24) return `${String(Math.floor(v)).padStart(2, '0')}:00`;
    if (v >= 100 && v < 2400) return `${String(Math.floor(v / 100)).padStart(2, '0')}:${String(Math.floor(v % 100)).padStart(2, '0')}`;
  }
  if (v instanceof Date) return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
  return null;
}

function transformSlot(doc, idMap) {
  const d = doc.data();
  const nailTechId = idMap.nail_techs?.[d.nailTechId] || d.nailTechId;
  const rawTime = d.time ?? d.startTime ?? d.slotTime ?? d.timeSlot ?? d.appointmentTime ?? d.timeString;
  const time = slotTimeToString(rawTime) || '09:00';
  const rawDate = d.date || d.slotDate || d.appointmentDate;
  let date = '';
  if (typeof rawDate === 'string') date = rawDate;
  else if (rawDate && typeof rawDate.toDate === 'function') date = rawDate.toDate().toISOString().slice(0, 10);
  else if (rawDate instanceof Date) date = rawDate.toISOString().slice(0, 10);
  return {
    firebaseId: doc.id,
    date: date || '',
    time,
    status: mapSlotStatus(d.status),
    slotType: d.slotType || undefined,
    notes: d.notes,
    isHidden: !!d.isHidden,
    nailTechId,
  };
}

function transformBooking(doc, idMap) {
  const d = doc.data();
  const slotId = d.slotId || (d.slotIds && d.slotIds[0]);
  const slotIds = Array.isArray(d.slotIds) && d.slotIds.length
    ? (d.slotIds.map(id => idMap.slots?.[id] || id).filter(Boolean))
    : (slotId ? [idMap.slots?.[slotId] || slotId] : []);
  const linked = d.linkedSlotIds || d.pairedSlotId ? [d.pairedSlotId].filter(Boolean) : [];
  const allSlotIds = [...new Set([...slotIds, ...linked.map(id => idMap.slots?.[id] || id)])];

  const rawCustomerId = d.customerId || d.customerID;
  const customerId = idMap.customers?.[rawCustomerId] || rawCustomerId;
  const nailTechId = idMap.nail_techs?.[d.nailTechId] || d.nailTechId;
  const bookingCode = d.bookingCode || d.bookingId || `FB-${doc.id}`;

  const basePaid = d.paidAmount ?? d.totalPaid ?? d.amountPaid ?? d.pricing?.paidAmount ?? 0;
  const depositRequired = d.depositRequired ?? d.depositAmount ?? d.pricing?.depositRequired ?? 0;
  const depositAmt = d.depositPaid ?? d.depositAmount ?? d.amountDepositPaid ?? depositRequired;
  const depositWasPaid = !!(d.payment?.depositPaidAt || d.depositDate || d.depositPaidAt);
  // paidAmount often means total paid (including deposit); only add deposit when basePaid appears to be partial
  const paidNum = typeof basePaid === 'number' ? basePaid : 0;
  const depositNum = typeof depositAmt === 'number' ? depositAmt : 0;
  const paid = (paidNum >= depositNum || paidNum >= depositRequired) ? paidNum : paidNum + (depositWasPaid ? depositNum : 0);
  const deposit = depositRequired;
  const tip = d.tipAmount ?? d.pricing?.tipAmount ?? 0;
  let total = d.total ?? d.totalAmount ?? d.amount ?? d.price ?? d.cost ?? d.serviceTotal ?? d.totalPrice ?? d.pricing?.total ?? d.invoice?.total ?? d.invoice?.totalAmount ?? 0;
  if (typeof total !== 'number' || total <= 0) total = 0;
  // When Firebase has no total but has paid amount, use paid as total so finance table shows something
  if (total <= 0 && paid > 0) total = paid;

  const serviceType = mapServiceType(d.serviceType || d.service?.type);
  const location = mapLocation(d.serviceLocation || d.service?.location);
  const clientType = mapClientType(d.clientType || d.service?.clientType);

  const photos = d.clientPhotos || {};
  const inspiration = (photos.inspiration || []).map(p => ({
    url: p.url,
    publicId: p.publicId,
    uploadedAt: toDate(p.uploadedAt) || new Date(),
  })).filter(p => p.url);
  const currentState = (photos.currentState || []).map(p => ({
    url: p.url,
    publicId: p.publicId,
    uploadedAt: toDate(p.uploadedAt) || new Date(),
  })).filter(p => p.url);

  return {
    firebaseId: doc.id,
    bookingCode,
    customerId,
    nailTechId,
    slotIds: allSlotIds.length ? allSlotIds : (slotId ? [idMap.slots?.[slotId] || slotId] : []),
    service: { type: serviceType, location, clientType },
    status: mapStatus(d.status),
    paymentStatus: mapPaymentStatus(d.paymentStatus),
    pricing: {
      total: typeof total === 'number' ? total : 0,
      depositRequired: typeof deposit === 'number' ? deposit : 0,
      paidAmount: typeof paid === 'number' ? paid : 0,
      tipAmount: typeof tip === 'number' ? tip : 0,
      discountAmount: d.discountAmount ?? d.pricing?.discountAmount ?? 0,
    },
    payment: {
      method: d.payment?.method || d.depositPaymentMethod,
      depositPaidAt: toDate(d.payment?.depositPaidAt || d.depositDate),
      fullyPaidAt: toDate(d.payment?.fullyPaidAt || d.paidDate),
      paymentProofUrl: d.payment?.paymentProofUrl,
      paymentProofPublicId: d.payment?.paymentProofPublicId,
    },
    clientNotes: d.clientNotes,
    adminNotes: d.adminNotes,
    clientPhotos: { inspiration, currentState },
    completedAt: toDate(d.completedAt),
    confirmedAt: toDate(d.confirmedAt),
    invoice: d.invoice
      ? (() => {
          const fromItems = Array.isArray(d.invoice.items) ? d.invoice.items.reduce((s, i) => s + (Number(i.total) || (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1)), 0) : 0;
          const invTotal = typeof d.invoice.total === 'number' ? d.invoice.total : (typeof d.invoice.totalAmount === 'number' ? d.invoice.totalAmount : fromItems);
          const finalTotal = (typeof invTotal === 'number' ? invTotal : 0) || total;
          return {
            quotationId: idMap.quotations?.[d.invoice.quotationId] || idMap._embedQuotation?.[doc.id] || d.invoice.quotationId,
            total: finalTotal,
            createdAt: toDate(d.invoice.createdAt) || new Date(),
          };
        })()
      : undefined,
    statusReason: d.statusReason,
  };
}

function transformQuotation(doc, idMap) {
  const d = doc.data();
  const items = Array.isArray(d.items)
    ? d.items.map((item) => ({
        description: String(item.description || item.name || '').trim() || 'Item',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
        total: typeof item.total === 'number' ? item.total : (item.unitPrice || 0) * (item.quantity || 1),
      }))
    : [];
  const subtotal = typeof d.subtotal === 'number' ? d.subtotal : items.reduce((s, i) => s + (i.total || 0), 0);
  const discountRate = typeof d.discountRate === 'number' ? d.discountRate : 0;
  const discountAmount = typeof d.discountAmount === 'number' ? d.discountAmount : Math.round(subtotal * (discountRate / 100));
  const squeezeInFee = typeof d.squeezeInFee === 'number' ? d.squeezeInFee : 0;
  const totalAmount = typeof d.totalAmount === 'number' ? d.totalAmount : (typeof d.total === 'number' ? d.total : subtotal - discountAmount + squeezeInFee);
  const customerName = (d.customerName || d.clientName || d.customer?.name || '').trim() || 'Unknown';
  const status = ['draft', 'sent', 'accepted', 'expired'].includes(String(d.status || '').toLowerCase())
    ? String(d.status).toLowerCase()
    : 'accepted';
  return {
    firebaseId: doc.id,
    quotationNumber: d.quotationNumber || d.invoiceNumber || d.quotationId,
    customerName,
    customerPhone: d.customerPhone || d.customer?.phone || d.phone,
    customerEmail: (d.customerEmail || d.customer?.email || d.email || '').toLowerCase().trim() || undefined,
    items,
    subtotal,
    discountRate,
    discountAmount,
    squeezeInFee,
    totalAmount,
    notes: d.notes,
    status,
    createdBy: d.createdBy,
  };
}

function transformBlock(doc, idMap) {
  const d = doc.data();
  return {
    startDate: d.startDate,
    endDate: d.endDate,
    reason: d.reason,
    scope: d.scope,
  };
}

// ============================================================================
// FIREBASE INIT
// ============================================================================

async function initFirebase() {
  if (admin.apps.length) return admin.firestore();
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    });
  } else if (fs.existsSync(path.resolve(CONFIG.SERVICE_ACCOUNT_PATH))) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(CONFIG.SERVICE_ACCOUNT_PATH))) });
  } else {
    throw new Error('Firebase credentials required. Set FIREBASE_* env vars or add serviceAccountKey.json');
  }
  return admin.firestore();
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  log('MongoDB connected', 'SUCCESS');
}

// ============================================================================
// MIGRATE ONE COLLECTION
// ============================================================================

async function migrateCollection(firestore, collName, Model, transform, idMap, dryRun) {
  const results = { total: 0, ok: 0, fail: 0, skip: 0, errors: [] };

  let collectionsToRead = [collName];
  if (collName === 'customers') collectionsToRead = CUSTOMER_COLLECTIONS;
  if (collName === 'nail_techs') collectionsToRead = NAIL_TECH_COLLECTIONS;
  if (collName === 'quotations') collectionsToRead = QUOTATION_COLLECTIONS;

  const allDocs = [];
  for (const c of collectionsToRead) {
    try {
      const snap = await firestore.collection(c).get();
      if (snap.size > 0) {
        snap.docs.forEach(d => allDocs.push(d));
        break; // Use first non-empty collection (customers before clients)
      }
    } catch (e) {
      log(`Collection ${c} not found or error: ${e.message}`, 'WARNING');
    }
  }

  results.total = allDocs.length;
  log(`Migrating ${collName}: ${results.total} documents`);

  const QuotationModel = mongoose.models.Quotation;
  idMap._embedQuotation = idMap._embedQuotation || {};

  for (const fd of allDocs) {
    try {
      // For bookings: create Quotation from embedded invoice if no separate quotations collection
      if (collName === 'bookings' && QuotationModel) {
        const d = fd.data();
        const inv = d.invoice;
        const hasItems = inv && Array.isArray(inv.items) && inv.items.length > 0;
        const hasQuotationRef = inv?.quotationId && idMap.quotations?.[inv.quotationId];
        if (hasItems && !hasQuotationRef && !dryRun) {
          try {
            const embedKey = `embed_${fd.id}`;
            const existing = await QuotationModel.findOne({ firebaseId: embedKey }).lean();
            if (existing) {
              idMap._embedQuotation[fd.id] = String(existing._id);
            } else {
            const items = inv.items.map((item) => ({
              description: String(item.description || item.name || '').trim() || 'Item',
              quantity: typeof item.quantity === 'number' ? item.quantity : 1,
              unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
              total: typeof item.total === 'number' ? item.total : (item.unitPrice || 0) * (item.quantity || 1),
            }));
            const subtotal = typeof inv.subtotal === 'number' ? inv.subtotal : items.reduce((s, i) => s + (i.total || 0), 0);
            const discountAmount = typeof inv.discountAmount === 'number' ? inv.discountAmount : 0;
            const squeezeInFee = typeof inv.squeezeInFee === 'number' ? inv.squeezeInFee : 0;
            const totalAmount = typeof inv.total === 'number' ? inv.total : (typeof inv.totalAmount === 'number' ? inv.totalAmount : subtotal - discountAmount + squeezeInFee);
            const customerName = (inv.customerName || d.customerName || d.clientName || '').trim() || 'Unknown';
            const q = new QuotationModel({
              firebaseId: embedKey,
              quotationNumber: inv.quotationNumber || inv.invoiceNumber || `INV-${fd.id.slice(-8)}`,
              customerName: customerName,
              customerPhone: inv.customerPhone || inv.phone,
              customerEmail: (inv.customerEmail || inv.email || '').toLowerCase().trim() || undefined,
              items,
              subtotal,
              discountRate: typeof inv.discountRate === 'number' ? inv.discountRate : 0,
              discountAmount,
              squeezeInFee,
              totalAmount,
              notes: inv.notes,
              status: 'accepted',
              createdBy: inv.createdBy,
            });
            await q.save();
            idMap._embedQuotation[fd.id] = String(q._id);
            }
          } catch (e) {
            log(`Embedded invoice Quotation for booking ${fd.id}: ${e.message}`, 'WARNING');
          }
        }
      }

      const transformed = transform(fd, idMap);
      if (dryRun) {
        results.ok++;
        continue;
      }
      const existing = collName === 'users'
        ? await Model.findOne({ $or: [{ firebaseId: fd.id }, { email: transformed.email }] }).lean()
        : await Model.findOne({ firebaseId: fd.id }).lean();
      if (existing) {
        results.skip++;
        idMap[collName] = idMap[collName] || {};
        if (existing._id) idMap[collName][fd.id] = String(existing._id);
        // For bookings: backfill invoice and/or pricing when we have better data from Firebase
        if (collName === 'bookings') {
          const existingBooking = await Model.findById(existing._id);
          if (existingBooking) {
            let saved = false;
            if (idMap._embedQuotation?.[fd.id] && transformed.invoice && !existingBooking.invoice?.quotationId) {
              existingBooking.invoice = {
                quotationId: idMap._embedQuotation[fd.id],
                total: transformed.invoice.total ?? existingBooking.invoice?.total ?? 0,
                createdAt: existingBooking.invoice?.createdAt || transformed.invoice.createdAt || new Date(),
              };
              saved = true;
            }
            const currentTotal = existingBooking.pricing?.total ?? 0;
            const currentPaid = existingBooking.pricing?.paidAmount ?? 0;
            const newTotal = transformed.pricing?.total ?? 0;
            if ((currentTotal == null || currentTotal <= 0) && (newTotal > 0 || currentPaid > 0)) {
              existingBooking.pricing = existingBooking.pricing || {};
              existingBooking.pricing.total = newTotal > 0 ? newTotal : currentPaid;
              saved = true;
            }
            if (saved) {
              await existingBooking.save();
              log(`Updated booking ${fd.id} (invoice/pricing backfill)`, 'INFO');
            }
          }
        }
        continue;
      }
      const doc = new Model(transformed);
      await doc.save();
      idMap[collName] = idMap[collName] || {};
      idMap[collName][fd.id] = String(doc._id);
      results.ok++;
    } catch (e) {
      results.fail++;
      results.errors.push({ id: fd.id, error: e.message });
      fs.appendFileSync(CONFIG.ERROR_LOG_FILE, `[${collName}] ${fd.id}: ${e.message}\n`);
    }
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

function parseArgs() {
  const only = process.argv.find(a => a.startsWith('--only='));
  const collections = only ? only.split('=')[1].split(',').map(s => s.trim()) : COLLECTION_ORDER;
  return { collections, dryRun: CONFIG.DRY_RUN, rollback: process.argv.includes('--rollback') };
}

async function runMigration() {
  const { collections, dryRun, rollback } = parseArgs();

  if (rollback) {
    log('ROLLBACK: Deleting from MongoDB ONLY. Firebase is NOT touched.', 'WARNING');
    await connectMongo();
    const models = { nail_techs: NailTech, users: User, customers: Customer, slots: Slot, quotations: Quotation, bookings: Booking, blocks: Block };
    for (const c of collections) {
      const M = models[c];
      if (M) {
        const r = await M.deleteMany({});
        log(`Rollback ${c}: deleted ${r.deletedCount}`);
      }
    }
    await mongoose.connection.close();
    return;
  }

  if (fs.existsSync(CONFIG.ERROR_LOG_FILE)) fs.unlinkSync(CONFIG.ERROR_LOG_FILE);

  const firestore = await initFirebase();
  await connectMongo();

  const idMap = { nail_techs: {}, users: {}, customers: {}, slots: {}, quotations: {} };
  const transformers = {
    nail_techs: transformNailTech,
    users: transformUser,
    customers: transformCustomer,
    slots: transformSlot,
    quotations: transformQuotation,
    bookings: transformBooking,
    blocks: transformBlock,
  };
  const models = { nail_techs: NailTech, users: User, customers: Customer, slots: Slot, quotations: Quotation, bookings: Booking, blocks: Block };

  const report = { timestamp: new Date().toISOString(), dryRun, collections: {} };

  for (const coll of COLLECTION_ORDER) {
    if (!collections.includes(coll)) continue;
    const Model = models[coll];
    const transform = transformers[coll];
    if (!Model || !transform) continue;
    const res = await migrateCollection(firestore, coll, Model, transform, idMap, dryRun);
    report.collections[coll] = res;
    log(`${coll}: ${res.ok} ok, ${res.fail} fail, ${res.skip} skipped`);
  }

  fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(report, null, 2));
  log(`Report: ${CONFIG.REPORT_FILE}`, 'SUCCESS');
  await mongoose.connection.close();
  if (admin.apps.length) await admin.app().delete();
}

runMigration().catch(err => {
  log(err.message, 'ERROR');
  console.error(err);
  process.exit(1);
});
