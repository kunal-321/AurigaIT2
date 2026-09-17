import { useState, useCallback } from 'react';
import { ParkingSpot, ParkedCar, Transaction, SpotType, PricingConfig } from '../types';
import { calculateFee, DEFAULT_PRICING } from '../utils/pricing';

// Generate initial spots for an Indian city-centre garage
function generateSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];

  // Two-wheeler spots: TW-01 to TW-20 (bikes/scooters are very common in India)
  for (let i = 1; i <= 20; i++) {
    spots.push({
      id: `TW-${String(i).padStart(2, '0')}`,
      type: 'twoWheeler',
      label: `TW-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }

  // Compact spots: C-01 to C-10 (for small cars like Alto, Swift, i20)
  for (let i = 1; i <= 10; i++) {
    spots.push({
      id: `C-${String(i).padStart(2, '0')}`,
      type: 'compact',
      label: `C-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }

  // Standard spots: S-01 to S-15 (for sedans, SUVs like Creta, Innova)
  for (let i = 1; i <= 15; i++) {
    spots.push({
      id: `S-${String(i).padStart(2, '0')}`,
      type: 'standard',
      label: `S-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }

  // EV spots: E-01 to E-05 (with charger)
  for (let i = 1; i <= 5; i++) {
    spots.push({
      id: `E-${String(i).padStart(2, '0')}`,
      type: 'ev',
      label: `E-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }

  return spots;
}

export type AvailabilitySummary = {
  [K in SpotType]: { total: number; available: number; occupied: number };
};

export function useParkingGarage() {
  const [spots, setSpots] = useState<ParkingSpot[]>(generateSpots);
  const [parkedCars, setParkedCars] = useState<ParkedCar[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  const getAvailableSpots = useCallback((type?: SpotType): ParkingSpot[] => {
    return spots.filter(s => !s.occupied && (!type || s.type === type));
  }, [spots]);

  const hasAvailability = useCallback((type: SpotType): boolean => {
    return spots.some(s => s.type === type && !s.occupied);
  }, [spots]);

  const findCarByPlate = useCallback((plate: string): ParkedCar | undefined => {
    return parkedCars.find(c => c.plate.toLowerCase() === plate.toLowerCase().trim());
  }, [parkedCars]);

  const checkIn = useCallback((plate: string, spotType: SpotType): { success: boolean; message: string; spotId?: string } => {
    const normalizedPlate = plate.toUpperCase().trim();

    if (findCarByPlate(normalizedPlate)) {
      return { success: false, message: `Vehicle ${normalizedPlate} is already parked in the garage.` };
    }

    if (spotType === 'ev') {
      if (!hasAvailability('ev')) {
        return { success: false, message: 'No EV spots available. All charger spots are occupied.' };
      }
    }

    const availableSpot = spots.find(s => s.type === spotType && !s.occupied);
    if (!availableSpot) {
      return { success: false, message: `No ${getSpotLabel(spotType)} spots available.` };
    }

    const now = new Date();

    setSpots(prev => prev.map(s =>
      s.id === availableSpot.id ? { ...s, occupied: true } : s
    ));

    setParkedCars(prev => [...prev, {
      plate: normalizedPlate,
      spotId: availableSpot.id,
      spotType,
      checkInTime: now,
    }]);

    return { success: true, message: `Vehicle ${normalizedPlate} checked in at spot ${availableSpot.id}.`, spotId: availableSpot.id };
  }, [spots, findCarByPlate, hasAvailability]);

  const checkOut = useCallback((plate: string): { success: boolean; message: string; fee?: number; duration?: number } => {
    const normalizedPlate = plate.toUpperCase().trim();
    const car = findCarByPlate(normalizedPlate);

    if (!car) {
      return { success: false, message: `Vehicle ${normalizedPlate} not found in the garage.` };
    }

    const now = new Date();
    const { fee, durationHours } = calculateFee(car.checkInTime, now, pricing);

    setSpots(prev => prev.map(s =>
      s.id === car.spotId ? { ...s, occupied: false } : s
    ));

    setParkedCars(prev => prev.filter(c => c.plate !== normalizedPlate));

    const transaction: Transaction = {
      id: `TXN-${Date.now()}`,
      plate: normalizedPlate,
      spotId: car.spotId,
      spotType: car.spotType,
      checkInTime: car.checkInTime,
      checkOutTime: now,
      durationHours,
      fee,
    };

    setTransactions(prev => [transaction, ...prev]);

    return { success: true, message: `Vehicle ${normalizedPlate} checked out. Fee: ₹${fee} for ${durationHours} hour(s).`, fee, duration: durationHours };
  }, [findCarByPlate, pricing]);

  const getAvailabilitySummary = useCallback((): AvailabilitySummary => {
    const summary: AvailabilitySummary = {
      twoWheeler: { total: 0, available: 0, occupied: 0 },
      compact: { total: 0, available: 0, occupied: 0 },
      standard: { total: 0, available: 0, occupied: 0 },
      ev: { total: 0, available: 0, occupied: 0 },
    };

    spots.forEach(s => {
      summary[s.type].total++;
      if (s.occupied) {
        summary[s.type].occupied++;
      } else {
        summary[s.type].available++;
      }
    });

    return summary;
  }, [spots]);

  return {
    spots,
    parkedCars,
    transactions,
    pricing,
    setPricing,
    getAvailableSpots,
    hasAvailability,
    findCarByPlate,
    checkIn,
    checkOut,
    getAvailabilitySummary,
  };
}

function getSpotLabel(type: SpotType): string {
  switch (type) {
    case 'twoWheeler': return 'Two-Wheeler';
    case 'compact': return 'Compact';
    case 'standard': return 'Standard';
    case 'ev': return 'EV';
  }
}
