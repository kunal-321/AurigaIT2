export type SpotType = 'compact' | 'standard' | 'ev';

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
}

export interface PricingConfig {
  firstHourRate: number;
  additionalHourRate: number;
  dailyCap: number;
}
