import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export interface UploadImageOptions {
  maxWidth?: number;
  quality?: string;
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string,
  publicId?: string,
  options?: UploadImageOptions
) {
  const maxWidth = options?.maxWidth ?? 1500;
  const quality = options?.quality ?? 'auto:good';
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ width: maxWidth, crop: 'limit' as const }, { quality, fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export function generateSignature(params: Record<string, any>) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, ...params },
    process.env.CLOUDINARY_API_SECRET!
  );
  return { signature, timestamp };
}
