import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Russian Pedicure | E-File Pedicure & Gel Toe Care',
  description:
    'Russian-style pedicure with precise cuticle care and long-lasting gel overlay. Smooth, glossy toes. Book your pedicure appointment online.',
  keywords: ['Russian pedicure', 'e-file pedicure', 'gel pedicure', 'toe nail care'],
  alternates: { canonical: getCanonical('/russian-pedicure') },
  openGraph: {
    title: 'Russian Pedicure | glammednailsbyjhen',
    description: 'Russian-style pedicure with precise cuticle care and gel overlay. Book online.',
    url: getCanonical('/russian-pedicure'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Russian Pedicure | glammednailsbyjhen', description: 'Russian-style pedicure. Book online.' },
  robots: { index: true, follow: true },
};

const processSteps = [
  { step: 1, title: 'Soak & prep', text: 'Your feet are soaked and cleaned. We assess nail and cuticle condition and trim or file as needed.' },
  { step: 2, title: 'E-file cuticle work', text: 'Same precision as our Russian manicure: we use an e-file to gently clean and refine the cuticle and nail fold for a crisp, long-lasting result.' },
  { step: 3, title: 'Buffing & finish', text: 'Nails are buffed smooth. Then we apply your chosen finish—natural shine, gel polish, or optional nail art for toes.' },
];

export default function RussianPedicurePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[72px] sm:pt-[88px] pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
          <header className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-acollia text-gray-900 mb-4">
              Russian Pedicure
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Indulge in a Russian-style pedicure with precise cuticle care and a long-lasting gel overlay for smooth, glossy toes.
            </p>
          </header>

          <section className="mb-12 sm:mb-16">
            <div className="relative aspect-video sm:aspect-[2/1] rounded-xl overflow-hidden bg-gray-100">
              <Image src="/images/service-5.jpg" alt="Russian pedicure - gel toe overlay" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
            </div>
          </section>

          <section className="mb-12 sm:mb-16" aria-labelledby="process-heading">
            <h2 id="process-heading" className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900 mb-6 text-center">The Russian Pedicure Process</h2>
            <p className="text-gray-600 text-sm sm:text-base text-center mb-8 max-w-2xl mx-auto">
              We bring the same e-file precision and cleanliness you get with our Russian manicure to your feet.
            </p>
            <ul className="space-y-6">
              {processSteps.map((item) => (
                <li key={item.step} className="flex gap-4 sm:gap-6">
                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black text-white flex items-center justify-center text-sm sm:text-base font-semibold">{item.step}</span>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12 sm:mb-16" aria-labelledby="ideal-heading">
            <h2 id="ideal-heading" className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900 mb-6 text-center">Who It’s Ideal For</h2>
            <ul className="max-w-2xl mx-auto space-y-3 text-gray-600 text-sm sm:text-base">
              <li className="flex gap-2"><span className="text-black font-medium">•</span> Anyone who wants clean, well-groomed toes that last</li>
              <li className="flex gap-2"><span className="text-black font-medium">•</span> Clients who prefer gel on toes for durability and shine</li>
              <li className="flex gap-2"><span className="text-black font-medium">•</span> People who book mani + pedi together for a full session</li>
            </ul>
          </section>

          <section className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-700 font-medium mb-4">Ready to book your pedicure?</p>
            <Link href="/booking" className="inline-block px-8 py-3.5 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300">
              Book now
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
