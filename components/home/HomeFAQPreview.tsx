'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { faqSections } from '@/lib/faq-data';

const previewCount = 3;
const firstSection = faqSections[0];
const previewItems = firstSection ? firstSection.items.slice(0, previewCount) : [];

export default function HomeFAQPreview() {
  return (
    <section className="section-padding bg-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto px-2 sm:px-4"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-acollia text-center mb-4 px-3">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
          Quick answers. Have more? See our full FAQ.
        </p>
        <ul className="space-y-4 mb-8">
          {previewItems.map((faq) => (
            <li key={faq.question} className="border-b border-gray-200 pb-4 last:border-0">
              <h3 className="font-heading font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                {faq.question}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {Array.isArray(faq.answer) ? faq.answer[0] : faq.answer}
              </p>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Link
            href="/faq"
            className="inline-block px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
          >
            View all FAQ
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
