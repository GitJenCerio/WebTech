'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const items = [
  {
    refKey: 'service-1',
    title: 'Russian Manicure',
    description: 'E-file cuticle work and long-lasting finish. Clean, precise, and built to last.',
    image: '/images/service-1.jpg',
    href: '/russian-manicure',
  },
  {
    refKey: 'service-5',
    title: 'Russian Pedicure',
    description: 'Same precision for your feet. Gel overlay and optional nail art for toes.',
    image: '/images/service-5.jpg',
    href: '/russian-pedicure',
  },
  {
    refKey: 'service-4',
    title: 'Nail Art & More',
    description: 'Gel overlay, extensions, nail art. We bring your vision to life.',
    image: '/images/service-3-v3.jpg',
    href: '/pricing',
  },
];

export default function HomeServicesPreview() {
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/media?category=service');
        if (!res.ok) return;
        const data = await res.json();
        const media = Array.isArray(data.media) ? data.media : [];
        const map: Record<string, string> = {};
        for (const item of media) {
          if (item.refKey && item.url && !map[item.refKey]) {
            map[item.refKey] = item.url;
          }
        }
        if (!cancelled && Object.keys(map).length > 0) {
          setImageOverrides(map);
        }
      } catch {
        // Keep static images
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section-padding section-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-center mb-4 px-2 text-[#111]">
          Our Services
        </h2>
        <p className="text-center text-[#71717a] mb-8 sm:mb-10 max-w-2xl mx-auto px-2 text-sm sm:text-base">
          Professional nail care tailored to you. Russian manicure, pedicure, nail art, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const imageSrc = imageOverrides[item.refKey] || item.image;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Link href={item.href} className="group block">
                  <div className="relative h-48 sm:h-56 overflow-hidden mb-4 bg-[#f4f4f5]">
                    <Image
                      src={imageSrc}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading mb-1 text-[#111]">{item.title}</h3>
                  <p className="text-[#71717a] text-sm mb-3 leading-relaxed">{item.description}</p>
                  <span className="text-sm font-medium text-[#111] border-b border-[#d4d4d8] group-hover:border-[#111] transition-colors">
                    Learn more
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/booking" className="brand-cta">
            Book Now
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
