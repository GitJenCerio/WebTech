'use client';

import { lazy, Suspense, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

const Services = lazy(() => import('@/components/Services'));
const RussianManicureSection = lazy(() => import('@/components/RussianManicureSection'));
const About = lazy(() => import('@/components/About'));
const Gallery = lazy(() => import('@/components/Gallery'));
const Pricing = lazy(() => import('@/components/Pricing'));
const FAQ = lazy(() => import('@/components/FAQ'));
const Footer = lazy(() => import('@/components/Footer'));

const LoadingPlaceholder = () => (
  <div className="section-padding bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
    </div>
  </div>
);

const HEADER_OFFSET = 88;

export default function Home() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (!hash || !hash.startsWith('#')) return;
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    scrollToHash();
    const t = setTimeout(scrollToHash, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <section className="bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
          <p className="text-sm sm:text-base text-amber-900">
            Price update: Starting April 2026, there is a +300 PHP increase for main services. Prices shown on this site are already updated.
          </p>
        </div>
      </section>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Services />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <RussianManicureSection />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <About />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Gallery />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Pricing />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </main>
  );
}
