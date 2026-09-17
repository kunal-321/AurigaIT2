import { useState, useCallback, useEffect } from 'react';
import { ParkingSpot, ParkedCar, Transaction, SpotType, PricingConfig } from '../types';
import { calculateFee, DEFAULT_PRICING } from '../utils/pricing';
import { loadFromStorage, saveToStorage } from '../utils/storage';

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
  // Load all data from localStorage once on initialization
  const [initialData] = useState(() => loadFromStorage());

  // Initialize state from localStorage or use defaults
  const [spots, setSpots] = useState<ParkingSpot[]>(
    initialData ? initialData.spots : generateSpots()
  );

  const [parkedCars, setParkedCars] = useState<ParkedCar[]>(
    initialData ? initialData.parkedCars : []
  );

  const [transactions, setTransactions] = useState<Transaction[]>(
    initialData ? initialData.transactions : []
  );

  const [pricing, setPricing] = useState<PricingConfig>(
    initialData ? initialData.pricing : DEFAULT_PRICING
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(spots, parkedCars, transactions, pricing);
  }, [spots, parkedCars, transactions, pricing]);

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

  const checkOut = useCallback((plate: string): { success: boolean; message: string; fee?: number; duration?: number; transaction?: Transaction } => {
    const normalizedPlate = plate.toUpperCase().trim();
    const car = findCarByPlate(normalizedPlate);

    if (!car) {
      return { success: false, message: `Vehicle ${normalizedPlate} not found in the garage.` };
    }

    const now = new Date();
    const { fee, durationHours } = calculateFee(car.checkInTime, now, car.spotType, pricing);

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

    return { success: true, message: `Vehicle ${normalizedPlate} checked out. Fee: ₹${fee} for ${durationHours} hour(s).`, fee, duration: durationHours, transaction };
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

  /**
   * Level 3 — T6: Transfer an open session to a different plate (valet hand-off).
   * Spot and entry time carry over.
   */
  const transferSession = useCallback((fromPlate: string, toPlate: string): {
    success: boolean;
    message: string;
  } => {
    const normalizedFrom = fromPlate.toUpperCase().trim();
    const normalizedTo = toPlate.toUpperCase().trim();

    // Validation: source must exist
    const sourceCar = findCarByPlate(normalizedFrom);
    if (!sourceCar) {
      return {
        success: false,
        message: `Vehicle ${normalizedFrom} is not currently parked in the garage.`,
      };
    }

    // Validation: destination must not already be parked
    if (findCarByPlate(normalizedTo)) {
      return {
        success: false,
        message: `Vehicle ${normalizedTo} is already parked in the garage. Cannot transfer.`,
      };
    }

    // Validation: plates must be different
    if (normalizedFrom === normalizedTo) {
      return {
        success: false,
        message: 'Source and destination plates are the same.',
      };
    }

    // Validation: destination plate must not be empty
    if (!normalizedTo) {
      return {
        success: false,
        message: 'Destination plate cannot be empty.',
      };
    }

    // Perform the transfer: update the plate, keep spot and checkInTime
    setParkedCars(prev =>
      prev.map(car =>
        car.plate === normalizedFrom
          ? { ...car, plate: normalizedTo }
          : car
      )
    );

    return {
      success: true,
      message: `Session transferred from ${normalizedFrom} to ${normalizedTo}. Spot ${sourceCar.spotId} and entry time preserved.`,
    };
  }, [findCarByPlate]);

  /**
   * Level 2 — T2: Auto-close vehicles parked over 24 hours.
   * Simulates POST /clock endpoint (nightly job).
   */
  const autoCloseLongStay = useCallback((): {
    closed: Array<{ plate: string; fee: number; duration: number }>;
    totalRevenue: number;
  } => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const longStayVehicles = parkedCars.filter(car => 
      car.checkInTime < twentyFourHoursAgo
    );

    const closed: Array<{ plate: string; fee: number; duration: number }> = [];
    let totalRevenue = 0;

    longStayVehicles.forEach(car => {
      const { fee, durationHours } = calculateFee(car.checkInTime, now, car.spotType, pricing);

      // Free the spot
      setSpots(prev => prev.map(s =>
        s.id === car.spotId ? { ...s, occupied: false } : s
      ));

      // Create transaction
      const transaction: Transaction = {
        id: `TXN-AUTO-${Date.now()}-${car.plate}`,
        plate: car.plate,
        spotId: car.spotId,
        spotType: car.spotType,
        checkInTime: car.checkInTime,
        checkOutTime: now,
        durationHours,
        fee,
      };

      setTransactions(prev => [transaction, ...prev]);

      closed.push({
        plate: car.plate,
        fee,
        duration: durationHours,
      });

      totalRevenue += fee;
    });

    // Remove all long-stay vehicles from parkedCars
    setParkedCars(prev => 
      prev.filter(car => car.checkInTime >= twentyFourHoursAgo)
    );

    return { closed, totalRevenue };
  }, [parkedCars, pricing]);

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
    autoCloseLongStay,
    transferSession,
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
