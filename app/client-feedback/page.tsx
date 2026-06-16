import type { Metadata } from 'next';
import ClientFeedbackSurvey from '@/components/client-feedback/ClientFeedbackSurvey';

export const metadata: Metadata = {
  title: 'Client Feedback',
  description: 'Private client feedback survey for glammednailsbyjhen.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientFeedbackPage() {
  const siteKey = process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  return <ClientFeedbackSurvey siteKey={siteKey} />;
}