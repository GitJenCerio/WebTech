import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  socialMediaName?: string;
  referralSource?: string;
  referralSourceOther?: string;
  isRepeatClient?: boolean;
  clientType?: 'NEW' | 'REPEAT';
  totalBookings?: number;
  completedBookings?: number;
  totalSpent?: number;
  totalTips?: number;
  totalDiscounts?: number;
  lastVisit?: Date | null;
  notes?: string;
  nailHistory?: {
    hasRussianManicure?: boolean;
    hasGelOverlay?: boolean;
    hasSoftgelExtensions?: boolean;
  };
  healthInfo?: {
    allergies?: string;
    nailConcerns?: string;
    nailDamageHistory?: string;
  };
  inspoDescription?: string;
  waiverAccepted?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    socialMediaName: { type: String },
    referralSource: { type: String },
    referralSourceOther: { type: String },
    isRepeatClient: { type: Boolean },
    clientType: { type: String, enum: ['NEW', 'REPEAT'], default: 'NEW' },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalTips: { type: Number, default: 0 },
    totalDiscounts: { type: Number, default: 0 },
    lastVisit: { type: Date, default: null },
    notes: { type: String },
    nailHistory: {
      hasRussianManicure: { type: Boolean },
      hasGelOverlay: { type: Boolean },
      hasSoftgelExtensions: { type: Boolean },
    },
    healthInfo: {
      allergies: { type: String },
      nailConcerns: { type: String },
      nailDamageHistory: { type: String },
    },
    inspoDescription: { type: String },
    waiverAccepted: { type: Boolean },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for faster lookups
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
