import mongoose from 'mongoose';

export interface ISettings extends mongoose.Document {
  businessName: string;
  reservationFee: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderHoursBefore: number;
}

const SettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    businessName: { type: String, default: 'Glammed Nails by Jhen' },
    reservationFee: { type: Number, default: 500 },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    reminderHoursBefore: { type: Number, default: 24 },
  },
  { timestamps: true }
);

const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;
