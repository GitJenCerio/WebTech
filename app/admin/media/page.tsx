import type { Metadata } from 'next';
import MediaManager from '@/components/admin/MediaManager';

export const metadata: Metadata = {
  title: 'Website Media',
  description: 'Upload and manage gallery, service, and marketing photos.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminMediaPage() {
  return <MediaManager />;
}
