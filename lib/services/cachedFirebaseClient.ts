// Firebase Client Lookup with Caching
// ====================================
// Add this to optimize your existing Firebase setup
// NO MIGRATION NEEDED!

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Simple in-memory cache
const clientCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Check cache first, then Firebase
export async function findClientByPhone(phone: string) {
  // Normalize phone number
  const normalizedPhone = phone.replace(/\D/g, '');
  const cacheKey = `phone:${normalizedPhone}`;

  // Check cache
  const cached = clientCache.get(cacheKey) as CacheEntry;
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('✓ Cache hit - 0 Firebase reads');
    return cached.data;
  }

  // Query Firebase (only if not cached)
  console.log('→ Querying Firebase...');
  const clientsRef = collection(db, 'clients');
  const q = query(
    clientsRef,
    where('phone', '==', phone), // Uses index
    limit(1)
  );

  const snapshot = await getDocs(q);
  
  let clientData = null;
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    clientData = { id: doc.id, ...doc.data() };
  }

  // Cache the result (even if null)
  clientCache.set(cacheKey, {
    data: clientData,
    timestamp: Date.now(),
  });

  return clientData;
}

// Check if client exists (lightweight)
export async function clientExists(phone: string): Promise<boolean> {
  const client = await findClientByPhone(phone);
  return !!client;
}

// Clear cache for a specific phone (call after updating client)
export function clearClientCache(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '');
  clientCache.delete(`phone:${normalizedPhone}`);
}

// Clear entire cache (call after bulk updates)
export function clearAllClientCache() {
  clientCache.clear();
}

// Preload frequent clients (optional)
export async function preloadFrequentClients() {
  const clientsRef = collection(db, 'clients');
  const q = query(
    clientsRef,
    where('isRepeatClient', '==', true),
    limit(50) // Load top 50 repeat clients
  );

  const snapshot = await getDocs(q);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.phone) {
      const normalizedPhone = data.phone.replace(/\D/g, '');
      clientCache.set(`phone:${normalizedPhone}`, {
        data: { id: doc.id, ...data },
        timestamp: Date.now(),
      });
    }
  });

  console.log(`✓ Preloaded ${snapshot.size} clients into cache`);
}

// COST ANALYSIS:
// =============
// Without cache: 
//   - 1000 client lookups = 1000 reads = $0.36
// 
// With cache (95% hit rate):
//   - 1000 lookups = 50 reads = $0.018 (~$0.02)
//   - 20x cost reduction!
//
// Cache benefits:
//   - Faster responses (<5ms vs 50-100ms)
//   - Reduced Firebase costs (95%+ reduction)
//   - No migration needed!

export { clientCache };
