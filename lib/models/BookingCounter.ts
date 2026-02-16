import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBookingCounter extends Document {
  dateKey: string; // YYYYMMDD
  seq: number; // Daily sequence number
}

const BookingCounterSchema = new Schema<IBookingCounter>(
  {
    dateKey: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Index is created automatically by unique: true on dateKey; no need for schema.index()

const BookingCounter: Model<IBookingCounter> =
  mongoose.models.BookingCounter || mongoose.model<IBookingCounter>('BookingCounter', BookingCounterSchema);

export default BookingCounter;
