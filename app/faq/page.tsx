import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import { getCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FAQ | Frequently Asked Questions',
  description:
    'Frequently asked questions about booking, Russian manicure, payments, aftercare, and studio info. Find answers before your appointment.',
  keywords: ['nail salon FAQ', 'booking FAQ', 'manicure FAQ', 'deposit', 'reschedule'],
  alternates: { canonical: getCanonical('/faq') },
  openGraph: {
    title: 'FAQ | glammednailsbyjhen',
    description: 'Frequently asked questions about booking, services, and studio.',
    url: getCanonical('/faq'),
    type: 'website',
  },
  twitter: { card: 'summary', title: 'FAQ | glammednailsbyjhen', description: 'Frequently asked questions.' },
  robots: { index: true, follow: true },
};

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[72px] sm:pt-[88px]">
        <FAQ asPage />
      </main>
      <Footer />
    </>
  );
}
