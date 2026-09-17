import { PricingConfig } from '../types';

export const DEFAULT_PRICING: PricingConfig = {
  firstHourRate: 5.0,
  additionalHourRate: 3.0,
  dailyCap: 25.0,
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
    // First hour (or less, but rounds up to 1)
    fee = pricing.firstHourRate;
  } else {
    // First hour + additional hours
    fee = pricing.firstHourRate + (durationHours - 1) * pricing.additionalHourRate;
  }
  
  // Apply daily cap
  fee = Math.min(fee, pricing.dailyCap);
  
  return { fee, durationHours };
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
