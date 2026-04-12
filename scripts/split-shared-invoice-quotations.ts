/**
 * One-time fix: multiple Booking documents sometimes pointed at the same Quotation _id
 * (e.g. old Mani + Pedi Express data). Editing one invoice overwrote the shared document.
 *
 * This script clones the quotation for every booking after the first in each duplicate group
 * so each booking has its own quotation row (same line items / totals as the source).
 *
 * Usage:
 *   npx tsx scripts/split-shared-invoice-quotations.ts --dry-run
 *   npx tsx scripts/split-shared-invoice-quotations.ts
 *   npx tsx scripts/split-shared-invoice-quotations.ts --booking-code=GN-20260312002
 */

import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../lib/mongodb';
import Booking from '../lib/models/Booking';
import Quotation from '../lib/models/Quotation';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type DupGroup = { _id: string; bookingIds: string[]; codes: string[] };

async function findDuplicateGroups(filterCode?: string): Promise<DupGroup[]> {
  const rows = await Booking.aggregate<{
    _id: string;
    bookingIds: unknown[];
    codes: string[];
  }>([
    {
      $match: {
        'invoice.quotationId': { $exists: true, $nin: [null, ''] },
      },
    },
    {
      $group: {
        _id: '$invoice.quotationId',
        bookingIds: { $push: '$_id' },
        codes: { $push: '$bookingCode' },
      },
    },
    { $match: { $expr: { $gt: [{ $size: '$bookingIds' }, 1] } } },
  ]);

  const groups: DupGroup[] = [];
  for (const r of rows) {
    const bookingIds = r.bookingIds.map((id) => String(id));
    const codes = r.codes.map((c) => (c == null ? '' : String(c)));
    if (filterCode && !codes.includes(filterCode)) continue;
    groups.push({ _id: String(r._id), bookingIds, codes });
  }
  return groups;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const codeArg = process.argv.find((a) => a.startsWith('--booking-code='));
  const filterCode = codeArg ? codeArg.split('=')[1]?.trim() : undefined;

  console.log('Connecting to MongoDB...');
  await connectDB();

  const groups = await findDuplicateGroups(filterCode);
  if (groups.length === 0) {
    console.log(filterCode ? `No duplicate quotation groups involving ${filterCode}.` : 'No duplicate quotation groups found.');
    process.exit(0);
  }

  let cloned = 0;
  for (const g of groups) {
    const pairs = g.bookingIds
      .map((id, i) => ({ id, code: g.codes[i] || '' }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const [keep, ...forks] = pairs;
    const sourceQ = await findQuotationByRef(g._id);
    if (!sourceQ) {
      console.warn(`Skip group ${g._id}: quotation not found`);
      continue;
    }

    console.log(
      `\nQuotation ref ${g._id}: ${pairs.length} bookings — keep ${keep.code || keep.id}, fork ${forks.length} other(s)`
    );

    for (const f of forks) {
      const booking = await Booking.findById(f.id);
      if (!booking) {
        console.warn(`  Missing booking ${f.id}`);
        continue;
      }

      if (dryRun) {
        console.log(`  [dry-run] Would clone quotation for ${booking.bookingCode || booking.id}`);
        cloned++;
        continue;
      }

      const newQ = await cloneQuotationFrom(sourceQ, booking.bookingCode);
      booking.invoice = {
        ...booking.invoice,
        quotationId: newQ._id.toString(),
        total: booking.invoice?.total,
        nailTechId: booking.invoice?.nailTechId,
        createdAt: booking.invoice?.createdAt || new Date(),
      };
      await booking.save();
      console.log(`  Cloned -> ${newQ._id} for ${booking.bookingCode}`);
      cloned++;
    }
  }

  console.log(dryRun ? `\nDry run: would clone ${cloned} quotation(s).` : `\nDone. Cloned ${cloned} quotation(s).`);
  process.exit(0);
}

async function findQuotationByRef(ref: string): Promise<InstanceType<typeof Quotation> | null> {
  const t = ref.trim();
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(t);
  if (isObjectId) {
    let doc = await Quotation.findById(t);
    if (!doc) doc = await Quotation.findOne({ firebaseId: t });
    return doc;
  }
  return Quotation.findOne({ firebaseId: t });
}

async function cloneQuotationFrom(
  source: InstanceType<typeof Quotation>,
  bookingCode?: string
): Promise<InstanceType<typeof Quotation>> {
  const plain = source.toObject();
  delete (plain as { _id?: unknown })._id;
  delete (plain as { __v?: unknown }).__v;
  delete (plain as { createdAt?: unknown }).createdAt;
  delete (plain as { updatedAt?: unknown }).updatedAt;
  const notes =
    (typeof plain.notes === 'string' && plain.notes.trim()) ||
    (bookingCode ? `Booking: ${bookingCode}` : undefined);
  return Quotation.create({ ...plain, notes });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
