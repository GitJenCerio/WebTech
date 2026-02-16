import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-heading font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black transition-all duration-300"
          >
            Back to home
          </Link>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 bg-white text-gray-900 font-medium hover:border-black transition-all duration-300"
          >
            Book now
          </Link>
        </div>
      </div>
    </main>
  );
}
