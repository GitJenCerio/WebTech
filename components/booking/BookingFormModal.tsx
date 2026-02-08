'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, User, AlertCircle, ArrowLeft, Upload, Info } from 'lucide-react';

type ClientType = 'new' | 'repeat';

interface BookingFormModalProps {
  isOpen: boolean;
  clientType: ClientType;
  clientName?: string;
  clientContactNumber?: string;
  clientSocialMediaName?: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    contactNumber: string;
    socialMediaName: string;
    howDidYouFindUs: string;
    howDidYouFindUsOther?: string;
    currentNailPicture?: File;
    inspoPictures: File[];
    hasRussianManicure: string;
    hasGelOverlay: string;
    hasSoftgelExtensions: string;
    allergies: string;
    nailConcerns: string;
    nailDamageHistory: string;
    services: string[];
    inspoDescription: string;
    waiverAccepted: string;
    rulesAccepted: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function BookingFormModal({
  isOpen,
  clientType,
  clientName,
  clientContactNumber,
  clientSocialMediaName,
  onClose,
  onSubmit,
  isSubmitting = false,
}: BookingFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState(clientName || '');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState(clientContactNumber || '');
  const [socialMediaName, setSocialMediaName] = useState(clientSocialMediaName || '');
  const [howDidYouFindUs, setHowDidYouFindUs] = useState('');
  const [howDidYouFindUsOther, setHowDidYouFindUsOther] = useState('');
  const [currentNailPicture, setCurrentNailPicture] = useState<File | undefined>();
  const [inspoPictures, setInspoPictures] = useState<File[]>([]);
  const [hasRussianManicure, setHasRussianManicure] = useState('');
  const [hasGelOverlay, setHasGelOverlay] = useState('');
  const [hasSoftgelExtensions, setHasSoftgelExtensions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [nailConcerns, setNailConcerns] = useState('');
  const [nailDamageHistory, setNailDamageHistory] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [inspoDescription, setInspoDescription] = useState('');
  const [waiverAccepted, setWaiverAccepted] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  // Reset form state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setName(clientName || '');
      setContactNumber(clientContactNumber || '');
      setSocialMediaName(clientSocialMediaName || '');
      setEmail('');
      setHowDidYouFindUs('');
      setHowDidYouFindUsOther('');
      setCurrentNailPicture(undefined);
      setInspoPictures([]);
      setHasRussianManicure('');
      setHasGelOverlay('');
      setHasSoftgelExtensions('');
      setAllergies('');
      setNailConcerns('');
      setNailDamageHistory('');
      setServices([]);
      setInspoDescription('');
      setWaiverAccepted('');
      setRulesAccepted(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isRepeatFound = clientType === 'repeat' && !!clientName;

  const handleInspoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 3);
      setInspoPictures(fileArray);
    }
  };

  const handleServiceToggle = (service: string) => {
    setServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1: // Contact Information
        if (!name.trim()) {
          setError('Full name is required');
          return false;
        }
        if (!email.trim()) {
          setError('Email address is required');
          return false;
        }
        if (!contactNumber.trim()) {
          setError('Contact number is required');
          return false;
        }
        if (!socialMediaName.trim()) {
          setError('Facebook or Instagram name is required');
          return false;
        }
        if (!howDidYouFindUs) {
          setError('Please select how you found out about us');
          return false;
        }
        if (howDidYouFindUs === 'other' && !howDidYouFindUsOther.trim()) {
          setError('Please specify how you found out about us');
          return false;
        }
        return true;

      case 2: // Nail History & Health
        if (!hasRussianManicure) {
          setError('Please answer the Russian Technique Dry Manicure question');
          return false;
        }
        if (!hasGelOverlay) {
          setError('Please answer the Gel/Biab/Hardgel Overlay question');
          return false;
        }
        if (!hasSoftgelExtensions) {
          setError('Please answer the Softgel Nail Extensions question');
          return false;
        }
        if (!nailConcerns.trim()) {
          setError('Please specify any nail concerns (or write "None")');
          return false;
        }
        return true;

      case 3: // Nail Pictures (optional, always valid)
        return true;

      case 4: // Services
        if (services.length === 0) {
          setError('Please select at least one service');
          return false;
        }
        return true;

      case 5: // Waiver
        if (!waiverAccepted) {
          setError('Please acknowledge the waiver');
          return false;
        }
        if (waiverAccepted === 'disagree') {
          setError('You must accept the waiver terms to proceed. Please contact us if you have concerns.');
          return false;
        }
        return true;

      case 6: // Rules
        if (!rulesAccepted) {
          setError('You must acknowledge and accept the rules and reservation instructions');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    // Final submission
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        socialMediaName: socialMediaName.trim(),
        howDidYouFindUs,
        howDidYouFindUsOther: howDidYouFindUs === 'other' ? howDidYouFindUsOther.trim() : undefined,
        currentNailPicture,
        inspoPictures,
        hasRussianManicure,
        hasGelOverlay,
        hasSoftgelExtensions,
        allergies: allergies.trim() || 'None',
        nailConcerns: nailConcerns.trim(),
        nailDamageHistory: nailDamageHistory.trim() || 'None',
        services,
        inspoDescription: inspoDescription.trim(),
        waiverAccepted,
        rulesAccepted,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-2 border-gray-300 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl my-2 sm:my-4 max-h-[95vh] overflow-y-auto relative"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation z-10"
          aria-label="Close"
          type="button"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </button>

        {/* Progress Indicator */}
        <div className="mb-4 sm:mb-6 pr-8 sm:pr-10">
          <h3 className="text-lg sm:text-2xl font-semibold mb-1 sm:mb-2 text-gray-900">
            Complete Your Booking
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Step {currentStep} of {totalSteps}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-black h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Repeat Client Welcome */}
        {isRepeatFound && currentStep === 1 && (
          <div className="rounded-lg border-2 border-green-300 bg-green-50 px-3 py-2 sm:px-4 sm:py-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-green-800">
              <strong>Welcome back, {clientName}!</strong>
            </p>
            <p className="text-[10px] sm:text-xs text-green-700 mt-1">
              Your details have been pre-filled. You can update them if needed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* STEP 1: Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">Contact Information</h4>
              
              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 flex items-center gap-2 block">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Maria Santos"
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 flex items-center gap-2 block">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., maria@example.com"
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 flex items-center gap-2 block">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., 09123456789"
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  Facebook or Instagram Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={socialMediaName}
                  onChange={(e) => {
                    setSocialMediaName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Maria Santos or @maria.nails"
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  How did you find out about us? <span className="text-red-500">*</span>
                </label>
                <select
                  value={howDidYouFindUs}
                  onChange={(e) => {
                    setHowDidYouFindUs(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="referral">Referred by someone</option>
                  <option value="other">Other</option>
                </select>
                
                {howDidYouFindUs === 'other' && (
                  <input
                    type="text"
                    value={howDidYouFindUsOther}
                    onChange={(e) => setHowDidYouFindUsOther(e.target.value)}
                    placeholder="Please specify"
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors mt-2"
                    disabled={isSubmitting}
                    required
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Nail History & Health */}
          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">Nail History & Health</h4>
              
              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1.5 sm:mb-2 block">
                  Have you ever had a Russian Technique Dry Manicure? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="russianManicure"
                      value="yes"
                      checked={hasRussianManicure === 'yes'}
                      onChange={(e) => setHasRussianManicure(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="russianManicure"
                      value="no"
                      checked={hasRussianManicure === 'no'}
                      onChange={(e) => setHasRussianManicure(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1.5 sm:mb-2 block">
                  Have you ever had Gel/Biab/Hardgel Overlay? <span className="text-red-500">*</span>
                </label>
                <div className="p-2 sm:p-3 bg-blue-50 border-2 border-blue-200 rounded-lg mb-2">
                  <p className="text-[10px] sm:text-xs text-blue-800 flex items-start gap-1.5 sm:gap-2">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Gel/Biab/Hardgel Overlay is a thin layer of gel applied directly onto natural nails to add strength and protection.
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gelOverlay"
                      value="yes"
                      checked={hasGelOverlay === 'yes'}
                      onChange={(e) => setHasGelOverlay(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gelOverlay"
                      value="no"
                      checked={hasGelOverlay === 'no'}
                      onChange={(e) => setHasGelOverlay(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1.5 sm:mb-2 block">
                  Have you ever had Softgel Nail Extensions? <span className="text-red-500">*</span>
                </label>
                <div className="p-2 sm:p-3 bg-blue-50 border-2 border-blue-200 rounded-lg mb-2">
                  <p className="text-[10px] sm:text-xs text-blue-800 flex items-start gap-1.5 sm:gap-2">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Softgel extensions (Gel-X) are pre-formed gel tips adhered to natural nails for longer and more durable nails.
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="softgelExtensions"
                      value="yes"
                      checked={hasSoftgelExtensions === 'yes'}
                      onChange={(e) => setHasSoftgelExtensions(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="softgelExtensions"
                      value="no"
                      checked={hasSoftgelExtensions === 'no'}
                      onChange={(e) => setHasSoftgelExtensions(e.target.value)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  Do you have any allergies or sensitivities to nail products?
                </label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Please specify any allergies or sensitivities, or write 'None'"
                  rows={2}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  Are there any specific nail concerns you would like to address? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={nailConcerns}
                  onChange={(e) => {
                    setNailConcerns(e.target.value);
                    setError(null);
                  }}
                  placeholder="Describe any nail concerns, or write 'None'"
                  rows={2}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors resize-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  Have you experienced any nail damage or infections in the past?
                </label>
                <textarea
                  value={nailDamageHistory}
                  onChange={(e) => setNailDamageHistory(e.target.value)}
                  placeholder="Please describe any past nail damage or infections, or write 'None'"
                  rows={2}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Nail Pictures */}
          {currentStep === 3 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">Nail Pictures</h4>
              
              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 flex items-center gap-2 block">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  Upload Current Picture of Nail
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurrentNailPicture(e.target.files?.[0])}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 flex items-center gap-2 block">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  Upload Nail Inspo (up to 3 images)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInspoUpload}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                />
                {inspoPictures.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    {inspoPictures.length} file(s) selected
                  </p>
                )}
                <div className="mt-2 p-2 sm:p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-blue-800">
                    <strong>Note:</strong> Please upload your nail inspiration in advance.
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                    Google Drive: <a href="https://drive.google.com/drive/folders/1-NylMKbBkoXiD18FxLrSgBVDzCfvOdJN" target="_blank" rel="noopener noreferrer" className="underline">View Inspo Gallery</a>
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                    ⚠️ AVOID CHANGING YOUR NAIL INSPO ON THE DAY OF THE APPOINTMENT
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 font-medium mb-1 sm:mb-2 block">
                  If you don&apos;t have nail inspo, describe how you want it to look
                </label>
                <textarea
                  value={inspoDescription}
                  onChange={(e) => setInspoDescription(e.target.value)}
                  placeholder="Describe your desired nail look..."
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Services */}
          {currentStep === 4 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">
                Services <span className="text-red-500">*</span>
              </h4>
              
              <div className="p-2 sm:p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-[10px] sm:text-xs text-yellow-900">
                  <strong>⏱️ Important:</strong> Detailed nail designs require time and precision. The entire procedure can take 3-4 hours. Rushing compromises quality.
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('removal')}
                    onChange={() => handleServiceToggle('removal')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>REMOVAL</strong> (30mins - 1hr)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('cleaning')}
                    onChange={() => handleServiceToggle('cleaning')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>Cleaning Only</strong> (Russian Technique)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('without-extensions')}
                    onChange={() => handleServiceToggle('without-extensions')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>WITHOUT EXTENSIONS</strong> - BIAB/Gel Overlay w/ Russian Manicure (2 hours)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('with-extensions')}
                    onChange={() => handleServiceToggle('with-extensions')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>WITH EXTENSIONS</strong> - Softgel Nail Extensions w/ Russian Manicure (3 hours)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('russian-pedicure')}
                    onChange={() => handleServiceToggle('russian-pedicure')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>RUSSIAN PEDICURE GEL OVERLAY</strong> (1-2 hours)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('minimal-design')}
                    onChange={() => handleServiceToggle('minimal-design')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>+ Minimal Design</strong> (Additional 30mins - 1hr)
                  </span>
                </label>

                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={services.includes('intricate-design')}
                    onChange={() => handleServiceToggle('intricate-design')}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>+ Intricate Design</strong> (Additional 1hr)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Waiver */}
          {currentStep === 5 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">
                Waiver for Clients <span className="text-red-500">*</span>
              </h4>
              
              <div className="p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-800">
                <p><strong>Dear Client,</strong></p>
                <p>Before your appointment, please acknowledge the following:</p>
                
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 pl-1 sm:pl-2">
                  <li>If you have allergies to nail products, kindly inform me. I will not be liable for any allergic reactions.</li>
                  <li>For diabetic clients: Russian manicure may carry a small risk of injury. While I will handle with care, I cannot be held responsible if a wound occurs.</li>
                </ol>

                <p className="pt-1 sm:pt-2">By proceeding, you accept these risks and understand my responsibility is limited.</p>
                <p className="font-medium">Thank you for your trust and understanding.</p>
                <p className="italic">– Jhen Cerio, glammednailsbyjhen</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <label className="flex items-start gap-1.5 sm:gap-2 cursor-pointer flex-1 p-2 border-2 border-gray-300 rounded-lg hover:border-gray-400">
                  <input
                    type="radio"
                    name="waiver"
                    value="accept"
                    checked={waiverAccepted === 'accept'}
                    onChange={(e) => {
                      setWaiverAccepted(e.target.value);
                      setError(null);
                    }}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">I acknowledge and accept the terms</span>
                </label>
                <label className="flex items-start gap-1.5 sm:gap-2 cursor-pointer flex-1 p-2 border-2 border-gray-300 rounded-lg hover:border-gray-400">
                  <input
                    type="radio"
                    name="waiver"
                    value="disagree"
                    checked={waiverAccepted === 'disagree'}
                    onChange={(e) => setWaiverAccepted(e.target.value)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">I don&apos;t agree</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Rules & Instructions */}
          {currentStep === 6 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">
                Rules & Reservation Instructions
              </h4>
              
              <div className="p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-800 max-h-[40vh] overflow-y-auto">
                <p className="font-semibold text-sm sm:text-base">PLEASE READ CAREFULLY</p>
                
                <p>Thank you for choosing glammednailsbyjhen 💅</p>

                <div className="space-y-1.5 sm:space-y-2">
                  <p><strong>📍 Location:</strong> 701-B Carola St., Sampaloc Manila</p>
                  <p className="text-[10px] sm:text-xs">(Pin: Granma Laundry Shoppe)</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <p><strong>⏰ Be on time</strong> — not too early, not late. Come exactly at your scheduled time.</p>
                  <ul className="list-disc list-inside pl-2 sm:pl-4 text-[10px] sm:text-xs space-y-0.5">
                    <li>15 mins late = ₱200 fee</li>
                    <li>30 mins late = Appointment cancelled</li>
                    <li>Reschedule allowed 2 days before only, with ₱100 fee</li>
                  </ul>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <p><strong>💵 Reservation deposit:</strong> ₱500</p>
                  <p className="text-[10px] sm:text-xs">Send proof via my FB Page: glammednailsbyjhen</p>
                  <p className="text-[10px] sm:text-xs">📲 GCash: 09451781774 – Jennilyn C.</p>
                  <p className="text-[10px] sm:text-xs">🏦 PNB: Jennilyn Cerio – 120110082823</p>
                </div>

                <p><strong>📅 Your slot is confirmed only after the deposit is sent.</strong></p>
                <p><strong>💖 Balance will be settled after your appointment.</strong></p>
                
                <p className="pt-1 sm:pt-2">Looking forward to glamming your nails!</p>
                <p className="italic">– Jhen</p>
              </div>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer p-2.5 sm:p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => {
                    setRulesAccepted(e.target.checked);
                    setError(null);
                  }}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1"
                  disabled={isSubmitting}
                />
                <span className="text-xs sm:text-sm text-gray-700">
                  <strong className="text-red-600">*</strong> I have read and accept all the rules, reservation instructions, and downpayment requirements above.
                </span>
              </label>

              <div className="rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-xs sm:text-sm text-blue-900">
                  <strong>📝 After Submission:</strong> Your booking is pending until you upload payment proof to confirm your slot.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2 sm:px-4 sm:py-3 flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 active:scale-[0.98] transition-all disabled:opacity-60 touch-manipulation text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation text-xs sm:text-sm"
            >
              {isSubmitting ? 'Submitting...' : currentStep === totalSteps ? 'Submit Booking' : 'Next'}
            </button>
          </div>

          {currentStep === 1 && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-60 touch-manipulation text-xs sm:text-sm"
            >
              Cancel
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
