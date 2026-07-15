import { NextResponse } from 'next/server';
import { isValidCategory, listMedia } from '@/lib/services/mediaService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/media?category=gallery
 * Public: returns active marketing images for the website.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    if (categoryParam && !isValidCategory(categoryParam)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const media = await listMedia({
      category: categoryParam && isValidCategory(categoryParam) ? categoryParam : undefined,
      activeOnly: true,
    });

    return NextResponse.json(
      { media },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Error listing public media:', error);
    return NextResponse.json({ error: error.message || 'Failed to list media' }, { status: 500 });
  }
}
