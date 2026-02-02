import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  socialMediaName?: string;
  referralSource?: string;
  isRepeatClient?: boolean;
  notes?: string;
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
    isRepeatClient: { type: Boolean },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for faster lookups
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
