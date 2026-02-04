import { NextResponse } from 'next/server';
import { listNailTechs, listActiveNailTechs, createNailTech } from '@/lib/services/nailTechService';
import type { NailTechInput } from '@/lib/types';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const nailTechs = activeOnly ? await listActiveNailTechs() : await listNailTechs();
    
    // OPTIMIZED: Nail techs change very infrequently, cache for 5 minutes
    // This significantly reduces Firestore reads since nail techs are loaded on every page
    return NextResponse.json({ nailTechs }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    });
  } catch (error: any) {
    console.error('Error listing nail techs:', error);
    return NextResponse.json({ error: error.message || 'Failed to list nail techs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const payload: NailTechInput = {
      name: String(body.name || '').trim(),
      role: body.role,
      serviceAvailability: body.serviceAvailability,
      workingDays: Array.isArray(body.workingDays) ? body.workingDays : [],
      discount: typeof body.discount === 'number' ? body.discount : undefined,
      commissionRate: typeof body.commissionRate === 'number' ? body.commissionRate : undefined,
      status: body.status || 'Active',
    };

    if (!payload.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!payload.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    if (!payload.serviceAvailability) {
      return NextResponse.json({ error: 'Service availability is required' }, { status: 400 });
    }

    const nailTech = await createNailTech(payload);
    return NextResponse.json({ nailTech }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating nail tech:', error);
    return NextResponse.json({ error: error.message || 'Failed to create nail tech' }, { status: 400 });
  }
}

