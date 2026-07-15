import connectDB from '@/lib/mongodb';
import MediaAsset, { MEDIA_CATEGORIES, type MediaCategory, type IMediaAsset } from '@/lib/models/MediaAsset';
import { deleteImage, uploadImage } from '@/lib/cloudinary';

export type MediaAssetDTO = {
  id: string;
  url: string;
  publicId: string;
  alt: string;
  title?: string;
  category: MediaCategory;
  refKey?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateMediaInput = {
  url: string;
  publicId: string;
  alt?: string;
  title?: string;
  category: MediaCategory;
  refKey?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateMediaInput = Partial<{
  alt: string;
  title: string;
  category: MediaCategory;
  refKey: string | null;
  sortOrder: number;
  isActive: boolean;
}>;

function toDTO(doc: IMediaAsset): MediaAssetDTO {
  return {
    id: String(doc._id),
    url: doc.url,
    publicId: doc.publicId,
    alt: doc.alt || '',
    title: doc.title || undefined,
    category: doc.category,
    refKey: doc.refKey || undefined,
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date(doc.updatedAt).toISOString(),
  };
}

export function isValidCategory(value: unknown): value is MediaCategory {
  return typeof value === 'string' && (MEDIA_CATEGORIES as readonly string[]).includes(value);
}

export async function listMedia(options?: {
  category?: MediaCategory;
  activeOnly?: boolean;
}): Promise<MediaAssetDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (options?.category) filter.category = options.category;
  if (options?.activeOnly) filter.isActive = true;

  const docs = await MediaAsset.find(filter).sort({ sortOrder: 1, createdAt: -1 }).exec();
  return docs.map(toDTO);
}

export async function getMediaById(id: string): Promise<MediaAssetDTO | null> {
  await connectDB();
  const doc = await MediaAsset.findById(id).exec();
  return doc ? toDTO(doc) : null;
}

export async function createMedia(input: CreateMediaInput): Promise<MediaAssetDTO> {
  await connectDB();

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await MediaAsset.findOne({ category: input.category })
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean()
      .exec();
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const doc = await MediaAsset.create({
    url: input.url,
    publicId: input.publicId,
    alt: input.alt?.trim() || '',
    title: input.title?.trim() || undefined,
    category: input.category,
    refKey: input.refKey?.trim() || undefined,
    sortOrder,
    isActive: input.isActive !== false,
  });

  return toDTO(doc);
}

export async function updateMedia(id: string, input: UpdateMediaInput): Promise<MediaAssetDTO | null> {
  await connectDB();
  const doc = await MediaAsset.findById(id).exec();
  if (!doc) return null;

  if (input.alt !== undefined) doc.alt = input.alt.trim();
  if (input.title !== undefined) doc.title = input.title.trim() || undefined;
  if (input.category !== undefined) doc.category = input.category;
  if (input.refKey !== undefined) doc.refKey = input.refKey?.trim() || undefined;
  if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) doc.isActive = input.isActive;

  await doc.save();
  return toDTO(doc);
}

export async function deleteMedia(id: string): Promise<boolean> {
  await connectDB();
  const doc = await MediaAsset.findById(id).exec();
  if (!doc) return false;

  await deleteImage(doc.publicId).catch((err) => {
    console.error('Failed to delete Cloudinary image:', err);
  });
  await doc.deleteOne();
  return true;
}

export async function uploadMarketingImage(
  fileBuffer: Buffer,
  category: MediaCategory
): Promise<{ url: string; publicId: string }> {
  const folder = `marketing/${category}`;
  const result: any = await uploadImage(fileBuffer, folder, undefined, {
    maxWidth: 2000,
    quality: 'auto:good',
  });
  return {
    url: result.secure_url as string,
    publicId: result.public_id as string,
  };
}

export async function reorderMedia(
  category: MediaCategory,
  orderedIds: string[]
): Promise<MediaAssetDTO[]> {
  await connectDB();
  await Promise.all(
    orderedIds.map((id, index) =>
      MediaAsset.findByIdAndUpdate(id, { sortOrder: index }).exec()
    )
  );
  return listMedia({ category });
}
