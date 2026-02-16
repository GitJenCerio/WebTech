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
    <section id="russian-manicure" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div id="russian-manicure" style={{ scrollMarginTop: '180px', height: 0 }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-acollia text-center mb-4 sm:mb-5 px-2 sm:px-3">
            Russian Manicure Specialist in Metro Manila
          </h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto px-2 sm:px-3 text-sm sm:text-base md:text-lg">
            Not all manicures are the same. Here’s why clients from Quezon City, Makati, Pasig, Taguig, Manila and across Metro Manila choose Russian manicure for a cleaner, longer-lasting result.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 max-w-5xl mx-auto">
          {points.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.24) }}
              className="px-2 sm:px-0"
            >
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
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
          <Link
            href="/russian-manicure"
            className="inline-block px-6 py-3 sm:px-8 sm:py-3.5 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300 text-sm sm:text-base"
          >
            Learn more & see before/after
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
