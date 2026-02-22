import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SlotStatus } from '@/lib/types';

export interface ISlot extends Document {
  firebaseId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: SlotStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  notes?: string | null;
  isHidden?: boolean;
  nailTechId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>(
  {
    firebaseId: { type: String, sparse: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['available', 'blocked', 'pending', 'confirmed'],
    },
    slotType: { type: String, enum: ['regular', 'with_squeeze_fee'] },
    notes: { type: String },
    isHidden: { type: Boolean, default: false },
    nailTechId: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for faster queries
SlotSchema.index({ date: 1, time: 1 });
SlotSchema.index({ nailTechId: 1, date: 1 });
SlotSchema.index({ date: 1, status: 1 });
SlotSchema.index({ nailTechId: 1, date: 1, status: 1 });

const Slot: Model<ISlot> = mongoose.models.Slot || mongoose.model<ISlot>('Slot', SlotSchema);

export default Slot;
