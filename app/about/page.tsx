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
      <main className="min-h-screen bg-gray-50 pt-[72px] sm:pt-[88px] pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] w-full mx-auto lg:mx-0 overflow-hidden rounded-lg">
              <Image
                src="/images/about.jpg"
                alt="About glammednailsbyjhen"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="text-center lg:text-left px-2 sm:px-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-acollia mb-4 sm:mb-6">
                About Us
              </h1>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg text-justify leading-relaxed">
                Welcome to glammednailsbyjhen, where your nail dreams become reality.
                We specialize in creating beautiful, long-lasting manicures and pedicures
                that reflect your unique style.
              </p>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg text-justify leading-relaxed">
                Our experienced team uses only the highest quality products and the latest
                techniques to ensure your nails look flawless and stay that way. From classic
                styles to intricate nail art, we bring your vision to life.
              </p>
              <p className="text-gray-600 mb-6 text-sm sm:text-base md:text-lg text-justify leading-relaxed">
                Book your appointment today and experience the difference that professional
                nail care can make.
              </p>
              <Link
                href="/booking"
                className="inline-block px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
              >
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
