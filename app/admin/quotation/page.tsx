'use client';

import { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';

// Helper function to clean currency values
function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols (₱, $, etc.), commas, and spaces
  const cleaned = String(value)
    .replace(/[₱$,\s]/g, '')
    .trim();
  
  return parseFloat(cleaned) || 0;
}

interface PricingItem {
  [key: string]: string | number;
}

interface QuotationLineItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  location?: string;
  notes?: string;
}

export default function QuotationPage() {
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean>(false);
  
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientName, setClientName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const quotationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/quotation/pricing');
        const data = await response.json();

        if (!response.ok || !data.available) {
          setAvailable(false);
          setError(data.error || 'Pricing data is not available');
          return;
        }

        setPricingData(data.pricing || []);
        setHeaders(data.headers || []);
        setAvailable(true);
      } catch (err: any) {
        console.error('Error loading pricing:', err);
        setAvailable(false);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, []);

  const handleAddService = () => {
    if (!selectedService) return;

    const service = pricingData.find((item) => {
      const firstKey = Object.keys(item)[0];
      return item[firstKey] === selectedService;
    });

    if (!service) return;

    const priceKey = headers.find((h) => 
      h.toLowerCase().includes('price') || 
      h.toLowerCase().includes('amount') ||
      h.toLowerCase().includes('cost')
    ) || headers[1];

    // Use the helper function to clean currency values
    const unitPrice = cleanCurrencyValue(service[priceKey] || 0);
    const location = String(service['Location'] || service['location'] || '');
    const notes = String(service['Notes'] || service['notes'] || '');

    const newItem: QuotationLineItem = {
      serviceName: selectedService,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
      location,
      notes,
    };

    setLineItems([...lineItems, newItem]);
    setSelectedService('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = [...lineItems];
    updated[index].quantity = newQuantity;
    updated[index].total = updated[index].unitPrice * newQuantity;
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const estimatedTotal = subtotal;

  const serviceNames = pricingData
    .map((item) => {
      const firstKey = Object.keys(item)[0];
      return String(item[firstKey] || '');
    })
    .filter((name) => name.trim() !== '');

  const handleDownloadQuotation = async (format: 'png' | 'jpeg') => {
    if (!quotationRef.current || lineItems.length === 0) {
      alert('Please add at least one service to the quotation.');
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(quotationRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imageData = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : 1.0);
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = clientName 
        ? `Quotation_${clientName.replace(/\s+/g, '_')}_${timestamp}.${format}`
        : `Quotation_${timestamp}.${format}`;
      
      link.href = imageData;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error('Error generating quotation image:', error);
      alert('Failed to generate quotation image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center p-4">
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 py-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
        <h4 className="mb-0" style={{ fontWeight: 600, color: '#212529' }}>
          Quotation Calculator
        </h4>
        {lineItems.length > 0 && (
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-dark"
              onClick={() => handleDownloadQuotation('png')}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download PNG'}
            </button>
            <button
              className="btn btn-outline-dark"
              onClick={() => handleDownloadQuotation('jpeg')}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download JPEG'}
            </button>
          </div>
        )}
      </div>

      <div className="alert alert-info mb-3 mb-md-4" role="alert">
        <strong>Disclaimer:</strong> This quotation is for estimation only and is not a confirmed booking or invoice.
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <br />
          <small>Pricing calculations are disabled. Please check Google Sheets configuration.</small>
        </div>
      )}

      {available && (
        <div className="row g-3 g-md-4">
          {/* Left Column - Add Services */}
          <div className="col-12 col-lg-5 col-xl-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0" style={{ fontWeight: 600, fontSize: '1rem' }}>Add Services</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>
                    Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter client name..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <small className="text-muted">Will appear on the quotation</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>
                    Service
                  </label>
                  <select
                    className="form-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">Select a service...</option>
                    {serviceNames.map((name, idx) => (
                      <option key={idx} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <button
                  className="btn btn-dark w-100"
                  onClick={handleAddService}
                  disabled={!selectedService}
                >
                  Add to Quotation
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Quotation Preview */}
          <div className="col-12 col-lg-7 col-xl-8">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {lineItems.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-file-earmark-text" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    <p className="text-muted mt-3 mb-0">No items added yet.</p>
                    <small className="text-muted">Add services to generate quotation</small>
                  </div>
                ) : (
                  <div 
                    ref={quotationRef} 
                    className="p-4 p-md-5" 
                    style={{ 
                      backgroundColor: '#ffffff',
                      maxWidth: '900px',
                      margin: '0 auto',
                      width: '100%'
                    }}
                  >
                    {/* Quotation Header */}
                    <div className="text-center mb-4 pb-3" style={{ borderBottom: '3px solid #000000' }}>
                      <h1 className="mb-0" style={{ 
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 700,
                        fontSize: 'clamp(1.75rem, 5vw, 3rem)',
                        color: '#000000',
                        letterSpacing: '0.1em'
                      }}>
                        QUOTATION
                      </h1>
                    </div>

                    {/* Client Details */}
                    <div className="mb-4">
                      {clientName && (
                        <div className="mb-2">
                          <p className="mb-1" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#212529' }}>
                            <strong style={{ color: '#000000' }}>Client:</strong> {clientName}
                          </p>
                        </div>
                      )}
                      <p className="mb-0" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#495057' }}>
                        <strong style={{ color: '#000000' }}>Date:</strong> {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Services List */}
                    <div className="mb-4">
                      <div className="mb-3 pb-2" style={{ borderBottom: '2px solid #000000' }}>
                        <h5 className="mb-0" style={{ 
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          fontWeight: 700,
                          color: '#000000',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          Services
                        </h5>
                      </div>

                      {lineItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="mb-3 pb-3" 
                          style={{ borderBottom: index < lineItems.length - 1 ? '1px solid #e0e0e0' : 'none' }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1" style={{ 
                              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                              fontWeight: 600,
                              color: '#212529',
                              flex: 1
                            }}>
                              {item.serviceName}
                            </h6>
                            <p className="mb-0 ms-2" style={{ 
                              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                              fontWeight: 700,
                              color: '#000000',
                              whiteSpace: 'nowrap'
                            }}>
                              ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="d-flex gap-3" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#6c757d' }}>
                            <span><strong>QTY:</strong> {item.quantity}</span>
                            <span><strong>UNIT PRICE:</strong> ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Section */}
                    <div className="pt-3" style={{ borderTop: '3px solid #000000' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="mb-0" style={{ 
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          fontWeight: 500,
                          color: '#495057'
                        }}>
                          SUBTOTAL:
                        </p>
                        <p className="mb-0" style={{ 
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          fontWeight: 600,
                          color: '#212529'
                        }}>
                          ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <p className="mb-0" style={{ 
                          fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                          fontWeight: 700,
                          color: '#000000',
                          letterSpacing: '0.05em'
                        }}>
                          ESTIMATED TOTAL:
                        </p>
                        <p className="mb-0" style={{ 
                          fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                          fontWeight: 700,
                          color: '#000000'
                        }}>
                          ₱{estimatedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Footer Notes */}
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e0e0e0' }}>
                      <p className="mb-2" style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: '#495057',
                        lineHeight: 1.6
                      }}>
                        <strong style={{ color: '#000000' }}>Terms & Conditions:</strong>
                      </p>
                      <ul className="mb-0 ps-3" style={{ 
                        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                        color: '#6c757d',
                        lineHeight: 1.5
                      }}>
                        <li>This is an estimated quotation only and is subject to change</li>
                        <li>Final pricing will be confirmed upon booking confirmation</li>
                        <li>Quotation is valid for 7 days from the date of issue</li>
                        <li>A reservation fee may be required to secure your appointment</li>
                      </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-4 text-center">
                      <p className="mb-0" style={{ 
                        fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                        color: '#6c757d',
                        fontStyle: 'italic'
                      }}>
                        Thank you for choosing Glammed Nails by Jhen
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Controls - Only show in browser, not in download */}
              {lineItems.length > 0 && (
                <div className="card-footer bg-light border-top p-3 p-md-4">
                  <h6 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#212529' }}>
                    Edit Services
                  </h6>
                  <div className="row g-2">
                    {lineItems.map((item, index) => (
                      <div key={index} className="col-12">
                        <div className="d-flex align-items-center gap-2 bg-white border rounded p-3">
                          <div className="flex-grow-1">
                            <span className="fw-medium d-block" style={{ fontSize: '0.875rem', color: '#212529' }}>
                              {item.serviceName}
                            </span>
                            <small className="text-muted">
                              ₱{item.unitPrice.toLocaleString('en-PH')} × {item.quantity} = ₱{item.total.toLocaleString('en-PH')}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center gap-1">
                              <label htmlFor={`qty-${index}`} className="mb-0 text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                Qty:
                              </label>
                              <input
                                id={`qty-${index}`}
                                type="number"
                                className="form-control form-control-sm text-center"
                                style={{ width: '70px' }}
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                              onClick={() => handleRemoveItem(index)}
                              aria-label="Remove service"
                            >
                              <i className="bi bi-trash"></i>
                              <span className="d-none d-sm-inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
