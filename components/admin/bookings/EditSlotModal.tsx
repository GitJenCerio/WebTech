import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { BookingStatus } from '../StatusBadge';

export type SlotType = 'regular' | 'with_squeeze_fee';

interface NailTech {
  id: string;
  name: string;
  role?: string;
}

interface EditSlotModalProps {
  show: boolean;
  onHide: () => void;
  onUpdate: (slotId: string, updates: {
    status?: BookingStatus;
    slotType?: SlotType;
    notes?: string;
    isHidden?: boolean;
  }) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
  slot?: {
    id: string;
    date: string;
    time: string;
    status: BookingStatus;
    type?: SlotType;
    nailTechId?: string;
    nailTechName?: string;
    notes?: string;
    isHidden?: boolean;
  };
  isLoading?: boolean;
  error?: string | null;
}

export default function EditSlotModal({
  show,
  onHide,
  onUpdate,
  onDelete,
  slot,
  isLoading = false,
  error: externalError = null,
}: EditSlotModalProps) {
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [notes, setNotes] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (slot) {
      setSlotType(slot.type || 'regular');
      setNotes(slot.notes || '');
      setIsHidden(slot.isHidden || false);
      setError(null);
    }
  }, [slot, show]);

  if (!show || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onUpdate(slot.id, {
        slotType,
        notes,
        isHidden,
      });
      onHide();
    } catch (err: any) {
      setError(err.message || 'Failed to update slot');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this slot?`)) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(slot.id);
      onHide();
    } catch (err: any) {
      setError(err.message || 'Failed to delete slot');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="modal d-block"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: show ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onHide}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        style={{ 
          margin: '0 auto', 
          position: 'relative',
          maxWidth: '500px',
          width: '100%'
        }} 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
            <h5 className="modal-title" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Edit Slot: {slot.time} on {slot.date}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
              aria-label="Close"
              disabled={isLoading || isDeleting}
              style={{ padding: '0.5rem' }}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '1rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              <div className="row g-2 g-md-3">
                {/* Nail Tech Info */}
                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Nail Technician
                  </label>
                  <div className="form-control" style={{ backgroundColor: '#f8f9fa' }}>
                    {slot.nailTechName || 'Unknown'}
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Cannot be changed for existing slots
                  </small>
                </div>

                {/* Slot Type */}
                <div className="col-12">
                  <label htmlFor="slotType" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Slot Type
                  </label>
                  <select
                    id="slotType"
                    className="form-select"
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value as SlotType)}
                    disabled={isLoading}
                  >
                    <option value="regular">Regular</option>
                    <option value="with_squeeze_fee">With Squeeze Fee (₱500)</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-12">
                  <label htmlFor="notes" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for this slot..."
                    disabled={isLoading}
                  />
                </div>

                {/* Hidden from Clients */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      id="isHidden"
                      type="checkbox"
                      className="form-check-input"
                      checked={isHidden}
                      onChange={(e) => setIsHidden(e.target.checked)}
                      disabled={isLoading}
                    />
                    <label htmlFor="isHidden" className="form-check-label" style={{ fontSize: '0.875rem' }}>
                      Hide from clients during booking
                    </label>
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Hidden slots won't appear in the public booking calendar
                  </small>
                </div>

                {/* Error Message */}
                {(error || externalError) && (
                  <div className="col-12">
                    <div className="alert alert-dark mb-0" style={{ fontSize: '0.875rem', backgroundColor: '#f3f4f6', color: '#111827', borderColor: '#d1d5db' }}>
                      <AlertCircle className="me-2" style={{ display: 'inline', width: '16px', height: '16px' }} />
                      {error || externalError}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid #dee2e6' }}>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                style={{ fontSize: '0.875rem', marginRight: 'auto' }}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="me-2" style={{ display: 'inline', width: '16px', height: '16px' }} />
                    Delete
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onHide}
                disabled={isLoading || isDeleting}
                style={{ fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark btn-sm"
                disabled={isLoading || isDeleting}
                style={{ fontSize: '0.875rem' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="me-2" style={{ display: 'inline', width: '16px', height: '16px' }} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
