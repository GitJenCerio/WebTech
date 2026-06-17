import mongoose, { Schema, Document, Model } from 'mongoose';

export type TestimonialPermission = 'first_name' | 'anonymous' | 'no';
export type FutureBookingIntent = 'definitely' | 'probably' | 'maybe' | 'unlikely';

export interface IClientFeedback extends Document {
  responseId: string;
  ipAddress?: string;
  userAgent?: string;
  nailTechId?: string;
  nailTechName?: string;
  overallSatisfaction: number;
  nailQuality: number;
  russianManicureQuality: number;
  studioCleanliness: number;
  customerService: number;
  favoritePart?: string;
  improvementSuggestions?: string;
  testimonialPermission: TestimonialPermission;
  futureBookingIntent: FutureBookingIntent;
  submittedAt: Date;
  averageRating: number;
  overallScore: number;
  isFlaggedForFollowUp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientFeedbackSchema = new Schema<IClientFeedback>(
  {
    responseId: { type: String, required: true, unique: true, index: true },
    ipAddress: { type: String, index: true },
    userAgent: { type: String },
    nailTechId: { type: String, index: true },
    nailTechName: { type: String, trim: true },
    overallSatisfaction: { type: Number, required: true, min: 1, max: 5 },
    nailQuality: { type: Number, required: true, min: 1, max: 5 },
    russianManicureQuality: { type: Number, required: true, min: 1, max: 5 },
    studioCleanliness: { type: Number, required: true, min: 1, max: 5 },
    customerService: { type: Number, required: true, min: 1, max: 5 },
    favoritePart: { type: String, trim: true, maxlength: 2000 },
    improvementSuggestions: { type: String, trim: true, maxlength: 2000 },
    testimonialPermission: {
      type: String,
      required: true,
      enum: ['first_name', 'anonymous', 'no'],
      default: 'no',
    },
    futureBookingIntent: {
      type: String,
      required: true,
      enum: ['definitely', 'probably', 'maybe', 'unlikely'],
      default: 'probably',
    },
    averageRating: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    isFlaggedForFollowUp: { type: Boolean, default: false, index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ClientFeedbackSchema.index({ createdAt: -1 });
ClientFeedbackSchema.index({ isFlaggedForFollowUp: 1, createdAt: -1 });

const ClientFeedback: Model<IClientFeedback> =
  mongoose.models.ClientFeedback || mongoose.model<IClientFeedback>('ClientFeedback', ClientFeedbackSchema);

export default ClientFeedback;