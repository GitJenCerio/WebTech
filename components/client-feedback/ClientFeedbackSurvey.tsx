'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Textarea } from '@/components/ui';

type RatingKey = 'overallSatisfaction' | 'nailQuality' | 'russianManicureQuality' | 'studioCleanliness' | 'customerService';
type RatingState = Record<RatingKey, number>;

const ratingQuestions: Array<{ key: RatingKey; label: string; helper: string }> = [
  { key: 'overallSatisfaction', label: 'How satisfied are you with your overall experience?', helper: 'Your first impression matters most.' },
  { key: 'nailQuality', label: 'How satisfied are you with your nail results?', helper: 'Finish, shape, durability, and detail.' },
  { key: 'russianManicureQuality', label: 'How would you rate the quality of your Russian Manicure or Nail Preparation?', helper: 'Prep precision and comfort.' },
  { key: 'studioCleanliness', label: 'How would you rate the cleanliness and comfort of the studio?', helper: 'A calm, premium atmosphere counts.' },
  { key: 'customerService', label: 'How would you rate your overall customer service experience?', helper: 'Communication, care, and attention.' },
];

const testimonialOptions = [
  { value: 'first_name', label: 'Yes, with my first name' },
  { value: 'anonymous', label: 'Yes, anonymously' },
  { value: 'no', label: 'No' },
] as const;

const futureBookingOptions = [
  { value: 'definitely', label: 'Definitely' },
  { value: 'probably', label: 'Probably' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'unlikely', label: 'Unlikely' },
] as const;

function StarRating({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const active = rating <= value;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded-full p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/40"
            aria-label={`${label}: ${rating} star${rating > 1 ? 's' : ''}`}
            aria-checked={active}
            role="radio"
          >
            <Star className={`h-6 w-6 ${active ? 'fill-[#c9a46a] text-[#c9a46a]' : 'text-[#d6c7bb]'}`} />
          </button>
        );
      })}
    </div>
  );
}

function TurnstileWidget({ onTokenChange, siteKey }: { onTokenChange: (token: string) => void; siteKey?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const key = siteKey || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const [scriptError, setScriptError] = useState(false);

  const removeExistingScript = () => {
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) existing.remove();
  };

  const loadScript = () => {
    setScriptError(false);
    removeExistingScript();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = () => {
      // small delay to allow initialization
      setTimeout(() => {
        const turnstile = (window as any).turnstile;
        if (!turnstile) setScriptError(true);
      }, 800);
    };
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
    return script;
  };

  useEffect(() => {
    if (!key || !ref.current || typeof window === 'undefined') return;

    let cancelled = false;

    const renderWidget = () => {
      const turnstile = (window as any).turnstile;
      if (!turnstile || !ref.current) return;
      try {
        turnstile.render(ref.current, {
          sitekey: key,
          callback: (token: string) => onTokenChange(token),
          'expired-callback': () => onTokenChange(''),
          'error-callback': () => onTokenChange(''),
        });
      } catch (e) {
        console.warn('turnstile.render error', e);
        if (!cancelled) setScriptError(true);
      }
    };

    const existingScript = document.querySelector('script[data-turnstile]');
    if (existingScript) {
      // give existing script a moment to initialize
      setTimeout(() => {
        renderWidget();
        if (!(window as any).turnstile) setScriptError(true);
      }, 600);
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.dataset.turnstile = 'true';
      s.onload = () => {
        if (!cancelled) renderWidget();
      };
      s.onerror = () => {
        if (!cancelled) setScriptError(true);
      };
      document.head.appendChild(s);
    }

    return () => {
      cancelled = true;
    };
  }, [onTokenChange, key]);

  if (!key) {
    if (isProduction) {
      return (
        <div className="rounded-2xl border border-dashed border-[#eaded4] bg-[#fffdfb] px-4 py-3 text-sm text-[#8a776d]">
          Human verification is not configured yet. Add the <span className="font-medium">TURNSTILE_SITE_KEY</span> env var in production.
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-[#eaded4] bg-[#fffdfb] px-4 py-3 text-sm text-[#8a776d]">
        Human verification is disabled in local development.
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <div className="font-medium">Unable to load Turnstile</div>
        <p className="mt-1">Check that the site key is correct, the domain is allowed in Cloudflare Turnstile settings, and your network or CSP isn&apos;t blocking the widget.</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setScriptError(false);
              loadScript();
            }}
            className="rounded bg-white px-3 py-1 text-sm font-medium text-rose-700"
          >
            Retry
          </button>
          <a className="text-sm text-rose-700 underline" href="https://developers.cloudflare.com/turnstile/get-started/" target="_blank" rel="noreferrer">Troubleshoot</a>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="min-h-[80px]" />;
}

export default function ClientFeedbackSurvey({ siteKey }: { siteKey?: string }) {
  const [ratings, setRatings] = useState<RatingState>({
    overallSatisfaction: 0,
    nailQuality: 0,
    russianManicureQuality: 0,
    studioCleanliness: 0,
    customerService: 0,
  });
  const [favoritePart, setFavoritePart] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [testimonialPermission, setTestimonialPermission] = useState<'first_name' | 'anonymous' | 'no'>('no');
  const [futureBookingIntent, setFutureBookingIntent] = useState<'definitely' | 'probably' | 'maybe' | 'unlikely'>('probably');
  const [nailTechId, setNailTechId] = useState('');
  const [nailTechs, setNailTechs] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [loadingNailTechs, setLoadingNailTechs] = useState(true);
  const [nailTechLoadError, setNailTechLoadError] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const hasTurnstile = Boolean(siteKey);
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    let cancelled = false;

    async function loadNailTechs() {
      setLoadingNailTechs(true);
      setNailTechLoadError(null);
      try {
        const response = await fetch('/api/nail-techs?activeOnly=true');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load nail technicians');
        if (cancelled) return;
        const options = (data.nailTechs || []).map((tech: { id?: string; _id?: string; name: string; role?: string }) => ({
          id: tech.id || tech._id || '',
          name: tech.name,
          role: tech.role,
        })).filter((tech: { id: string }) => Boolean(tech.id));
        setNailTechs(options);
      } catch (err: any) {
        if (!cancelled) {
          setNailTechLoadError(err.message || 'Failed to load nail technicians');
          setNailTechs([]);
        }
      } finally {
        if (!cancelled) setLoadingNailTechs(false);
      }
    }

    loadNailTechs();
    return () => {
      cancelled = true;
    };
  }, []);

  const answeredCount = useMemo(() => Object.values(ratings).filter((value) => value > 0).length, [ratings]);
  const progress = Math.round((answeredCount / ratingQuestions.length) * 100);
  const canSubmit = Boolean(nailTechId)
    && answeredCount === ratingQuestions.length
    && (!hasTurnstile || !!turnstileToken || !isProduction)
    && !isSubmitting
    && !loadingNailTechs;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Please select your nail technician, complete the ratings, and finish verification before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/client-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ratings,
          nailTechId,
          favoritePart,
          improvementSuggestions,
          testimonialPermission,
          futureBookingIntent,
          website,
          turnstileToken,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmittedResponseId(data.responseId || null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedResponseId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#fffaf7] text-[#221817]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(231,194,180,0.35),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(201,164,106,0.2),_transparent_22%),linear-gradient(180deg,_#fffaf7_0%,_#fffdfb_100%)]" />
        <main className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <Card className="w-full border border-[#eaded4] bg-white/90 shadow-[0_24px_70px_rgba(72,44,26,0.10)] backdrop-blur">
            <CardContent className="space-y-5 p-6 text-center sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8efe6] text-[#b98b57] shadow-inner">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-[#b58f68]">Feedback received</p>
                <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[#1f1715] sm:text-5xl">Thank you</h1>
                <p className="mx-auto max-w-2xl text-sm leading-6 text-[#6d5d54] sm:text-base">
                  Thank you for your feedback! We appreciate your trust and support. We look forward to seeing you again at Glammed Nails by Jhen.
                </p>
              </div>
              <div className="rounded-2xl border border-[#eaded4] bg-[#fffaf6] px-4 py-3 text-sm text-[#6d5d54]">
                Response ID: <span className="font-medium text-[#221817]">{submittedResponseId}</span>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf7] text-[#221817]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(231,194,180,0.35),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(201,164,106,0.2),_transparent_22%),linear-gradient(180deg,_#fffaf7_0%,_#fffdfb_100%)]" />
      <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f1d7cc]/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-[#f4e7d1]/30 blur-3xl" />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[#b58f68]">
          <Sparkles className="h-4 w-4" /> Private client survey
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr] lg:items-start">
          <Card className="border border-[#eaded4] bg-white/85 shadow-[0_20px_60px_rgba(72,44,26,0.08)] backdrop-blur">
            <CardHeader className="space-y-4 p-6 sm:p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eaded4] bg-[#fff7f2] px-3 py-1 text-xs font-medium text-[#a97d50]">
                <ShieldCheck className="h-3.5 w-3.5" /> Private QR survey
              </div>
              <div className="space-y-3">
                <CardTitle className="font-[family-name:var(--font-cormorant)] text-4xl leading-tight text-[#1f1715] sm:text-5xl">
                  Client Feedback
                </CardTitle>
                <CardDescription className="max-w-md text-sm leading-6 text-[#6d5d54] sm:text-base">
                  Thank you for choosing Glammed Nails by Jhen. Your feedback helps us improve and continue providing exceptional service.
                </CardDescription>
              </div>
              <div className="grid gap-3 rounded-3xl border border-[#eaded4] bg-[#fffaf6] p-4 text-sm text-[#5e4f48]">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-[#b58f68]" />
                  <span>Completes in about 1 to 2 minutes.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[#b58f68]" />
                  <span>Protected with human verification and anti-spam checks.</span>
                </div>
              </div>
              <div className="rounded-3xl border border-[#eaded4] bg-[#1f1715] px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d8c2a2]">Progress</p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#d8b18a] via-[#e8caa2] to-[#c8a15f] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-sm text-white/80">{answeredCount} of {ratingQuestions.length} ratings completed</p>
              </div>
            </CardHeader>
          </Card>

          <Card className="border border-[#eaded4] bg-white/90 shadow-[0_24px_70px_rgba(72,44,26,0.10)] backdrop-blur">
            <CardContent className="p-5 sm:p-8">
              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}

              <form className="space-y-7" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <section className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4 sm:p-5">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#221817]">Who was your nail technician?</Label>
                    <p className="text-xs leading-5 text-[#8a776d]">Select the technician who served you today.</p>
                  </div>

                  {loadingNailTechs ? (
                    <p className="text-sm text-[#8a776d]">Loading technicians...</p>
                  ) : nailTechLoadError ? (
                    <p className="text-sm text-rose-700">{nailTechLoadError}</p>
                  ) : nailTechs.length === 0 ? (
                    <p className="text-sm text-[#8a776d]">No technicians are available right now. Please try again later.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {nailTechs.map((tech) => (
                        <label
                          key={tech.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#eaded4] bg-white px-3 py-2.5 text-sm text-[#4d4038] transition-colors hover:border-[#c9a46a]/40"
                        >
                          <input
                            type="radio"
                            name="nailTechId"
                            value={tech.id}
                            checked={nailTechId === tech.id}
                            onChange={() => setNailTechId(tech.id)}
                            className="h-4 w-4 border-[#c9a46a] text-[#c9a46a] focus:ring-[#c9a46a]"
                          />
                          <span className="flex flex-col">
                            <span className="font-medium text-[#221817]">Ms. {tech.name}</span>
                            {tech.role ? <span className="text-xs text-[#8a776d]">{tech.role}</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f1715]">Rating your experience</h2>
                    <p className="mt-1 text-sm text-[#6d5d54]">Tap a star for each section below.</p>
                  </div>

                  <div className="space-y-5">
                    {ratingQuestions.map((question) => (
                      <div key={question.key} className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-[#221817]">{question.label}</Label>
                            <p className="text-xs leading-5 text-[#8a776d]">{question.helper}</p>
                          </div>
                          <StarRating
                            value={ratings[question.key]}
                            onChange={(next) => setRatings((current) => ({ ...current, [question.key]: next }))}
                            label={question.label}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f1715]">Share your thoughts</h2>
                    <p className="mt-1 text-sm text-[#6d5d54]">Short answers are enough.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favoritePart" className="text-sm font-medium text-[#221817]">What did you love most about your appointment?</Label>
                    <Textarea
                      id="favoritePart"
                      value={favoritePart}
                      onChange={(event) => setFavoritePart(event.target.value)}
                      placeholder="Tell us what stood out, what felt special, or what you appreciated most..."
                      className="min-h-28 border-[#eaded4] bg-[#fffdfb] text-[#221817] placeholder:text-[#aa9a91] focus-visible:ring-[#c9a46a]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="improvements" className="text-sm font-medium text-[#221817]">Is there anything we can improve?</Label>
                    <Textarea
                      id="improvements"
                      value={improvementSuggestions}
                      onChange={(event) => setImprovementSuggestions(event.target.value)}
                      placeholder="Share any suggestions, requests, or small details we should refine..."
                      className="min-h-28 border-[#eaded4] bg-[#fffdfb] text-[#221817] placeholder:text-[#aa9a91] focus-visible:ring-[#c9a46a]/30"
                    />
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
                    <Label className="text-sm font-medium text-[#221817]">May we share your feedback on our social media or website?</Label>
                    <div className="space-y-2.5">
                      {testimonialOptions.map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#eaded4] bg-white px-3 py-2 text-sm text-[#4d4038] transition-colors hover:border-[#c9a46a]/40">
                          <input
                            type="radio"
                            name="testimonialPermission"
                            value={option.value}
                            checked={testimonialPermission === option.value}
                            onChange={() => setTestimonialPermission(option.value)}
                            className="h-4 w-4 border-[#c9a46a] text-[#c9a46a] focus:ring-[#c9a46a]"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
                    <Label className="text-sm font-medium text-[#221817]">Would you book with us again?</Label>
                    <div className="grid gap-2">
                      {futureBookingOptions.map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#eaded4] bg-white px-3 py-2 text-sm text-[#4d4038] transition-colors hover:border-[#c9a46a]/40">
                          <input
                            type="radio"
                            name="futureBookingIntent"
                            value={option.value}
                            checked={futureBookingIntent === option.value}
                            onChange={() => setFutureBookingIntent(option.value)}
                            className="h-4 w-4 border-[#c9a46a] text-[#c9a46a] focus:ring-[#c9a46a]"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
                  <Label className="text-sm font-medium text-[#221817]">Human verification</Label>
                  <TurnstileWidget onTokenChange={setTurnstileToken} siteKey={siteKey} />
                </div>

                <div className="rounded-2xl border border-[#eaded4] bg-[#1f1715] p-4 text-sm text-white/80">
                  <p className="font-medium text-white">Your response is private.</p>
                  <p className="mt-1 text-white/70">The form is protected against spam and repeated submissions.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#8a776d]">Select your technician and complete all ratings before submission.</p>
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    loading={isSubmitting}
                    className="h-11 rounded-full bg-gradient-to-r from-[#1f1715] to-[#3d2b22] px-6 text-sm font-medium text-white shadow-lg shadow-[#1f1715]/15 hover:from-[#2b1f1a] hover:to-[#4a3429]"
                  >
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}