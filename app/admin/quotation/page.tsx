'use client';

import { useEffect, useState } from 'react';

/**
 * Quotation Page - Pricing Estimation Tool Only
 * 
 * ============================================================================
 * STRICT SEPARATION RULES (NON-NEGOTIABLE):
 * ============================================================================
 * - NO relationship to bookings, customers, or invoices
 * - NO database persistence (data stored ONLY in page state)
 * - Data cleared on page refresh or navigation away
 * - Used ONLY for price estimation
 * - NO booking ID generation from quotations
 * - NO conversion of quotations to invoices
 * - NO reuse of quotation data when creating bookings
 * ============================================================================
 * 
 * This page is a temporary pricing calculator only.
 * All quotation data is ephemeral and never persisted.
 */

interface PricingItem {
  [key: string]: string | number; // Dynamic fields from Google Sheets
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  
  // Quotation state (page state only - cleared on refresh)
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch pricing data from Google Sheets on mount
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

  // Clear quotation data when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      // Cleanup: Clear quotation state
      setLineItems([]);
      setSelectedService('');
      setQuantity(1);
    };
  }, []);

  // Add service to quotation
  const handleAddService = () => {
    if (!selectedService) return;

    const service = pricingData.find((item) => {
      // Find by first column (usually service name)
      const firstKey = Object.keys(item)[0];
      return item[firstKey] === selectedService;
    });

    if (!service) return;

    // Extract price (look for Price, Amount, or numeric field)
    const priceKey = headers.find((h) => 
      h.toLowerCase().includes('price') || 
      h.toLowerCase().includes('amount') ||
      h.toLowerCase().includes('cost')
    ) || headers[1]; // Fallback to second column

    const unitPrice = parseFloat(String(service[priceKey] || 0)) || 0;
    const location = service['Location'] || service['location'] || '';
    const notes = service['Notes'] || service['notes'] || '';

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

  // Remove line item
  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Update quantity
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = [...lineItems];
    updated[index].quantity = newQuantity;
    updated[index].total = updated[index].unitPrice * newQuantity;
    setLineItems(updated);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const estimatedTotal = subtotal; // Add tax/discounts if needed

  // Get unique service names for dropdown
  const serviceNames = pricingData
    .map((item) => {
      const firstKey = Object.keys(item)[0];
      return String(item[firstKey] || '');
    })
    .filter((name) => name.trim() !== '');

  return (
    <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
            Quotation Calculator
          </h4>
        </div>

        {/* Disclaimer - Always visible */}
        <div className="alert alert-info mb-4" role="alert">
          <strong>Disclaimer:</strong> This quotation is for estimation only and is not a confirmed booking or invoice.
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
            <br />
            <small>Pricing calculations are disabled. Please check Google Sheets configuration.</small>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-muted">Loading pricing data...</div>
        )}

        {/* Main Content - Only show if pricing is available */}
        {available && !loading && (
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Add Services</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Service</label>
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
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <button
                    className="btn btn-dark"
                    onClick={handleAddService}
                    disabled={!selectedService}
                  >
                    Add to Quotation
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Price Breakdown</h5>
                </div>
                <div className="card-body">
                  {lineItems.length === 0 ? (
                    <p className="text-muted">No items added yet.</p>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Service</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  {item.serviceName}
                                  {item.location && (
                                    <br />
                                    <small className="text-muted">{item.location}</small>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: '60px' }}
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                                    }
                                  />
                                </td>
                                <td>₱{item.unitPrice.toFixed(2)}</td>
                                <td>₱{item.total.toFixed(2)}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 pt-3 border-top">
                        <div className="d-flex justify-content-between mb-2">
                          <strong>Subtotal:</strong>
                          <strong>₱{subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <strong>Estimated Total:</strong>
                          <strong>₱{estimatedTotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (Admin only - can be removed in production) */}
        {process.env.NODE_ENV === 'development' && available && (
          <div className="mt-4">
            <details>
              <summary className="text-muted small">Debug: Pricing Data Structure</summary>
              <pre className="bg-light p-3 mt-2 small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify({ headers, sampleItem: pricingData[0] }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
  );
}
