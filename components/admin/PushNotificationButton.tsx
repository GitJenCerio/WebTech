'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      checkSubscriptionStatus();
    }
  }, []);

  async function checkSubscriptionStatus() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // ignore
    }
  }

  async function subscribe() {
    setLoading(true);
    try {
      const keyRes = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      setSubscribed(true);
      toast.success('Push notifications enabled');
    } catch (err) {
      console.error('Push subscribe error:', err);
      toast.error('Could not enable notifications. Check browser permissions.');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      toast.error('Could not disable notifications');
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      title={subscribed ? 'Disable push notifications' : 'Enable push notifications'}
      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
    >
      {subscribed ? (
        <Bell className="h-4 w-4 text-green-600" />
      ) : (
        <BellOff className="h-4 w-4 text-gray-400" />
      )}
      <span className="hidden sm:inline text-gray-600">
        {loading ? 'Loading...' : subscribed ? 'Notifications On' : 'Notifications Off'}
      </span>
    </button>
  );
}
