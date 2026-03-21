import { NextResponse } from 'next/server';
import { getNailTechById, updateNailTech, deleteNailTech } from '@/lib/services/nailTechService';
import type { NailTechInput } from '@/lib/types';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const nailTech = await getNailTechById(id);
    if (!nailTech) {
      return NextResponse.json({ error: 'Nail tech not found' }, { status: 404 });
    }
    return NextResponse.json({ nailTech });
  } catch (error: any) {
    console.error('Error getting nail tech:', error);
    return NextResponse.json({ error: error.message || 'Failed to get nail tech' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parseOptionalNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const payload: Partial<NailTechInput> = {
      name: typeof body.name === 'string' ? body.name.trim() : undefined,
      role: body.role,
      serviceAvailability: body.serviceAvailability,
      workingDays: Array.isArray(body.workingDays) ? body.workingDays : undefined,
      discount: parseOptionalNumber(body.discount),
      commissionRate: parseOptionalNumber(body.commissionRate),
      adminCommissionRate: parseOptionalNumber(body.adminCommissionRate),
      status: body.status,
    };

    // Do not overwrite name with empty string on partial updates.
    if (!payload.name) {
      delete payload.name;
    }

    const nailTech = await updateNailTech(id, payload);
    return NextResponse.json({ nailTech });
  } catch (error: any) {
    console.error('Error updating nail tech:', error);
    return NextResponse.json({ error: error.message || 'Failed to update nail tech' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteNailTech(id);
    return NextResponse.json({ message: 'Nail tech deactivated' });
  } catch (error: any) {
    console.error('Error deleting nail tech:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete nail tech' }, { status: 400 });
  }
}

