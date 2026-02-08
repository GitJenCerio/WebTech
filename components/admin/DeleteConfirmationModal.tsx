import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';

interface DeleteConfirmationModalProps {
  show: boolean;
  title?: string;
  message?: string;
  slotDate?: string;
  slotTime?: string;
  nailTechName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  show,
  title = 'Delete Slot',
  message = 'Are you sure you want to delete this slot? This action cannot be undone.',
  slotDate,
  slotTime,
  nailTechName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!show) return null;

  // Format the date and time details
  const dateFormatted = slotDate ? new Date(slotDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  const slotDetails = `${dateFormatted} at ${slotTime}${nailTechName ? ` - ${nailTechName}` : ''}`;

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
        zIndex: 1500,
        display: show ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        style={{ 
          margin: '0 auto', 
          position: 'relative',
          maxWidth: '400px',
          width: '100%'
        }} 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid #dee2e6' }}>
            <h5 className="modal-title" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000000' }}>
              <AlertCircle className="me-2" style={{ color: '#000000', display: 'inline', width: '20px', height: '20px' }} />
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Close"
              disabled={isLoading}
              style={{ padding: '0.5rem' }}
            ></button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '0.75rem', color: '#495057', fontSize: '0.95rem' }}>
              {message}
            </p>
            {slotDate && slotTime && (
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '0.75rem 1rem',
                borderLeft: '3px solid #000000',
                marginTop: '1rem',
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: 0, color: '#000000', fontWeight: 500, fontSize: '0.9rem' }}>
                  <Calendar className="me-2" style={{ display: 'inline', width: '16px', height: '16px' }} />
                  {slotDetails}
                </p>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid #dee2e6', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              disabled={isLoading}
              style={{ fontSize: '0.875rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              onClick={onConfirm}
              disabled={isLoading}
              style={{ fontSize: '0.875rem' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
