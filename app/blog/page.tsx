import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { blogPosts } from '@/lib/blog-posts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com';

export const metadata: Metadata = {
  title: 'Blog | Nail Care & Russian Manicure Tips',
  description:
    'Nail care tips, Russian manicure guides, and expert advice. Learn how to keep nails healthy, how long manicures last, and book your appointment online.',
  keywords: [
    'nail care blog',
    'Russian manicure blog',
    'nail tips',
    'manicure guide Philippines',
  ],
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Blog | Nail Care & Russian Manicure Tips | glammednailsbyjhen',
    description: 'Nail care tips, Russian manicure guides, and expert advice.',
    url: `${siteUrl}/blog`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Header />
      <main className="min-h-screen section-ash pt-[72px] sm:pt-[88px] pb-16">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
          <header className="text-center py-10 sm:py-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-[#111] mb-4">
              Blog
            </h1>
            <p className="text-[#71717a] text-base sm:text-lg max-w-2xl mx-auto">
              Nail care tips, Russian manicure guides, and advice for our clients.
            </p>
          </header>

          <ul className="space-y-8 sm:space-y-10">
            {sortedPosts.map((post) => (
              <li key={post.slug}>
                <article className="group">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-video sm:aspect-[2/1] overflow-hidden bg-[#f4f4f5] mb-4">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 896px"
                      />
                    </div>
                    <time
                      dateTime={post.date}
                      className="text-sm text-[#a1a1aa]"
                    >
                      {formatDate(post.date)}
                    </time>
                    <h2 className="text-xl sm:text-2xl font-heading text-[#111] mt-1 group-hover:opacity-80 transition-opacity">
                      {post.title}
                    </h2>
                    <p className="text-[#71717a] text-sm sm:text-base mt-2 line-clamp-2">
                      {post.description}
                    </p>
                    <span className="inline-block mt-3 text-sm font-medium text-[#111] border-b border-[#d4d4d8] group-hover:border-[#111] transition-colors">
                      Read more
                    </span>
                  </Link>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="text-[#71717a] hover:text-black text-sm font-medium transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
