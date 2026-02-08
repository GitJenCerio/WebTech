import mongoose from 'mongoose';

const QuotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
});

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerEmail: { type: String },
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    squeezeInFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    notes: { type: String },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'expired'],
      default: 'draft',
      index: true,
    },
    createdBy: { type: String },
  },
  { timestamps: true }
);

QuotationSchema.pre('save', function (next) {
  if (!this.quotationNumber) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.quotationNumber = `QN-${dateStr}${random}`;
  }
  next();
});

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
