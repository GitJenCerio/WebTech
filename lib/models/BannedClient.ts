import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBannedClient extends Document {
  customerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  socialMediaName?: string;
  nameNormalized?: string;
  emailNormalized?: string;
  phoneKey?: string;
  socialNormalized?: string;
  reason?: string;
  isActive: boolean;
  bannedByUserId?: string;
  bannedByName?: string;
  bannedByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannedClientSchema = new Schema<IBannedClient>(
  {
    customerId: { type: String, index: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    socialMediaName: { type: String },
    nameNormalized: { type: String, index: true },
    emailNormalized: { type: String, index: true },
    phoneKey: { type: String, index: true },
    socialNormalized: { type: String, index: true },
    reason: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    bannedByUserId: { type: String },
    bannedByName: { type: String },
    bannedByEmail: { type: String },
  },
  { timestamps: true }
);

BannedClientSchema.index({ isActive: 1, nameNormalized: 1 });
BannedClientSchema.index({ isActive: 1, emailNormalized: 1 });
BannedClientSchema.index({ isActive: 1, phoneKey: 1 });
BannedClientSchema.index({ isActive: 1, socialNormalized: 1 });

const BannedClient: Model<IBannedClient> =
  mongoose.models.BannedClient || mongoose.model<IBannedClient>('BannedClient', BannedClientSchema);

export default BannedClient;
