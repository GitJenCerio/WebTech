import mongoose from 'mongoose';

export interface IAnalyticsEvent extends mongoose.Document {
  type: string;
  page?: string;
  referrer?: string;
  bookingId?: string;
  sessionId?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    page: { type: String },
    referrer: { type: String },
    bookingId: { type: String, index: true },
    sessionId: { type: String, index: true },
    userAgent: { type: String },
    timestamp: { type: String },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });

const AnalyticsEvent =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
