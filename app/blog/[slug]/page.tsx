import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { blogPosts, getPostBySlug, getAllSlugs } from '@/lib/blog-posts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white pt-[72px] sm:pt-[88px] pb-16 flex items-center justify-center">
          <div className="text-center px-2">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Post not found</h1>
            <Link href="/blog" className="text-black font-medium underline">
              Back to blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[72px] sm:pt-[88px] pb-16">
        <article className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-6">
          <header className="mb-8 sm:mb-10">
            <Link
              href="/blog"
              className="text-sm text-gray-600 hover:text-black font-medium mb-4 inline-block"
            >
              ← Blog
            </Link>
            <time dateTime={post.date} className="text-sm text-gray-500 block">
              {formatDate(post.date)}
            </time>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-acollia font-semibold text-gray-900 mt-1">
              {post.title}
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              {post.description}
            </p>
          </header>

          <div className="relative aspect-video sm:aspect-[2/1] rounded-xl overflow-hidden bg-gray-100 mb-8">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          <div
            className="blog-content text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content.trim() }}
          />

          <footer className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By {post.author}. Ready to book?{' '}
              <Link href="/booking" className="text-black font-medium underline hover:no-underline">
                Book your appointment online
              </Link>
              .
            </p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-sm font-medium text-gray-600 hover:text-black"
            >
              ← All blog posts
            </Link>
          </footer>
        </article>
      </main>
      <Footer />
    </>
  );
}
