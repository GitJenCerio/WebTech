'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import ClientTypeSelectionModal from '@/components/booking/ClientTypeSelectionModal';
import ServiceTypeSelectionModal from '@/components/booking/ServiceTypeSelectionModal';
import NailTechSelectionModal from '@/components/booking/NailTechSelectionModal';
import DualNailTechSelectionModal from '@/components/booking/DualNailTechSelectionModal';
import BookingFormModal from '@/components/booking/BookingFormModal';
import SlotConfirmationModal from '@/components/booking/SlotConfirmationModal';
import BookingSuccessModal from '@/components/booking/BookingSuccessModal';
import type { Slot, NailTech } from '@/lib/types';

type ServiceLocation = 'homebased_studio' | 'home_service';
type BookingServiceType =
  | 'manicure'
  | 'pedicure'
  | 'mani_pedi'
  | 'mani_pedi_simultaneous'
  | 'home_service_2slots'
  | 'home_service_3slots';
import { normalizeSlotTime } from '@/lib/constants/slots';
import { findConsecutiveAvailableSlots } from '@/lib/utils/consecutiveSlots';
import { formatTime12Hour } from '@/lib/utils';
import { trackBookingCompleted, trackBookNowClick } from '@/lib/utils/analytics';
import { DEPOSIT_PER_SLOT, SQUEEZE_IN_FEE, formatPeso } from '@/lib/constants/policy';

const SERVICE_OPTIONS: Record<ServiceLocation, { value: BookingServiceType; label: string }[]> = {
  homebased_studio: [
    { value: 'manicure', label: 'Manicure (1 slot)' },
    { value: 'pedicure', label: 'Pedicure (1 slot)' },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo (2 slots)' },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express (2 techs)' },
  ],
  home_service: [
    { value: 'manicure', label: 'Manicure' },
    { value: 'pedicure', label: 'Pedicure' },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo (2 slots)' },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express (2 techs)' },
  ],
};

function getRequiredSlotCount(
  serviceType: BookingServiceType | null,
  serviceLocation?: ServiceLocation
): number {
  if (serviceType === null) return 1;
  if (serviceType === 'mani_pedi_simultaneous') return 1;
  // For home service, manicure and pedicure require 2 slots (2 pax)
  if (serviceLocation === 'home_service' && (serviceType === 'manicure' || serviceType === 'pedicure')) {
    return 2;
  }
  
  switch (serviceType) {
    case 'mani_pedi':
      return 2;
    case 'home_service_2slots':
      return 4;
    case 'home_service_3slots':
      return 3;
    default:
      return 1;
  }
}

function canSlotAccommodateService(
  slot: Slot,
  serviceType: BookingServiceType,
  allSlots: Slot[],
  serviceLocation?: ServiceLocation
): boolean {
  const requiredSlots = getRequiredSlotCount(serviceType, serviceLocation);
  if (requiredSlots === 1) return true;

  const slotsForDate = allSlots.filter(
    (s) => s.date === slot.date && s.nailTechId === slot.nailTechId
  );
  const availableForDate = slotsForDate.filter((s) => s.status === 'available');
  const chain = findConsecutiveAvailableSlots(slotsForDate, availableForDate, slot, requiredSlots);
  return chain.length === requiredSlots;
}

type ClientType = 'new' | 'repeat';

export default function BookingPage() {
  // Booking flow state
  const [showClientTypeModal, setShowClientTypeModal] = useState(true);
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showNailTechModal, setShowNailTechModal] = useState(false);
  const [serviceChangeMode, setServiceChangeMode] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    clientType: ClientType;
    serviceLocation: ServiceLocation;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    contactNumber?: string;
    socialMediaName?: string;
  } | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [nailTechs, setNailTechs] = useState<NailTech[]>([]);
  const [selectedNailTechId, setSelectedNailTechId] = useState<string | null>(null);
  const [selectedSecondaryNailTechId, setSelectedSecondaryNailTechId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNailTechs, setLoadingNailTechs] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const slotsSectionRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedService, setSelectedService] = useState<BookingServiceType | null>(null);
  const [linkedSlots, setLinkedSlots] = useState<Slot[]>([]);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [squeezeFeeAcknowledged, setSqueezeFeeAcknowledged] = useState(false);
  const [showBookingFormModal, setShowBookingFormModal] = useState(false);
  const [showSlotConfirmModal, setShowSlotConfirmModal] = useState(false);
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);
  const [latestBookingCode, setLatestBookingCode] = useState('');
  const [latestDepositDue, setLatestDepositDue] = useState<number | null>(null);
  const [latestUploadProofLink, setLatestUploadProofLink] = useState<string | null>(null);
  const [bookingSuccessNote, setBookingSuccessNote] = useState<string | null>(null);
  const serviceOptions = clientInfo ? SERVICE_OPTIONS[clientInfo.serviceLocation] : SERVICE_OPTIONS.homebased_studio;
  const isSimultaneous = selectedService === 'mani_pedi_simultaneous';
  const secondarySlotIdByDateTimeRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (clientInfo && selectedService !== null) {
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
    trackBookNowClick('booking_page');
  }, []);

  useEffect(() => {
    if (selectedNailTechId && (!isSimultaneous || !!selectedSecondaryNailTechId)) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNailTechId, selectedSecondaryNailTechId, isSimultaneous]);

  // OPTIMIZED: Increased auto-refresh interval from 30s to 60s to reduce Firestore reads
  // Cache headers on API route provide freshness, so less frequent polling is safe
  useEffect(() => {
    if (!selectedNailTechId) return;
    if (isSimultaneous && !selectedSecondaryNailTechId) return;
    
    const interval = setInterval(() => {
      loadData(false); // Don't show loading spinner on auto-refresh
    }, 60000); // 60 seconds - reduced reads while still showing fresh data

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNailTechId, selectedSecondaryNailTechId, isSimultaneous]);

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
    if (isSimultaneous && !selectedSecondaryNailTechId) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      if (isSimultaneous) {
        const [resA, resB] = await Promise.all([
          fetch(`/api/availability?nailTechId=${selectedNailTechId}`),
          fetch(`/api/availability?nailTechId=${selectedSecondaryNailTechId}`),
        ]);
        if (!resA.ok || !resB.ok) throw new Error('Failed to fetch availability');
        const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
        const slotsA = (dataA?.slots || []) as any[];
        const slotsB = (dataB?.slots || []) as any[];

        const normA = slotsA.map((slot: any) => ({
          ...slot,
          id: slot.id || slot._id || slot._id?.toString?.(),
          time: normalizeSlotTime(String(slot.time || '')),
        })) as Slot[];
        const normB = slotsB.map((slot: any) => ({
          ...slot,
          id: slot.id || slot._id || slot._id?.toString?.(),
          time: normalizeSlotTime(String(slot.time || '')),
        })) as Slot[];

        const mapB = new Map<string, Slot>();
        normB
          .filter((s) => s.status === 'available')
          .forEach((s) => mapB.set(`${s.date}T${normalizeSlotTime(s.time)}`, s));

        const intersection: Slot[] = [];
        const secondaryIdMap = new Map<string, string>();
        normA.forEach((s) => {
          if (s.status !== 'available') return;
          const key = `${s.date}T${normalizeSlotTime(s.time)}`;
          const other = mapB.get(key);
          if (other) {
            intersection.push(s);
            secondaryIdMap.set(key, other.id);
          }
        });

        secondarySlotIdByDateTimeRef.current = secondaryIdMap;
        setSlots(intersection);
      } else {
        // Single-tech flow
        const response = await fetch(`/api/availability?nailTechId=${selectedNailTechId}`, {
          // Use default cache behavior - API route handles caching headers
        });
        const data = await response.json();
        const normalized = (data.slots || []).map((slot: any) => ({
          ...slot,
          id: slot.id || slot._id || slot._id?.toString?.(),
          time: normalizeSlotTime(String(slot.time || '')),
        })) as Slot[];
        setSlots(normalized);
      }
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
    if (!selectedSlot || !selectedService) {
      setLinkedSlots([]);
      setServiceMessage(null);
      return;
    }

    if (isSimultaneous) {
      setLinkedSlots([]);
      setServiceMessage(
        `This booking will reserve 2 nail techs at the same time slot (${formatTime12Hour(selectedSlot.time)}).`
      );
      return;
    }

    const requiredSlots = getRequiredSlotCount(selectedService, clientInfo?.serviceLocation);
    if (requiredSlots === 1) {
      setLinkedSlots([]);
      setServiceMessage(null);
      return;
    }

    const collected: Slot[] = [];
    let errorMessage: string | null = null;

    // Get all slots for this date and same nail tech (only check slots for the chosen nail tech)
    const slotsForDate = slots.filter(
      (s) => s.date === selectedSlot.date && s.nailTechId === selectedSlot.nailTechId
    );
    const availableForDate = slotsForDate.filter((s) => s.status === 'available');
    const chain = findConsecutiveAvailableSlots(
      slotsForDate,
      availableForDate,
      selectedSlot,
      requiredSlots
    );

    if (chain.length !== requiredSlots) {
      const availableTimes = availableForDate
        .map((s) => formatTime12Hour(s.time))
        .join(', ');
      const blocking = slotsForDate
        .filter((s) => s.status !== 'available')
        .sort((a, b) => normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time)));
      const firstBlockingAfter = blocking.find(
        (s) => normalizeSlotTime(s.time) > normalizeSlotTime(selectedSlot.time)
      );
      if (firstBlockingAfter) {
        errorMessage = `This service requires ${requiredSlots} consecutive slots, but there is a ${firstBlockingAfter.status} slot at ${formatTime12Hour(firstBlockingAfter.time)} between the slots. There is a gap in the consecutive slots. Please select a different time or date. If this is not complete, please contact our FB page for special requests.`;
      } else {
        errorMessage = `This service requires ${requiredSlots} consecutive available slots starting from ${formatTime12Hour(selectedSlot.time)}, but there aren't enough slots available after this time. Available slots on this date: ${availableTimes || 'none'}. Please select a different time or date. If this is not complete, please contact our FB page for special requests.`;
      }
    } else {
      collected.push(...chain.slice(1));
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
  }, [selectedSlot, selectedService, slots, serviceOptions, isSimultaneous, clientInfo?.serviceLocation]);

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
      if (!selectedService || getRequiredSlotCount(selectedService, clientInfo?.serviceLocation) === 1) {
        return availableSlotsForDate;
      }
      return availableSlotsForDate.filter((slot) =>
        canSlotAccommodateService(slot, selectedService, slots, clientInfo?.serviceLocation)
      );
    },
    [availableSlotsForDate, selectedService, slots, clientInfo?.serviceLocation],
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

  // Determine available days based on required consecutive slots for selected service
  const requiredSlots = getRequiredSlotCount(selectedService, clientInfo?.serviceLocation);
  
  // Filter calendar dates to show only those with enough consecutive available slots
  const availableDatesForService = useMemo(() => {
    if (!clientInfo || selectedService === null) return new Set<string>();
    
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
    
    // Check each date for consecutive available slots (required for multi-slot services)
    Object.entries(dateGroups).forEach(([dateKey, dateSlots]) => {
      if (
        dateSlots.some((slot) =>
          canSlotAccommodateService(slot, selectedService, slots, clientInfo?.serviceLocation)
        )
      ) {
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
    file: File,
    photoUploadToken: string
  ) {
    const photoData = new FormData();
    photoData.set('photoType', photoType);
    photoData.set('file', file);
    photoData.set('token', photoUploadToken);

    const photoResponse = await fetch(`/api/bookings/${bookingId}/photos`, {
      method: 'POST',
      body: photoData,
    });

    if (!photoResponse.ok) {
      const photoError = await photoResponse.json().catch(() => ({ error: 'Failed to upload photo' }));
      throw new Error(photoError.error || 'Failed to upload photo');
    }
  }

  async function uploadBookingPhotos(
    bookingId: string,
    photoUploadToken: string,
    formData: {
    currentNailPictures: File[];
    inspoPictures: File[];
  }) {
    const uploads: Promise<void>[] = [];

    const currentFiles = (formData.currentNailPictures || []).slice(0, 3);
    for (const file of currentFiles) {
      uploads.push(uploadBookingPhoto(bookingId, 'currentState', file, photoUploadToken));
    }

    const inspoFiles = (formData.inspoPictures || []).slice(0, 3);
    for (const inspoFile of inspoFiles) {
      uploads.push(uploadBookingPhoto(bookingId, 'inspiration', inspoFile, photoUploadToken));
    }

    if (uploads.length === 0) return;
    await Promise.all(uploads);
  }

  async function handleCompleteBooking(formData: {
    name: string;
    email: string;
    contactNumber: string;
    socialMediaName: string;
    socialMediaPlatform?: 'facebook' | 'instagram';
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
    address?: string;
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
            socialMediaPlatform: formData.socialMediaPlatform,
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

      const slotIds = (() => {
        if (isSimultaneous) {
          const key = `${selectedSlot.date}T${normalizeSlotTime(selectedSlot.time)}`;
          const secondarySlotId = secondarySlotIdByDateTimeRef.current.get(key);
          if (!secondarySlotId) throw new Error('Matching slot for the second nail tech is no longer available. Please select a different time.');
          return [selectedSlot.id, secondarySlotId];
        }
        return [selectedSlot.id, ...linkedSlotIds];
      })();
      const slotCount = slotIds.length;
      const basePrice = 1500;
      const depositRequired = DEPOSIT_PER_SLOT * slotCount;
      const total = basePrice + (clientInfo.serviceLocation === 'home_service' ? 1000 : 0);

      const payloadServiceType = (() => {
        if (isSimultaneous) return 'Manicure + Pedicure';
        return selectedService;
      })();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIds,
          customerId,
          customerEmail: formData.email,
          customerUpdates: isExistingCustomer && customerId ? {
            name: formData.name,
            email: formData.email,
            phone: formData.contactNumber,
            socialMediaName: formData.socialMediaName,
          } : undefined,
          nailTechId: selectedNailTechId || '',
          service: {
            type: payloadServiceType,
            location: clientInfo.serviceLocation,
            clientType: clientInfo.clientType,
            chosenServices: formData.services?.length ? formData.services : undefined,
            ...(clientInfo.serviceLocation === 'home_service' && formData.address ? { address: formData.address } : {}),
            ...(isSimultaneous && selectedSecondaryNailTechId ? { mode: 'simultaneous_two_techs', secondaryNailTechId: selectedSecondaryNailTechId, secondaryServiceType: 'Pedicure' } : {}),
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
      const photoUploadToken = data?.photoUploadToken;
      const hasPhotos =
        (formData.currentNailPictures?.length ?? 0) > 0 || (formData.inspoPictures?.length ?? 0) > 0;
      if (bookingId && hasPhotos) {
        if (!photoUploadToken) {
          photoUploadWarning =
            'Your booking was saved, but photo upload could not be completed. Please contact us if you need to add nail photos.';
        } else {
          try {
            await uploadBookingPhotos(bookingId, photoUploadToken, {
              currentNailPictures: formData.currentNailPictures,
              inspoPictures: formData.inspoPictures,
            });
          } catch (photoError) {
            console.error('Booking created but photo upload failed:', photoError);
            photoUploadWarning =
              'Your booking was saved, but some nail photos were not uploaded. You can upload them again later.';
          }
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
      
      setLatestBookingCode(
        data.partnerBooking?.bookingCode
          ? `${data.booking.bookingCode} + ${data.partnerBooking.bookingCode}`
          : data.booking.bookingCode || ''
      );
      setLatestDepositDue(depositRequired);
      setLatestUploadProofLink(data.uploadProofLink || null);
      setBookingSuccessNote(photoUploadWarning);
      setShowBookingSuccessModal(true);
      if (bookingId) {
        trackBookingCompleted(String(bookingId));
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      // Re-throw for modal to handle and display
      throw error;
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <main className="min-h-screen section-ash">
      <Header />
      
      <section className="pt-[80px] sm:pt-[90px] md:pt-[100px] lg:pt-[130px] px-2 sm:px-3 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <h1 id="booking-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading text-center mb-3 sm:mb-4 px-2 sm:px-3 text-[#1c1917] scroll-mt-28 sm:scroll-mt-32 lg:scroll-mt-36">
            Book Your Appointment
          </h1>
          <div className="brand-rule w-24 mx-auto mb-6 sm:mb-8" aria-hidden />

          {/* Nail Tech Selection - Now shown in modal */}
          {selectedNailTechId && (
            <div className="mb-6 sm:mb-8 max-w-4xl mx-auto px-2 sm:px-3">
              <div className="brand-panel px-5 py-4">
                {(() => {
                  const selectedTech = nailTechs.find(t => t.id === selectedNailTechId);
                  if (!selectedTech) return null;

                  if (isSimultaneous) {
                    const secondaryTech = nailTechs.find(t => t.id === selectedSecondaryNailTechId);
                    return (
                      <div>
                        <p className="brand-eyebrow mb-1.5">Mani + Pedi Express</p>
                        <p className="text-sm text-[#1c1917]">
                          Ms. {selectedTech.name}
                          <span className="ml-1.5 text-xs text-[#78716c]">Manicure</span>
                          {secondaryTech && (
                            <>
                              <span className="mx-2 text-[#c4b5a0]">·</span>
                              Ms. {secondaryTech.name}
                              <span className="ml-1.5 text-xs text-[#78716c]">Pedicure</span>
                            </>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                          <button
                            onClick={() => {
                              setSelectedNailTechId(null);
                              setSelectedSecondaryNailTechId(null);
                              setSelectedSlot(null);
                              setLinkedSlots([]);
                              setServiceMessage(null);
                              setShowNailTechModal(true);
                            }}
                            className="brand-eyebrow underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
                          >
                            Change nail techs
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(null);
                              setServiceChangeMode(true);
                              setShowServiceTypeModal(true);
                            }}
                            className="brand-eyebrow underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
                          >
                            Change service
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const hasDiscount =
                    clientInfo?.serviceLocation !== 'home_service' &&
                    selectedTech.discount !== undefined &&
                    selectedTech.discount !== null &&
                    selectedTech.discount > 0;
                  return (
                    <div>
                      <p className="brand-eyebrow mb-1.5">Viewing calendar for</p>
                      <p className="font-heading text-lg sm:text-xl text-[#1c1917]">Ms. {selectedTech.name}</p>
                      {hasDiscount && (
                        <p className="mt-2 inline-flex items-center border border-[#c4b5a0] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#3d342c]">
                          Special offer · {selectedTech.discount}% off studio services
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                        <button
                          onClick={() => {
                            setSelectedNailTechId(null);
                            setSelectedSecondaryNailTechId(null);
                            setSelectedSlot(null);
                            setLinkedSlots([]);
                            setServiceMessage(null);
                            setShowNailTechModal(true);
                          }}
                          className="brand-eyebrow underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
                        >
                          Change nail tech
                        </button>
                        <button
                          onClick={() => {
                            setSelectedService(null);
                            // Open service modal as a "change" modal.
                            // If user presses Back/Close, we should return to calendar.
                            setServiceChangeMode(true);
                            setShowServiceTypeModal(true);
                          }}
                          className="brand-eyebrow underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917]"
                        >
                          Change service
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {!selectedNailTechId ? null : loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b border-[#c4b5a0] mx-auto mb-5" />
                <p className="brand-eyebrow">Loading calendar</p>
              </div>
            </div>
          ) : (
            <>
              <div className="max-w-4xl mx-auto px-2 sm:px-3">
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
                          nailTechName={
                            selectedNailTechId
                              ? isSimultaneous
                                ? `Ms. ${nailTechs.find(t => t.id === selectedNailTechId)?.name || ''} + Ms. ${nailTechs.find(t => t.id === selectedSecondaryNailTechId)?.name || ''}`
                                : `Ms. ${nailTechs.find(t => t.id === selectedNailTechId)?.name || ''}`
                              : undefined
                          }
                          noAvailableSlotsDates={requiredSlots > 1 ? noAvailableSlotsDates : []}
                          disablePastDates
                        />
                      );
                    })()}
                  </div>

                  <section 
                    ref={slotsSectionRef}
                    className="brand-panel p-3 sm:p-4 lg:p-6 scroll-mt-24 order-1 lg:order-2 flex flex-col"
                  >
                  <header className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="brand-eyebrow">Available slots</p>
                      <button
                        type="button"
                        onClick={() => loadData(true)}
                        disabled={loading}
                        className="brand-eyebrow underline decoration-[#c4b5a0] underline-offset-4 transition-colors hover:text-[#1c1917] disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh slots"
                      >
                        {loading ? 'Refreshing' : 'Refresh'}
                      </button>
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-heading break-words text-[#1c1917]">
                      {format(parseISO(selectedDate), 'EEEE, MMM d')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#78716c] mt-0.5">
                      Tap a time to reserve it.
                    </p>
                    {clientInfo && selectedService && getRequiredSlotCount(selectedService, clientInfo.serviceLocation) > 1 && (
                      <p className="brand-note mt-3 text-xs leading-relaxed">
                        Select the <span className="text-[#1c1917]">first</span> slot for {getRequiredSlotCount(selectedService, clientInfo.serviceLocation)}-slot services.
                      </p>
                    )}
                  </header>

                  <div className="space-y-2 sm:space-y-3 max-h-[60vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                    {(() => {
                      const slotsToDisplay = requiredSlots === 1 ? availableSlotsForDate : compatibleSlotsForDate;
                      return slotsToDisplay.length === 0 ? (
                        <div className="brand-note-error">
                          <p className="font-heading text-lg">No available slots</p>
                          <p className="mt-1 text-xs sm:text-sm">
                            Please select a different date.
                            {requiredSlots > 1 ? ' If this schedule is not complete, please message our Facebook page for special requests.' : ''}
                          </p>
                        </div>
                      ) : null;
                    })()}
                    {(() => {
                      const slotsToDisplay = requiredSlots === 1 ? availableSlotsForDate : compatibleSlotsForDate;
                      // Sort slots chronologically by time
                      const sortedSlots = [...slotsToDisplay].sort((a, b) => normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time)));
                      return sortedSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSelectSlotAndOpenForm(slot)}
                          className="group w-full cursor-pointer border border-[#c4b5a0] bg-[#f0ebe4] px-3 sm:px-4 py-3 text-left transition-all duration-300 active:scale-[0.98] focus:outline-none focus:border-[#1c1917] focus:ring-1 focus:ring-[#c4b5a0] touch-manipulation hover:border-[#1c1917] hover:bg-[#e7e2db]"
                        >
                          {slot.slotType === 'with_squeeze_fee' && (
                            <span className="inline-flex items-center mb-1.5 px-2 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] border border-[#c4b5a0] text-[#3d342c]">
                              {formatPeso(SQUEEZE_IN_FEE)} squeeze-in fee
                            </span>
                          )}
                          <p className="brand-numeric text-base sm:text-lg text-[#1c1917]">{formatTime12Hour(slot.time)}</p>
                          {slot.notes && <p className="text-xs sm:text-sm mt-0.5 text-[#78716c]">{slot.notes}</p>}
                        </button>
                      ));
                    })()}
                  </div>
                </section>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm px-2 sm:px-3">
                {error ? (
                  <p className="text-[#5a3830]">{error}</p>
                ) : (
                  <p className="text-[#78716c]">Highlighted dates have open slots. Available times appear once you select a date.</p>
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
          setSelectedService(null);
          setSelectedNailTechId(null);
          setSelectedSecondaryNailTechId(null);
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
          setServiceChangeMode(false);
          // Changing service should invalidate previously-selected tech/slots.
          setSelectedNailTechId(null);
          setSelectedSecondaryNailTechId(null);
          setSelectedSlot(null);
          setLinkedSlots([]);
          setServiceMessage(null);
        }}
        onBack={() => {
          if (serviceChangeMode) {
            setShowServiceTypeModal(false);
            setServiceChangeMode(false);
            // Keep existing calendar context (tech/service selection) and just return.
            return;
          }
          setShowServiceTypeModal(false);
          setShowClientTypeModal(true);
          setClientInfo(null);
        }}
      />

      {/* Nail Tech Selection Modal - Shows after service type is selected */}
      {isSimultaneous ? (
        <DualNailTechSelectionModal
          isOpen={showNailTechModal}
          nailTechs={nailTechs}
          serviceLocation={clientInfo?.serviceLocation || 'homebased_studio'}
          manicureTechId={selectedNailTechId}
          pedicureTechId={selectedSecondaryNailTechId}
          onSelectManicure={(techId) => {
            setSelectedNailTechId(techId);
            setSelectedSlot(null);
            setLinkedSlots([]);
            setServiceMessage(null);
          }}
          onSelectPedicure={(techId) => {
            setSelectedSecondaryNailTechId(techId);
            setSelectedSlot(null);
            setLinkedSlots([]);
            setServiceMessage(null);
          }}
          onContinue={() => {
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
      ) : (
        <NailTechSelectionModal
          isOpen={showNailTechModal}
          nailTechs={nailTechs}
          selectedNailTechId={selectedNailTechId}
          serviceLocation={clientInfo?.serviceLocation || 'homebased_studio'}
          onContinue={(techId) => {
            setSelectedNailTechId(techId);
            setSelectedSecondaryNailTechId(null);
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
      )}

      {/* Slot Confirmation Modal - Shows after slot selection */}
      <SlotConfirmationModal
        isOpen={showSlotConfirmModal}
        slotDate={selectedSlot?.date || ''}
        slotTime={selectedSlot?.time || ''}
        slotType={selectedSlot?.slotType}
        linkedSlotTimes={linkedSlots.map(s => s.time)}
        slotCount={selectedSlot ? (isSimultaneous ? 2 : 1 + linkedSlots.length) : 0}
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
        slotCount={selectedSlot ? (isSimultaneous ? 2 : 1 + linkedSlots.length) : 0}
        isManiPediExpress={isSimultaneous}
        clientType={clientInfo?.clientType || 'new'}
        serviceLocation={clientInfo?.serviceLocation || 'homebased_studio'}
        clientName={clientInfo?.customerName}
        clientEmail={clientInfo?.customerEmail}
        clientContactNumber={clientInfo?.contactNumber}
        clientSocialMediaName={clientInfo?.socialMediaName}
        onClose={() => setShowBookingFormModal(false)}
        onSubmit={handleCompleteBooking}
        isSubmitting={isBooking}
      />
      
      <BookingSuccessModal
        isOpen={showBookingSuccessModal}
        bookingCode={latestBookingCode}
        depositAmount={latestDepositDue}
        uploadProofLink={latestUploadProofLink}
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

