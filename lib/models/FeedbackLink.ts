import mongoose, { Document, Model, Schema } from 'mongoose';

export type FeedbackLinkStatus = 'unused' | 'used' | 'expired';

export interface IFeedbackLink extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date | null;
  usedResponseId?: string | null;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackLinkSchema = new Schema<IFeedbackLink>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
    usedResponseId: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeedbackLinkSchema.index({ expiresAt: 1, usedAt: 1 });

const FeedbackLink: Model<IFeedbackLink> =
  mongoose.models.FeedbackLink || mongoose.model<IFeedbackLink>('FeedbackLink', FeedbackLinkSchema);

export default FeedbackLink;