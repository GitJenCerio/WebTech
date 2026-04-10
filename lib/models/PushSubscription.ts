import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// One subscription per browser per user
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;
