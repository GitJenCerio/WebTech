import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdminOrAbove, type SessionUser } from '@/lib/rbac';
import {
  createMedia,
  isValidCategory,
  listMedia,
  uploadMarketingImage,
} from '@/lib/services/mediaService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function guessMimeFromName(name: string | undefined): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return null;
}

function sessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  return {
    role: (session.user as { role?: string }).role,
    assignedNailTechId: (session.user as { assignedNailTechId?: string | null }).assignedNailTechId ?? null,
  };
}

/**
 * GET /api/admin/media?category=gallery
 * Admin: list all media (including inactive).
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrAbove(sessionUser(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    if (categoryParam && !isValidCategory(categoryParam)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const media = await listMedia({
      category: categoryParam && isValidCategory(categoryParam) ? categoryParam : undefined,
      activeOnly: false,
    });

    return NextResponse.json(
      { media },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Error listing admin media:', error);
    return NextResponse.json({ error: error.message || 'Failed to list media' }, { status: 500 });
  }
}

/**
 * POST /api/admin/media
 * Admin: upload one or more images (FormData: files[], category, alt?, title?, refKey?).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrAbove(sessionUser(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'This photo is too large to upload. Try a smaller image.' },
        { status: 413 }
      );
    }
    const categoryRaw = String(formData.get('category') || 'gallery');
    if (!isValidCategory(categoryRaw)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const alt = String(formData.get('alt') || '');
    const title = String(formData.get('title') || '');
    const refKey = String(formData.get('refKey') || '');

    const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
    const single = formData.get('file');
    if (single instanceof File && single.size > 0) files.push(single);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const created = [];

    for (const file of files) {
      const mime =
        (file.type && file.type !== 'application/octet-stream' ? file.type : null) ||
        guessMimeFromName(file.name) ||
        '';
      if (mime && !ALLOWED_TYPES.includes(mime)) {
        return NextResponse.json(
          { error: `Only JPEG, PNG, WebP, GIF, and HEIC images are allowed (got ${mime})` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Each file must be under 8MB' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadMarketingImage(buffer, categoryRaw);
      const asset = await createMedia({
        url: uploaded.url,
        publicId: uploaded.publicId,
        category: categoryRaw,
        alt: alt || file.name.replace(/\.[^.]+$/, ''),
        title: title || undefined,
        refKey: refKey || undefined,
      });
      created.push(asset);
    }

    return NextResponse.json({ media: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
