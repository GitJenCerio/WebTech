'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { CHOSEN_SERVICE_LABELS } from '@/lib/serviceLabels';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const CHOSEN_SERVICE_OPTIONS = Object.entries(CHOSEN_SERVICE_LABELS).map(([value, label]) => ({ value, label }));

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function UploadSection({
  label,
  description,
  photoType,
  maxCount,
  currentCount,
  token,
  bookingId,
  onSuccess,
  disabled = false,
}: {
  label: string;
  description: string;
  photoType: 'inspiration' | 'currentState';
  maxCount: number;
  currentCount: number;
  token: string;
  bookingId: string;
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slotsLeft = Math.max(0, maxCount - currentCount);
  const isFull = slotsLeft <= 0;
  const canUpload = !disabled && !isFull;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!canUpload) {
      setError(disabled ? 'Please select and save at least one service first.' : `Maximum ${maxCount} photos allowed.`);
      return;
    }

    setError(null);
    setUploading(true);

    const toUpload = files.slice(0, slotsLeft);
    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, and HEIC images are allowed.');
        setUploading(false);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('Each image must be under 10MB.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.set('token', token);
      formData.set('file', file);
      formData.set('photoType', photoType);

      const res = await fetch(`/api/bookings/${bookingId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }
      onSuccess();
    }

    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="mb-8">
      <h3 className="font-heading text-xl text-[#1c1917] mb-1">{label}</h3>
      <p className="text-sm text-[#78716c] mb-2">{description}</p>
      <p className="brand-eyebrow mb-2.5">
        {currentCount} / {maxCount} uploaded · {isFull ? 'maximum reached' : `you can add ${slotsLeft} more`}
      </p>
      {!isFull && (
        <label className={`block ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <span className="sr-only">Choose {label.toLowerCase()} images</span>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileChange}
            disabled={uploading || disabled}
            className="brand-field-file"
          />
        </label>
      )}
      {error && (
        <p className="brand-note-error mt-3 text-sm" role="alert">
          {error}
        </p>
      )}
      {uploading && <p className="brand-eyebrow mt-3">Uploading</p>}
    </div>
  );
}

function UploadPhotosContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [booking, setBooking] = useState<{
    bookingId: string;
    bookingCode: string;
    inspirationCount: number;
    currentStateCount: number;
    chosenServices: string[];
  } | null>(null);
  const [chosenServices, setChosenServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback((showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    fetch(`/api/bookings/upload-photos?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBooking(data);
          const services = Array.isArray(data.chosenServices) ? data.chosenServices : [];
          setChosenServices(services);
          if (services.length > 0) setServicesSaved(true);
        }
      })
      .catch(() => setError('Could not load booking'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchBooking(true);
  }, [fetchBooking]);

  if (!token) {
    return (
      <Shell
        title="Upload nail photos"
        subtitle="Use the link we sent you to upload your inspiration photos and current nail photos for your appointment."
      >
        <div className="text-center">
          <Link
            href="/booking"
            className="brand-cta"
          >
            Book an appointment
          </Link>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell title="Upload nail photos">
        <p className="brand-eyebrow text-center py-4 animate-pulse">Loading</p>
      </Shell>
    );
  }

  if (error || !booking) {
    return (
      <Shell
        title="Invalid or expired link"
        subtitle={error || 'This link may have expired. Ask us to send you a new link.'}
      >
        <div className="text-center">
          <Link
            href="/booking"
            className="brand-cta"
          >
            Book an appointment
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Upload nail photos"
      subtitle="Share your inspiration and current nail photos so we can prepare for your appointment."
    >
      <div className="brand-panel-soft px-4 py-4 mb-6">
        <p className="brand-eyebrow">Booking</p>
        <p className="brand-numeric text-lg text-[#1c1917] mt-1">{booking.bookingCode}</p>
      </div>

      <div className="mb-8">
        <h3 className="font-heading text-xl text-[#1c1917] mb-1">
          Specific services / Add-ons <span className="text-[#5a3830]">*</span>
        </h3>
        <p className="text-sm text-[#78716c] mb-3">
          Select at least one service you need for your appointment.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CHOSEN_SERVICE_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2.5 px-3 py-2.5 border border-[#e7e2db] bg-[#fffcfa] cursor-pointer transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation"
            >
              <input
                type="checkbox"
                checked={chosenServices.includes(value)}
                onChange={() => {
                  setChosenServices((prev) =>
                    prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
                  );
                  setServicesSaved(false);
                  setServicesError(null);
                }}
                className="brand-check"
              />
              <span className="text-sm text-[#57534e]">{label}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!token) return;
            if (chosenServices.length === 0) {
              setServicesError('Please select at least one service.');
              return;
            }
            setSavingServices(true);
            setServicesError(null);
            try {
              const res = await fetch('/api/bookings/upload-photos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, chosenServices }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to save');
              setServicesSaved(true);
              setServicesError(null);
              setBooking((prev) => prev ? { ...prev, chosenServices } : null);
            } catch {
              setServicesError('Failed to save. Please try again.');
            } finally {
              setSavingServices(false);
            }
          }}
          disabled={savingServices}
          className="brand-cta-sm disabled:opacity-50"
        >
          {savingServices ? 'Saving...' : 'Save services'}
        </button>
        {servicesSaved && (
          <p className="brand-eyebrow mt-3">Services saved</p>
        )}
        {servicesError && (
          <p className="brand-note-error mt-3 text-sm" role="alert">
            {servicesError}
          </p>
        )}
      </div>

      {!servicesSaved && chosenServices.length === 0 && (
        <p className="brand-note-strong text-sm mb-6">
          Please select and save at least one service above before uploading photos.
        </p>
      )}

      <UploadSection
        label="Inspiration nails"
        description="Photos of nail designs you like (reference images)."
        photoType="inspiration"
        maxCount={3}
        currentCount={booking.inspirationCount}
        token={token}
        bookingId={booking.bookingId}
        onSuccess={() => fetchBooking(false)}
        disabled={!servicesSaved || chosenServices.length === 0}
      />

      <UploadSection
        label="Current nails"
        description="Photos of your current nails (how they look now)."
        photoType="currentState"
        maxCount={3}
        currentCount={booking.currentStateCount}
        token={token}
        bookingId={booking.bookingId}
        onSuccess={() => fetchBooking(false)}
        disabled={!servicesSaved || chosenServices.length === 0}
      />

      <p className="text-sm text-[#78716c] mb-5">
        Accepted formats: JPEG, PNG, WebP, HEIC. Max 10MB per image. Up to 3 photos per section.
      </p>

      {(booking.inspirationCount > 0 || booking.currentStateCount > 0) && (
        <div className="brand-note mb-6">
          <p className="font-heading text-lg text-[#1c1917]">Thank you — your details were uploaded.</p>
          <p className="text-sm mt-1">
            We&apos;ll use these to prepare for your appointment. See you soon.
          </p>
        </div>
      )}

      <Link
        href="/"
        className="brand-eyebrow inline-block underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
      >
        Return to home
      </Link>
    </Shell>
  );
}

export default function UploadPhotosPage() {
  return (
    <Suspense
      fallback={
        <Shell title="Upload nail photos">
          <p className="brand-eyebrow text-center py-4">Loading</p>
        </Shell>
      }
    >
      <UploadPhotosContent />
    </Suspense>
  );
}
