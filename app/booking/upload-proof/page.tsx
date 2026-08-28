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
        <div className="max-w-2xl mx-auto brand-panel p-5 sm:p-7 lg:p-9">
          <h1 className="text-2xl sm:text-3xl font-heading text-[#1c1917] mb-3">{title}</h1>
          <div className="brand-rule w-16 mb-4" aria-hidden />
          {subtitle ? <p className="text-sm sm:text-base text-[#78716c] mb-6 leading-relaxed">{subtitle}</p> : null}
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
        <p className="brand-eyebrow text-center py-4 animate-pulse">Loading</p>
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
      <div className="brand-panel-soft px-4 py-4 mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="brand-eyebrow">Booking</p>
          <p className="brand-numeric text-lg text-[#1c1917] mt-1">{booking.bookingCode}</p>
        </div>
        <div>
          <p className="brand-eyebrow">Deposit due</p>
          <p className="brand-numeric text-lg text-[#1c1917] mt-1">
            ₱{booking.depositRequired.toLocaleString()}
          </p>
        </div>
      </div>

      {booking.hasProof && (
        <div className="brand-note mb-6 text-sm">
          You already uploaded proof of payment. You can replace it below if needed.
        </div>
      )}

      {uploadSuccess && (
        <div className="brand-note mb-6 text-sm space-y-2">
          <p className="font-heading text-lg text-[#1c1917]">Thank you for uploading.</p>
          <p>You will receive a confirmation email once your payment has been verified. Your slot is secured after we confirm.</p>
          <p className="text-xs">If you have any questions, please reach out to us.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="brand-label">
            Screenshot or photo of payment (JPEG, PNG, WebP, max 5MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="brand-field-file"
          />
        </div>

        {uploadError && (
          <p className="brand-note-error text-sm" role="alert">
            {uploadError}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="brand-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload proof'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#78716c] leading-relaxed">
        Payment methods: GCash or PNB bank transfer. After paying the deposit, upload a screenshot or photo of your payment here.
      </p>

      <Link
        href="/booking"
        className="brand-eyebrow mt-6 inline-block underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
      >
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
          <p className="brand-eyebrow text-center py-4">Loading</p>
        </UploadProofShell>
      }
    >
      <UploadProofContent />
    </Suspense>
  );
}
