/**
 * Migrates legacy Mani + Pedi Express bookings (one Booking doc with
 * service.mode === 'simultaneous_two_techs', two slotIds, secondaryNailTechId)
 * into the new model: two Booking docs sharing expressGroupId.
 *
 * The existing document becomes the manicure row (keeps the same _id and bookingCode).
 * A new document is inserted for the pedicure tech with a new booking code.
 *
 * Run after DB backup. Idempotent: skips rows that already have expressGroupId.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-express-bookings.ts --dry-run
 *   npx tsx scripts/migrate-legacy-express-bookings.ts
 *   npx tsx scripts/migrate-legacy-express-bookings.ts --booking-code=GN-20260312002
 */

import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../lib/mongodb';
import Booking from '../lib/models/Booking';
import BookingCounter from '../lib/models/BookingCounter';
import Slot from '../lib/models/Slot';
import { recomputeCustomerStats } from '../lib/services/bookingService';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getManilaDateKey(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return formatted.replace(/-/g, '');
}

async function generateBookingCode(): Promise<string> {
  const dateKey = getManilaDateKey();
  const counter = await BookingCounter.findOneAndUpdate(
    { dateKey },
    { $inc: { seq: 1 }, $setOnInsert: { dateKey } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const sequence = counter?.seq ?? 1;
  return `GN-${dateKey}${String(sequence).padStart(3, '0')}`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const codeArg = process.argv.find((a) => a.startsWith('--booking-code='));
  const filterCode = codeArg ? codeArg.split('=')[1]?.trim() : undefined;

  console.log(dryRun ? 'DRY RUN — no writes' : 'LIVE migration');
  await connectDB();

  const filter: Record<string, unknown> = {
    expressGroupId: { $in: [null, undefined] },
    'service.mode': 'simultaneous_two_techs',
    'service.secondaryNailTechId': { $exists: true, $nin: [null, ''] },
    slotIds: { $size: 2 },
  };
  if (filterCode) {
    filter.bookingCode = filterCode;
  }

  const legacyList = await Booking.find(filter).sort({ createdAt: 1 });

  if (legacyList.length === 0) {
    console.log(
      filterCode
        ? `No legacy simultaneous express booking found for code ${filterCode}.`
        : 'No legacy simultaneous express bookings to migrate.'
    );
    process.exit(0);
  }

  let migrated = 0;
  let skipped = 0;

  for (const legacy of legacyList) {
    const sid = legacy.service?.secondaryNailTechId;
    if (!sid || legacy.slotIds?.length !== 2) {
      console.warn(`Skip ${legacy.bookingCode}: missing secondary tech or slot count`);
      skipped++;
      continue;
    }

    const priTech = String(legacy.nailTechId);
    const secTech = String(sid);
    const slots = await Slot.find({ _id: { $in: legacy.slotIds } });
    if (slots.length !== 2) {
      console.warn(`Skip ${legacy.bookingCode}: expected 2 slots, found ${slots.length}`);
      skipped++;
      continue;
    }

    const slotPrimary = slots.find((s) => String(s.nailTechId) === priTech);
    const slotSecondary = slots.find((s) => String(s.nailTechId) === secTech);
    if (!slotPrimary || !slotSecondary) {
      console.warn(
        `Skip ${legacy.bookingCode}: slots do not match nail techs (primary=${priTech}, secondary=${secTech})`
      );
      skipped++;
      continue;
    }

    const total = Number(legacy.pricing?.total ?? 0);
    const deposit = Number(legacy.pricing?.depositRequired ?? 0);
    const half1 = Math.floor(total / 2);
    const half2 = total - half1;
    const paid = Number(legacy.pricing?.paidAmount ?? 0);
    const tip = Number(legacy.pricing?.tipAmount ?? 0);
    const discountAmount = legacy.pricing?.discountAmount;

    let manicureInvoice = legacy.invoice
      ? { ...legacy.invoice, nailTechId: legacy.invoice.nailTechId ?? priTech }
      : undefined;
    let pedicureInvoice = legacy.secondaryInvoice
      ? { ...legacy.secondaryInvoice, nailTechId: legacy.secondaryInvoice.nailTechId ?? secTech }
      : undefined;

    const invNt = manicureInvoice?.nailTechId ? String(manicureInvoice.nailTechId) : '';
    if (manicureInvoice && !legacy.secondaryInvoice && invNt === secTech) {
      pedicureInvoice = manicureInvoice;
      manicureInvoice = undefined;
    }

    const expressGroupId = randomUUID();

    if (dryRun) {
      console.log(
        `[dry-run] ${legacy.bookingCode} → manicure (same code) + new pedicure row | group=${expressGroupId}`
      );
      migrated++;
      continue;
    }

    const newPedicureCode = await generateBookingCode();

    legacy.set({
      slotIds: [String(slotPrimary._id)],
      expressGroupId,
      service: {
        type: 'Mani + Pedi Express',
        location: legacy.service.location,
        clientType: legacy.service.clientType,
        chosenServices: legacy.service.chosenServices,
        address: legacy.service.address,
        expressSegment: 'manicure',
      },
      pricing: {
        total: half1,
        depositRequired: deposit,
        paidAmount: paid,
        tipAmount: tip,
        ...(typeof discountAmount === 'number' ? { discountAmount } : {}),
      },
      invoice: manicureInvoice ?? undefined,
      secondaryInvoice: undefined,
    });
    await legacy.save();

    const pedicure = new Booking({
      bookingCode: newPedicureCode,
      customerId: legacy.customerId,
      nailTechId: secTech,
      slotIds: [String(slotSecondary._id)],
      service: {
        type: 'Mani + Pedi Express',
        location: legacy.service.location,
        clientType: legacy.service.clientType,
        chosenServices: legacy.service.chosenServices,
        address: legacy.service.address,
        expressSegment: 'pedicure',
      },
      expressGroupId,
      status: legacy.status,
      paymentStatus: legacy.paymentStatus,
      clientNotes: legacy.clientNotes,
      adminNotes: legacy.adminNotes,
      pricing: {
        total: half2,
        depositRequired: 0,
        paidAmount: 0,
        tipAmount: 0,
        discountAmount: 0,
      },
      payment: legacy.payment ? { ...legacy.payment } : {},
      completedAt: legacy.completedAt ?? null,
      confirmedAt: legacy.confirmedAt ?? null,
      invoice: pedicureInvoice ?? undefined,
      secondaryInvoice: undefined,
      clientPhotos: legacy.clientPhotos,
      clientPhotoUploadUrl: legacy.clientPhotoUploadUrl,
      clientPhotoUploadExpiresAt: legacy.clientPhotoUploadExpiresAt ?? null,
      statusReason: legacy.statusReason,
    });
    await pedicure.save();

    await recomputeCustomerStats(String(legacy.customerId));
    console.log(`Migrated ${legacy.bookingCode} + ${newPedicureCode} (group ${expressGroupId})`);
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}, skipped: ${skipped}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
