'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Mail, AtSign, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/Dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/Button';

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  socialMediaName?: string;
  referralSource?: string;
  clientType?: 'NEW' | 'REPEAT';
  isVIP?: boolean;
  totalBookings?: number;
  completedBookings?: number;
  totalSpent?: number;
  totalTips?: number;
  lastVisit?: string | null;
  isActive?: boolean;
  notes?: string;
  nailHistory?: {
    hasRussianManicure?: boolean;
    hasGelOverlay?: boolean;
    hasSoftgelExtensions?: boolean;
  };
  healthInfo?: {
    allergies?: string;
    nailConcerns?: string;
    nailDamageHistory?: string;
  };
  inspoDescription?: string;
}

interface ClientProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | undefined;
}

export default function ClientProfileModal({ open, onOpenChange, customerId }: ClientProfileModalProps) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    setLoading(true);
    setCustomer(null);
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (cancelled) return;
        setCustomer(data?.customer ?? null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, customerId]);

  const isRepeat = customer?.clientType === 'REPEAT';
  const nailHistoryItems = customer?.nailHistory
    ? [
        customer.nailHistory.hasRussianManicure && 'Russian Mani',
        customer.nailHistory.hasGelOverlay && 'Gel Overlay',
        customer.nailHistory.hasSoftgelExtensions && 'Softgel Ext',
      ].filter(Boolean) as string[]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Client Profile</DialogTitle>
        </VisuallyHidden.Root>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-8 pb-3 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>
          ) : !customer ? (
            <p className="text-sm text-gray-500 py-4 text-center">No client data available.</p>
          ) : (
            <>
              {/* Identity */}
              <div className="p-3 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-base font-semibold text-[#1a1a1a]">{customer.name}</h3>
                  {customer.isVIP && (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                      <Star size={10} className="fill-amber-500 text-amber-500" />VIP
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isRepeat
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}>
                    {isRepeat ? 'Repeat Client' : 'New Client'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      {customer.email}
                    </div>
                  )}
                  {customer.socialMediaName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AtSign size={13} className="text-gray-400 shrink-0" />
                      {customer.socialMediaName}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Bookings', value: customer.totalBookings ?? 0 },
                  { label: 'Completed', value: customer.completedBookings ?? 0 },
                  { label: 'Total Spent', value: `₱${(customer.totalSpent ?? 0).toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#e5e5e5] bg-white px-2 py-2 text-center shadow-sm">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {customer.lastVisit && (
                <p className="text-xs text-gray-400 -mt-1">
                  Last visit: {new Date(customer.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}

              {/* Nail history + health */}
              {(nailHistoryItems.length > 0 || customer.healthInfo?.allergies || customer.healthInfo?.nailConcerns || customer.healthInfo?.nailDamageHistory) && (
                <div className="px-3 py-2.5 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Nail & Health</p>
                  <div className="flex flex-col gap-1.5">
                    {nailHistoryItems.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-400 shrink-0">History:</span>
                        {nailHistoryItems.map((item) => (
                          <span key={item} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-purple-50 text-purple-700 border border-purple-200">{item}</span>
                        ))}
                      </div>
                    )}
                    {customer.healthInfo?.allergies && (
                      <div className="text-sm"><span className="text-gray-400">Allergies: </span>{customer.healthInfo.allergies}</div>
                    )}
                    {customer.healthInfo?.nailConcerns && (
                      <div className="text-sm"><span className="text-gray-400">Concerns: </span>{customer.healthInfo.nailConcerns}</div>
                    )}
                    {customer.healthInfo?.nailDamageHistory && (
                      <div className="text-sm"><span className="text-gray-400">Nail damage: </span>{customer.healthInfo.nailDamageHistory}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Inspo */}
              {customer.inspoDescription && (
                <div className="px-3 py-2.5 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">Inspo Notes</p>
                  <p className="text-sm text-gray-700">{customer.inspoDescription}</p>
                </div>
              )}

              {/* Admin notes */}
              {customer.notes && (
                <div className="px-3 py-2.5 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{customer.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-none px-4 py-3 border-t border-[#e5e5e5] bg-[#f7f7f7] rounded-b-[24px]">
          <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
