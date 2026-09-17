import { PricingConfig, SpotType, SpotTypePricing } from '../types';

/**
 * Default per-type pricing for Indian parking garage.
 * Two-wheelers are cheaper, EVs might have a premium.
 */
export const DEFAULT_PRICING: PricingConfig = {
  // Legacy flat rates (used as fallback)
  firstHourRate: 40,
  additionalHourRate: 20,
  dailyCap: 200,
  // Per-type rates
  byType: {
    twoWheeler: { firstHourRate: 20, additionalHourRate: 10, dailyCap: 100 },
    compact: { firstHourRate: 40, additionalHourRate: 20, dailyCap: 200 },
    standard: { firstHourRate: 60, additionalHourRate: 30, dailyCap: 300 },
    ev: { firstHourRate: 80, additionalHourRate: 40, dailyCap: 400 },
  },
};

/**
 * Get pricing for a specific spot type.
 * Falls back to legacy flat rates if per-type not available.
 */
export function getPricingForType(pricing: PricingConfig, spotType: SpotType): SpotTypePricing {
  if (pricing.byType && pricing.byType[spotType]) {
    return pricing.byType[spotType];
  }
  // Fallback to legacy flat rates
  return {
    firstHourRate: pricing.firstHourRate,
    additionalHourRate: pricing.additionalHourRate,
    dailyCap: pricing.dailyCap,
  };
}

/**
 * Calculate parking fee based on duration and spot type.
 * - First hour at firstHourRate
 * - Each additional hour at additionalHourRate (cheaper)
 * - Daily cap applies
 * - Part-hours round up
 */
export function calculateFee(
  checkInTime: Date,
  checkOutTime: Date,
  spotType: SpotType,
  pricing: PricingConfig = DEFAULT_PRICING
): { fee: number; durationHours: number } {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Round up to nearest hour (part-hours round up)
  const durationHours = Math.ceil(diffMinutes / 60);

  if (durationHours <= 0) return { fee: 0, durationHours: 0 };

  // Get pricing for this spot type
  const typePricing = getPricingForType(pricing, spotType);

  let fee: number;

  if (durationHours <= 1) {
    fee = typePricing.firstHourRate;
  } else {
    fee = typePricing.firstHourRate + (durationHours - 1) * typePricing.additionalHourRate;
  }

  // Apply daily cap
  fee = Math.min(fee, typePricing.dailyCap);

  return { fee, durationHours };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export function formatDateTime(date: Date): string {
  // Indian format: DD/MM/YYYY, 12-hour time
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${day}/${month}/${year}, ${h12}:${minutes} ${ampm}`;
}

/** Indian state codes for plate suggestions */
export const INDIAN_STATES = [
  'AP', 'AR', 'AS', 'BR', 'CG', 'DL', 'GA', 'GJ', 'HR', 'HP',
  'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD',
  'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB',
];
