import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'payment_6h'
  | 'payment_12h'
  | 'payment_23h'
  | 'payment_24h_cancel'
  | 'appt_24h'
  | 'appt_2h';

export interface INotificationLog extends Document {
  bookingId: string;
  type: NotificationType;
  scheduledFor: Date;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    bookingId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ bookingId: 1, type: 1 }, { unique: true });

const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog || mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);

export default NotificationLog;
