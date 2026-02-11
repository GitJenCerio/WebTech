import { useRef } from 'react';
import html2canvas from 'html2canvas';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceModalBooking {
  bookingCode?: string;
  clientName: string;
  service: string;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  paidAmount?: number;
}

interface InvoiceModalProps {
  show: boolean;
  booking: InvoiceModalBooking | null;
  invoiceError: string | null;
  invoiceItems: InvoiceItem[];
  invoiceNotes: string;
  invoiceSaving: boolean;
  currentQuotationId: string | null;
  invoiceDiscountAmount: number;
  pricingData: any[];
  selectedPricingService: string;
  pricingLoading: boolean;
  pricingError: string | null;
  onClose: () => void;
  onSelectedPricingServiceChange: (value: string) => void;
  onInvoiceItemsChange: (items: InvoiceItem[]) => void;
  onInvoiceNotesChange: (value: string) => void;
  onAddFromPricing: () => void;
  onSave: () => Promise<void>;
}

export default function InvoiceModal({
  show,
  booking,
  invoiceError,
  invoiceItems,
  invoiceNotes,
  invoiceSaving,
  currentQuotationId,
  invoiceDiscountAmount,
  pricingData,
  selectedPricingService,
  pricingLoading,
  pricingError,
  onClose,
  onSelectedPricingServiceChange,
  onInvoiceItemsChange,
  onInvoiceNotesChange,
  onAddFromPricing,
  onSave,
}: InvoiceModalProps) {
  const quotationRef = useRef<HTMLDivElement>(null);

  if (!show || !booking) return null;

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = invoiceDiscountAmount;
  const squeeze = booking.slotType === 'with_squeeze_fee' ? 500 : 0;
  const total = subtotal - discountAmount + squeeze;
  const depositPaid = booking.paidAmount ?? 0;
  const balance = Math.max(0, total - depositPaid);

  const handleDownload = async () => {
    if (!quotationRef.current) return;
    const canvas = await html2canvas(quotationRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imageData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const ts = new Date().toISOString().split('T')[0];
    link.href = imageData;
    link.download = `Quotation_${booking.clientName.replace(/\s+/g, '_')}_${ts}.png`;
    link.click();
  };

  return (
    <div
      className={`modal fade ${show ? 'show' : ''}`}
      style={{
        display: show ? 'flex' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1055,
      }}
      tabIndex={-1}
      role="dialog"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 0,
        }}
        onClick={onClose}
      />

      <div
        className="modal-dialog modal-dialog-centered"
        style={{ margin: '0.5rem auto', position: 'relative', zIndex: 1, width: 'min(96vw, 760px)' }}
        role="document"
      >
        <div className="modal-content">
          <div className="modal-header py-2 px-3">
            <h5 className="modal-title">Create Invoice</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-3" style={{ fontSize: '0.92rem' }}>
            <div className="mb-2 p-2 border rounded bg-light">
              <div className="d-flex flex-column gap-1">
                {booking.bookingCode ? <div><strong>Booking Code:</strong> {booking.bookingCode}</div> : null}
                <div><strong>Client:</strong> {booking.clientName}</div>
                <div><strong>Service:</strong> {booking.service}</div>
              </div>
            </div>

            {invoiceError && <div className="alert alert-danger">{invoiceError}</div>}

            <div className="mb-3">
              <label className="form-label fw-semibold">Invoice Items</label>
              <div className="mb-2">
                <label className="form-label small mb-1">Add from Pricing</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={selectedPricingService}
                    onChange={(e) => onSelectedPricingServiceChange(e.target.value)}
                    disabled={pricingLoading || pricingError !== null}
                  >
                    <option value="">Select a service...</option>
                    {pricingData.map((item, idx) => {
                      const firstKey = Object.keys(item)[0];
                      const name = String(item[firstKey] || '');
                      return name ? <option key={idx} value={name}>{name}</option> : null;
                    })}
                  </select>
                  <button type="button" className="btn btn-outline-dark" disabled={!selectedPricingService} onClick={onAddFromPricing}>
                    Add
                  </button>
                </div>
                {pricingLoading && <div className="text-muted small mt-1">Loading pricing...</div>}
                {pricingError && <div className="text-danger small mt-1">{pricingError}</div>}
              </div>

              {invoiceItems.map((item, idx) => (
                <div key={idx} className="row g-2 align-items-end mb-2">
                  <div className="col-12 col-md-5">
                    <label className="form-label small mb-1">Description</label>
                    <input
                      className="form-control"
                      value={item.description}
                      onChange={(e) => {
                        const next = [...invoiceItems];
                        next[idx].description = e.target.value;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value) || 1);
                        const next = [...invoiceItems];
                        next[idx].quantity = qty;
                        next[idx].total = qty * next[idx].unitPrice;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small mb-1">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value) || 0);
                        const next = [...invoiceItems];
                        next[idx].unitPrice = price;
                        next[idx].total = price * next[idx].quantity;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <label className="form-label small mb-1">Total</label>
                    <input className="form-control" value={item.total} disabled />
                  </div>
                  <div className="col-12 col-md-1">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => {
                        if (invoiceItems.length === 1) return;
                        onInvoiceItemsChange(invoiceItems.filter((_, i) => i !== idx));
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => onInvoiceItemsChange([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }])}
              >
                <i className="bi bi-plus-circle me-2"></i>Add Item
              </button>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Notes (optional)</label>
                <input className="form-control" value={invoiceNotes} onChange={(e) => onInvoiceNotesChange(e.target.value)} />
              </div>
            </div>

            <div className="mt-3 text-end fw-semibold">
              <div>Subtotal: PHP {subtotal.toLocaleString()}</div>
              <div>Discount: -PHP {discountAmount.toLocaleString()}</div>
              <div>Squeeze-in Fee: PHP {squeeze.toLocaleString()}</div>
              <div>Total: PHP {total.toLocaleString()}</div>
              <div>Deposit Paid: -PHP {depositPaid.toLocaleString()}</div>
              <div>Balance Due: PHP {balance.toLocaleString()}</div>
            </div>

            <div className="mt-3">
              <div ref={quotationRef} className="p-3 border rounded bg-white" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div className="text-center mb-2" style={{ borderBottom: '2px solid #000' }}>
                  <h5 className="mb-1" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>QUOTATION</h5>
                </div>
                <div className="mb-2">
                  <div><strong>Client:</strong> {booking.clientName}</div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US')}</div>
                </div>
                <div className="mb-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between">
                      <div>{item.description} x {item.quantity}</div>
                      <div>PHP {(item.total || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between fw-semibold" style={{ borderTop: '2px solid #000', paddingTop: '6px' }}>
                  <span>Subtotal</span>
                  <span>PHP {subtotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Discount</span>
                  <span>-PHP {discountAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Squeeze-in Fee</span>
                  <span>PHP {squeeze.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between fw-semibold" style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <span>Total</span>
                  <span>PHP {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 px-3">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-outline-dark" onClick={handleDownload}>
              Download
            </button>
            <button type="button" className="btn btn-dark" disabled={invoiceSaving} onClick={onSave}>
              {invoiceSaving ? 'Saving...' : currentQuotationId ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
