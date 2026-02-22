'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { IoMenu, IoClose } from 'react-icons/io5';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#services', label: 'Services' },
  { href: '/#about', label: 'About' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 w-full max-w-full safe-top"
    >
      <nav className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-6 w-full max-w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <IoClose className="w-6 h-6" /> : <IoMenu className="w-6 h-6" />}
        </button>

        <Link href="/" className="hidden lg:flex items-center flex-shrink-0">
          <Image src="/logo.png" alt="glammednailsbyjhen logo" width={200} height={64} className="h-9 xl:h-10 w-auto" priority />
        </Link>

        <div className="hidden lg:flex items-center justify-center flex-1">
          <div className="flex items-center gap-5 xl:gap-6 flex-wrap justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200 whitespace-nowrap tracking-[0.06em]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        >
          <Image src="/logo.png" alt="glammednailsbyjhen logo" width={200} height={56} className="h-9 sm:h-10 w-auto max-w-[45vw]" priority />
        </Link>

        <div className="hidden lg:block flex-shrink-0">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-5 xl:px-6 py-2.5 xl:py-3 text-sm font-semibold text-white bg-black border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300 whitespace-nowrap"
          >
            Book Now
          </Link>
        </div>

        <Link
          href="/booking"
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-black border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300 z-10"
        >
          Book
        </Link>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-lg z-[100]"
          >
            <div className="px-4 py-5 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 px-3 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors tracking-[0.04em]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100">
                <Link
                  href="/booking"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-3.5 text-base font-semibold text-white bg-black border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
