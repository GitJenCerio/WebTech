import { Metadata } from 'next';
import Link from 'next/link';
import { getCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Studio Policies & Booking Policies',
  description:
    'Read glammednailsbyjhen studio policies for booking deposits, cancellation, late arrivals, no-shows, warranty, home service, and surcharges.',
  keywords: [
    'studio policies',
    'booking policies',
    'deposit policy',
    'cancellation policy',
    'late arrival policy',
    'nail salon Manila policy',
  ],
  alternates: { canonical: getCanonical('/studio-policies') },
  openGraph: {
    title: 'Studio Policies & Booking Policies | glammednailsbyjhen',
    description:
      'Official glammednailsbyjhen policies for bookings, deposits, rescheduling, late arrivals, home service, and warranty.',
    url: getCanonical('/studio-policies'),
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function StudioPoliciesPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 sm:py-16 px-2 sm:px-4">
      <Link href="/" className="inline-block text-sm text-gray-600 hover:text-black underline mb-5">
        ← Back to Home
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Studio Policies & Booking Policies</h1>
      <p className="text-gray-600 mb-8">glammednailsbyjhen</p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Booking & Deposit Rules</h2>
      <p className="mb-4">
        All appointments must be secured with a <strong>PHP 500 non-refundable deposit per slot</strong> upon booking.
        Your slot is not confirmed until the deposit has been received and acknowledged.
      </p>
      <p className="mb-4">
        Deposits can be sent via GCash or bank transfer. Please send your proof of payment to our Facebook or
        Instagram page, or through our booking website at{' '}
        <a href="https://www.glammednailsbyjhen.com" className="underline">
          glammednailsbyjhen.com
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cancellation & Rescheduling</h2>
      <p className="mb-4">We understand that life happens. To keep our schedule fair for all clients, we follow these guidelines:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Rescheduling is allowed at least 3 days before your appointment.</li>
        <li>A PHP 200 rescheduling fee applies. Your deposit will be carried over to your new slot.</li>
        <li>Cancellations made less than 48 hours before the appointment will forfeit the deposit.</li>
        <li>Same-day cancellations are not eligible for deposit transfer or refund.</li>
        <li>To reschedule, please message us on Facebook or Instagram as early as possible.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Late Arrival Policy</h2>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>A PHP 200 late fee applies to clients who arrive after 15 minutes of their scheduled appointment time.</li>
        <li>
          Clients who arrive more than 30 minutes late without prior notice will have their appointment automatically
          cancelled and their deposit forfeited.
        </li>
        <li>A PHP 500 squeeze-in fee applies to clients who need to be accommodated outside their scheduled time.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">No-Show Policy</h2>
      <p className="mb-4">
        Clients who fail to show up without prior notice will forfeit their deposit. Repeat no-shows may be required
        to pay the full service amount upfront before future bookings are confirmed.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Studio Guest Policy</h2>
      <p className="mb-4">
        Only one (1) companion is allowed per client inside the studio to keep the environment relaxing and
        comfortable for everyone.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Parking</h2>
      <p className="mb-4">
        No parking is available at the studio. We recommend nearby street parking or using Grab/ride-hailing services.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5-Day Warranty</h2>
      <p className="mb-3">All services come with a 5-day warranty from the date of your appointment for:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Lifting or chipping not caused by rough handling</li>
        <li>Application defects</li>
      </ul>
      <p className="mb-3">The warranty does not cover damage caused by:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Improper aftercare</li>
        <li>Exposure to harsh chemicals</li>
        <li>Picking, biting, or forceful impact</li>
      </ul>
      <p className="mb-4">
        To claim warranty, send a clear photo of the issue within 5 days. Walk-ins for warranty fixes are subject to
        technician availability.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Home Service Rules</h2>
      <p className="mb-3">We offer home service across Metro Manila with a PHP 1,500 home service fee.</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Home service bookings require a PHP 500 deposit per slot.</li>
        <li>Grab transportation back and forth will be shouldered by the client.</li>
        <li>Please provide a clean, well-lit, and comfortable working area.</li>
        <li>A stable table and chair setup is required. We bring our own tools and equipment.</li>
        <li>Home service is subject to technician availability and Metro Manila coverage only.</li>
        <li>Traffic/travel delays may affect arrival time. We will keep you updated via message.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Bitten Nails & Nail Condition Surcharges</h2>
      <p className="mb-3">
        We welcome all nail types and conditions. Some conditions require extra time, care, and materials:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Severely bitten nails: PHP 500 surcharge</li>
        <li>Severely damaged or overgrown nails: surcharge may apply based on work required</li>
      </ul>
      <p className="mb-4">
        Our technician will assess your nails upon arrival and inform you of any applicable surcharges before
        proceeding.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Studio Amenities</h2>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Air-conditioned studio</li>
        <li>Complimentary bottled water and snacks</li>
        <li>Coffee or CR break anytime upon request</li>
        <li>Free WiFi</li>
      </ul>

      <p className="mt-8">
        For policy questions, message us on{' '}
        <a href="https://facebook.com/glammednailsbyjhen" className="underline">
          Facebook
        </a>{' '}
        or book online at{' '}
        <a href="https://www.glammednailsbyjhen.com" className="underline">
          glammednailsbyjhen.com
        </a>
        .
      </p>
      <p className="mt-4">
        <Link href="/booking" className="underline">
          Go to booking
        </Link>
      </p>
    </main>
  );
}

