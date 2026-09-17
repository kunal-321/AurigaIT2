import { useState, useCallback } from 'react';
import { ParkingSpot, ParkedCar, Transaction, SpotType, PricingConfig } from '../types';
import { calculateFee, DEFAULT_PRICING } from '../utils/pricing';

// Generate initial spots
function generateSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  
  // Compact spots: C-01 to C-10
  for (let i = 1; i <= 10; i++) {
    spots.push({
      id: `C-${String(i).padStart(2, '0')}`,
      type: 'compact',
      label: `C-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }
  
  // Standard spots: S-01 to S-15
  for (let i = 1; i <= 15; i++) {
    spots.push({
      id: `S-${String(i).padStart(2, '0')}`,
      type: 'standard',
      label: `S-${String(i).padStart(2, '0')}`,
      occupied: false,
    });
  }
  
  // EV spots: E-01 to E-05
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

export function useParkingGarage() {
  const [spots, setSpots] = useState<ParkingSpot[]>(generateSpots);
  const [parkedCars, setParkedCars] = useState<ParkedCar[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  // Get available spots by type
  const getAvailableSpots = useCallback((type?: SpotType): ParkingSpot[] => {
    return spots.filter(s => !s.occupied && (!type || s.type === type));
  }, [spots]);

  // Check if a spot type has availability
  const hasAvailability = useCallback((type: SpotType): boolean => {
    return spots.some(s => s.type === type && !s.occupied);
  }, [spots]);

  // Find car by plate
  const findCarByPlate = useCallback((plate: string): ParkedCar | undefined => {
    return parkedCars.find(c => c.plate.toLowerCase() === plate.toLowerCase().trim());
  }, [parkedCars]);

  // Check in a car
  const checkIn = useCallback((plate: string, spotType: SpotType): { success: boolean; message: string; spotId?: string } => {
    const normalizedPlate = plate.toUpperCase().trim();
    
    // Check if car is already parked
    if (findCarByPlate(normalizedPlate)) {
      return { success: false, message: `Car ${normalizedPlate} is already parked in the garage.` };
    }
    
    // EV cars must use EV spots
    if (spotType === 'ev') {
      if (!hasAvailability('ev')) {
        return { success: false, message: 'No EV spots available. All charger spots are occupied.' };
      }
    }
    
    // Find an available spot of the requested type
    const availableSpot = spots.find(s => s.type === spotType && !s.occupied);
    if (!availableSpot) {
      return { success: false, message: `No ${spotType} spots available.` };
    }
    
    // Assign the spot
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
    
    return { success: true, message: `Car ${normalizedPlate} checked in at spot ${availableSpot.id}.`, spotId: availableSpot.id };
  }, [spots, findCarByPlate, hasAvailability]);

  // Check out a car
  const checkOut = useCallback((plate: string): { success: boolean; message: string; fee?: number; duration?: number } => {
    const normalizedPlate = plate.toUpperCase().trim();
    const car = findCarByPlate(normalizedPlate);
    
    if (!car) {
      return { success: false, message: `Car ${normalizedPlate} not found in the garage.` };
    }
    
    const now = new Date();
    const { fee, durationHours } = calculateFee(car.checkInTime, now, pricing);
    
    // Free the spot
    setSpots(prev => prev.map(s => 
      s.id === car.spotId ? { ...s, occupied: false } : s
    ));
    
    // Remove from parked cars
    setParkedCars(prev => prev.filter(c => c.plate !== normalizedPlate));
    
    // Add transaction
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
    
    return { success: true, message: `Car ${normalizedPlate} checked out. Fee: $${fee.toFixed(2)} for ${durationHours} hour(s).`, fee, duration: durationHours };
  }, [findCarByPlate, pricing]);

  // Get spot availability summary
  const getAvailabilitySummary = useCallback(() => {
    const summary = {
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
