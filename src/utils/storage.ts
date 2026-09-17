import { ParkingSpot, ParkedCar, Transaction, PricingConfig, SpotType } from '../types';

const STORAGE_KEY = 'parkdesk_data';
const STORAGE_VERSION = 1;

/**
 * Shape of data persisted to localStorage.
 * Dates are stored as ISO strings; we rehydrate them on load.
 */
interface SerializedData {
  version: number;
  savedAt: string; // ISO timestamp of when we saved
  spots: Array<{
    id: string;
    type: SpotType;
    label: string;
    occupied: boolean;
  }>;
  parkedCars: Array<{
    plate: string;
    spotId: string;
    spotType: SpotType;
    checkInTime: string; // ISO
  }>;
  transactions: Array<{
    id: string;
    plate: string;
    spotId: string;
    spotType: SpotType;
    checkInTime: string; // ISO
    checkOutTime: string; // ISO
    durationHours: number;
    fee: number;
  }>;
  pricing: PricingConfig;
}

const VALID_SPOT_TYPES: SpotType[] = ['twoWheeler', 'compact', 'standard', 'ev'];

/**
 * Check if a value is a valid SpotType.
 */
function isValidSpotType(value: unknown): value is SpotType {
  return typeof value === 'string' && VALID_SPOT_TYPES.includes(value as SpotType);
}

/**
 * Validate and rehydrate a single spot.
 * Returns null if invalid.
 */
function validateSpot(spot: unknown): ParkingSpot | null {
  if (!spot || typeof spot !== 'object') return null;
  const s = spot as Record<string, unknown>;

  if (
    typeof s.id !== 'string' ||
    !isValidSpotType(s.type) ||
    typeof s.label !== 'string' ||
    typeof s.occupied !== 'boolean'
  ) {
    return null;
  }

  return {
    id: s.id,
    type: s.type,
    label: s.label,
    occupied: s.occupied,
  };
}

/**
 * Validate and rehydrate a parked car.
 * Returns null if invalid.
 */
function validateParkedCar(car: unknown): ParkedCar | null {
  if (!car || typeof car !== 'object') return null;
  const c = car as Record<string, unknown>;

  if (
    typeof c.plate !== 'string' ||
    typeof c.spotId !== 'string' ||
    !isValidSpotType(c.spotType) ||
    typeof c.checkInTime !== 'string'
  ) {
    return null;
  }

  const checkInTime = new Date(c.checkInTime);
  if (isNaN(checkInTime.getTime())) return null;

  return {
    plate: c.plate,
    spotId: c.spotId,
    spotType: c.spotType,
    checkInTime,
  };
}

/**
 * Validate and rehydrate a transaction.
 * Returns null if invalid.
 */
function validateTransaction(txn: unknown): Transaction | null {
  if (!txn || typeof txn !== 'object') return null;
  const t = txn as Record<string, unknown>;

  if (
    typeof t.id !== 'string' ||
    typeof t.plate !== 'string' ||
    typeof t.spotId !== 'string' ||
    !isValidSpotType(t.spotType) ||
    typeof t.checkInTime !== 'string' ||
    typeof t.checkOutTime !== 'string' ||
    typeof t.durationHours !== 'number' ||
    typeof t.fee !== 'number'
  ) {
    return null;
  }

  const checkInTime = new Date(t.checkInTime);
  const checkOutTime = new Date(t.checkOutTime);
  if (isNaN(checkInTime.getTime()) || isNaN(checkOutTime.getTime())) return null;

  return {
    id: t.id,
    plate: t.plate,
    spotId: t.spotId,
    spotType: t.spotType,
    checkInTime,
    checkOutTime,
    durationHours: t.durationHours,
    fee: t.fee,
  };
}

/**
 * Validate pricing config.
 * Returns null if invalid.
 */
function validatePricing(pricing: unknown): PricingConfig | null {
  if (!pricing || typeof pricing !== 'object') return null;
  const p = pricing as Record<string, unknown>;

  // Validate legacy flat rates
  if (
    typeof p.firstHourRate !== 'number' ||
    typeof p.additionalHourRate !== 'number' ||
    typeof p.dailyCap !== 'number' ||
    p.firstHourRate < 0 ||
    p.additionalHourRate < 0 ||
    p.dailyCap < 0
  ) {
    return null;
  }

  // Validate per-type rates (new structure)
  if (!p.byType || typeof p.byType !== 'object') {
    return null;
  }

  const byType = p.byType as Record<string, unknown>;
  const spotTypes = ['twoWheeler', 'compact', 'standard', 'ev'];

  for (const type of spotTypes) {
    if (!byType[type] || typeof byType[type] !== 'object') {
      return null;
    }

    const typePricing = byType[type] as Record<string, unknown>;
    if (
      typeof typePricing.firstHourRate !== 'number' ||
      typeof typePricing.additionalHourRate !== 'number' ||
      typeof typePricing.dailyCap !== 'number' ||
      typePricing.firstHourRate < 0 ||
      typePricing.additionalHourRate < 0 ||
      typePricing.dailyCap < 0
    ) {
      return null;
    }
  }

  return {
    firstHourRate: p.firstHourRate,
    additionalHourRate: p.additionalHourRate,
    dailyCap: p.dailyCap,
    byType: {
      twoWheeler: byType.twoWheeler as any,
      compact: byType.compact as any,
      standard: byType.standard as any,
      ev: byType.ev as any,
    },
  };
}

/**
 * Load persisted data from localStorage.
 * Returns null if data is missing, corrupted, or invalid.
 * Gracefully handles:
 * - localStorage not available (e.g., private browsing)
 * - JSON parse errors
 * - Schema mismatches
 * - Invalid dates
 * - Missing fields
 */
export function loadFromStorage(): {
  spots: ParkingSpot[];
  parkedCars: ParkedCar[];
  transactions: Transaction[];
  pricing: PricingConfig;
} | null {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('[ParkDesk] localStorage not available');
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.info('[ParkDesk] No saved data found in localStorage');
      return null;
    }

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('[ParkDesk] Failed to parse localStorage data:', e);
      return null;
    }

    if (!data || typeof data !== 'object') {
      console.error('[ParkDesk] localStorage data is not an object');
      return null;
    }

    const d = data as Record<string, unknown>;

    // Check version
    if (typeof d.version !== 'number' || d.version !== STORAGE_VERSION) {
      console.warn(`[ParkDesk] Storage version mismatch (expected ${STORAGE_VERSION}, got ${d.version})`);
      return null;
    }

    // Validate and rehydrate spots
    if (!Array.isArray(d.spots)) {
      console.error('[ParkDesk] spots is not an array');
      return null;
    }
    const spots: ParkingSpot[] = [];
    for (const spot of d.spots) {
      const validated = validateSpot(spot);
      if (validated) {
        spots.push(validated);
      } else {
        console.warn('[ParkDesk] Skipping invalid spot:', spot);
      }
    }
    if (spots.length === 0) {
      console.error('[ParkDesk] No valid spots found');
      return null;
    }

    // Validate and rehydrate parkedCars
    if (!Array.isArray(d.parkedCars)) {
      console.error('[ParkDesk] parkedCars is not an array');
      return null;
    }
    const parkedCars: ParkedCar[] = [];
    for (const car of d.parkedCars) {
      const validated = validateParkedCar(car);
      if (validated) {
        parkedCars.push(validated);
      } else {
        console.warn('[ParkDesk] Skipping invalid parked car:', car);
      }
    }

    // Validate and rehydrate transactions
    if (!Array.isArray(d.transactions)) {
      console.error('[ParkDesk] transactions is not an array');
      return null;
    }
    const transactions: Transaction[] = [];
    for (const txn of d.transactions) {
      const validated = validateTransaction(txn);
      if (validated) {
        transactions.push(validated);
      } else {
        console.warn('[ParkDesk] Skipping invalid transaction:', txn);
      }
    }

    // Validate pricing (optional - use defaults if invalid)
    const pricing = validatePricing(d.pricing);
    if (!pricing) {
      console.warn('[ParkDesk] Invalid pricing, will use defaults');
      return null;
    }

    console.info('[ParkDesk] Successfully loaded data from localStorage', {
      spots: spots.length,
      parkedCars: parkedCars.length,
      transactions: transactions.length,
      savedAt: d.savedAt,
    });

    return { spots, parkedCars, transactions, pricing };
  } catch (error) {
    console.error('[ParkDesk] Unexpected error loading from localStorage:', error);
    return null;
  }
}

/**
 * Save data to localStorage.
 * Gracefully handles:
 * - localStorage not available
 * - Quota exceeded errors
 * - Serialization errors
 */
export function saveToStorage(
  spots: ParkingSpot[],
  parkedCars: ParkedCar[],
  transactions: Transaction[],
  pricing: PricingConfig
): boolean {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('[ParkDesk] localStorage not available for saving');
      return false;
    }

    const data: SerializedData = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      spots: spots.map(s => ({
        id: s.id,
        type: s.type,
        label: s.label,
        occupied: s.occupied,
      })),
      parkedCars: parkedCars.map(c => ({
        plate: c.plate,
        spotId: c.spotId,
        spotType: c.spotType,
        checkInTime: c.checkInTime.toISOString(),
      })),
      transactions: transactions.map(t => ({
        id: t.id,
        plate: t.plate,
        spotId: t.spotId,
        spotType: t.spotType,
        checkInTime: t.checkInTime.toISOString(),
        checkOutTime: t.checkOutTime.toISOString(),
        durationHours: t.durationHours,
        fee: t.fee,
      })),
      pricing,
    };

    const serialized = JSON.stringify(data);

    // Check size (warn if > 4MB, which is close to typical 5MB limit)
    const sizeInBytes = new Blob([serialized]).size;
    if (sizeInBytes > 4 * 1024 * 1024) {
      console.warn(`[ParkDesk] Storage size is large: ${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`);
    }

    localStorage.setItem(STORAGE_KEY, serialized);

    return true;
  } catch (error) {
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[ParkDesk] localStorage quota exceeded. Data not saved.');
      // Could implement cleanup strategy here (e.g., remove old transactions)
    } else {
      console.error('[ParkDesk] Failed to save to localStorage:', error);
    }
    return false;
  }
}

/**
 * Clear all persisted data.
 */
export function clearStorage(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    localStorage.removeItem(STORAGE_KEY);
    console.info('[ParkDesk] localStorage cleared');
    return true;
  } catch (error) {
    console.error('[ParkDesk] Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Get storage info (for debugging).
 */
export function getStorageInfo(): { exists: boolean; size: number; savedAt: string | null } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { exists: false, size: 0, savedAt: null };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { exists: false, size: 0, savedAt: null };
    }

    const data = JSON.parse(raw);
    const sizeInBytes = new Blob([raw]).size;

    return {
      exists: true,
      size: sizeInBytes,
      savedAt: data.savedAt || null,
    };
  } catch (error) {
    console.error('[ParkDesk] Failed to get storage info:', error);
    return { exists: false, size: 0, savedAt: null };
  }
}
