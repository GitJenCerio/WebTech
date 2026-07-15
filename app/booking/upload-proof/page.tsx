'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function UploadProofShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen section-ash">
      <Header />
      <section className="pt-[90px] sm:pt-[105px] md:pt-[120px] lg:pt-[140px] px-2 sm:px-4 pb-10 sm:pb-14">
        <div className="max-w-2xl mx-auto border border-[#e4e4e7] bg-white p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-heading text-[#111] mb-2">{title}</h1>
          {subtitle ? <p className="text-sm sm:text-base text-[#71717a] mb-6">{subtitle}</p> : null}
          {children}
        </div>
      </section>
      <Footer />
    </main>
  );
}

function UploadProofContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [booking, setBooking] = useState<{ bookingCode: string; depositRequired: number; status: string; hasProof: boolean } | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/upload-proof?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data);
        }
      })
      .catch(() => setError('Could not load booking'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) {
      setUploadError('Please select an image (JPEG, PNG, or WebP, max 5MB).');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.set('token', token);
      formData.set('file', file);

      const res = await fetch('/api/bookings/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }

      setUploadSuccess(true);
      setFile(null);
      setBooking((prev) => (prev ? { ...prev, hasProof: true } : null));
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!token) {
    return (
      <UploadProofShell
        title="Upload proof of payment"
        subtitle="Use the link from your booking confirmation email to upload your proof of downpayment."
      >
        <div className="text-center">
          <Link
            href="/booking"
            className="brand-cta"
          >
            Book an appointment
          </Link>
        </div>
      </UploadProofShell>
    );
  }

  if (loading) {
    return (
      <UploadProofShell title="Upload proof of payment">
        <div className="animate-pulse text-slate-500 text-center py-4">Loading...</div>
      </UploadProofShell>
    );
  }

  if (error || !booking) {
    return (
      <UploadProofShell
        title="Invalid or expired link"
        subtitle={error || 'This link may have expired. Use the latest link from your confirmation email.'}
      >
        <div className="text-center">
          <Link
            href="/booking"
            className="brand-cta"
          >
            Book an appointment
          </Link>
        </div>
      </UploadProofShell>
    );
  }

  return (
    <UploadProofShell title="Upload proof of payment" subtitle="Your booking is pending confirmation.">
      <div className="rounded-lg border-2 border-slate-300 bg-white px-4 py-3 mb-6">
        <p className="text-sm sm:text-base text-slate-700">
          Booking <strong>{booking.bookingCode}</strong> · Deposit ₱{booking.depositRequired.toLocaleString()}
        </p>
      </div>

      {booking.hasProof && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border-2 border-green-200 text-green-800 text-sm">
          You already uploaded proof of payment. You can replace it below if needed.
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border-2 border-green-200 text-green-800 text-sm space-y-2">
          <p className="font-semibold">Thank you for uploading!</p>
          <p>You will receive a confirmation email once your payment has been verified. Your slot is secured after we confirm.</p>
          <p className="text-xs text-green-700">If you have any questions, please reach out to us.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Screenshot or photo of payment (JPEG, PNG, WebP, max 5MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-800 file:font-medium"
          />
        </div>

        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

        <button
          type="submit"
          disabled={uploading || !file}
          className="brand-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload proof'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Payment methods: GCash or PNB Bank Transfer. After paying the deposit, upload a screenshot or photo of your payment here.
      </p>

      <Link href="/booking" className="mt-6 inline-block text-slate-700 hover:text-black text-sm underline">
        Back to booking
      </Link>
    </UploadProofShell>
  );
}

export default function UploadProofPage() {
  return (
    <Suspense
      fallback={
        <UploadProofShell title="Upload proof of payment">
          <div className="text-center text-slate-500 py-4">Loading...</div>
        </UploadProofShell>
      }
    >
      <UploadProofContent />
    </Suspense>
  );
}
