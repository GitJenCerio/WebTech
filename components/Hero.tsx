'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section id="home" className="relative h-[calc(72px+28vh)] sm:h-[60vh] md:h-[70vh] lg:h-screen flex items-center justify-center overflow-hidden pt-[72px] sm:pt-[80px] md:pt-[90px] pb-8 sm:pb-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-1.JPG"
          alt="Hero background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </div>

      {/* Frame Effect - Black Border Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-[72vw] sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full mx-auto px-1 sm:px-4"
      >
        <div className="border-2 md:border-[6px] border-white shadow-[0_0_0_2px_#000000] md:shadow-[0_0_0_6px_#000000] bg-white/60 backdrop-blur-sm px-3 py-2.5 sm:p-6 md:px-10 md:py-8 lg:px-12 lg:py-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="hidden sm:flex justify-center mb-2 sm:mb-3"
          >
            <Image
              src="/logo.png"
              alt="glammednailsbyjhen logo"
              width={800}
              height={150}
              className="w-full h-auto max-w-[140px] sm:max-w-[320px] md:max-w-[420px] drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
              priority
            />
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="text-sm sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-balgor font-normal text-center text-black mb-1 sm:mb-2 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          >
            Russian Manicure Specialist
            <br />
            in Metro Manila
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="text-[10px] sm:text-base md:text-lg text-center text-black mb-4 sm:mb-8 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          >
            Precision dry technique. Clean cuticles. Long-lasting results.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex justify-center pt-1"
          >
            <a
              href="/booking"
              className="px-2.5 py-1.5 text-[10px] sm:px-6 sm:py-3 sm:text-base bg-black text-white font-semibold border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300 whitespace-nowrap"
            >
              Book Now
            </a>
          </motion.div>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-[9px] sm:text-xs md:text-sm text-center text-black/90 mt-2 sm:mt-3 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          >
            Private Home Studio • By Appointment Only
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-black rounded-full flex justify-center bg-white/80 backdrop-blur-sm"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-black rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

