import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Slot from '@/lib/models/Slot';
import Customer from '@/lib/models/Customer';
import NotificationLog, { NotificationType } from '@/lib/models/NotificationLog';
import { sendPaymentReminderEmail, sendPaymentUrgentEmail, sendAppointmentReminderEmail } from '@/lib/email';

const CRON_WINDOW_MINUTES = 20;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaDateTimeToUtc(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  if (!year || !month || !day) return null;
  const utcMs = Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0);
  return new Date(utcMs - MANILA_OFFSET_MS);
}

function isWithinWindow(target: Date, now: Date): boolean {
  const diff = Math.abs(target.getTime() - now.getTime());
  return diff <= CRON_WINDOW_MINUTES * 60 * 1000;
}

async function alreadySent(bookingId: string, type: NotificationType): Promise<boolean> {
  const exists = await NotificationLog.findOne({ bookingId, type }).lean();
  return Boolean(exists);
}

async function markSent(bookingId: string, type: NotificationType, scheduledFor: Date): Promise<void> {
  await NotificationLog.create({
    bookingId,
    type,
    scheduledFor,
    sentAt: new Date(),
  });
}

export async function runNotificationSweep(): Promise<{ sent: number }> {
  await connectDB();
  const now = new Date();
  let sent = 0;

  const bookings = await Booking.find({
    status: { $in: ['pending', 'confirmed'] },
  }).lean();

  const slotIds = Array.from(new Set(bookings.flatMap((b: any) => (b.slotIds || []).map(String))));
  const slots = slotIds.length
    ? await Slot.find({ _id: { $in: slotIds } }).select('_id date time').lean()
    : [];
  const slotById = new Map(slots.map((s: any) => [String(s._id), s]));

  for (const booking of bookings) {
    const customer = await Customer.findById(booking.customerId).lean();
    if (!customer?.email) continue;

    const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
    const unpaid = booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partial';

    if (createdAt && unpaid) {
      const schedule: Array<{ type: NotificationType; hours: number; label: string }> = [
        { type: 'payment_6h', hours: 6, label: 'Payment Reminder' },
        { type: 'payment_12h', hours: 12, label: 'Payment Urgent Reminder' },
        { type: 'payment_23h', hours: 23, label: 'Final Payment Warning' },
        { type: 'payment_24h_cancel', hours: 24, label: 'Cancellation Notice' },
      ];

      for (const item of schedule) {
        const target = new Date(createdAt.getTime() + item.hours * 60 * 60 * 1000);
        if (!isWithinWindow(target, now)) continue;
        if (await alreadySent(String(booking._id), item.type)) continue;
        if (item.type === 'payment_6h') {
          await sendPaymentReminderEmail(booking, customer);
        } else {
          await sendPaymentUrgentEmail(booking, customer, item.label);
        }
        await markSent(String(booking._id), item.type, target);
        sent += 1;
      }
    }

    const firstSlotId = (booking.slotIds || [])[0];
    const slot = firstSlotId ? slotById.get(String(firstSlotId)) : null;
    const apptUtc = slot ? manilaDateTimeToUtc(slot.date, slot.time) : null;
    if (apptUtc) {
      const apptSchedule: Array<{ type: NotificationType; hoursBefore: number; label: string }> = [
        { type: 'appt_24h', hoursBefore: 24, label: 'Appointment Reminder' },
        { type: 'appt_2h', hoursBefore: 2, label: 'Final Appointment Reminder' },
      ];
      for (const item of apptSchedule) {
        const target = new Date(apptUtc.getTime() - item.hoursBefore * 60 * 60 * 1000);
        if (!isWithinWindow(target, now)) continue;
        if (await alreadySent(String(booking._id), item.type)) continue;
        await sendAppointmentReminderEmail(booking, customer, item.label);
        await markSent(String(booking._id), item.type, target);
        sent += 1;
      }
    }
  }

  return { sent };
}
