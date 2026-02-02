import mongoose, { Schema, Document, Model } from 'mongoose';
import type { BookingStatus, ServiceType, PaymentStatus, Invoice } from '@/lib/types';

export interface IBooking extends Document {
  slotId: string;
  pairedSlotId?: string | null;
  linkedSlotIds?: string[];
  bookingId: string; // GN-00001 format
  customerId: string;
  nailTechId: string;
  status: BookingStatus;
  serviceType?: ServiceType;
  clientType?: 'new' | 'repeat';
  serviceLocation?: 'homebased_studio' | 'home_service';
  assistantName?: string;
  assistantCommissionRate?: number;
  customerData?: Record<string, string>;
  customerDataOrder?: string[];
  formResponseId?: string;
  dateChanged?: boolean;
  timeChanged?: boolean;
  validationWarnings?: string[];
  invoice?: Invoice;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  depositAmount?: number;
  tipAmount?: number;
  depositDate?: string;
  paidDate?: string;
  tipDate?: string;
  depositPaymentMethod?: 'PNB' | 'CASH' | 'GCASH';
  paidPaymentMethod?: 'PNB' | 'CASH' | 'GCASH';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    slotId: { type: String, required: true },
    pairedSlotId: { type: String },
    linkedSlotIds: [{ type: String }],
    bookingId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    nailTechId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending_form', 'pending_payment', 'confirmed', 'cancelled'],
    },
    serviceType: {
      type: String,
      enum: ['manicure', 'pedicure', 'mani_pedi', 'home_service_2slots', 'home_service_3slots'],
    },
    clientType: { type: String, enum: ['new', 'repeat'] },
    serviceLocation: { type: String, enum: ['homebased_studio', 'home_service'] },
    assistantName: { type: String },
    assistantCommissionRate: { type: Number },
    customerData: { type: Schema.Types.Mixed },
    customerDataOrder: [{ type: String }],
    formResponseId: { type: String },
    dateChanged: { type: Boolean },
    timeChanged: { type: Boolean },
    validationWarnings: [{ type: String }],
    invoice: { type: Schema.Types.Mixed },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded', 'forfeited'],
    },
    paidAmount: { type: Number },
    depositAmount: { type: Number },
    tipAmount: { type: Number },
    depositDate: { type: String },
    paidDate: { type: String },
    tipDate: { type: String },
    depositPaymentMethod: { type: String, enum: ['PNB', 'CASH', 'GCASH'] },
    paidPaymentMethod: { type: String, enum: ['PNB', 'CASH', 'GCASH'] },
  },
  { timestamps: true }
);

// Indexes for faster queries
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ slotId: 1 });
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ nailTechId: 1, createdAt: -1 });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
