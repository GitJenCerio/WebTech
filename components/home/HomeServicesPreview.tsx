'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const items = [
  {
    title: 'Russian Manicure',
    description: 'E-file cuticle work and long-lasting finish. Clean, precise, and built to last.',
    image: '/images/service-1.jpg',
    href: '/russian-manicure',
  },
  {
    title: 'Russian Pedicure',
    description: 'Same precision for your feet. Gel overlay and optional nail art for toes.',
    image: '/images/service-5.jpg',
    href: '/russian-pedicure',
  },
  {
    title: 'Nail Art & More',
    description: 'Gel overlay, extensions, nail art. We bring your vision to life.',
    image: '/images/service-3.jpg',
    href: '/pricing',
  },
];

export default function HomeServicesPreview() {
  return (
    <section className="section-padding bg-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-acollia text-center mb-4 px-2">
          Our Services
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-2 text-sm sm:text-base">
          Professional nail care tailored to you. Russian manicure, pedicure, nail art, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link href={item.href} className="group block">
                <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden mb-3 bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-heading font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <span className="text-sm font-medium text-black group-hover:underline">
                  Learn more →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/booking"
            className="inline-block px-6 py-3 bg-black text-white font-semibold border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] transition-all duration-300"
          >
            Book Now
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
