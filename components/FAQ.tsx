'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { faqSections } from '@/lib/faq-data';

type FAQProps = { asPage?: boolean };

export default function FAQ({ asPage }: FAQProps) {
  const [openSectionIdx, setOpenSectionIdx] = useState<number | null>(null);
  const [openItemIdx, setOpenItemIdx] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const HeadingTag = asPage ? 'h1' : 'h2';

  const toggleFAQ = (sectionIdx: number, itemIdx: number) => {
    if (openSectionIdx === sectionIdx && openItemIdx === itemIdx) {
      setOpenSectionIdx(null);
      setOpenItemIdx(null);
    } else {
      setOpenSectionIdx(sectionIdx);
      setOpenItemIdx(itemIdx);
    }
  };

  const toggleSection = (sectionIdx: number) => {
    setExpandedSections((prev) => ({ ...prev, [sectionIdx]: !prev[sectionIdx] }));
  };

  return (
    <section id={asPage ? undefined : 'faq'} className="section-padding section-ash">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6"
      >
        {!asPage && <div id="faq" style={{ scrollMarginTop: '180px', height: 0 }} />}
        <HeadingTag className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-center mb-3 sm:mb-4 px-2 sm:px-3 text-[#1c1917]">
          Frequently Asked Questions
        </HeadingTag>
        <div className="brand-rule w-24 mx-auto mb-4" aria-hidden />
        <p className="text-center text-[#78716c] mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base px-2 sm:px-3">
          Have questions? We have answers
        </p>
        <div className="space-y-8 sm:space-y-10">
          {faqSections.map((section, sectionIdx) => {
            const expanded = expandedSections[sectionIdx];
            const itemsToShow = expanded ? section.items : section.items.slice(0, 2);
            return (
              <div key={section.title}>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-heading text-[#111] border-l border-[#a1a1aa] pl-3 mb-4">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {itemsToShow.map((faq, itemIdx) => (
                    <motion.div
                      key={faq.question}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(itemIdx * 0.03, 0.2) }}
                      className="border border-[#e4e4e7] bg-white"
                    >
                      <button
                        onClick={() => toggleFAQ(sectionIdx, itemIdx)}
                        className="w-full px-4 sm:px-5 md:px-6 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-[#fafafa] transition-colors"
                      >
                        <span className="font-medium text-sm sm:text-base pr-3 text-[#111]">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{
                            rotate:
                              openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 45 : 0,
                          }}
                          className="text-xl text-[#a1a1aa] flex-shrink-0"
                        >
                          +
                        </motion.span>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height:
                            openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 'auto' : 0,
                          opacity:
                            openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 text-[#71717a] border-t border-[#e4e4e7] text-sm sm:text-base leading-relaxed">
                          {Array.isArray(faq.answer) ? (
                            <ul className="list-disc list-inside space-y-1.5">
                              {faq.answer.map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <span>{faq.answer}</span>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}

                  {section.items.length > 2 && (
                    <div className="flex justify-center mt-3">
                      <button
                        className="brand-cta-outline px-5 py-2 text-xs sm:text-sm"
                        onClick={() => toggleSection(sectionIdx)}
                        type="button"
                      >
                        {expanded ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
