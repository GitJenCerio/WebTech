'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Fallback when no CMS gallery images are published yet
const FALLBACK_GALLERY = Array.from({ length: 41 }, (_, i) => i + 1)
  .filter((n) => n !== 27)
  .map((n) => ({
    src: n <= 9 ? `/images/gallery-${n}.jpg` : `/images/gallery-${n}.JPG`,
    alt: `Gallery image ${n}`,
  }));

type GalleryItem = { src: string; alt: string };

export default function Gallery() {
  const [images, setImages] = useState<GalleryItem[]>(FALLBACK_GALLERY);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/media?category=gallery');
        if (!res.ok) return;
        const data = await res.json();
        const media = Array.isArray(data.media) ? data.media : [];
        if (!cancelled && media.length > 0) {
          setImages(
            media.map((item: { url: string; alt?: string }, index: number) => ({
              src: item.url,
              alt: item.alt || `Gallery image ${index + 1}`,
            }))
          );
        }
      } catch {
        // Keep static fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getTileHeight = (index: number) => {
    const baseHeights = [150, 180, 210, 240, 260, 280, 300, 320];
    const base = baseHeights[(index * 7 + 3) % baseHeights.length];
    const jitter = ((index * 13) % 40) - 20;
    return Math.max(140, base + jitter);
  };

  return (
    <section id="gallery" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-center mb-3 sm:mb-4 px-2 sm:px-3">
          Gallery
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-2 sm:px-3 text-sm sm:text-base">
          Browse our latest work and get inspired
        </p>

        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
          {images.map((item, index) => (
            <motion.div
              key={`${item.src}-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.015, 0.15) }}
              className="mb-4 break-inside-avoid overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer group relative"
              style={{ height: `${getTileHeight(index)}px` }}
              onClick={() => setSelectedImage(item.src)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover rounded-2xl md:rounded-3xl group-hover:opacity-95 transition"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </motion.div>
          ))}
        </div>
      </div>

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
              <Image
                src={selectedImage}
                alt="Gallery image"
                fill
                className="object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
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
