import webpush from 'web-push';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/lib/models/PushSubscription';

function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM || 'admin@glammednailsbyjhen.com'}`,
    publicKey,
    privateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: {
    url?: string;
    [key: string]: unknown;
  };
}

/**
 * Send a push notification to all subscriptions for a user
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  initVapid();
  await connectDB();
  const subscriptions = await PushSubscription.find({ userId });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // Subscription is expired or invalid — remove it
        if (
          err instanceof webpush.WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        throw err;
      }
    })
  );

  return results;
}

/**
 * Send a push notification to ALL admin subscriptions (all users)
 */
export async function sendPushToAll(payload: PushPayload) {
  initVapid();
  await connectDB();
  const subscriptions = await PushSubscription.find({});

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        if (
          err instanceof webpush.WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );

  return results;
}
