import mongoose, { Schema, Document, Model } from 'mongoose';
import type { BookingStatus, PaymentStatus, ServiceType } from '@/lib/types';

export interface IBooking extends Document {
  bookingCode: string; // Unique booking code (e.g., "GN-000123")
  customerId: string; // Reference to Customer
  nailTechId: string; // Reference to NailTech
  slotIds: string[]; // Array of Slot IDs (one or multiple slots)
  service: {
    type: ServiceType;
    location: 'homebased_studio' | 'home_service';
    clientType: 'new' | 'repeat';
  };
  status: BookingStatus; // 'pending' | 'confirmed' | 'cancelled'
  paymentStatus: PaymentStatus; // 'unpaid' | 'partial' | 'paid' | 'refunded'
  pricing: {
    total: number; // Total price
    depositRequired: number; // Required deposit amount
    paidAmount: number; // Amount paid so far
    tipAmount: number; // Tip amount (optional)
  };
  payment: {
    method?: 'PNB' | 'CASH' | 'GCASH'; // Payment method
    depositPaidAt?: Date; // When deposit was paid
    fullyPaidAt?: Date; // When full payment was completed
  };
  completedAt: Date | null; // When appointment was completed (admin-only, settable once)
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingCode: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    customerId: { 
      type: String, 
      required: true,
      index: true 
    },
    nailTechId: { 
      type: String, 
      required: true,
      index: true 
    },
    slotIds: [{ 
      type: String,
      required: true 
    }],
    service: {
      type: {
        type: String,
        required: true,
        enum: ['manicure', 'pedicure', 'mani_pedi', 'home_service_2slots', 'home_service_3slots'],
      },
      location: {
        type: String,
        required: true,
        enum: ['homebased_studio', 'home_service'],
      },
      clientType: {
        type: String,
        required: true,
        enum: ['new', 'repeat'],
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['unpaid', 'partial', 'paid', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    pricing: {
      total: { type: Number, required: true, default: 0 },
      depositRequired: { type: Number, required: true, default: 0 },
      paidAmount: { type: Number, required: true, default: 0 },
      tipAmount: { type: Number, required: true, default: 0 },
    },
    payment: {
      method: { type: String, enum: ['PNB', 'CASH', 'GCASH'] },
      depositPaidAt: { type: Date },
      fullyPaidAt: { type: Date },
    },
    completedAt: {
      type: Date,
      default: null,
      index: true, // Index for querying completed appointments
    },
  },
  { timestamps: true }
);

// Pre-save hook: Prevent changing completedAt once it's set (enforced at service layer, but add extra protection)
BookingSchema.pre('save', async function(next) {
  // If this is an update (not a new document) and completedAt is being modified
  if (!this.isNew && this.isModified('completedAt')) {
    try {
      const original = await this.constructor.findById(this._id);
      if (original && (original as any).completedAt !== null && this.completedAt !== (original as any).completedAt) {
        // Prevent changing completedAt if it was already set
        return next(new Error('Cannot change completedAt once it is set'));
      }
    } catch (err: any) {
      return next(err);
    }
  }
  next();
});

// Indexes for faster queries
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ nailTechId: 1 });
BookingSchema.index({ slotIds: 1 }); // Array index for slot lookups
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ nailTechId: 1, createdAt: -1 });
// Compound index for upcoming appointments query: status = 'confirmed' AND completedAt = null
BookingSchema.index({ status: 1, completedAt: 1 });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
