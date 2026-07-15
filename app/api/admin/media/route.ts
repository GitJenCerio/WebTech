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

    const formData = await request.formData();
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 8 * 1024 * 1024;
    const created = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Only JPEG, PNG, WebP, and GIF images are allowed (got ${file.type || 'unknown'})` },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
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
