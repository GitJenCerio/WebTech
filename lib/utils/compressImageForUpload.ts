/**
 * Compress an image File for upload (JPEG). Skips non-images / HEIC (kept as-is).
 * Targets ~1.2MB max while keeping reasonable quality for receipts/nails.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxWidth?: number; maxBytes?: number; quality?: number }
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 1600;
  const maxBytes = options?.maxBytes ?? 1.2 * 1024 * 1024;
  const quality = options?.quality ?? 0.82;

  if (!file.type.startsWith('image/') || file.type.includes('heic') || file.type.includes('heif')) {
    return file;
  }
  if (file.size <= maxBytes && file.size < 800 * 1024) {
    return file;
  }

  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let q = quality;
    let blob: Blob | null = null;
    for (let i = 0; i < 4; i++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', q)
      );
      if (!blob) break;
      if (blob.size <= maxBytes) break;
      q = Math.max(0.5, q - 0.12);
    }

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
