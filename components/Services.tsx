'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    refKey: 'service-1',
    title: 'Russian Manicure (Cleaning Only)',
    price: 'PHP 1,000',
    description:
      'A meticulous, machine-based cleaning that deeply removes dead skin and refines the cuticle area for a polished, healthy nail appearance. Perfect for those who prefer natural nails without polish. This service enhances nail health, promotes cleaner regrowth, and leaves nails looking neat and naturally glossy.',
    image: '/images/service-1.jpg',
  },
  {
    refKey: 'service-2',
    title: 'BIAB/Gel/Hardgel Overlay',
    titleLine2: '(No Extensions)',
    price: 'Starts at PHP 1,300',
    description:
      'Achieve the perfect balance between natural and refined. This manicure includes complete Russian-style cleaning, cuticle detailing, and a flawless gel or BIAB overlay for long-lasting shine and strength — no extensions needed. It enhances the nail\'s natural shape and keeps them looking elegant for weeks.',
    image: '/images/service-2.jpg',
  },
  {
    refKey: 'service-3',
    title: 'BIAB/Gel/Hardgel Overlay',
    titleLine2: '(With Extensions)',
    price: 'Starts at PHP 1,800',
    description:
      'Instantly elevate your look with expertly sculpted extensions using premium-quality soft gel, hard gel, or polygel. Each set is custom-shaped and finished to complement your natural nail bed. Perfect for those who want added length, durability, and style with a natural feel..',
    image: '/images/service-4.jpg',
  },
  {
    refKey: 'service-4',
    title: 'Nail Art',
    price: 'Starts at PHP 2,000',
    description:
      'Turn your nails into mini masterpieces. Choose from a wide range of creative designs — from minimalist details to intricate 3D art, chrome, ombre, or hand-painted styles. Each look is carefully done to match your personality and enhance your overall aesthetic.',
    image: '/images/service-3-v3.jpg',
  },
  {
    refKey: 'service-5',
    title: 'Russian Pedicure with Gel Overlay',
    price: 'Starts at PHP 1,500',
    description:
      'Indulge in a Russian-style pedicure with precise cuticle care and a long-lasting gel overlay for smooth, glossy toes. This service not only beautifies your nails but also maintains foot hygiene. Optional custom shades and nail art are available for a personalized finish.',
    image: '/images/service-5.jpg',
  },
  {
    refKey: 'service-6',
    title: 'Mani + Pedi Express',
    price: 'Additional PHP 300',
    description:
      'Get your manicure and pedicure done at the same time with two nail techs for a faster appointment flow. Perfect for clients who want the complete Mani + Pedi experience in less time. This express option has an additional PHP 300 fee on top of your service total.',
    image: '/images/service-8.jpg',
  },
  {
    refKey: 'service-7',
    title: 'Nail Repair',
    price: 'Price varies',
    description:
      'Restore your nails to perfection. Whether it’s a chipped, cracked, or broken nail, this service carefully rebuilds and strengthens it to blend seamlessly with your natural or extended nails. Ideal for maintaining the longevity and beauty of your set.',
    image: '/images/service-6.jpg',
  },
];

export default function Services() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
    <section id="services" className="section-padding section-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-0"
      >
        <div id="services" style={{ scrollMarginTop: '180px', height: 0 }} />
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center mb-3 sm:mb-4 font-heading text-[#1c1917] px-2 sm:px-3">
          Our Services
        </h2>
        <div className="brand-rule w-24 mx-auto mb-4 sm:mb-5" aria-hidden />
        <p className="text-center text-[#78716c] mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-2 sm:px-3 text-sm sm:text-base">
          Professional nail care services tailored to your needs
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 px-2 sm:px-4">
          {services.map((service, index) => {
            const imageSrc = imageOverrides[service.refKey] || service.image;
            return (
            <motion.div
              key={`${service.title}-${service.titleLine2 ?? 'default'}`}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
              className="group cursor-pointer"
            >
              <div
                className="relative h-64 sm:h-72 md:h-80 lg:h-96 mb-4 overflow-hidden"
                onClick={() => setSelectedImage(imageSrc)}
              >
                <Image
                  src={imageSrc}
                  alt={service.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>
              <div className="mb-2 flex flex-col gap-1">
                <h3 className="text-xl sm:text-2xl font-heading leading-tight text-[#111]">
                  {service.title}
                  {service.titleLine2 && <span className="block text-[#71717a]">{service.titleLine2}</span>}
                </h3>
                <p className="text-sm sm:text-base tracking-wide text-[#a1a1aa]">{service.price}</p>
              </div>
              <p className="text-[#71717a] text-sm md:text-base leading-relaxed">{service.description}</p>
              {index === 0 && (
                <Link
                  href="/russian-manicure"
                  className="inline-block mt-3 text-sm font-medium text-[#111] border-b border-[#d4d4d8] hover:border-[#111] transition-colors"
                >
                  Russian manicure in Manila — learn more
                </Link>
              )}
            </motion.div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-5xl w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={selectedImage} alt="Service image" fill className="object-contain" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white text-4xl font-light hover:text-[#d4d4d8]"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

