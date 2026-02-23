import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

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
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      reminderHoursBefore: settings.reminderHoursBefore,
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
    await connectDB();

    const update: Record<string, unknown> = {};
    if (typeof body.businessName === 'string') update.businessName = body.businessName;
    if (typeof body.reservationFee === 'number') update.reservationFee = body.reservationFee;
    if (typeof body.emailNotifications === 'boolean') update.emailNotifications = body.emailNotifications;
    if (typeof body.smsNotifications === 'boolean') update.smsNotifications = body.smsNotifications;
    if (typeof body.reminderHoursBefore === 'number') update.reminderHoursBefore = body.reminderHoursBefore;

    const settings = await Settings.findByIdAndUpdate(
      'global',
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      businessName: settings.businessName,
      reservationFee: settings.reservationFee,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      reminderHoursBefore: settings.reminderHoursBefore,
    });
  } catch (error: unknown) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
