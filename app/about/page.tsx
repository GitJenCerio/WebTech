import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Us | glammednailsbyjhen',
  description:
    'Welcome to glammednailsbyjhen. We specialize in beautiful, long-lasting manicures and pedicures that reflect your unique style. Book your appointment today.',
  keywords: ['about nail salon', 'nail studio', 'glammednailsbyjhen'],
  alternates: { canonical: getCanonical('/about') },
  openGraph: {
    title: 'About Us | glammednailsbyjhen',
    description: 'We specialize in beautiful, long-lasting manicures and pedicures.',
    url: getCanonical('/about'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'About Us | glammednailsbyjhen', description: 'We specialize in beautiful, long-lasting manicures and pedicures.' },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen section-ash pt-[72px] sm:pt-[88px] pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] w-full mx-auto lg:mx-0 overflow-hidden">
              <Image
                src="/images/about.jpg"
                alt="About glammednailsbyjhen"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="text-center lg:text-left px-2 sm:px-0">
              <p className="text-xs tracking-[0.2em] uppercase text-[#a1a1aa] mb-3">glammednailsbyjhen</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading mb-4 sm:mb-6 text-[#111]">
                About Us
              </h1>
              <p className="text-[#71717a] mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
                Welcome to glammednailsbyjhen, where your nail dreams become reality.
                We specialize in creating beautiful, long-lasting manicures and pedicures
                that reflect your unique style.
              </p>
              <p className="text-[#71717a] mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
                Our experienced team uses only the highest quality products and the latest
                techniques to ensure your nails look flawless and stay that way. From classic
                styles to intricate nail art, we bring your vision to life.
              </p>
              <p className="text-[#71717a] mb-6 text-sm sm:text-base md:text-lg leading-relaxed">
                Book your appointment today and experience the difference that professional
                nail care can make.
              </p>
              <Link href="/booking" className="brand-cta">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
