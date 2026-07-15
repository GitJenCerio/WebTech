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
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#fffcfa]/95 backdrop-blur-xl border-b border-[#e7e2db] shadow-[0_4px_24px_rgba(28,25,23,0.06)] w-full max-w-full safe-top"
    >
      <nav className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-6 w-full max-w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-[#78716c] hover:text-[#1c1917] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c4b5a0]"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <IoClose className="w-6 h-6" /> : <IoMenu className="w-6 h-6" />}
        </button>

        <Link href="/" className="hidden lg:flex items-center flex-shrink-0">
          <Image
            src="/logo.png"
            alt="glammednailsbyjhen"
            width={200}
            height={64}
            className="h-9 xl:h-10 w-auto"
            priority
          />
        </Link>

        <div className="hidden lg:flex items-center justify-center flex-1">
          <div className="flex items-center gap-6 xl:gap-8 flex-wrap justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] font-medium text-[#78716c] hover:text-[#1c1917] transition-colors duration-200 whitespace-nowrap tracking-[0.16em] uppercase relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-[#c4b5a0] hover:after:w-full after:transition-all after:duration-300"
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
          <Image
            src="/logo.png"
            alt="glammednailsbyjhen"
            width={200}
            height={56}
            className="h-9 sm:h-10 w-auto max-w-[45vw]"
            priority
          />
        </Link>

        <div className="hidden lg:block flex-shrink-0">
          <Link href="/booking" className="brand-cta-sm">
            Book Now
          </Link>
        </div>

        <Link href="/booking" className="lg:hidden brand-cta-sm min-h-[44px] z-10">
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
            className="lg:hidden absolute left-0 right-0 top-full bg-[#fffcfa] border-t border-[#e7e2db] shadow-[0_12px_40px_rgba(28,25,23,0.08)] z-[100]"
          >
            <div className="px-4 py-5 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 px-3 text-sm font-medium tracking-[0.14em] uppercase text-[#57534e] hover:text-[#1c1917] hover:bg-[#f0ebe4] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-[#e7e2db]">
                <Link href="/booking" onClick={() => setIsOpen(false)} className="brand-cta w-full">
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
