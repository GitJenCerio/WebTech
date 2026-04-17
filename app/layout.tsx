import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/StructuredData";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com';
const siteName = 'glammednailsbyjhen';
const defaultTitle = `Russian Manicure & Pedicure in Manila | ${siteName}`;
const defaultDescription = 'Russian manicure in Manila: premium e-file manicure, pedicure, nail art & extensions. Book your appointment online. Metro Manila nail studio.';
const ogVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'v1';
const ogImageUrl = `/opengraph-image?v=${ogVersion}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'Russian manicure in Manila',
    'Russian manicure Manila',
    'Russian pedicure Manila',
    'Russian manicure Philippines',
    'e-file manicure Manila',
    'nail salon Manila',
    'manicure Manila',
    'pedicure Manila',
    'nail art Manila',
    'nail extensions Manila',
    'gel nails Manila',
    'nail studio Metro Manila',
  ],
  authors: [{ name: 'glammednailsbyjhen' }],
  creator: 'glammednailsbyjhen',
  publisher: 'glammednailsbyjhen',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Russian manicure & pedicure in Manila | glammednailsbyjhen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    creator: '@glammednailsbyjhen', // Update with your actual Twitter handle if you have one
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you set up Google Search Console
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Beauty Services',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
  viewportFit: 'cover', // Enables safe-area-inset on notched devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <StructuredData />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('Service worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${jost.variable} ${cormorant.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

