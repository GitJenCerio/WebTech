'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const points = [
  {
    title: 'What makes Russian manicure different',
    body: 'Unlike traditional manicures that rely on cutting and pushing cuticles, the Russian technique uses a precision e-file to gently remove dead skin and refine the cuticle area. No nippers, no harsh scraping—just controlled, hygienic work that leaves the nail bed clean and the cuticle line crisp. It’s the gold standard in professional nail care.',
  },
  {
    title: 'Why it lasts longer',
    body: 'Because the cuticle and sidewalls are cleaned so thoroughly, polish and gel adhere better and grow out more neatly. You get fewer chips, less lifting, and a cleaner regrowth line. Many clients see 3–4 weeks of wear instead of 1–2, so you spend less time in the chair and more time with perfect nails.',
  },
  {
    title: 'Why precision cuticle work matters',
    body: 'Healthy cuticles mean healthier nails: less hangnails, fewer infections, and a smoother surface for any finish you choose. Russian manicure focuses on exact, detailed work around the cuticle area—so your nails look polished and professional from every angle, not just from the top.',
  },
  {
    title: 'Ideal for working professionals',
    body: 'If you need a low-maintenance, long-lasting look that stays neat between appointments, Russian manicure is built for you. One session gives you a clean, polished result that holds up through back-to-back meetings, travel, and busy schedules—without constant touch-ups.',
  },
];

export default function RussianManicureSection() {
  return (
    <section id="russian-manicure" className="section-padding section-ash">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div id="russian-manicure" style={{ scrollMarginTop: '180px', height: 0 }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-center mb-3 sm:mb-4 px-2 sm:px-3 text-[#1c1917]">
            Russian Manicure Specialist in Metro Manila
          </h2>
          <div className="brand-rule w-28 mx-auto mb-4 sm:mb-5" aria-hidden />
          <p className="text-center text-[#78716c] max-w-3xl mx-auto px-2 sm:px-3 text-sm sm:text-base md:text-lg">
            Not all manicures are the same. Here’s why clients from Quezon City, Makati, Pasig, Taguig, Manila and across Metro Manila choose Russian manicure for a cleaner, longer-lasting result.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl mx-auto border-t border-[#e4e4e7]">
          {points.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.24) }}
              className="px-4 sm:px-6 py-8 sm:py-10 border-b border-[#e4e4e7] md:odd:border-r"
            >
              <h3 className="text-xl sm:text-2xl font-heading text-[#111] mb-3">
                {item.title}
              </h3>
              <p className="text-[#71717a] text-sm sm:text-base leading-relaxed">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-12"
        >
          <Link href="/russian-manicure" className="brand-cta">
            Learn more & see before/after
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
