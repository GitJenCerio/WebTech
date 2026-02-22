'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { cleanCurrencyValue } from '@/lib/utils/currency';

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

  // New state for saved quotations
  const [savedQuotations, setSavedQuotations] = useState<any[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [showSavedQuotations, setShowSavedQuotations] = useState(false);
  const [savingQuotation, setSavingQuotation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quotationToDeleteId, setQuotationToDeleteId] = useState<string | null>(null);

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

  // Fetch saved quotations
  useEffect(() => {
    if (showSavedQuotations) {
      fetchSavedQuotations();
    }
  }, [showSavedQuotations]);

  async function fetchSavedQuotations() {
    try {
      setQuotationsLoading(true);
      const response = await fetch('/api/quotations');
      if (!response.ok) throw new Error('Failed to load quotations');
      
      const data = await response.json();
      setSavedQuotations(data.quotations || []);
    } catch (err: any) {
      console.error('Error loading quotations:', err);
    } finally {
      setQuotationsLoading(false);
    }
  }

  async function handleSaveQuotation() {
    if (lineItems.length === 0) {
      toast.error('Please add at least one service before saving.');
      return;
    }

    if (!clientName.trim()) {
      toast.error('Please enter a client name.');
      return;
    }

    try {
      setSavingQuotation(true);
      setSaveError(null);

      const payload = {
        customerName: clientName.trim(),
        items: lineItems.map(item => ({
          description: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal,
        totalAmount: estimatedTotal,
        ...(currentQuotationId && { id: currentQuotationId }),
      };

      const url = currentQuotationId 
        ? `/api/quotations/${currentQuotationId}`
        : '/api/quotations';
      
      const method = currentQuotationId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save quotation');
      }

      const data = await response.json();
      setCurrentQuotationId(data.quotation._id || data.quotation.id);
      
      toast.success(currentQuotationId ? 'Quotation updated successfully!' : 'Quotation saved successfully!');
      
      // Refresh saved quotations if viewing them
      if (showSavedQuotations) {
        fetchSavedQuotations();
      }
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      setSaveError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSavingQuotation(false);
    }
  }

  async function handleLoadQuotation(quotation: any) {
    setClientName(quotation.customerName);
    setLineItems(quotation.items.map((item: any) => ({
      serviceName: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      location: '',
      notes: '',
    })));
    setCurrentQuotationId(quotation._id || quotation.id);
    setShowSavedQuotations(false);
  }

  function handleRequestDeleteQuotation(id: string) {
    setQuotationToDeleteId(id);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDeleteQuotation() {
    const id = quotationToDeleteId;
    if (!id) return;
    setQuotationToDeleteId(null);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete quotation');

      toast.success('Quotation deleted successfully!');
      setDeleteConfirmOpen(false);
      fetchSavedQuotations();
      
      if (currentQuotationId === id) {
        handleNewQuotation();
      }
    } catch (err: any) {
      console.error('Error deleting quotation:', err);
      toast.error(`Error: ${err.message}`);
    }
  }

  function handleNewQuotation() {
    setLineItems([]);
    setClientName('');
    setCurrentQuotationId(null);
    setShowSavedQuotations(false);
  }

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
      toast.error('Please add at least one service to the quotation.');
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
      toast.error('Failed to generate quotation image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="px-2 sm:px-4 py-6">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent" role="status" aria-label="Loading" />
          <p className="mt-3 text-sm text-gray-500">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            className="h-9 px-4 text-sm rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] hover:border-[#1a1a1a]/30 hover:bg-white transition-all flex items-center gap-2"
            onClick={() => setShowSavedQuotations(!showSavedQuotations)}
          >
            <i className={`bi bi-${showSavedQuotations ? 'calculator' : 'folder'}`}></i>
            {showSavedQuotations ? 'New Quotation' : 'Saved Quotations'}
          </button>
          {!showSavedQuotations && lineItems.length > 0 && (
            <>
              <button
                className="h-9 px-4 text-sm rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveQuotation}
                disabled={savingQuotation || !clientName.trim()}
              >
                {savingQuotation ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save"></i>
                    {currentQuotationId ? 'Update' : 'Save'} Quotation
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  className="h-9 px-4 text-sm rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleDownloadQuotation('png')}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Download PNG'}
                </button>
                <button
                  className="h-9 px-4 text-sm rounded-xl border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#f9f9f9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleDownloadQuotation('jpeg')}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Download JPEG'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showSavedQuotations ? (
        <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6">
            {quotationsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent" role="status" aria-label="Loading" />
                <p className="mt-2 text-sm text-gray-500">Loading saved quotations...</p>
              </div>
            ) : savedQuotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <i className="bi bi-folder-x text-5xl text-gray-400"></i>
                <p className="mt-3 text-sm text-gray-500">No saved quotations found.</p>
                <button
                  className="mt-3 h-9 px-4 text-sm rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all flex items-center gap-2"
                  onClick={handleNewQuotation}
                >
                  <i className="bi bi-plus-circle"></i>
                  Create New Quotation
                </button>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e5e5]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quotation #</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedQuotations.map((quotation) => (
                      <tr key={quotation._id || quotation.id}>
                        <td>
                          <code className="text-dark">{quotation.quotationNumber}</code>
                        </td>
                        <td className="fw-semibold">{quotation.customerName}</td>
                        <td>{quotation.items?.length || 0} item(s)</td>
                        <td className="fw-semibold">
                          ₱{(quotation.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <span className={`badge ${
                            quotation.status === 'accepted' ? 'bg-success' :
                            quotation.status === 'sent' ? 'bg-primary' :
                            quotation.status === 'expired' ? 'bg-danger' :
                            'bg-secondary'
                          }`}>
                            {quotation.status || 'draft'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-dark"
                              onClick={() => handleLoadQuotation(quotation)}
                              title="Load quotation"
                            >
                              <i className="bi bi-box-arrow-up-right"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleRequestDeleteQuotation(quotation._id || quotation.id)}
                              title="Delete quotation"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden p-4 space-y-3">
                {savedQuotations.map((quotation) => (
                  <div
                    key={quotation._id || quotation.id}
                    className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <code className="text-sm font-medium text-[#1a1a1a]">{quotation.quotationNumber}</code>
                        <p className="font-medium text-[#1a1a1a] mt-1">{quotation.customerName}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                        quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        quotation.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-[#f5f5f5] text-[#1a1a1a]'
                      }`}>
                        {quotation.status || 'draft'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs">Items</span>
                        <p className="text-[#1a1a1a]">{quotation.items?.length || 0} item(s)</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Total</span>
                        <p className="text-[#1a1a1a] font-medium">₱{(quotation.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Created</span>
                        <p className="text-[#1a1a1a]">{new Date(quotation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        className="flex-1 h-10 flex items-center justify-center rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#f9f9f9] transition-all"
                        onClick={() => handleLoadQuotation(quotation)}
                      >
                        Load
                      </button>
                      <button
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                        onClick={() => handleRequestDeleteQuotation(quotation._id || quotation.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] px-4 py-3 text-sm text-[#1a1a1a]" role="alert">
            <strong>Disclaimer:</strong> This quotation is for estimation only and is not a confirmed booking or invoice.
          </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <strong>Error:</strong> {error}
          <br />
          <small>Pricing calculations are disabled. Please check Google Sheets configuration.</small>
        </div>
      )}

      {available && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column - Add Services */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl h-full">
              <CardHeader className="p-5 pb-0">
                <h5 className="text-base font-semibold text-[#1a1a1a]">Add Services</h5>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                    Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 text-sm rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
                    placeholder="Enter client name..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <small className="text-gray-500 text-xs mt-1 block">Will appear on the quotation</small>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                    Service
                  </label>
                  <Select value={selectedService || '_placeholder'} onValueChange={(v) => setSelectedService(v === '_placeholder' ? '' : v)}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_placeholder">Select a service...</SelectItem>
                      {serviceNames.map((name, idx) => (
                        <SelectItem key={idx} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 text-sm rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <button
                  className="w-full h-10 text-sm font-medium rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddService}
                  disabled={!selectedService}
                >
                  Add to Quotation
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quotation Preview */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
              <div className="p-0">
                {lineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <i className="bi bi-file-earmark-text text-5xl text-gray-400"></i>
                    <p className="text-gray-500 mt-3 mb-0">No items added yet.</p>
                    <small className="text-gray-400">Add services to generate quotation</small>
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
                    <div className="text-center mb-4 pb-3 border-b-[3px] border-[#1a1a1a]">
                      <h1 className="mb-0 text-[#1a1a1a]" style={{ 
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 700,
                        fontSize: 'clamp(1.75rem, 5vw, 3rem)',
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
                            <strong className="text-[#1a1a1a]">Client:</strong> {clientName}
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
                      <div className="mb-3 pb-2 border-b-2 border-[#1a1a1a]">
                        <h5 className="mb-0" style={{ 
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          fontWeight: 700,
                          color: '#1a1a1a',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          Services
                        </h5>
                      </div>

                      {lineItems.map((item, index) => (
                        <div
                          key={index}
                          className={`mb-3 pb-3 ${index < lineItems.length - 1 ? 'border-b border-[#e5e5e5]' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="mb-1 flex-1" style={{ 
                              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                              fontWeight: 600,
                              color: '#212529',
                              flex: 1
                            }}>
                              {item.serviceName}
                            </h6>
                            <p className="mb-0 ml-2 shrink-0" style={{ 
                              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                              fontWeight: 700,
                              color: '#1a1a1a',
                              whiteSpace: 'nowrap'
                            }}>
                              ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="flex gap-3 text-sm text-gray-500" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                            <span><strong>QTY:</strong> {item.quantity}</span>
                            <span><strong>UNIT PRICE:</strong> ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Section */}
                    <div className="pt-3 border-t-[3px] border-[#1a1a1a]">
                      <div className="flex justify-between items-center mb-2">
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
                      <div className="flex justify-between items-center">
                        <p className="mb-0" style={{ 
                          fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                          fontWeight: 700,
                          color: '#1a1a1a',
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
                    <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
                      <p className="mb-2" style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: '#495057',
                        lineHeight: 1.6
                      }}>
                        <strong className="text-[#1a1a1a]">Terms & Conditions:</strong>
                      </p>
                      <ul className="mb-0 ps-3" style={{ 
                        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                        color: '#6c757d',
                        lineHeight: 1.5
                      }}>
                        <li>This is an estimated quotation only and is subject to change, Final pricing will be confirmed upon booking confirmation</li>
                        <li>Quotation is valid for 7 days from the date of issue</li>
                        <li>A reservation fee is required to secure your appointment</li>
                      </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-4 text-center">
                      <p className="mb-0" style={{ 
                        fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                        color: '#6c757d',
                        fontStyle: 'italic'
                      }}>
                        Thank you for choosing glammednailsbyjhen
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Controls - Only show in browser, not in download */}
              {lineItems.length > 0 && (
                <CardFooter className="flex-col items-stretch gap-3 p-5 pt-0 border-t border-[#e5e5e5] bg-[#fafafa]">
                  <h6 className="text-sm font-semibold text-[#1a1a1a]">
                    Edit Services
                  </h6>
                  <div className="space-y-2">
                    {lineItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-[#e5e5e5] bg-white"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[#1a1a1a]">
                            {item.serviceName}
                          </span>
                          <small className="text-gray-500 text-xs">
                            ₱{item.unitPrice.toLocaleString('en-PH')} × {item.quantity} = ₱{item.total.toLocaleString('en-PH')}
                          </small>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`qty-${index}`} className="text-xs text-gray-500 whitespace-nowrap">
                              Qty:
                            </label>
                            <input
                              id={`qty-${index}`}
                              type="number"
                              className="h-8 w-[70px] text-center text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <button
                            className="h-8 px-3 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center gap-1.5"
                            onClick={() => handleRemoveItem(index)}
                            aria-label="Remove service"
                          >
                            <i className="bi bi-trash"></i>
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      )}
      </>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setQuotationToDeleteId(null);
        }}
        title="Delete quotation"
        description="Are you sure you want to delete this quotation?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => handleConfirmDeleteQuotation()}
      />
    </div>
  );
}
