import type { Metadata } from 'next';
import FeedbackAnalytics from '@/components/admin/FeedbackAnalytics';

export const metadata: Metadata = {
  title: 'Feedback Analytics',
  description: 'Private client feedback analytics for glammednailsbyjhen.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminFeedbackPage() {
  return <FeedbackAnalytics />;
}