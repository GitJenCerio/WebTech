'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomeAboutPreview() {
  return (
    <section className="section-padding section-ash">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto px-2 sm:px-4 text-center"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-center mb-4 px-3">
          About Us
        </h2>
        <p className="text-[#71717a] mb-6 text-sm sm:text-base leading-relaxed">
          We specialize in beautiful, long-lasting manicures and pedicures that reflect your unique style. 
          From classic styles to intricate nail art, we bring your vision to life.
        </p>
        <Link
          href="/about"
          className="brand-cta"
        >
          Learn more
        </Link>
      </motion.div>
    </section>
  );
}
