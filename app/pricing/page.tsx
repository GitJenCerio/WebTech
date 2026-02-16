import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Pricing from '@/components/Pricing';
import { getCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pricing | Nail Services & Packages',
  description:
    'Transparent pricing for Russian manicure, pedicure, nail art, and extensions. See our service prices and book your appointment online.',
  keywords: ['nail pricing', 'manicure price', 'pedicure price', 'nail art price'],
  alternates: { canonical: getCanonical('/pricing') },
  openGraph: {
    title: 'Pricing | glammednailsbyjhen',
    description: 'Transparent pricing for nail services. Book online.',
    url: getCanonical('/pricing'),
    type: 'website',
  },
  twitter: { card: 'summary', title: 'Pricing | glammednailsbyjhen', description: 'Transparent pricing for nail services.' },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-[72px] sm:pt-[88px]">
        <Pricing asPage />
      </main>
      <Footer />
    </>
  );
}
