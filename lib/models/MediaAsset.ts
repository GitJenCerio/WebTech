import mongoose, { Schema, Document, Model } from 'mongoose';

export const MEDIA_CATEGORIES = ['gallery', 'service', 'hero', 'other'] as const;
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export interface IMediaAsset extends Document {
  url: string;
  publicId: string;
  alt: string;
  title?: string;
  category: MediaCategory;
  /** Optional key to bind an image to a specific UI slot (e.g. service-1, hero) */
  refKey?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: '', trim: true },
    title: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: MEDIA_CATEGORIES,
      default: 'gallery',
      index: true,
    },
    refKey: { type: String, trim: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MediaAssetSchema.index({ category: 1, isActive: 1, sortOrder: 1 });

const MediaAssetModel: Model<IMediaAsset> =
  (mongoose.models.MediaAsset as Model<IMediaAsset>) ||
  mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);

export default MediaAssetModel;
