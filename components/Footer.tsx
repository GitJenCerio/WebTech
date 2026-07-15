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
    <footer className="section-padding safe-bottom border-t border-[#e7e2db] bg-[linear-gradient(180deg,#fffcfa_0%,#f0ebe4_100%)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="brand-rule mb-10 sm:mb-12" aria-hidden />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12 mb-10">
          <div>
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="glammednailsbyjhen"
                width={250}
                height={80}
                className="h-10 sm:h-12 w-auto"
              />
            </div>
            <p className="text-[#78716c] mb-5 text-sm sm:text-base leading-relaxed max-w-xs">
              Premium nail care for the modern you. Precision Russian technique in Metro Manila.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61557672954391"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#c4b5a0]/70 text-[#1c1917] hover:bg-[#1c1917] hover:text-[#fffcfa] hover:border-[#1c1917] transition-colors"
                aria-label="Facebook"
              >
                <IoLogoFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/glammednailsbyjhen"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#c4b5a0]/70 text-[#1c1917] hover:bg-[#1c1917] hover:text-[#fffcfa] hover:border-[#1c1917] transition-colors"
                aria-label="Instagram"
              >
                <IoLogoInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-xl sm:text-2xl mb-4 text-[#1c1917]">Quick Links</h4>
            <ul className="space-y-2 text-[#78716c] text-sm sm:text-base">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#1c1917] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xl sm:text-2xl mb-4 text-[#1c1917]">Contact</h4>
            <div className="text-[#78716c] space-y-2 text-sm sm:text-base">
              <p>Manila, Philippines</p>
              <p className="mt-3">
                <a href="tel:+639451781774" className="hover:text-[#1c1917] transition-colors">
                  +639451781774
                </a>
              </p>
              <p>
                <a
                  href="mailto:glammednailsbyjhen@gmail.com"
                  className="hover:text-[#1c1917] transition-colors break-words"
                >
                  glammednailsbyjhen@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e7e2db] pt-6 sm:pt-8 text-center text-[#a8a29e]">
          <span className="text-xs sm:text-sm block mb-3 tracking-wide">
            © {new Date().getFullYear()} glammednailsbyjhen
          </span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy-policy" className="text-xs sm:text-sm hover:text-[#1c1917] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies-policy" className="text-xs sm:text-sm hover:text-[#1c1917] transition-colors">
              Cookies Policy
            </Link>
            <Link href="/studio-policies" className="text-xs sm:text-sm hover:text-[#1c1917] transition-colors">
              Studio Policies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
