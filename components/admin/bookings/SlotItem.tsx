import React, { useState, useRef, useEffect } from 'react';
import { Eye, Pencil, Trash2, EyeOff, MoreVertical } from 'lucide-react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import NailTechBadge from '../NailTechBadge';

/** Map API service type to display label and style for slot service badge */
const SERVICE_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  manicure: { label: 'Mani', style: { backgroundColor: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd' } },
  pedicure: { label: 'Pedi', style: { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' } },
  mani_pedi: { label: 'Mani + Pedi', style: { backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' } },
  home_service_2slots: { label: 'Mani + Pedi (2)', style: { backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' } },
  home_service_3slots: { label: 'Mani + Pedi (3)', style: { backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' } },
};

function getServiceBadge(service?: string): { label: string; style: React.CSSProperties } | null {
  if (!service || !service.trim()) return null;
  const key = service.toLowerCase().trim().replace(/\s+/g, '_');
  if (SERVICE_BADGE[key]) return SERVICE_BADGE[key];
  if (key.includes('mani') && key.includes('pedi')) return SERVICE_BADGE.mani_pedi;
  if (key.includes('manicure') || key === 'mani') return SERVICE_BADGE.manicure;
  if (key.includes('pedicure') || key === 'pedi') return SERVICE_BADGE.pedicure;
  return { label: service.trim(), style: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' } };
}

interface SlotItemProps {
  time: string;
  status: BookingStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  nailTechId?: string;
  nailTechName?: string;
  nailTechRole?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSocialMediaName?: string;
  service?: string;
  isHidden?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function SlotItem({
  time,
  status,
  slotType,
  nailTechId,
  nailTechName,
  nailTechRole,
  clientName,
  clientEmail,
  clientPhone,
  clientSocialMediaName,
  service,
  isHidden = false,
  onView,
  onEdit,
  onCancel,
}: SlotItemProps) {
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canDeleteSlot = ['available', 'cancelled', 'CANCELLED', 'no_show', 'NO_SHOW'].includes(status);
  const canEditSlot = ['available', 'blocked', 'cancelled', 'CANCELLED', 'no_show', 'NO_SHOW'].includes(status);
  
  // Build actions array for mobile dropdown
  const mobileActions = [];
  if (['booked', 'pending', 'PENDING_PAYMENT', 'confirmed', 'CONFIRMED', 'no_show', 'NO_SHOW'].includes(status) && onView) {
    mobileActions.push({ label: 'View', icon: Eye, onClick: onView });
  }
  if (onEdit && canEditSlot) {
    mobileActions.push({ label: 'Edit', icon: Pencil, onClick: onEdit });
  }
  if (canDeleteSlot && onCancel) {
    mobileActions.push({ label: 'Delete', icon: Trash2, onClick: onCancel, variant: 'danger' });
  }

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (showMobileDropdown) {
      document.body.classList.add('dropdown-open');
      return () => {
        document.body.classList.remove('dropdown-open');
      };
    }
  }, [showMobileDropdown]);

  const serviceBadge = getServiceBadge(service);

  return (
    <div 
      className={`card mb-2 ${isHidden ? 'border-warning' : ''}`}
      style={{
        borderRadius: '20px',
        border: isHidden ? '2px solid #ffc107' : '1px solid #ced4da',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        background: '#ffffff',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04)';
      }}
    >
      {slotType === 'with_squeeze_fee' && (
        <span
          title="Squeeze-in Fee"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.55rem',
            fontWeight: 700,
            color: '#5b21b6',
            backgroundColor: '#ede9fe',
            border: '1px solid #c4b5fd',
            borderTop: 'none',
            borderRight: 'none',
            borderRadius: '0 0 0 8px',
            zIndex: 1,
          }}
        >
          SQ
        </span>
      )}
      <div 
        className="card-body py-2"
        style={{
          borderRadius: '20px',
          padding: '0.75rem 1rem',
          ...(slotType === 'with_squeeze_fee' ? { paddingRight: '2rem' } : {}),
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div style={{ flex: 1 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="fw-semibold" style={{ minWidth: '70px', flexShrink: 0 }}>
                {time}
              </div>
              <StatusBadge status={status} />
              {serviceBadge && (
                <span
                  className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium min-h-[24px] box-border"
                  style={{ ...serviceBadge.style }}
                >
                  {serviceBadge.label}
                </span>
              )}
              {isHidden && (
                <span
                  className="inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium min-h-[24px] box-border border border-transparent text-white"
                  style={{ backgroundColor: '#6c757d' }}
                >
                  <EyeOff style={{ width: '12px', height: '12px', flexShrink: 0 }} />Hidden from Clients
                </span>
              )}
              {nailTechName && (
                <NailTechBadge name={nailTechName} nailTechId={nailTechId} role={nailTechRole} />
              )}
              {clientName && (
                <span className="text-muted small fw-semibold">{clientName}</span>
              )}
            </div>
          </div>
          {/* Actions: single dropdown on all screens so card fits in narrow column */}
          {mobileActions.length > 0 && (
            <div className="position-relative flex-shrink-0">
              <button
                ref={buttonRef}
                type="button"
                className="btn btn-sm"
                onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                title="Actions"
                aria-label="Slot actions"
                style={{
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #495057 0%, #212529 100%)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(33, 37, 41, 0.3)',
                  padding: '0.375rem 0.75rem',
                }}
              >
                <MoreVertical size={16} />
              </button>
              {showMobileDropdown && (
                <>
                  <div 
                    className="position-fixed inset-0"
                    style={{ zIndex: 1049, backgroundColor: 'transparent' }}
                    onClick={() => setShowMobileDropdown(false)}
                    aria-hidden="true"
                  />
                  <div 
                    className="bg-white border rounded-2xl shadow-lg position-absolute"
                    style={{ 
                      minWidth: '150px',
                      zIndex: 1051,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                    }}
                  >
                    {mobileActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`w-100 text-start px-3 py-2 border-0 bg-transparent d-flex align-items-center gap-2 ${
                            action.variant === 'danger' ? 'text-danger' : ''
                          }`}
                          style={{
                            fontSize: '0.875rem',
                            borderRadius: index === 0 ? '16px 16px 0 0' : index === mobileActions.length - 1 ? '0 0 16px 16px' : '0',
                          }}
                          onClick={() => {
                            action.onClick?.();
                            setShowMobileDropdown(false);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Icon size={16} />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
