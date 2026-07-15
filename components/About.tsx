'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
  return (
    <section id="about" className="section-padding section-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.55 }}
            className="relative h-[320px] sm:h-[400px] md:h-[480px] lg:h-[560px] w-full overflow-hidden"
          >
            <Image
              src="/images/about.jpg"
              alt="About glammednailsbyjhen"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              quality={90}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.55 }}
            className="text-center lg:text-left px-2 sm:px-0"
          >
            <div id="about" style={{ scrollMarginTop: '180px', height: 0 }} />
            <p className="text-xs sm:text-sm tracking-[0.22em] uppercase text-[#b5a99a] mb-3">
              glammednailsbyjhen
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading mb-5 sm:mb-6 text-[#1c1917]">
              About Us
            </h2>
            <div className="brand-rule w-20 mb-5 mx-auto lg:mx-0" aria-hidden />
            <p className="text-[#71717a] mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
              Welcome to glammednailsbyjhen, where your nail dreams become reality.
              We specialize in creating beautiful, long-lasting manicures and pedicures
              that reflect your unique style.
            </p>
            <p className="text-[#71717a] mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
              Our experienced team uses only the highest quality products and the latest
              techniques to ensure your nails look flawless and stay that way. From classic
              styles to intricate nail art, we bring your vision to life.
            </p>
            <p className="text-[#71717a] text-sm sm:text-base md:text-lg leading-relaxed">
              Book your appointment today and experience the difference that professional
              nail care can make.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
