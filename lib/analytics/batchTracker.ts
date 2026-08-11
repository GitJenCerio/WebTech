/**
 * Client-side analytics event batching to reduce DB writes.
 *
 * Batches events and flushes when:
 * - Queue reaches 10 events, or
 * - 30 seconds have passed
 */

interface AnalyticsEvent {
  [key: string]: unknown;
  createdAt?: string;
}

class AnalyticsBatchTracker {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private isFlushing = false;

  track(event: AnalyticsEvent): void {
    if (!event.createdAt) {
      event.createdAt = new Date().toISOString();
    }

    this.queue.push(event);

    if (this.queue.length >= this.BATCH_SIZE) {
      void this.flush();
      return;
    }

    if (this.queue.length === 1 && !this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        void this.flush();
      }, this.FLUSH_INTERVAL);
    }
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const detail = contentType.includes('application/json')
          ? JSON.stringify(await response.json().catch(() => ({})))
          : `HTTP ${response.status}`;
        console.error('Failed to send analytics batch:', detail);
      }
    } catch (error) {
      console.error('Error sending analytics batch:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  async flushNow(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

export const analyticsBatchTracker = new AnalyticsBatchTracker();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const queue = (analyticsBatchTracker as unknown as { queue: AnalyticsEvent[] }).queue;
    if (queue.length > 0) {
      const payload = new Blob([JSON.stringify({ events: queue })], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics/batch', payload);
      queue.length = 0;
    }
  });
}
