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
    <section id={asPage ? undefined : 'faq'} className="section-padding bg-white">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6"
      >
        {!asPage && <div id="faq" style={{ scrollMarginTop: '180px', height: 0 }} />}
        <HeadingTag className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-acollia text-center mb-3 sm:mb-4 px-2 sm:px-3">Frequently Asked Questions</HeadingTag>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base px-2 sm:px-3">Have questions? We have answers</p>
        <div className="space-y-6 sm:space-y-8">
          {faqSections.map((section, sectionIdx) => {
            const expanded = expandedSections[sectionIdx];
            const itemsToShow = expanded ? section.items : section.items.slice(0, 2);
            return (
              <div key={section.title}>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold border-l-4 border-black pl-2 sm:pl-3 mb-3 sm:mb-4">{section.title}</h3>
                <div className="space-y-3 sm:space-y-4">
                  {itemsToShow.map((faq, itemIdx) => (
                    <motion.div
                      key={faq.question}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(itemIdx * 0.03, 0.2) }}
                      className="border-2 border-black bg-white"
                    >
                      <button
                        onClick={() => toggleFAQ(sectionIdx, itemIdx)}
                        className="w-full px-4 sm:px-5 md:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-sm sm:text-base md:text-lg pr-2">{faq.question}</span>
                        <motion.span
                          animate={{ rotate: openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 180 : 0 }}
                          className="text-xl sm:text-2xl font-bold flex-shrink-0"
                        >
                          +
                        </motion.span>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 'auto' : 0,
                          opacity: openSectionIdx === sectionIdx && openItemIdx === itemIdx ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 text-gray-600 border-t-2 border-black text-sm sm:text-base leading-relaxed">
                          {Array.isArray(faq.answer) ? (
                            <ul className="list-disc list-inside space-y-1 sm:space-y-1.5">
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
                    <div className="flex justify-center mt-2 sm:mt-3">
                      <button
                        className="px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm md:text-base bg-gray-200 text-gray-700 focus:outline-none hover:bg-gray-300 transition-colors"
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

