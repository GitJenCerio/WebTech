'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { faqSections } from '@/lib/faq-data';

const previewCount = 3;
const firstSection = faqSections[0];
const previewItems = firstSection ? firstSection.items.slice(0, previewCount) : [];

export default function HomeFAQPreview() {
  return (
    <section className="section-padding section-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto px-2 sm:px-4"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-center mb-4 px-3">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-[#71717a] mb-8 text-sm sm:text-base">
          Quick answers. Have more? See our full FAQ.
        </p>
        <ul className="space-y-4 mb-8">
          {previewItems.map((faq) => (
            <li key={faq.question} className="border-b border-gray-200 pb-4 last:border-0">
              <h3 className="font-heading font-normal text-[#111] mb-1 text-sm sm:text-base">
                {faq.question}
              </h3>
              <p className="text-[#71717a] text-sm leading-relaxed">
                {Array.isArray(faq.answer) ? faq.answer[0] : faq.answer}
              </p>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Link
            href="/faq"
            className="brand-cta"
          >
            View all FAQ
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
