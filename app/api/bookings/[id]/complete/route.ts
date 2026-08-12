import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Customer from '@/lib/models/Customer';
import NailTech from '@/lib/models/NailTech';
import Settings from '@/lib/models/Settings';
import Slot from '@/lib/models/Slot';
import { uploadImage } from '@/lib/cloudinary';
import {
  getBookingById,
  getBookingByCode,
  markBookingAsCompleted,
  updateBookingPayment,
} from '@/lib/services/bookingService';
import { backupBooking } from '@/lib/services/googleSheetsBackup';
import { syncBookingToSheet, syncFinanceToSheet } from '@/lib/services/googleSheetsService';
import { sendPushToAll } from '@/lib/services/pushNotificationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Allow multi-photo uploads (Vercel hobby still caps ~4.5MB total request). */
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_NAIL_PHOTOS = 5;
const PAYMENT_METHODS = ['PNB', 'CASH', 'GCASH'] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number' &&
    (value as File).size > 0
  );
}

function guessMimeFromName(name: string | undefined): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return null;
}

function assertImageFile(file: File, label: string) {
  const mime =
    (file.type && file.type !== 'application/octet-stream' ? file.type : null) ||
    guessMimeFromName(file.name) ||
    '';
  if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
    throw new Error(`${label} must be JPEG, PNG, WebP, or HEIC`);
  }
  if (!mime) {
    console.warn(`[complete] ${label} missing MIME type; proceeding with upload`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`${label} must be 10MB or smaller`);
  }
}

function paymentToPlain(payment: unknown): Record<string, unknown> {
  if (!payment) return {};
  if (typeof (payment as { toObject?: () => Record<string, unknown> }).toObject === 'function') {
    return (payment as { toObject: () => Record<string, unknown> }).toObject();
  }
  return { ...(payment as Record<string, unknown>) };
}

/**
 * POST /api/bookings/[id]/complete
 * Mark a confirmed booking complete with payment method, optional receipt, and nail photos.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const assignedNailTechId = session.user.assignedNailTechId;

    await connectDB();
    const existing = (await getBookingById(id)) || (await getBookingByCode(id));
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (assignedNailTechId && String(existing.nailTechId) !== assignedNailTechId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (existing.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Can only complete confirmed bookings (current status: ${existing.status})` },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error('[complete] formData parse failed:', err);
      return NextResponse.json(
        { error: 'Could not read upload. Try smaller images (under 4MB total) or fewer photos.' },
        { status: 400 }
      );
    }

    const paymentMethodRaw = formData.get('paymentMethod');
    if (!isPaymentMethod(paymentMethodRaw)) {
      return NextResponse.json(
        { error: 'Payment method is required (PNB, GCash, or Cash)' },
        { status: 400 }
      );
    }
    const paymentMethod = paymentMethodRaw;

    const paidAmount = Number(formData.get('paidAmount'));
    const tipAmount = Number(formData.get('tipAmount') ?? 0);
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json({ error: 'Invalid paid amount' }, { status: 400 });
    }
    if (!Number.isFinite(tipAmount) || tipAmount < 0) {
      return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 });
    }

    const receiptEntry = formData.get('receipt');
    const receiptFile = isUploadFile(receiptEntry) ? receiptEntry : null;
    if (paymentMethod !== 'CASH') {
      if (!receiptFile) {
        return NextResponse.json(
          { error: 'Receipt photo is required for PNB and GCash payments' },
          { status: 400 }
        );
      }
      assertImageFile(receiptFile, 'Receipt');
    }

    const nailEntries = formData.getAll('nails');
    const nailFiles = nailEntries.filter(isUploadFile);
    if (nailFiles.length < 1) {
      return NextResponse.json(
        { error: 'At least one finished nail photo is required' },
        { status: 400 }
      );
    }
    if (nailFiles.length > MAX_NAIL_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_NAIL_PHOTOS} nail photos allowed` },
        { status: 400 }
      );
    }
    for (let i = 0; i < nailFiles.length; i++) {
      assertImageFile(nailFiles[i], `Nail photo ${i + 1}`);
    }

    const bookingId = existing._id.toString();

    let completionReceiptUrl: string | undefined;
    let completionReceiptPublicId: string | undefined;
    if (receiptFile) {
      try {
        const buffer = Buffer.from(await receiptFile.arrayBuffer());
        const uploaded = (await uploadImage(
          buffer,
          `completion_receipts/${bookingId}`,
          `receipt_${Date.now()}`
        )) as { secure_url?: string; public_id?: string };
        completionReceiptUrl = uploaded.secure_url;
        completionReceiptPublicId = uploaded.public_id;
      } catch (err) {
        console.error('[complete] receipt upload failed:', err);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return NextResponse.json({ error: `Receipt upload failed: ${msg}` }, { status: 500 });
      }
      if (!completionReceiptUrl) {
        return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 });
      }
    }

    const afterServicePhotos: Array<{ url: string; publicId: string; uploadedAt: Date }> = [];
    for (let i = 0; i < nailFiles.length; i++) {
      try {
        const buffer = Buffer.from(await nailFiles[i].arrayBuffer());
        const uploaded = (await uploadImage(
          buffer,
          `nail_completed/${bookingId}`,
          `after_${Date.now()}_${i}`
        )) as { secure_url?: string; public_id?: string };
        if (!uploaded.secure_url || !uploaded.public_id) {
          return NextResponse.json({ error: 'Failed to upload nail photo' }, { status: 500 });
        }
        afterServicePhotos.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          uploadedAt: new Date(),
        });
      } catch (err) {
        console.error('[complete] nail upload failed:', err);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return NextResponse.json({ error: `Nail photo upload failed: ${msg}` }, { status: 500 });
      }
    }

    await updateBookingPayment(bookingId, paidAmount, tipAmount, paymentMethod, {
      allowCompletedBooking: true,
    });

    const bookingDoc = await Booking.findById(bookingId);
    if (!bookingDoc) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const nextPayment = {
      ...paymentToPlain(bookingDoc.payment),
      method: paymentMethod,
      completionMethod: paymentMethod,
      ...(completionReceiptUrl
        ? {
            completionReceiptUrl,
            completionReceiptPublicId,
          }
        : {}),
    };
    bookingDoc.set('payment', nextPayment);

    if (!bookingDoc.clientPhotos) {
      bookingDoc.set('clientPhotos', { inspiration: [], currentState: [], afterService: [] });
    }
    const existingAfter = bookingDoc.clientPhotos?.afterService || [];
    bookingDoc.set('clientPhotos.afterService', [...existingAfter, ...afterServicePhotos]);
    bookingDoc.markModified('clientPhotos');
    bookingDoc.markModified('payment');
    await bookingDoc.save();

    // Keep express pair payment/photos in sync when completing one side
    if (bookingDoc.expressGroupId) {
      await Booking.updateMany(
        { expressGroupId: bookingDoc.expressGroupId, _id: { $ne: bookingDoc._id } },
        {
          $set: {
            'payment.method': paymentMethod,
            'payment.completionMethod': paymentMethod,
            ...(completionReceiptUrl
              ? {
                  'payment.completionReceiptUrl': completionReceiptUrl,
                  'payment.completionReceiptPublicId': completionReceiptPublicId,
                }
              : {}),
            'clientPhotos.afterService': [...existingAfter, ...afterServicePhotos],
          },
        }
      );
    }

    const booking = await markBookingAsCompleted(bookingId);

    if (booking.confirmedAt) {
      backupBooking(booking, 'update').catch((err) =>
        console.error('Failed to backup booking update to Google Sheets:', err)
      );
    }

    (async () => {
      try {
        const [latest, settings] = await Promise.all([
          getBookingById(bookingId) || getBookingByCode(bookingId),
          Settings.findById('global').lean(),
        ]);
        if (!latest) return;
        const b = latest as any;
        const [cust, tech, slotList] = await Promise.all([
          Customer.findById(b.customerId).lean(),
          NailTech.findById(b.nailTechId).lean(),
          Slot.find({ _id: { $in: b.slotIds || [] } })
            .sort({ date: 1, time: 1 })
            .lean(),
        ]);
        const customerName = (cust as { name?: string })?.name ?? 'Unknown';
        const socialMediaName = (cust as { socialMediaName?: string })?.socialMediaName ?? '';
        const nailTechName = (tech as { name?: string })?.name
          ? `Ms. ${(tech as { name: string }).name}`
          : '';
        const slots = (slotList as { date?: string; time?: string }[]) ?? [];
        const appointmentDate = slots[0]?.date ?? '';
        const appointmentTimes = slots.map((s) => s.time).filter(Boolean) as string[];
        const commissionRate = (settings as { adminCommissionRate?: number })?.adminCommissionRate ?? 10;
        await syncBookingToSheet(b, customerName, socialMediaName, nailTechName, appointmentDate, appointmentTimes);
        await syncFinanceToSheet(
          b,
          customerName,
          socialMediaName,
          nailTechName,
          appointmentDate,
          appointmentTimes,
          commissionRate
        );
      } catch (err) {
        console.error('[Sheets] sync failed:', err);
      }
    })();

    sendPushToAll({
      title: '🎉 Booking Completed',
      body: `${booking.bookingCode} has been marked as completed.`,
      tag: 'booking-completed',
      data: { url: '/admin/bookings' },
    }).catch((err) => console.error('[Push] completed:', err));

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        status: booking.status,
        completedAt: booking.completedAt?.toISOString() || null,
        payment: booking.payment,
        clientPhotos: booking.clientPhotos,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete booking';
    console.error('Error completing booking:', error);
    const status = /only complete confirmed|already completed|required|invalid/i.test(message)
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
