'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import ClientTypeSelectionModal from '@/components/booking/ClientTypeSelectionModal';
import ServiceTypeSelectionModal from '@/components/booking/ServiceTypeSelectionModal';
import NailTechSelectionModal from '@/components/booking/NailTechSelectionModal';
import BookingFormModal from '@/components/booking/BookingFormModal';
import SlotConfirmationModal from '@/components/booking/SlotConfirmationModal';
import BookingSuccessModal from '@/components/booking/BookingSuccessModal';
import type { Slot, ServiceType, NailTech } from '@/lib/types';
import { getNextSlotTime, SLOT_TIMES } from '@/lib/constants/slots';
import { formatTime12Hour } from '@/lib/utils';

const SERVICE_OPTIONS: Record<ServiceLocation, { value: ServiceType; label: string }[]> = {
  homebased_studio: [
    { value: 'manicure', label: 'Manicure (1 slot)' },
    { value: 'pedicure', label: 'Pedicure (1 slot)' },
    { value: 'mani_pedi', label: 'Mani + Pedi (2 slots)' },
  ],
  home_service: [
    { value: 'manicure', label: 'Manicure 2 pax (2 slots)' },
    { value: 'pedicure', label: 'Pedicure 2 pax (2 slots)' },
    { value: 'mani_pedi', label: 'Mani + Pedi (2 slots)' },
    { value: 'home_service_2slots', label: 'Mani + Pedi 2 pax (2 slots)' },
  ],
};

function getRequiredSlotCount(serviceType: ServiceType, serviceLocation?: ServiceLocation): number {
  // For home service, manicure and pedicure require 2 slots (2 pax)
  if (serviceLocation === 'home_service' && (serviceType === 'manicure' || serviceType === 'pedicure')) {
    return 2;
  }
  
  switch (serviceType) {
    case 'mani_pedi':
    case 'home_service_2slots':
      return 2;
    case 'home_service_3slots':
      return 3;
    default:
      return 1;
  }
}

function canSlotAccommodateService(
  slot: Slot,
  serviceType: ServiceType,
  allSlots: Slot[]
): boolean {
  const requiredSlots = getRequiredSlotCount(serviceType);
  if (requiredSlots === 1) return true;

  // Get all slots for this date and same nail tech, sorted by time
  const slotsForDate = allSlots
    .filter((s) => s.date === slot.date && s.nailTechId === slot.nailTechId)
    .sort((a, b) => a.time.localeCompare(b.time));

  let referenceSlot = slot;
  // Consecutive means: available slots with no booked/blocked slots in between
  // We skip over slot times that don't exist in the schedule at all
  for (let step = 1; step < requiredSlots; step += 1) {
    let nextSlot: Slot | null = null;
    let currentCheckTime = referenceSlot.time.trim();
    
    // Keep looking for the next available slot in sequence
    while (!nextSlot) {
      const nextTime = getNextSlotTime(currentCheckTime);
      if (!nextTime) {
        // No more slot times in the sequence
        return false;
      }
      
      // Check if a slot exists at this time (normalize time strings for comparison)
      const normalizedNextTime = nextTime.trim();
      const slotAtTime = slotsForDate.find(
        (candidate) => candidate.time.trim() === normalizedNextTime
      );
      
      if (slotAtTime) {
        // Slot exists at this time
        // Check status
        if (slotAtTime.status === 'available') {
          // Found the next available slot - this is consecutive
          nextSlot = slotAtTime;
          break;
        } else {
          // Slot exists but is not available (pending, confirmed, blocked, etc.)
          // This breaks consecutiveness - there's a gap
          return false;
        }
      }
      // Slot doesn't exist at this time - skip it (not a gap, just not created)
      // Continue to next time in sequence
      
      currentCheckTime = normalizedNextTime;
    }
    
    if (!nextSlot) {
      // Couldn't find the next available slot
      return false;
    }
    referenceSlot = nextSlot;
  }
  return true;
}

type ClientType = 'new' | 'repeat';
type ServiceLocation = 'homebased_studio' | 'home_service';

export default function BookingPage() {
  // Booking flow state
  const [showClientTypeModal, setShowClientTypeModal] = useState(true);
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showNailTechModal, setShowNailTechModal] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    clientType: ClientType;
    serviceLocation: ServiceLocation;
    customerId?: string;
    customerName?: string;
    contactNumber?: string;
    socialMediaName?: string;
  } | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [nailTechs, setNailTechs] = useState<NailTech[]>([]);
  const [selectedNailTechId, setSelectedNailTechId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNailTechs, setLoadingNailTechs] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const slotsSectionRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedService, setSelectedService] = useState<ServiceType>('manicure');
  const [linkedSlots, setLinkedSlots] = useState<Slot[]>([]);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [squeezeFeeAcknowledged, setSqueezeFeeAcknowledged] = useState(false);
  const [showBookingFormModal, setShowBookingFormModal] = useState(false);
  const [showSlotConfirmModal, setShowSlotConfirmModal] = useState(false);
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);
  const [latestBookingCode, setLatestBookingCode] = useState('');
  const [bookingSuccessNote, setBookingSuccessNote] = useState<string | null>(null);
  const serviceOptions = clientInfo ? SERVICE_OPTIONS[clientInfo.serviceLocation] : SERVICE_OPTIONS.homebased_studio;

  useEffect(() => {
    if (clientInfo) {
      const options = SERVICE_OPTIONS[clientInfo.serviceLocation];
      if (!options.some((option) => option.value === selectedService)) {
        setSelectedService(options[0].value);
      }
    }
  }, [clientInfo, selectedService]);

  useEffect(() => {
    loadNailTechs();
  }, []);

  useEffect(() => {
    if (selectedNailTechId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNailTechId]);

  // OPTIMIZED: Increased auto-refresh interval from 30s to 60s to reduce Firestore reads
  // Cache headers on API route provide freshness, so less frequent polling is safe
  useEffect(() => {
    if (!selectedNailTechId) return;
    
    const interval = setInterval(() => {
      loadData(false); // Don't show loading spinner on auto-refresh
    }, 60000); // 60 seconds - reduced reads while still showing fresh data

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNailTechId]);

  async function loadNailTechs() {
    setLoadingNailTechs(true);
    try {
      // OPTIMIZED: Removed cache: 'no-store' - API route now caches for 5 minutes
      // Nail techs rarely change, so caching significantly reduces reads
      const response = await fetch('/api/nail-techs?activeOnly=true');
      const data = await response.json();
      setNailTechs(data.nailTechs || []);
      
      // Don't auto-select a nail tech - user must choose first
      // This ensures the calendar is hidden until a selection is made
    } catch (err) {
      console.error('Error loading nail techs', err);
      setError('Unable to load nail technicians. Please try again.');
    } finally {
      setLoadingNailTechs(false);
    }
  }

  async function loadData(showLoading = true) {
    if (!selectedNailTechId) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      // OPTIMIZED: Removed cache-busting timestamp - API route now has proper caching
      // Browser/CDN cache will handle freshness, reducing unnecessary Firestore reads
      const response = await fetch(`/api/availability?nailTechId=${selectedNailTechId}`, {
        // Use default cache behavior - API route handles caching headers
      });
      const data = await response.json();
      setSlots(data.slots);
    } catch (err) {
      console.error('Error loading availability', err);
      setError('Unable to load availability. Please try again.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }


  useEffect(() => {
    if (!selectedSlot) {
      setLinkedSlots([]);
      setServiceMessage(null);
      return;
    }

    const requiredSlots = getRequiredSlotCount(selectedService);
    if (requiredSlots === 1) {
      setLinkedSlots([]);
      setServiceMessage(null);
      return;
    }

    const collected: Slot[] = [];
    let referenceSlot = selectedSlot;
    let errorMessage: string | null = null;

    // Get all slots for this date and same nail tech (only check slots for the chosen nail tech)
    // Sort by time to ensure consistent ordering
    const slotsForDate = slots
      .filter((s) => s.date === selectedSlot.date && s.nailTechId === selectedSlot.nailTechId)
      .sort((a, b) => a.time.localeCompare(b.time));

    // Check for consecutive slots starting from the selected slot
    // Consecutive means: available slots with no booked/blocked slots in between
    // We skip over slot times that don't exist in the schedule at all
    for (let step = 1; step < requiredSlots; step += 1) {
      let nextSlotAny: Slot | null = null;
      let currentCheckTime = referenceSlot.time.trim();
      
      // Keep looking for the next available slot in sequence
      while (!nextSlotAny) {
        const nextTime = getNextSlotTime(currentCheckTime);
        if (!nextTime) {
          // No more slot times in the predefined sequence
          const availableTimes = slotsForDate
            .filter((s) => s.status === 'available' && s.nailTechId === selectedSlot.nailTechId)
            .map((s) => formatTime12Hour(s.time))
            .join(', ');
          errorMessage = `This service requires ${requiredSlots} consecutive available slots starting from ${formatTime12Hour(selectedSlot.time)}, but there aren't enough slots available after this time. Available slots on this date: ${availableTimes || 'none'}. Please select a different time or date.`;
          break;
        }
        
        // Check if a slot exists at this time (normalize time strings for comparison)
        const normalizedNextTime = nextTime.trim();
        const slotAtTime = slotsForDate.find(
          (candidate) => candidate.time.trim() === normalizedNextTime
        );
        
        if (slotAtTime) {
          // Slot exists at this time
          // Check status
          if (slotAtTime.status === 'available') {
            // Found the next available slot - this is consecutive
            nextSlotAny = slotAtTime;
            break;
          } else {
            // Slot exists but is not available (pending, confirmed, blocked, etc.)
            // This breaks consecutiveness - there's a gap
            errorMessage = `This service requires ${requiredSlots} consecutive slots, but there is a ${slotAtTime.status} slot at ${formatTime12Hour(nextTime)} between the slots. There is a gap in the consecutive slots. Please select a different time or date.`;
            break;
          }
        }
        // Slot doesn't exist at this time - skip it (not a gap, just not created)
        // Continue to next time in sequence
        
        currentCheckTime = normalizedNextTime;
      }

      // If we couldn't find the next available slot, break with error
      if (!nextSlotAny) {
        break;
      }

      collected.push(nextSlotAny);
      referenceSlot = nextSlotAny;
    }

    if (errorMessage) {
      setLinkedSlots([]);
      setServiceMessage(errorMessage);
      return;
    }

    // Successfully found all required consecutive slots - clear any error messages
    setLinkedSlots(collected);
    const serviceLabel =
      serviceOptions.find((option) => option.value === selectedService)?.label ?? 'This service';
    
    if (requiredSlots > 1) {
      // For multiple slots, show clear explanation
      const allSlots = [selectedSlot, ...collected];
      const slotTimes = allSlots.map(s => formatTime12Hour(s.time)).join(' and ');
      setServiceMessage(
        `This slot selection will use ${slotTimes} for this booking. The system will automatically reserve ${requiredSlots} consecutive time slots for your ${serviceLabel}.`
      );
    } else {
      setServiceMessage(
        `This booking will use the time slot at ${formatTime12Hour(selectedSlot.time)}.`
      );
    }
  }, [selectedSlot, selectedService, slots, serviceOptions]);

  const availableSlotsForDate = useMemo(
    () => {
      return slots.filter(
        (slot) =>
          slot.date === selectedDate &&
          slot.status === 'available' &&
          !slot.isHidden
      );
    },
    [slots, selectedDate],
  );

  // Filter slots that can accommodate the selected service
  const compatibleSlotsForDate = useMemo(
    () => {
      if (!selectedService || getRequiredSlotCount(selectedService) === 1) {
        return availableSlotsForDate;
      }
      return availableSlotsForDate.filter((slot) => canSlotAccommodateService(slot, selectedService, slots));
    },
    [availableSlotsForDate, selectedService, slots],
  );


  // Find dates with no available slots (for calendar styling)

  const handleSelectSlot = useCallback((slot: Slot) => {
    if (slot.status !== 'available') return;
    setLinkedSlots([]);
    setServiceMessage(null);
    setSqueezeFeeAcknowledged(false);
    setSelectedSlot(slot);
  }, []);

  // Removed auto-select behavior - users must manually click on a time slot to open the modal

  // Scroll to show both calendar and slots on mobile when date is selected
  useEffect(() => {
    if (selectedDate) {
      // Only scroll on mobile/tablet (smaller screens)
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const calendarElement = document.getElementById('booking-calendar');
          if (calendarElement) {
            // Scroll to calendar position but ensure slots are also visible
            // Calculate position to show calendar with some space for slots below
            const calendarTop = calendarElement.getBoundingClientRect().top + window.pageYOffset;
            const headerOffset = 80; // Header height offset
            const scrollPosition = Math.max(0, calendarTop - headerOffset);
            
            window.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }
  }, [selectedDate]);

  // Determine available days based on required consecutive slots for selected service
  const requiredSlots = getRequiredSlotCount(selectedService, clientInfo?.serviceLocation);
  
  // Filter calendar dates to show only those with enough consecutive available slots
  const availableDatesForService = useMemo(() => {
    if (!clientInfo) return new Set<string>();
    
    const available = new Set<string>();
    const dateGroups: Record<string, Slot[]> = {};
    
    // Group slots by date
    slots.forEach((slot) => {
      if (!slot.isHidden && slot.status === 'available') {
        const dateKey = slot.date;
        if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
        dateGroups[dateKey].push(slot);
      }
    });
    
    // Check each date for consecutive available slots
    Object.entries(dateGroups).forEach(([dateKey, dateSlots]) => {
      if (canSlotAccommodateService(dateSlots[0], selectedService, slots)) {
        available.add(dateKey);
      }
    });
    
    return available;
  }, [slots, selectedService, clientInfo]);

  // Dates that don't have enough consecutive slots for the selected service
  const noAvailableSlotsDates = useMemo(() => {
    if (!clientInfo) return [];
    
    const allDates = new Set<string>();
    slots.forEach((slot) => {
      allDates.add(slot.date);
    });
    
    return Array.from(allDates).filter((date) => !availableDatesForService.has(date));
  }, [slots, availableDatesForService, clientInfo]);

  const hasSqueezeFee = selectedSlot?.slotType === 'with_squeeze_fee';
  const missingLinkedSlots = requiredSlots > 1 && linkedSlots.length !== requiredSlots - 1;
  const disableProceed =
    !selectedSlot ||
    !clientInfo ||
    !selectedNailTechId ||
    !selectedService ||
    !clientInfo.serviceLocation ||
    missingLinkedSlots ||
    (hasSqueezeFee && !squeezeFeeAcknowledged) ||
    isBooking;


  function handleSelectSlotAndOpenForm(slot: Slot) {
    if (slot.status !== 'available') return;
    setLinkedSlots([]);
    setServiceMessage(null);
    setSqueezeFeeAcknowledged(false);
    setSelectedSlot(slot);
    // Show slot confirmation modal first
    setShowSlotConfirmModal(true);
  }

  async function uploadBookingPhoto(
    bookingId: string,
    photoType: 'currentState' | 'inspiration',
    file: File
  ) {
    const photoData = new FormData();
    photoData.set('photoType', photoType);
    photoData.set('file', file);

    const photoResponse = await fetch(`/api/bookings/${bookingId}/photos`, {
      method: 'POST',
      body: photoData,
    });

    if (!photoResponse.ok) {
      const photoError = await photoResponse.json().catch(() => ({ error: 'Failed to upload photo' }));
      throw new Error(photoError.error || 'Failed to upload photo');
    }
  }

  async function uploadBookingPhotos(bookingId: string, formData: {
    currentNailPicture?: File;
    inspoPictures: File[];
  }) {
    const uploads: Promise<void>[] = [];

    if (formData.currentNailPicture) {
      uploads.push(uploadBookingPhoto(bookingId, 'currentState', formData.currentNailPicture));
    }

    const inspoFiles = (formData.inspoPictures || []).slice(0, 3);
    for (const inspoFile of inspoFiles) {
      uploads.push(uploadBookingPhoto(bookingId, 'inspiration', inspoFile));
    }

    if (uploads.length === 0) return;
    await Promise.all(uploads);
  }

  async function handleCompleteBooking(formData: {
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
  }) {
    if (!selectedSlot || isBooking || !clientInfo) return;
    
    setIsBooking(true);
    try {
      const requiredSlots = getRequiredSlotCount(selectedService, clientInfo.serviceLocation);
      const linkedSlotIds = linkedSlots.map((slot) => slot.id);

      if (requiredSlots > 1 && linkedSlotIds.length !== requiredSlots - 1) {
        setLinkedSlots([]);
        throw new Error('Invalid slot selection');
      }

      let customerId = clientInfo.customerId;
      const isExistingCustomer = Boolean(customerId);

      // Create customer if no existing customer ID (new client or repeat-not-found)
      if (!customerId) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.contactNumber,
            socialMediaName: formData.socialMediaName,
            howDidYouFindUs: formData.howDidYouFindUs,
            howDidYouFindUsOther: formData.howDidYouFindUsOther,
            nailHistory: {
              hasRussianManicure: formData.hasRussianManicure === 'yes',
              hasGelOverlay: formData.hasGelOverlay === 'yes',
              hasSoftgelExtensions: formData.hasSoftgelExtensions === 'yes',
            },
            healthInfo: {
              allergies: formData.allergies,
              nailConcerns: formData.nailConcerns,
              nailDamageHistory: formData.nailDamageHistory,
            },
            inspoDescription: formData.inspoDescription,
            waiverAccepted: formData.waiverAccepted === 'accept',
          }),
        });

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json().catch(() => ({ error: 'Failed to create customer' }));
          throw new Error(errorData.error || 'Failed to create customer account');
        }

        const customerData = await customerResponse.json();
        customerId = customerData.customer._id || customerData.customer.id;
      }

      if (isExistingCustomer && customerId) {
        const updateResponse = await fetch(`/api/customers/${customerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.contactNumber,
            socialMediaName: formData.socialMediaName,
            referralSource: formData.howDidYouFindUs,
            referralSourceOther: formData.howDidYouFindUsOther,
            nailHistory: {
              hasRussianManicure: formData.hasRussianManicure === 'yes',
              hasGelOverlay: formData.hasGelOverlay === 'yes',
              hasSoftgelExtensions: formData.hasSoftgelExtensions === 'yes',
            },
            healthInfo: {
              allergies: formData.allergies,
              nailConcerns: formData.nailConcerns,
              nailDamageHistory: formData.nailDamageHistory,
            },
            inspoDescription: formData.inspoDescription,
            waiverAccepted: formData.waiverAccepted === 'accept',
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({ error: 'Failed to update customer' }));
          throw new Error(errorData.error || 'Failed to update customer details');
        }
      }

      const slotIds = [selectedSlot.id, ...linkedSlotIds];
      const basePrice = 1500;
      const depositRequired = 500;
      const total = basePrice + (clientInfo.serviceLocation === 'home_service' ? 1000 : 0);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIds,
          customerId,
          customerEmail: formData.email,
          nailTechId: selectedNailTechId || '',
          service: {
            type: selectedService,
            location: clientInfo.serviceLocation,
            clientType: clientInfo.clientType,
          },
          pricing: {
            total,
            depositRequired,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Slot is no longer available.';
        if (errorMessage.includes('no longer available') || errorMessage.includes('not available')) {
          throw new Error('This slot was just booked by another customer. Please select a different time slot.');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      let photoUploadWarning: string | null = null;
      const bookingId = data?.booking?.id;
      if (bookingId) {
        try {
          await uploadBookingPhotos(bookingId, {
            currentNailPicture: formData.currentNailPicture,
            inspoPictures: formData.inspoPictures,
          });
        } catch (photoError) {
          console.error('Booking created but photo upload failed:', photoError);
          photoUploadWarning =
            'Your booking was saved, but some nail photos were not uploaded. You can upload them again later.';
        }
      }

      // Reset and reload
      setShowBookingFormModal(false);
      setShowSlotConfirmModal(false);
      setSelectedSlot(null);
      setLinkedSlots([]);
      setSelectedNailTechId(null);
      setClientInfo(null);
      setShowClientTypeModal(true);
      
      setLatestBookingCode(data.booking.bookingCode || '');
      setBookingSuccessNote(photoUploadWarning);
      setShowBookingSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      // Re-throw for modal to handle and display
      throw error;
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[80px] sm:pt-[90px] md:pt-[100px] lg:pt-[130px] px-2 sm:px-6 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <h1 id="booking-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-acollia text-center mb-3 sm:mb-4 px-2 sm:px-4 text-slate-900 scroll-mt-28 sm:scroll-mt-32 lg:scroll-mt-36">
            Book Your Appointment
          </h1>

          {/* Nail Tech Selection - Now shown in modal */}
          {selectedNailTechId && (
            <div className="mb-6 sm:mb-8 max-w-4xl mx-auto px-2 sm:px-4">
              <div className="rounded-xl border-2 px-5 py-4" style={{ borderColor: '#212529', backgroundColor: '#f8f9fa' }}>
                {(() => {
                  const selectedTech = nailTechs.find(t => t.id === selectedNailTechId);
                  if (!selectedTech) return null;
                  const hasDiscount = selectedTech.discount !== undefined && selectedTech.discount !== null && selectedTech.discount > 0;
                  return (
                    <div className="space-y-1">
                      <p className="text-sm" style={{ color: '#212529', fontFamily: "'Lato', sans-serif" }}>
                        Viewing calendar for: <strong style={{ fontFamily: "'Lato', sans-serif" }}>Ms. {selectedTech.name}</strong>
                      </p>
                      {hasDiscount && (
                        <p className="text-sm font-semibold text-green-600" style={{ fontFamily: "'Lato', sans-serif" }}>
                          🎉 Special Offer: {selectedTech.discount}% discount on all services!
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedNailTechId(null);
                          setSelectedSlot(null);
                          setLinkedSlots([]);
                          setServiceMessage(null);
                        }}
                        className="text-sm hover:opacity-75 underline mt-2 transition-opacity"
                        style={{ color: '#212529', fontFamily: "'Lato', sans-serif" }}
                      >
                        Change nail technician
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {!selectedNailTechId ? null : loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
                <p className="text-slate-600">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="max-w-4xl mx-auto px-2 sm:px-4">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[1.8fr,1fr]">
                  <div id="booking-calendar" className="scroll-mt-24 order-2 lg:order-1">
                    {(() => {
                      return (
                        <CalendarGrid
                          referenceDate={currentMonth}
                          slots={slots}
                          selectedDate={selectedDate}
                          onSelectDate={setSelectedDate}
                          onChangeMonth={setCurrentMonth}
                          nailTechName={selectedNailTechId ? `Ms. ${nailTechs.find(t => t.id === selectedNailTechId)?.name || ''}` : undefined}
                          noAvailableSlotsDates={noAvailableSlotsDates}
                          disablePastDates
                        />
                      );
                    })()}
                  </div>

                  <section 
                    ref={slotsSectionRef}
                    className="rounded-xl border-2 p-3 sm:p-4 lg:p-6 shadow-sm scroll-mt-24 order-1 lg:order-2 flex flex-col"
                    style={{ borderColor: '#212529', backgroundColor: '#f8f9fa' }}
                  >
                  <header className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em]" style={{ color: '#6c757d', fontFamily: "'Lato', sans-serif" }}>Available slots</p>
                      <button
                        type="button"
                        onClick={() => loadData(true)}
                        disabled={loading}
                        className="text-[10px] sm:text-xs underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ color: '#495057', fontFamily: "'Lato', sans-serif" }}
                        title="Refresh slots"
                      >
                        {loading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold break-words" style={{ color: '#212529', fontFamily: "'Lato', sans-serif" }}>
                      {format(parseISO(selectedDate), 'EEEE, MMM d')}
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: '#495057', fontFamily: "'Lato', sans-serif" }}>
                      Tap a time to reserve it.
                    </p>
                    {clientInfo && selectedService && getRequiredSlotCount(selectedService, clientInfo.serviceLocation) > 1 && (
                      <p className="text-[10px] sm:text-xs mt-1 leading-relaxed" style={{ color: '#856404', fontFamily: "'Lato', sans-serif" }}>
                        Select the <strong>first</strong> slot for {getRequiredSlotCount(selectedService, clientInfo.serviceLocation)}-slot services.
                      </p>
                    )}
                  </header>

                  <div className="space-y-2 sm:space-y-3 max-h-[60vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                    {(() => {
                      const slotsToDisplay = requiredSlots === 1 ? availableSlotsForDate : compatibleSlotsForDate;
                      return slotsToDisplay.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed p-3 sm:p-4 text-sm" style={{ borderColor: '#f5c6cb', backgroundColor: '#f8d7da', fontFamily: "'Lato', sans-serif" }}>
                          <p className="font-semibold text-sm" style={{ color: '#721c24' }}>
                            No available slots for this day.
                          </p>
                          <p className="mt-1 text-xs sm:text-sm" style={{ color: '#721c24' }}>
                            Please select a different date.
                          </p>
                        </div>
                      ) : null;
                    })()}
                    {(() => {
                      const slotsToDisplay = requiredSlots === 1 ? availableSlotsForDate : compatibleSlotsForDate;
                      // Sort slots chronologically by time
                      const sortedSlots = [...slotsToDisplay].sort((a, b) => a.time.localeCompare(b.time));
                      return sortedSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSelectSlotAndOpenForm(slot)}
                          className="w-full rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all active:scale-[0.98] focus:outline-none focus:ring-2 touch-manipulation"
                          style={{ 
                            borderColor: '#c3e6cb',
                            backgroundColor: '#d4edda',
                            fontFamily: "'Lato', sans-serif"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#28a745';
                            e.currentTarget.style.backgroundColor = '#c3e6cb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#c3e6cb';
                            e.currentTarget.style.backgroundColor = '#d4edda';
                          }}
                        >
                          {slot.slotType === 'with_squeeze_fee' && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold self-start sm:self-auto" style={{ backgroundColor: '#e2d5f3', color: '#6f42c1', border: '1px solid #c5a7e8', fontFamily: "'Lato', sans-serif" }}>
                                ₱500 Squeeze-in Fee
                              </span>
                            </div>
                          )}
                          <p className="text-base sm:text-lg font-semibold" style={{ color: '#155724', fontFamily: "'Lato', sans-serif" }}>{formatTime12Hour(slot.time)}</p>
                          {slot.notes && <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#155724', fontFamily: "'Lato', sans-serif" }}>{slot.notes}</p>}
                        </button>
                      ));
                    })()}
                  </div>
                </section>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm px-2 sm:px-4" style={{ color: '#6c757d', fontFamily: "'Lato', sans-serif" }}>
                {error ? (
                  <p style={{ color: '#721c24' }}>{error}</p>
                ) : (
                  <p>Green cards are open slots. Available times will be shown after selecting a date.</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* Client Type Selection Modal - Shows first */}
      <ClientTypeSelectionModal
        isOpen={showClientTypeModal}
        onClose={() => {
          // Don't allow closing - user must complete the flow
        }}
        onContinue={(data) => {
          setClientInfo(data);
          setShowClientTypeModal(false);
          setShowServiceTypeModal(true);
        }}
      />

      {/* Service Type Selection Modal - Shows after client type */}
      <ServiceTypeSelectionModal
        isOpen={showServiceTypeModal}
        serviceLocation={clientInfo?.serviceLocation || 'homebased_studio'}
        selectedService={selectedService}
        onContinue={(serviceType) => {
          setSelectedService(serviceType);
          setShowServiceTypeModal(false);
          setShowNailTechModal(true);
        }}
        onBack={() => {
          setShowServiceTypeModal(false);
          setShowClientTypeModal(true);
          setClientInfo(null);
        }}
      />

      {/* Nail Tech Selection Modal - Shows after service type is selected */}
      <NailTechSelectionModal
        isOpen={showNailTechModal}
        nailTechs={nailTechs}
        selectedNailTechId={selectedNailTechId}
        serviceLocation={clientInfo?.serviceLocation || 'homebased_studio'}
        onContinue={(techId) => {
          setSelectedNailTechId(techId);
          setSelectedSlot(null);
          setLinkedSlots([]);
          setServiceMessage(null);
          setShowNailTechModal(false);
        }}
        onBack={() => {
          setShowNailTechModal(false);
          setShowServiceTypeModal(true);
        }}
      />

      {/* Slot Confirmation Modal - Shows after slot selection */}
      <SlotConfirmationModal
        isOpen={showSlotConfirmModal}
        slotDate={selectedSlot?.date || ''}
        slotTime={selectedSlot?.time || ''}
        slotType={selectedSlot?.slotType}
        linkedSlotTimes={linkedSlots.map(s => s.time)}
        serviceName={serviceOptions.find(o => o.value === selectedService)?.label}
        onConfirm={() => {
          setShowSlotConfirmModal(false);
          setShowBookingFormModal(true);
        }}
        onBack={() => {
          setShowSlotConfirmModal(false);
          setSelectedSlot(null);
          setLinkedSlots([]);
        }}
      />

      {/* Booking Form Modal - Collect customer info */}
      <BookingFormModal
        isOpen={showBookingFormModal}
        clientType={clientInfo?.clientType || 'new'}
        clientName={clientInfo?.customerName}
        clientContactNumber={clientInfo?.contactNumber}
        clientSocialMediaName={clientInfo?.socialMediaName}
        onClose={() => setShowBookingFormModal(false)}
        onSubmit={handleCompleteBooking}
        isSubmitting={isBooking}
      />
      
      <BookingSuccessModal
        isOpen={showBookingSuccessModal}
        bookingCode={latestBookingCode}
        uploadWarning={bookingSuccessNote}
        onClose={() => {
          setShowBookingSuccessModal(false);
          setBookingSuccessNote(null);
        }}
      />

      <Footer />
    </main>
  );
}

