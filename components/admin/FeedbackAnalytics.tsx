'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, Filter, MessageSquareQuote, Star, TrendingUp, ShieldAlert } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

type ResponseItem = {
  responseId: string;
  overallSatisfaction: number;
  nailQuality: number;
  russianManicureQuality: number;
  studioCleanliness: number;
  customerService: number;
  favoritePart: string;
  improvementSuggestions: string;
  testimonialPermission: 'first_name' | 'anonymous' | 'no';
  futureBookingIntent: 'definitely' | 'probably' | 'maybe' | 'unlikely';
  averageRating: number;
  overallScore: number;
  isFlaggedForFollowUp: boolean;
  createdAt: string;
};

type FeedbackStats = {
  totalResponses: number;
  averageRatings: Record<'overallSatisfaction' | 'nailQuality' | 'russianManicureQuality' | 'studioCleanliness' | 'customerService', number>;
  overallSatisfactionScore: number;
  compositeScore: number;
  testimonialCount: number;
  flaggedCount: number;
};

function scoreLabel(value: number) {
  if (value >= 4.75) return 'Excellent';
  if (value >= 4.25) return 'Outstanding';
  if (value >= 3.5) return 'Strong';
  if (value >= 3) return 'Good';
  return 'Needs attention';
}

function exportCsv(rows: ResponseItem[]) {
  const header = [
    'responseId',
    'submittedAt',
    'overallSatisfaction',
    'nailQuality',
    'russianManicureQuality',
    'studioCleanliness',
    'customerService',
    'averageRating',
    'overallScore',
    'testimonialPermission',
    'futureBookingIntent',
    'favoritePart',
    'improvementSuggestions',
    'isFlaggedForFollowUp',
  ];

  const escapeCell = (value: unknown) => {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
  };

  const csv = [
    header.join(','),
    ...rows.map((row) => [
      row.responseId,
      row.createdAt,
      row.overallSatisfaction,
      row.nailQuality,
      row.russianManicureQuality,
      row.studioCleanliness,
      row.customerService,
      row.averageRating,
      row.overallScore,
      row.testimonialPermission,
      row.futureBookingIntent,
      row.favoritePart,
      row.improvementSuggestions,
      row.isFlaggedForFollowUp,
    ].map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `client-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#4b3f39]">{label}</span>
        <span className="font-medium text-[#1f1715]">{value.toFixed(2)} / 5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f0e6dc]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#d8b18a] via-[#c9a46a] to-[#8f6a38]" style={{ width: `${Math.min(100, (value / 5) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function FeedbackAnalytics() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'testimonials' | 'follow-up'>('all');

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const response = await fetch(`/api/client-feedback?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load feedback');
      setResponses(data.responses || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const visibleResponses = useMemo(() => {
    if (activeTab === 'testimonials') {
      return responses.filter((response) => response.testimonialPermission !== 'no');
    }
    if (activeTab === 'follow-up') {
      return responses.filter((response) => response.isFlaggedForFollowUp);
    }
    return responses;
  }, [responses, activeTab]);

  const handleExport = () => exportCsv(visibleResponses);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Feedback Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-500">View client survey responses, ratings, and testimonial-ready feedback.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      <Card className="border border-[#e5e5e5] shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl lg:flex-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4b3f39]">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4b3f39]">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={fetchResponses} className="gap-2">
                <Filter className="h-4 w-4" /> Apply Filter
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={visibleResponses.length === 0} className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Responses</p>
            <p className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{stats?.totalResponses ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Overall satisfaction</p>
            <p className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{(stats?.overallSatisfactionScore ?? 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">{scoreLabel(stats?.overallSatisfactionScore ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Composite score</p>
            <p className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{(stats?.compositeScore ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Testimonials</p>
            <p className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{stats?.testimonialCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Flagged</p>
            <p className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{stats?.flaggedCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardHeader className="border-b border-[#f0f0f0] pb-4">
            <CardTitle className="text-base">Average Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-5">
            <RatingBar label="Overall satisfaction" value={stats?.averageRatings.overallSatisfaction ?? 0} />
            <RatingBar label="Nail quality" value={stats?.averageRatings.nailQuality ?? 0} />
            <RatingBar label="Russian manicure quality" value={stats?.averageRatings.russianManicureQuality ?? 0} />
            <RatingBar label="Studio cleanliness" value={stats?.averageRatings.studioCleanliness ?? 0} />
            <RatingBar label="Customer service" value={stats?.averageRatings.customerService ?? 0} />
          </CardContent>
        </Card>

        <Card className="border border-[#e5e5e5] shadow-sm">
          <CardHeader className="border-b border-[#f0f0f0] pb-4">
            <CardTitle className="text-base">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 md:p-5">
            <div className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1f1715]"><MessageSquareQuote className="h-4 w-4 text-[#b58f68]" /> Testimonials ready</div>
              <p className="mt-1 text-sm text-[#6d5d54]">Responses marked Yes can be reviewed separately for social proof or website quotes.</p>
            </div>
            <div className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1f1715]"><ShieldAlert className="h-4 w-4 text-[#b58f68]" /> Follow-up flags</div>
              <p className="mt-1 text-sm text-[#6d5d54]">Any response with a rating of 3 stars or below is flagged automatically for review.</p>
            </div>
            <div className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1f1715]"><TrendingUp className="h-4 w-4 text-[#b58f68]" /> Premium service check</div>
              <p className="mt-1 text-sm text-[#6d5d54]">The composite score gives a quick snapshot of the overall client experience.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
        <TabsList className="w-full justify-start bg-[#f5f5f5] p-1">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">All Responses</TabsTrigger>
          <TabsTrigger value="testimonials" className="flex-1 sm:flex-none">Testimonials</TabsTrigger>
          <TabsTrigger value="follow-up" className="flex-1 sm:flex-none">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card className="border border-[#e5e5e5] shadow-sm">
              <CardContent className="p-6 text-sm text-gray-500">Loading feedback...</CardContent>
            </Card>
          ) : visibleResponses.length === 0 ? (
            <Card className="border border-[#e5e5e5] shadow-sm">
              <CardContent className="p-6 text-sm text-gray-500">No responses found for the selected filter.</CardContent>
            </Card>
          ) : (
            visibleResponses.map((response) => (
              <Card key={response.responseId} className="border border-[#e5e5e5] shadow-sm">
                <CardContent className="space-y-4 p-4 md:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{response.responseId}</p>
                      <p className="text-xs text-gray-500">{format(new Date(response.createdAt), 'PPP p')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      {response.isFlaggedForFollowUp && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">Follow-up</span>}
                      {response.testimonialPermission !== 'no' && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Testimonial eligible</span>}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <RatingBar label="Overall" value={response.overallSatisfaction} />
                    <RatingBar label="Nail quality" value={response.nailQuality} />
                    <RatingBar label="Russian prep" value={response.russianManicureQuality} />
                    <RatingBar label="Cleanliness" value={response.studioCleanliness} />
                    <RatingBar label="Service" value={response.customerService} />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Favorite part</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#1f1715]">{response.favoritePart || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Improvement suggestions</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#1f1715]">{response.improvementSuggestions || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[#5e4f48]">
                    <span className="rounded-full border border-[#eaded4] bg-white px-2.5 py-1">Future booking: {response.futureBookingIntent}</span>
                    <span className="rounded-full border border-[#eaded4] bg-white px-2.5 py-1">Average: {response.averageRating.toFixed(2)}</span>
                    <span className="rounded-full border border-[#eaded4] bg-white px-2.5 py-1">Overall score: {response.overallScore.toFixed(2)}</span>
                    <span className="rounded-full border border-[#eaded4] bg-white px-2.5 py-1">Share: {response.testimonialPermission}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}