import { NextResponse } from 'next/server';
import { deleteImage } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const { publicId } = await request.json();
    if (!publicId) return NextResponse.json({ error: 'Public ID required' }, { status: 400 });

    const result = await deleteImage(publicId);
    return NextResponse.json({ success: true, result, message: 'Image deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
