'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePricingPreview() {
  return (
    <section className="section-padding bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto px-2 sm:px-4 text-center"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-acollia text-center mb-4 px-3">
          Pricing
        </h2>
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Transparent pricing for all our services. Base Russian manicure from ₱1,500. Deposit ₱500 to secure your slot.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
        >
          View full pricing
        </Link>
      </motion.div>
    </section>
  );
}
