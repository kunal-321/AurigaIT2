import { PricingConfig } from '../types';

export const DEFAULT_PRICING: PricingConfig = {
  firstHourRate: 40,
  additionalHourRate: 20,
  dailyCap: 200,
};

/**
 * Calculate parking fee based on duration.
 * - First hour at firstHourRate
 * - Each additional hour at additionalHourRate (cheaper)
 * - Daily cap applies
 * - Part-hours round up
 */
export function calculateFee(
  checkInTime: Date,
  checkOutTime: Date,
  pricing: PricingConfig = DEFAULT_PRICING
): { fee: number; durationHours: number } {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Round up to nearest hour (part-hours round up)
  const durationHours = Math.ceil(diffMinutes / 60);

  if (durationHours <= 0) return { fee: 0, durationHours: 0 };

  let fee: number;

  if (durationHours <= 1) {
    fee = pricing.firstHourRate;
  } else {
    fee = pricing.firstHourRate + (durationHours - 1) * pricing.additionalHourRate;
  }

  // Apply daily cap
  fee = Math.min(fee, pricing.dailyCap);

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
