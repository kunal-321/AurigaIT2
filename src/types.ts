export type SpotType = 'twoWheeler' | 'compact' | 'standard' | 'ev';

export interface ParkingSpot {
  id: string;
  type: SpotType;
  label: string;
  occupied: boolean;
}

export interface ParkedCar {
  plate: string;
  spotId: string;
  spotType: SpotType;
  checkInTime: Date;
}

export interface Transaction {
  id: string;
  plate: string;
  spotId: string;
  spotType: SpotType;
  checkInTime: Date;
  checkOutTime: Date;
  durationHours: number;
  fee: number;
  // Payment information (added for Razorpay integration)
  paymentId?: string;
  paymentMethod?: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash';
  paymentStatus?: 'success' | 'failed' | 'pending';
  paymentTimestamp?: Date;
}

export interface SpotTypePricing {
  firstHourRate: number;
  additionalHourRate: number;
  dailyCap: number;
}

export interface PricingConfig {
  // Legacy flat rates (for backward compatibility)
  firstHourRate: number;
  additionalHourRate: number;
  dailyCap: number;
  // Per-type rates (new structure)
  byType: {
    twoWheeler: SpotTypePricing;
    compact: SpotTypePricing;
    standard: SpotTypePricing;
    ev: SpotTypePricing;
  };
}
