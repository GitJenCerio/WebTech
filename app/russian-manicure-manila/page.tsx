import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com';

export const metadata: Metadata = {
  title: 'Russian Manicure in Manila | E-File Manicure & Cuticle Care',
  description:
    'Russian manicure in Manila: before/after, process, and pricing. Safe e-file cuticle work that lasts longer. Ideal for professionals. Book your appointment online.',
  keywords: [
    'Russian manicure Manila',
    'Russian manicure in Manila',
    'e-file manicure Manila',
    'Russian manicure before after',
    'Russian manicure safe',
    'Russian manicure price Manila',
  ],
  alternates: {
    canonical: `${siteUrl}/russian-manicure-manila`,
  },
  openGraph: {
    title: 'Russian Manicure in Manila | glammednailsbyjhen',
    description:
      'Russian manicure in Manila: before/after, process, pricing. Safe, long-lasting e-file cuticle work. Book online.',
    url: `${siteUrl}/russian-manicure-manila`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const processSteps = [
  {
    step: 1,
    title: 'Assessment & prep',
    text: 'We check your nail and cuticle condition and sanitize the area. Nails are filed to the shape you want.',
  },
  {
    step: 2,
    title: 'E-file cuticle work',
    text: 'A precision e-file (electric file) with sterile bits is used to gently remove dead cuticle and clean the nail fold. No nippers—just controlled, hygienic refinement.',
  },
  {
    step: 3,
    title: 'Buffing & finishing',
    text: 'The nail surface is buffed for a smooth base. Then we apply your chosen finish: natural shine, gel overlay, or nail art.',
  },
];

const faqs = [
  {
    q: 'Is Russian manicure safe?',
    a: 'Yes. When done by a trained technician with proper sterilization and the right bits, Russian manicure is safe. We use single-use or properly sterilized bits and follow strict hygiene. It should never hurt; if you feel discomfort, tell your nail tech so they can adjust pressure or technique.',
  },
  {
    q: 'Does it damage nails?',
    a: 'No. Russian manicure does not thin or damage the nail plate when performed correctly. The e-file is used on cuticle and dead skin, not to grind down healthy nail. Proper technique actually supports healthier regrowth and fewer hangnails. Over-filing or inexperienced techs can cause damage—that’s why choosing a specialist matters.',
  },
  {
    q: 'How long does it last?',
    a: 'Results typically last 3–4 weeks. Because the cuticle area is cleaned so thoroughly, polish and gel adhere better and grow out more neatly. Many clients need fewer touch-ups and can stretch the time between appointments compared to a traditional manicure.',
  },
];

export default function RussianManicureManilaPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[70px] sm:pt-[80px] md:pt-[90px] pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* H1 & intro */}
          <header className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-gray-900 mb-4">
              Russian Manicure in Manila
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Premium e-file manicure and cuticle care in Metro Manila. See the difference—before, after, and every step in between.
            </p>
          </header>

          {/* Before & after */}
          <section className="mb-12 sm:mb-16" aria-labelledby="before-after-heading">
            <h2 id="before-after-heading" className="text-2xl sm:text-3xl font-heading font-normal text-gray-900 mb-6 text-center">
              Before & After
            </h2>
            <p className="text-gray-600 text-sm sm:text-base text-center mb-8 max-w-xl mx-auto">
              Real results from our Manila studio. Clean cuticles, smooth nail beds, and a finish that lasts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/service-1.jpg"
                  alt="Before Russian manicure - cuticle and nail condition"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                  Before
                </span>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/service-2.jpg"
                  alt="After Russian manicure - clean cuticles and polished nails"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                  After
                </span>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="mb-12 sm:mb-16" aria-labelledby="process-heading">
            <h2 id="process-heading" className="text-2xl sm:text-3xl font-heading font-normal text-gray-900 mb-6 text-center">
              The Russian Manicure Process
            </h2>
            <p className="text-gray-600 text-sm sm:text-base text-center mb-8 max-w-2xl mx-auto">
              We use an e-file and precise bits to clean and refine the cuticle area—no harsh cutting, no guesswork. Here’s what to expect.
            </p>
            <ul className="space-y-6">
              {processSteps.map((item) => (
                <li key={item.step} className="flex gap-4 sm:gap-6">
                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black text-white flex items-center justify-center text-sm sm:text-base font-semibold">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-heading font-normal text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Price range */}
          <section className="mb-12 sm:mb-16" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="text-2xl sm:text-3xl font-heading font-normal text-gray-900 mb-6 text-center">
              Price Range
            </h2>
            <p className="text-gray-600 text-sm sm:text-base text-center mb-4 max-w-xl mx-auto">
              Russian manicure services in Manila start from a base that reflects the time and skill involved. Add-ons (gel overlay, nail art, etc.) are priced separately.
            </p>
            <p className="text-center text-gray-700 font-medium">
              Base Russian manicure: from ₱1,500* — Deposit ₱500 to secure your slot.
            </p>
            <p className="text-center text-gray-500 text-sm mt-2">
              *Final price depends on finish and add-ons. Confirm at booking.
            </p>
            <div className="text-center mt-6">
              <Link
                href="/booking"
                className="inline-block px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
              >
                Book your appointment
              </Link>
            </div>
          </section>

          {/* Who it's for */}
          <section className="mb-12 sm:mb-16" aria-labelledby="ideal-heading">
            <h2 id="ideal-heading" className="text-2xl sm:text-3xl font-heading font-normal text-gray-900 mb-6 text-center">
              Who It’s Ideal For
            </h2>
            <ul className="max-w-2xl mx-auto space-y-3 text-gray-600 text-sm sm:text-base">
              <li className="flex gap-2">
                <span className="text-black font-medium">•</span>
                Working professionals who want a low-maintenance, long-lasting look
              </li>
              <li className="flex gap-2">
                <span className="text-black font-medium">•</span>
                Anyone who’s had lifting or chipping with traditional manicures
              </li>
              <li className="flex gap-2">
                <span className="text-black font-medium">•</span>
                People who prefer a clean, natural nail bed with or without polish
              </li>
              <li className="flex gap-2">
                <span className="text-black font-medium">•</span>
                Clients who value precision and hygiene in nail care
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12 sm:mb-16" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-2xl sm:text-3xl font-heading font-normal text-gray-900 mb-8 text-center">
              Russian Manicure FAQ
            </h2>
            <ul className="space-y-8">
              {faqs.map((faq) => (
                <li key={faq.q}>
                  <h3 className="font-heading font-normal text-gray-900 mb-2 text-lg">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{faq.a}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-700 font-medium mb-4">
              Ready for a Russian manicure in Manila?
            </p>
            <Link
              href="/booking"
              className="inline-block px-8 py-3.5 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
            >
              Book now
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
