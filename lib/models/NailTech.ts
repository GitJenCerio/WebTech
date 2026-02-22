import mongoose, { Schema, Document, Model } from 'mongoose';
import type { NailTechRole, ServiceAvailability, NailTechStatus } from '@/lib/types';

export interface INailTech extends Document {
  firebaseId?: string;
  name: string; // Stored without "Ms." prefix
  role: NailTechRole;
  serviceAvailability: ServiceAvailability;
  workingDays: string[];
  discount?: number;
  commissionRate?: number;
  status: NailTechStatus;
  createdAt: Date;
  updatedAt: Date;
}

const NailTechSchema = new Schema<INailTech>(
  {
    firebaseId: { type: String, sparse: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['Owner', 'Junior Tech', 'Senior Tech'],
    },
    serviceAvailability: {
      type: String,
      required: true,
      enum: ['Studio only', 'Home service only', 'Studio and Home Service'],
    },
    workingDays: {
      type: [String],
      default: [],
    },
    discount: { type: Number },
    commissionRate: { type: Number },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true },
);

// Helpful indexes
NailTechSchema.index({ status: 1 });
NailTechSchema.index({ role: 1 });

const NailTechModel: Model<INailTech> =
  mongoose.models.NailTech || mongoose.model<INailTech>('NailTech', NailTechSchema);

export default NailTechModel;

