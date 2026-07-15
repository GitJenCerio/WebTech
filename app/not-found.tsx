import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 section-ash">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-heading text-[#111] mb-2">Page not found</h1>
        <p className="text-[#71717a] mb-8">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="brand-cta">
            Back to home
          </Link>
          <Link href="/booking" className="brand-cta-outline">
            Book now
          </Link>
        </div>
      </div>
    </main>
  );
}
