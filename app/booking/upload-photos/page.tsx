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
    <main className="min-h-screen bg-white">
      <Header />
      <section
        className="pt-[90px] sm:pt-[105px] md:pt-[120px] lg:pt-[140px] px-2 sm:px-4 pb-10 sm:pb-14"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <div
          className="max-w-2xl mx-auto rounded-xl border-2 p-4 sm:p-6 lg:p-8 shadow-sm"
          style={{ borderColor: '#212529', backgroundColor: '#f8f9fa' }}
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">{title}</h1>
          {subtitle ? <p className="text-sm sm:text-base text-slate-600 mb-6">{subtitle}</p> : null}
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
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{label}</h3>
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      <p className="text-xs text-slate-500 mb-2">
        {currentCount} / {maxCount} uploaded. {isFull ? 'Maximum reached.' : `You can add ${slotsLeft} more.`}
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
            className="block w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-800 file:font-medium disabled:opacity-50"
          />
        </label>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}
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
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
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
        <div className="animate-pulse text-slate-500 text-center py-4">Loading...</div>
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
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
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
      <div className="rounded-lg border-2 border-slate-300 bg-white px-4 py-3 mb-6">
        <p className="text-sm sm:text-base text-slate-700">
          Booking <strong>{booking.bookingCode}</strong>
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Specific services / Add-ons <span className="text-red-600">*</span>
        </h3>
        <p className="text-sm text-slate-600 mb-3">
          Select at least one service you need for your appointment. (Required)
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CHOSEN_SERVICE_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-slate-300 bg-white cursor-pointer hover:border-slate-500 transition-colors"
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
                className="rounded border-gray-300"
              />
              <span className="text-sm text-slate-800">{label}</span>
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
          className="px-4 py-2 rounded-lg border-2 border-slate-700 bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
        >
          {savingServices ? 'Saving...' : 'Save services'}
        </button>
        {servicesSaved && (
          <p className="mt-2 text-sm text-green-600">Services saved successfully.</p>
        )}
        {servicesError && (
          <p className="mt-2 text-sm text-red-600">{servicesError}</p>
        )}
      </div>

      {!servicesSaved && chosenServices.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
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

      <p className="text-sm text-slate-600 mb-4">
        Accepted formats: JPEG, PNG, WebP, HEIC. Max 10MB per image. Up to 3 photos per section.
      </p>

      {(booking.inspirationCount > 0 || booking.currentStateCount > 0) && (
        <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-4 mb-6">
          <p className="text-base font-semibold text-emerald-800">
            Thank you! Your details were uploaded successfully.
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            We&apos;ll use these to prepare for your appointment. See you soon!
          </p>
        </div>
      )}

      <Link href="/" className="inline-block text-slate-700 hover:text-black text-sm underline">
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
          <div className="text-center text-slate-500 py-4">Loading...</div>
        </Shell>
      }
    >
      <UploadPhotosContent />
    </Suspense>
  );
}
