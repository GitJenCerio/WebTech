'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomeAboutPreview() {
  return (
    <section className="section-padding bg-gray-50">
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
        <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
          We specialize in beautiful, long-lasting manicures and pedicures that reflect your unique style. 
          From classic styles to intricate nail art, we bring your vision to life.
        </p>
        <Link
          href="/about"
          className="inline-block px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
        >
          Learn more
        </Link>
      </motion.div>
    </section>
  );
}
