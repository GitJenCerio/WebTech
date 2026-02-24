import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

const patchSettingsSchema = z.object({
  businessName: z.string().max(200).optional(),
  reservationFee: z.number().min(0).optional(),
  adminCommissionRate: z.number().min(0).max(100).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  reminderHoursBefore: z.number().min(0).max(168).optional(),
  googleSheetsId: z.string().max(500).optional(),
  googleSheetsEnabled: z.boolean().optional(),
}).strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    let settings = await Settings.findById('global').lean();

    if (!settings) {
      const defaultSettings = await Settings.create({
        _id: 'global',
        businessName: 'Glammed Nails by Jhen',
        reservationFee: 500,
        emailNotifications: true,
        smsNotifications: false,
        reminderHoursBefore: 24,
      });
      settings = defaultSettings.toObject();
    }

    return NextResponse.json({
      businessName: settings.businessName,
      reservationFee: settings.reservationFee,
      adminCommissionRate: (settings as { adminCommissionRate?: number }).adminCommissionRate ?? 10,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      reminderHoursBefore: settings.reminderHoursBefore,
      googleSheetsId: (settings as { googleSheetsId?: string }).googleSheetsId ?? '',
      googleSheetsEnabled: (settings as { googleSheetsEnabled?: boolean }).googleSheetsEnabled ?? false,
    });
  } catch (error: unknown) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await connectDB();

    const update: Record<string, unknown> = {};
    const data = parsed.data;
    if (data.businessName !== undefined) update.businessName = data.businessName;
    if (data.reservationFee !== undefined) update.reservationFee = data.reservationFee;
    if (data.adminCommissionRate !== undefined) update.adminCommissionRate = data.adminCommissionRate;
    if (data.emailNotifications !== undefined) update.emailNotifications = data.emailNotifications;
    if (data.smsNotifications !== undefined) update.smsNotifications = data.smsNotifications;
    if (data.reminderHoursBefore !== undefined) update.reminderHoursBefore = data.reminderHoursBefore;
    if (data.googleSheetsId !== undefined) update.googleSheetsId = data.googleSheetsId;
    if (data.googleSheetsEnabled !== undefined) update.googleSheetsEnabled = data.googleSheetsEnabled;

    const settings = await Settings.findByIdAndUpdate(
      'global',
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      businessName: settings.businessName,
      reservationFee: settings.reservationFee,
      adminCommissionRate: (settings as { adminCommissionRate?: number }).adminCommissionRate ?? 10,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      reminderHoursBefore: settings.reminderHoursBefore,
      googleSheetsId: (settings as { googleSheetsId?: string }).googleSheetsId ?? '',
      googleSheetsEnabled: (settings as { googleSheetsEnabled?: boolean }).googleSheetsEnabled ?? false,
    });
  } catch (error: unknown) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
