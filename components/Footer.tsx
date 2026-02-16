'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IoLogoFacebook, IoLogoInstagram } from 'react-icons/io5';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/#services', label: 'Services' },
  { href: '/#about', label: 'About' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/russian-manicure', label: 'Russian Manicure' },
  { href: '/blog', label: 'Blog' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-100 section-padding safe-bottom">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-6 sm:mb-8">
          <div>
            <div className="mb-3 sm:mb-4">
              <Image src="/logo.png" alt="glammednailsbyjhen logo" width={250} height={80} className="h-10 sm:h-12 md:h-14 w-auto" />
            </div>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Premium nail care services for the modern you.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61557672954391"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors rounded"
                aria-label="Facebook"
              >
                <IoLogoFacebook className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com/glammednailsbyjhen"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors rounded"
                aria-label="Instagram"
              >
                <IoLogoInstagram className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-base sm:text-lg md:text-xl mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-600 text-sm sm:text-base">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-base sm:text-lg md:text-xl mb-3 sm:mb-4">Contact Us</h4>
            <div className="text-gray-600 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
              <p>Manila, Philippines</p>
              <p className="mt-3 sm:mt-4">
                <a href="tel:+639451781774" className="hover:text-black transition-colors">
                  +639451781774
                </a>
              </p>
              <p>
                <a href="mailto:glammednailsbyjhen@gmail.com" className="hover:text-black transition-colors break-words">
                  glammednailsbyjhen@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-black pt-6 sm:pt-8 text-center text-gray-600">
          <span className="text-xs sm:text-sm text-gray-600 block mb-2 sm:mb-3">© {new Date().getFullYear()} glammednailsbyjhen</span>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/privacy-policy" className="text-gray-500 hover:text-black text-xs sm:text-sm">Privacy Policy</Link>
            <Link href="/cookies-policy" className="text-gray-500 hover:text-black text-xs sm:text-sm">Cookies Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
