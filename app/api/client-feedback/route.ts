import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import ClientFeedback from '@/lib/models/ClientFeedback';
import { getNailTechById } from '@/lib/services/nailTechService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  overallSatisfaction: z.coerce.number().int().min(1).max(5),
  nailQuality: z.coerce.number().int().min(1).max(5),
  russianManicureQuality: z.coerce.number().int().min(1).max(5),
  studioCleanliness: z.coerce.number().int().min(1).max(5),
  customerService: z.coerce.number().int().min(1).max(5),
  nailTechId: z.string().trim().min(1, 'Please select your nail technician.'),
  favoritePart: z.string().trim().max(2000).optional().or(z.literal('')),
  improvementSuggestions: z.string().trim().max(2000).optional().or(z.literal('')),
  testimonialPermission: z.enum(['first_name', 'anonymous', 'no']),
  futureBookingIntent: z.enum(['definitely', 'probably', 'maybe', 'unlikely']),
  website: z.string().max(0).optional().or(z.literal('')),
  turnstileToken: z.string().trim().optional().or(z.literal('')),
  recaptchaToken: z.string().trim().optional().or(z.literal('')),
});

const MIN_INTERVAL_MS = 10 * 60 * 1000;
const DAILY_MAX = 3;

function getRequestIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function getUserAgent(request: Request) {
  return request.headers.get('user-agent') || '';
}

function generateResponseId() {
  return `FB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function checkRateLimit(ipAddress: string, userAgent: string) {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - MIN_INTERVAL_MS);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [recentSubmission, dailyCount] = await Promise.all([
    ClientFeedback.findOne({
      ipAddress,
      userAgent,
      submittedAt: { $gte: tenMinutesAgo },
    })
      .sort({ submittedAt: -1 })
      .lean(),
    ClientFeedback.countDocuments({
      ipAddress,
      userAgent,
      submittedAt: { $gte: startOfDay },
    }),
  ]);

  if (recentSubmission) {
    return { ok: false as const, status: 429, message: 'Please wait a little longer before submitting another response.' };
  }

  if (dailyCount >= DAILY_MAX) {
    return { ok: false as const, status: 429, message: 'You have reached today\'s feedback submission limit.' };
  }

  return { ok: true as const };
}

async function verifyHumanCheck(turnstileToken?: string, recaptchaToken?: string) {
  const token = (turnstileToken || recaptchaToken || '').trim();
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  const secret = turnstileSecret || recaptchaSecret;

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true as const };
    }

    return { ok: false as const, message: 'Human verification is not configured for production.' };
  }

  if (!token) {
    return { ok: false as const, message: 'Please complete the human verification check before submitting.' };
  }

  const endpoint = turnstileSecret
    ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    : 'https://www.google.com/recaptcha/api/siteverify';

  const formData = new URLSearchParams();
  formData.set('secret', secret);
  formData.set('response', token);

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  const data = await response.json().catch(() => null) as { success?: boolean } | null;
  if (!data?.success) {
    return { ok: false as const, message: 'Human verification failed. Please try again.' };
  }

  return { ok: true as const };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const query: Record<string, unknown> = {};

    if (from || to) {
      query.submittedAt = {};
      if (from) (query.submittedAt as { $gte?: Date }).$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) (query.submittedAt as { $lte?: Date }).$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const responses = await ClientFeedback.find(query).sort({ submittedAt: -1 }).lean();
    const mapped = responses.map((response: any) => ({
      responseId: response.responseId,
      ipAddress: response.ipAddress ?? '',
      userAgent: response.userAgent ?? '',
      overallSatisfaction: response.overallSatisfaction,
      nailQuality: response.nailQuality,
      russianManicureQuality: response.russianManicureQuality,
      studioCleanliness: response.studioCleanliness,
      customerService: response.customerService,
      favoritePart: response.favoritePart ?? '',
      improvementSuggestions: response.improvementSuggestions ?? '',
      nailTechId: response.nailTechId ?? '',
      nailTechName: response.nailTechName ?? '',
      testimonialPermission: response.testimonialPermission,
      futureBookingIntent: response.futureBookingIntent,
      averageRating: response.averageRating,
      overallScore: response.overallScore,
      isFlaggedForFollowUp: Boolean(response.isFlaggedForFollowUp),
      submittedAt: response.submittedAt ?? response.createdAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }));

    const totalResponses = mapped.length;
    const averages = {
      overallSatisfaction: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.overallSatisfaction || 0), 0) / totalResponses).toFixed(2)) : 0,
      nailQuality: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.nailQuality || 0), 0) / totalResponses).toFixed(2)) : 0,
      russianManicureQuality: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.russianManicureQuality || 0), 0) / totalResponses).toFixed(2)) : 0,
      studioCleanliness: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.studioCleanliness || 0), 0) / totalResponses).toFixed(2)) : 0,
      customerService: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.customerService || 0), 0) / totalResponses).toFixed(2)) : 0,
    };

    return NextResponse.json({
      responses: mapped,
      stats: {
        totalResponses,
        averageRatings: averages,
        overallSatisfactionScore: averages.overallSatisfaction,
        compositeScore: totalResponses ? Number((mapped.reduce((sum, item) => sum + Number(item.averageRating || 0), 0) / totalResponses).toFixed(2)) : 0,
        testimonialCount: mapped.filter((item) => item.testimonialPermission !== 'no').length,
        flaggedCount: mapped.filter((item) => item.isFlaggedForFollowUp).length,
      },
    });
  } catch (error) {
    console.error('[client-feedback GET]', error);
    return NextResponse.json({ error: 'Failed to load feedback data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const ipAddress = getRequestIp(request);
    const userAgent = getUserAgent(request);
    const rateLimit = await checkRateLimit(ipAddress, userAgent);
    if (!rateLimit.ok) {
      return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    if (data.website?.trim()) {
      return NextResponse.json({ error: 'Submission rejected.' }, { status: 400 });
    }

    const humanCheck = await verifyHumanCheck(data.turnstileToken, data.recaptchaToken);
    if (!humanCheck.ok) {
      console.warn('[client-feedback] verification failed', { ipAddress, userAgent, reason: humanCheck.message });
      return NextResponse.json({ error: humanCheck.message }, { status: 400 });
    }

    const nailTech = await getNailTechById(data.nailTechId);
    if (!nailTech || nailTech.status !== 'Active') {
      return NextResponse.json({ error: 'Please select a valid nail technician.' }, { status: 400 });
    }

    const ratings = [data.overallSatisfaction, data.nailQuality, data.russianManicureQuality, data.studioCleanliness, data.customerService];
    const overallScore = Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2));
    const isFlaggedForFollowUp = ratings.some((value) => value <= 3);
    const responseId = generateResponseId();

    const response = await ClientFeedback.create({
      responseId,
      ipAddress,
      userAgent,
      nailTechId: nailTech.id,
      nailTechName: nailTech.name,
      overallSatisfaction: data.overallSatisfaction,
      nailQuality: data.nailQuality,
      russianManicureQuality: data.russianManicureQuality,
      studioCleanliness: data.studioCleanliness,
      customerService: data.customerService,
      favoritePart: data.favoritePart?.trim() || undefined,
      improvementSuggestions: data.improvementSuggestions?.trim() || undefined,
      testimonialPermission: data.testimonialPermission,
      futureBookingIntent: data.futureBookingIntent,
      averageRating: overallScore,
      overallScore,
      isFlaggedForFollowUp,
      submittedAt: new Date(),
    });

    return NextResponse.json({ responseId: response.responseId, submittedAt: response.submittedAt }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'This submission could not be saved.' }, { status: 409 });
    }
    console.error('[client-feedback POST]', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}