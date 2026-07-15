'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const FALLBACK_HERO = '/images/hero-1.JPG';

export default function Hero() {
  const [heroSrc, setHeroSrc] = useState(FALLBACK_HERO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/media?category=hero');
        if (!res.ok) return;
        const data = await res.json();
        const media = Array.isArray(data.media) ? data.media : [];
        const preferred =
          media.find((m: { refKey?: string }) => m.refKey === 'hero') || media[0];
        if (!cancelled && preferred?.url) setHeroSrc(preferred.url);
      } catch {
        // Keep static hero
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="home"
      className="relative h-[min(68vh,520px)] sm:h-[min(78vh,680px)] md:h-[min(85vh,820px)] lg:min-h-screen lg:h-auto flex items-end sm:items-center overflow-hidden pt-[4.5rem] sm:pt-24"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={heroSrc}
          alt="glammednailsbyjhen studio"
          fill
          className="object-cover object-[center_35%] sm:object-center"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        {/* Soft pearl haze + ink depth for luxury legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/80 via-[#1c1917]/35 to-[#1c1917]/10 sm:bg-gradient-to-r sm:from-[#1c1917]/75 sm:via-[#1c1917]/40 sm:to-[#1c1917]/10"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light bg-[radial-gradient(ellipse_at_30%_20%,rgba(196,181,160,0.35),transparent_55%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-8 sm:pb-16 lg:pb-24 pt-4 sm:pt-8">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 sm:mb-7"
          >
            <Image
              src="/logo.png"
              alt="glammednailsbyjhen"
              width={520}
              height={120}
              className="w-full h-auto max-w-[180px] sm:max-w-[300px] md:max-w-[380px] brightness-0 invert drop-shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="origin-left h-px w-16 sm:w-24 mb-4 sm:mb-5 bg-gradient-to-r from-[#c4b5a0] to-transparent"
            aria-hidden
          />

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-[1.65rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-[3.25rem] text-[#fffcfa] mb-3 sm:mb-5"
          >
            Russian Manicure Specialist in Metro Manila
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#e7e2db]/90 text-sm sm:text-lg max-w-md mb-5 sm:mb-9 leading-relaxed"
          >
            Precision dry technique. Clean cuticles. Long-lasting results.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-5"
          >
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-7 py-3 text-xs sm:text-sm font-medium tracking-[0.16em] uppercase text-[#1c1917] bg-[#fffcfa] border border-[#c4b5a0]/60 hover:bg-transparent hover:text-[#fffcfa] hover:border-[#c4b5a0] transition-all duration-300 shadow-[0_8px_28px_rgba(0,0,0,0.25)]"
            >
              Book Now
            </Link>
            <p className="text-[#c4b5a0]/90 text-[11px] sm:text-sm tracking-[0.12em] uppercase">
              Private Home Studio · By Appointment Only
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 hidden md:block"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border border-[#c4b5a0]/50 flex justify-center pt-1.5"
        >
          <div className="w-px h-2.5 bg-[#c4b5a0]/80" />
        </motion.div>
      </motion.div>
    </section>
  );
}
