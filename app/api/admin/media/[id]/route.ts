import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdminOrAbove, type SessionUser } from '@/lib/rbac';
import {
  deleteMedia,
  getMediaById,
  isValidCategory,
  updateMedia,
} from '@/lib/services/mediaService';

export const dynamic = 'force-dynamic';

function sessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  return {
    role: (session.user as { role?: string }).role,
    assignedNailTechId: (session.user as { assignedNailTechId?: string | null }).assignedNailTechId ?? null,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/media/[id]
 * Update metadata, visibility, sort order, or category.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrAbove(sessionUser(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getMediaById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const body = await request.json();
    if (body.category !== undefined && !isValidCategory(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const updated = await updateMedia(id, {
      alt: body.alt,
      title: body.title,
      category: body.category,
      refKey: body.refKey === null || body.refKey === '' ? null : body.refKey,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
    });

    return NextResponse.json({ media: updated });
  } catch (error: any) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Remove from DB and Cloudinary.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrAbove(sessionUser(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const ok = await deleteMedia(id);
    if (!ok) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
