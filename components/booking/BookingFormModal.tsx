'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getChosenServicesDisplay } from '@/lib/serviceLabels';
import {
  X,
  Phone,
  Mail,
  User,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Upload,
  Info,
  MapPin,
  Clock,
  CreditCard,
  Wallet,
  CalendarCheck,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { SocialMediaPlatform } from '@/lib/utils/socialMedia';
import {
  DEPOSIT_PER_SLOT,
  LATE_ARRIVAL_CANCEL_MINUTES,
  LATE_ARRIVAL_FEE,
  LATE_ARRIVAL_GRACE_MINUTES,
  MANI_PEDI_EXPRESS_FEE,
  PROOF_OF_PAYMENT_WINDOW_HOURS,
  RESCHEDULE_FEE,
  RESCHEDULE_NOTICE_DAYS,
  STUDIO_ADDRESS,
  formatPeso,
} from '@/lib/constants/policy';

type ClientType = 'new' | 'repeat';

interface BookingFormModalProps {
  isOpen: boolean;
  slotCount?: number; // Total slots for deposit calc: ₱500 per slot
  isManiPediExpress?: boolean;
  clientType: ClientType;
  serviceLocation?: 'homebased_studio' | 'home_service';
  clientName?: string;
  clientEmail?: string;
  clientContactNumber?: string;
  clientSocialMediaName?: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    contactNumber: string;
    socialMediaName: string;
    socialMediaPlatform?: 'facebook' | 'instagram';
    address?: string;
    howDidYouFindUs: string;
    howDidYouFindUsOther?: string;
    currentNailPictures: File[];
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
  slotCount = 1,
  isManiPediExpress = false,
  clientType,
  serviceLocation = 'homebased_studio',
  clientName,
  clientEmail,
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
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | ''>('');
  const [address, setAddress] = useState('');
  const [howDidYouFindUs, setHowDidYouFindUs] = useState('');
  const [howDidYouFindUsOther, setHowDidYouFindUsOther] = useState('');
  const [currentNailPictures, setCurrentNailPictures] = useState<File[]>([]);
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

  const isRepeatFound = clientType === 'repeat' && !!clientName;
  const totalSteps = isRepeatFound ? 5 : 6; // Repeat: Contact, Nail Pictures, Services, Waiver, Rules

  // Reset form state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setName(clientName || '');
      setContactNumber(clientContactNumber || '');
      setSocialMediaName(clientSocialMediaName || '');
      setSocialMediaPlatform('');
      setEmail(clientEmail || '');
      setHowDidYouFindUs('');
      setHowDidYouFindUsOther('');
      setCurrentNailPictures([]);
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
      setAddress('');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientName, clientEmail, clientContactNumber, clientSocialMediaName]);

  if (!isOpen) return null;

  const handleInspoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setInspoPictures(Array.from(files).slice(0, 3));
    }
  };

  const handleCurrentNailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setCurrentNailPictures(Array.from(files).slice(0, 3));
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

    if (isRepeatFound) {
      // Repeat: 1=Contact, 2=Nail Pictures, 3=Services, 4=Waiver, 5=Rules
      switch (step) {
        case 1:
          if (!name.trim()) { setError('Full name is required'); return false; }
          if (!email.trim()) { setError('Email address is required'); return false; }
          if (!contactNumber.trim()) { setError('Contact number is required'); return false; }
          if (!socialMediaName.trim()) { setError('Facebook or Instagram name is required'); return false; }
          if (serviceLocation === 'home_service' && !address.trim()) {
            setError('Please provide your address for the home service appointment');
            return false;
          }
          return true;
        case 2:
          return true; // Nail Pictures (optional)
        case 3:
          if (services.length === 0) { setError('Please select at least one service'); return false; }
          return true;
        case 4:
          if (!waiverAccepted) { setError('Please acknowledge the waiver'); return false; }
          if (waiverAccepted === 'disagree') { setError('You must accept the waiver terms to proceed.'); return false; }
          return true;
        case 5:
          if (!rulesAccepted) { setError('You must acknowledge and accept the rules'); return false; }
          return true;
        default:
          return true;
      }
    }

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
        if (!socialMediaPlatform) {
          setError('Please choose Facebook or Instagram');
          return false;
        }
        if (!socialMediaName.trim()) {
          setError(socialMediaPlatform === 'instagram' ? 'Instagram name is required' : 'Facebook name is required');
          return false;
        }
        if (serviceLocation === 'home_service' && !address.trim()) {
          setError('Please provide your address for the home service appointment');
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
        socialMediaPlatform: isRepeatFound ? undefined : (socialMediaPlatform || undefined),
        ...(serviceLocation === 'home_service' && address.trim() ? { address: address.trim() } : {}),
        howDidYouFindUs: isRepeatFound ? 'repeat' : howDidYouFindUs,
        howDidYouFindUsOther: isRepeatFound ? undefined : (howDidYouFindUs === 'other' ? howDidYouFindUsOther.trim() : undefined),
        currentNailPictures: currentNailPictures,
        inspoPictures: inspoPictures,
        hasRussianManicure: isRepeatFound ? 'yes' : hasRussianManicure,
        hasGelOverlay: isRepeatFound ? 'yes' : hasGelOverlay,
        hasSoftgelExtensions: isRepeatFound ? 'yes' : hasSoftgelExtensions,
        allergies: isRepeatFound ? 'None' : (allergies.trim() || 'None'),
        nailConcerns: isRepeatFound ? 'None' : nailConcerns.trim(),
        nailDamageHistory: isRepeatFound ? 'None' : (nailDamageHistory.trim() || 'None'),
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
    <div className="brand-modal-backdrop z-50">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="brand-modal brand-modal-panel max-w-2xl"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="brand-icon-btn absolute top-3 right-3 z-30"
          aria-label="Close"
          type="button"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        {/* The form owns the column so the submit row can sit in a pinned
            footer while staying inside the form. */}
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
          <div className="brand-modal-scroll brand-modal-body">
            {/* Progress Indicator */}
            <div className="mb-4 pr-9">
              <p className="brand-eyebrow mb-1">
                Step {currentStep} of {totalSteps}
              </p>
              <h3 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2.5">
                Complete Your Booking
              </h3>

              {/* Progress Bar */}
              <div className="w-full bg-[#e7e2db] h-[3px]">
                <div
                  className="h-[3px] transition-all duration-500"
                  style={{
                    width: `${(currentStep / totalSteps) * 100}%`,
                    background: 'linear-gradient(90deg, #c4b5a0 0%, #1c1917 100%)',
                  }}
                />
              </div>
            </div>

            {/* Repeat Client Welcome */}
            {isRepeatFound && currentStep === 1 && (
              <div className="brand-note mb-4">
                <p className="font-heading text-lg text-[#1c1917]">Welcome back, {clientName}.</p>
                <p className="text-xs sm:text-sm mt-1">
                  Your details have been pre-filled. You can update them if needed.
                </p>
              </div>
            )}
            {isManiPediExpress && (
              <div className="brand-note-strong mb-4 flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Mani + Pedi Express notice:</span> An additional fee of{' '}
                  {formatPeso(MANI_PEDI_EXPRESS_FEE)} applies for Mani + Pedi Express.
                </p>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
          {/* STEP 1: Contact Information (both new and repeat) */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">
                {isRepeatFound ? 'Confirm Your Details' : 'Contact Information'}
              </h4>
              
              <div>
                <label className="brand-label flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#c4b5a0]" />
                  Full Name <span className="text-[#5a3830]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Maria Santos"
                  className="brand-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="brand-label flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#c4b5a0]" />
                  Email Address <span className="text-[#5a3830]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., maria@example.com"
                  className="brand-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="brand-label flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#c4b5a0]" />
                  Contact Number <span className="text-[#5a3830]">*</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., 09123456789"
                  className="brand-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                {isRepeatFound ? (
                  <>
                    <label className="brand-label">
                      Facebook or Instagram Name <span className="text-[#5a3830]">*</span>
                    </label>
                    <input
                      type="text"
                      value={socialMediaName}
                      onChange={(e) => {
                        setSocialMediaName(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g., Maria Santos or @maria.nails"
                      className="brand-field"
                      disabled={isSubmitting}
                      required
                    />
                  </>
                ) : (
                  <>
                    <label className="brand-label">
                      Social media <span className="text-[#5a3830]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {([
                        { value: 'facebook', label: 'Facebook' },
                        { value: 'instagram', label: 'Instagram' },
                      ] as const).map((option) => {
                        const selected = socialMediaPlatform === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSocialMediaPlatform(option.value);
                              setError(null);
                            }}
                            disabled={isSubmitting}
                            className={`px-3 py-2.5 text-sm border transition-all duration-300 touch-manipulation ${
                              selected
                                ? 'border-[#1c1917] bg-[#1c1917] text-[#fffcfa]'
                                : 'border-[#e7e2db] bg-[#fffcfa] text-[#1c1917] hover:border-[#c4b5a0]'
                            }`}
                            aria-pressed={selected}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={socialMediaName}
                      onChange={(e) => {
                        setSocialMediaName(e.target.value);
                        setError(null);
                      }}
                      placeholder={
                        socialMediaPlatform === 'instagram'
                          ? 'e.g., @maria.nails'
                          : socialMediaPlatform === 'facebook'
                            ? 'e.g., Maria Santos'
                            : 'Choose Facebook or Instagram first'
                      }
                      className="brand-field"
                      disabled={isSubmitting || !socialMediaPlatform}
                      required
                    />
                  </>
                )}
              </div>

              {serviceLocation === 'home_service' && (
                <div>
                  <label className="brand-label flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#c4b5a0]" />
                    Address for home service <span className="text-[#5a3830]">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g., Street, Barangay, City"
                    rows={2}
                    className="brand-field resize-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}

              {/* How did you find us - new clients only */}
              {!isRepeatFound && (
                <div>
                  <label className="brand-label">
                    How did you find out about us? <span className="text-[#5a3830]">*</span>
                  </label>
                  <Select
                    value={howDidYouFindUs || '_placeholder'}
                    onValueChange={(v) => {
                      setHowDidYouFindUs(v === '_placeholder' ? '' : v);
                      setError(null);
                    }}
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full text-sm sm:text-base px-3">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_placeholder">Select an option</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="referral">Referred by someone</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {howDidYouFindUs === 'other' && (
                    <input
                      type="text"
                      value={howDidYouFindUsOther}
                      onChange={(e) => setHowDidYouFindUsOther(e.target.value)}
                      placeholder="Please specify"
                      className="brand-field mt-2"
                      disabled={isSubmitting}
                      required
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Nail History & Health (new clients only) */}
          {!isRepeatFound && currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">Nail History & Health</h4>
              
              <div>
                <label className="brand-label">
                  Have you ever had a Russian Technique Dry Manicure? <span className="text-[#5a3830]">*</span>
                </label>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="russianManicure"
                      value="yes"
                      checked={hasRussianManicure === 'yes'}
                      onChange={(e) => setHasRussianManicure(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">Yes</span>
                  </label>
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="russianManicure"
                      value="no"
                      checked={hasRussianManicure === 'no'}
                      onChange={(e) => setHasRussianManicure(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="brand-label">
                  Have you ever had Gel/Biab/Hardgel Overlay? <span className="text-[#5a3830]">*</span>
                </label>
                <div className="brand-note mb-3">
                  <p className="text-xs flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Gel/Biab/Hardgel Overlay is a thin layer of gel applied directly onto natural nails to add strength and protection.
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="gelOverlay"
                      value="yes"
                      checked={hasGelOverlay === 'yes'}
                      onChange={(e) => setHasGelOverlay(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">Yes</span>
                  </label>
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="gelOverlay"
                      value="no"
                      checked={hasGelOverlay === 'no'}
                      onChange={(e) => setHasGelOverlay(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="brand-label">
                  Have you ever had Softgel Nail Extensions? <span className="text-[#5a3830]">*</span>
                </label>
                <div className="brand-note mb-3">
                  <p className="text-xs flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Softgel extensions (Gel-X) are pre-formed gel tips adhered to natural nails for longer and more durable nails.
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="softgelExtensions"
                      value="yes"
                      checked={hasSoftgelExtensions === 'yes'}
                      onChange={(e) => setHasSoftgelExtensions(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">Yes</span>
                  </label>
                  <label className="flex flex-1 items-center gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-4 py-2.5 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                    <input
                      type="radio"
                      name="softgelExtensions"
                      value="no"
                      checked={hasSoftgelExtensions === 'no'}
                      onChange={(e) => setHasSoftgelExtensions(e.target.value)}
                      className="brand-check"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-[#57534e]">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="brand-label">
                  Do you have any allergies or sensitivities to nail products?
                </label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Please specify any allergies or sensitivities, or write 'None'"
                  rows={2}
                  className="brand-field resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="brand-label">
                  Are there any specific nail concerns you would like to address? <span className="text-[#5a3830]">*</span>
                </label>
                <textarea
                  value={nailConcerns}
                  onChange={(e) => {
                    setNailConcerns(e.target.value);
                    setError(null);
                  }}
                  placeholder="Describe any nail concerns, or write 'None'"
                  rows={2}
                  className="brand-field resize-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="brand-label">
                  Have you experienced any nail damage or infections in the past?
                </label>
                <textarea
                  value={nailDamageHistory}
                  onChange={(e) => setNailDamageHistory(e.target.value)}
                  placeholder="Please describe any past nail damage or infections, or write 'None'"
                  rows={2}
                  className="brand-field resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Nail Pictures (new clients) / STEP 2: Nail Pictures (repeat) */}
          {currentStep === (isRepeatFound ? 2 : 3) && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">Nail Pictures</h4>
              
              <div>
                <label className="brand-label flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#c4b5a0]" />
                  Upload Current Nails (up to 3 images)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCurrentNailUpload}
                  className="brand-field-file"
                  disabled={isSubmitting}
                />
                {currentNailPictures.length > 0 && (
                  <p className="text-xs text-[#78716c] mt-1.5">
                    {currentNailPictures.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="brand-label flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#c4b5a0]" />
                  Upload Nail Inspo (up to 3 images)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInspoUpload}
                  className="brand-field-file"
                  disabled={isSubmitting}
                />
                {inspoPictures.length > 0 && (
                  <p className="text-xs text-[#78716c] mt-1.5">
                    {inspoPictures.length} file(s) selected
                  </p>
                )}
                <div className="brand-note mt-3 space-y-1.5">
                  <p className="text-xs">
                    <span className="font-medium text-[#1c1917]">Note:</span> Please upload your nail inspiration in advance.
                  </p>
                  <p className="text-xs">
                    Google Drive:{' '}
                    <a
                      href="https://drive.google.com/drive/folders/1-NylMKbBkoXiD18FxLrSgBVDzCfvOdJN"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1c1917] underline decoration-[#c4b5a0] underline-offset-2 hover:decoration-[#1c1917]"
                    >
                      View Inspo Gallery
                    </a>
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#3d342c] flex items-start gap-2 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Please avoid changing your nail inspo on the day of the appointment</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="brand-label">
                  If you don&apos;t have nail inspo, describe how you want it to look
                </label>
                <textarea
                  value={inspoDescription}
                  onChange={(e) => setInspoDescription(e.target.value)}
                  placeholder="Describe your desired nail look..."
                  rows={3}
                  className="brand-field resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Services (new) / STEP 3: Services (repeat) */}
          {currentStep === (isRepeatFound ? 3 : 4) && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">
                Services <span className="text-[#5a3830]">*</span>
              </h4>
              {services.length > 0 && (
                <div className="brand-panel-soft px-4 py-3">
                  <p className="brand-eyebrow mb-1">Selected</p>
                  <p className="text-sm text-[#1c1917]">{getChosenServicesDisplay(services)}</p>
                </div>
              )}
              <div className="brand-note-strong flex items-start gap-2.5">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Please allow enough time.</span> Detailed nail designs require
                  precision — the full procedure can take 3–4 hours. Rushing compromises quality.
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('removal')}
                    onChange={() => handleServiceToggle('removal')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>REMOVAL</strong> (30mins - 1hr)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('cleaning')}
                    onChange={() => handleServiceToggle('cleaning')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>Cleaning Only</strong> (Russian Technique)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('without-extensions')}
                    onChange={() => handleServiceToggle('without-extensions')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>WITHOUT EXTENSIONS</strong> - BIAB/Gel Overlay w/ Russian Manicure (2 hours)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('with-extensions')}
                    onChange={() => handleServiceToggle('with-extensions')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>WITH EXTENSIONS</strong> - Softgel Nail Extensions w/ Russian Manicure (3 hours)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('russian-pedicure')}
                    onChange={() => handleServiceToggle('russian-pedicure')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>RUSSIAN PEDICURE GEL OVERLAY</strong> (1-2 hours)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('nail-reconstruction')}
                    onChange={() => handleServiceToggle('nail-reconstruction')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>NAIL RECONSTRUCTION</strong> (for bitten or damaged nails)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('minimal-design')}
                    onChange={() => handleServiceToggle('minimal-design')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>+ Minimal Design</strong> (Additional 30mins - 1hr)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-2.5 transition-colors hover:border-[#c4b5a0] hover:bg-[#faf8f6] touch-manipulation">
                  <input
                    type="checkbox"
                    checked={services.includes('intricate-design')}
                    onChange={() => handleServiceToggle('intricate-design')}
                    className="brand-check mt-0.5 sm:mt-1"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">
                    <strong>+ Intricate Design</strong> (Additional 1hr)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Waiver (new) / STEP 4: Waiver (repeat) */}
          {currentStep === (isRepeatFound ? 4 : 5) && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">
                Waiver for Clients <span className="text-[#5a3830]">*</span>
              </h4>
              
              <div className="brand-panel-soft p-4 sm:p-5 space-y-3 text-xs sm:text-sm text-[#57534e]">
                <p className="font-heading text-lg text-[#1c1917]">Dear Client,</p>
                <p>Before your appointment, please acknowledge the following:</p>

                <ol className="list-decimal list-inside space-y-2 pl-1 sm:pl-2">
                  <li>If you have allergies to nail products, kindly inform me. I will not be liable for any allergic reactions.</li>
                  <li>For diabetic clients: Russian manicure may carry a small risk of injury. While I will handle with care, I cannot be held responsible if a wound occurs.</li>
                </ol>

                <p className="pt-1">By proceeding, you accept these risks and understand my responsibility is limited.</p>
                <p className="text-[#1c1917]">Thank you for your trust and understanding.</p>
                <div className="brand-rule w-16" aria-hidden />
                <p className="font-heading text-base text-[#1c1917]">Jhen Cerio · glammednailsbyjhen</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <label className="flex flex-1 items-start gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-3 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                  <input
                    type="radio"
                    name="waiver"
                    value="accept"
                    checked={waiverAccepted === 'accept'}
                    onChange={(e) => {
                      setWaiverAccepted(e.target.value);
                      setError(null);
                    }}
                    className="brand-check mt-0.5"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">I acknowledge and accept the terms</span>
                </label>
                <label className="flex flex-1 items-start gap-2 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-3 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                  <input
                    type="radio"
                    name="waiver"
                    value="disagree"
                    checked={waiverAccepted === 'disagree'}
                    onChange={(e) => setWaiverAccepted(e.target.value)}
                    className="brand-check mt-0.5"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#57534e]">I don&apos;t agree</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Rules (new) / STEP 5: Rules (repeat) */}
          {currentStep === (isRepeatFound ? 5 : 6) && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-heading text-xl sm:text-2xl text-[#1c1917] mb-2 sm:mb-3">
                Rules & Reservation Instructions
              </h4>
              
              <div className="brand-panel-soft p-3 sm:p-4 space-y-4 text-xs sm:text-sm text-[#57534e]">
                <div>
                  <p className="brand-eyebrow">Please read carefully</p>
                  <p className="mt-1.5">Thank you for choosing glammednailsbyjhen.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
                  <p>
                    <span className="font-medium text-[#1c1917]">Location:</span> {STUDIO_ADDRESS}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
                  <div className="space-y-1.5">
                    <p>
                      <span className="font-medium text-[#1c1917]">Be on time</span> — not too early, not late. Come
                      exactly at your scheduled time.
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>{LATE_ARRIVAL_GRACE_MINUTES} mins late = {formatPeso(LATE_ARRIVAL_FEE)} fee</li>
                      <li>{LATE_ARRIVAL_CANCEL_MINUTES} mins late = appointment cancelled</li>
                      <li>
                        Reschedule allowed at least {RESCHEDULE_NOTICE_DAYS} days before, with a{' '}
                        {formatPeso(RESCHEDULE_FEE)} fee
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Wallet className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
                  <p>
                    <span className="font-medium text-[#1c1917]">Reservation deposit:</span>{' '}
                    {formatPeso(DEPOSIT_PER_SLOT)} per slot — total {formatPeso(DEPOSIT_PER_SLOT * slotCount)} for{' '}
                    {slotCount} slot{slotCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <CalendarCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
                  <div className="space-y-1.5">
                    <p className="font-medium text-[#1c1917]">Your slot is confirmed only after the deposit is sent.</p>
                    <p>The remaining balance is settled after your appointment.</p>
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <p>Looking forward to glamming your nails.</p>
                  <div className="brand-rule w-16" aria-hidden />
                  <p className="font-heading text-base text-[#1c1917]">Jhen</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer border border-[#e7e2db] bg-[#fffcfa] px-3 py-3 transition-colors hover:border-[#c4b5a0] touch-manipulation">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => {
                    setRulesAccepted(e.target.checked);
                    setError(null);
                  }}
                  className="brand-check mt-0.5 sm:mt-1"
                  disabled={isSubmitting}
                />
                <span className="text-xs sm:text-sm text-[#57534e]">
                  <span className="text-[#5a3830]">*</span> I have read and accept all the rules, reservation
                  instructions, and downpayment requirements above.
                </span>
              </label>

              <div className="brand-note space-y-2">
                <p className="text-xs sm:text-sm flex items-start gap-2.5">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-[#1c1917]">After submission:</span> You will receive an email
                    about your booking. Upload your proof of payment using the link in that email to confirm your slot.
                  </span>
                </p>
                <p className="text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-[#1c1917]">Important:</span> Your slot is automatically cancelled
                    after {PROOF_OF_PAYMENT_WINDOW_HOURS} hours if no proof of payment has been uploaded.
                  </span>
                </p>
              </div>
            </div>
          )}

            {/* Error Message */}
            {error && (
              <div className="brand-note-error flex items-start gap-2.5" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium">{error}</p>
              </div>
            )}
            </div>
          </div>

          <div className="brand-modal-footer">
          <div className="flex gap-2 sm:gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="brand-cta-ghost flex-1 gap-2 disabled:opacity-60 active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="brand-cta flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] touch-manipulation"
            >
              {isSubmitting ? 'Submitting...' : currentStep === totalSteps ? 'Submit Booking' : 'Next'}
            </button>
          </div>

          {currentStep === 1 && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full text-center text-[11px] uppercase tracking-[0.18em] text-[#78716c] pt-2 transition-colors hover:text-[#1c1917] disabled:opacity-60 touch-manipulation"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      </motion.div>
    </div>
  );
}
