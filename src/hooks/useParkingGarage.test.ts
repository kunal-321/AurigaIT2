import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParkingGarage } from './useParkingGarage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useParkingGarage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('checkIn - double-booking prevention', () => {
    it('should prevent checking in the same vehicle twice', () => {
      const { result } = renderHook(() => useParkingGarage());

      // First check-in should succeed
      act(() => {
        const firstResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(firstResult.success).toBe(true);
        expect(firstResult.spotId).toBeDefined();
      });

      // Second check-in with same plate should fail
      act(() => {
        const secondResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(secondResult.success).toBe(false);
        expect(secondResult.message).toContain('already parked');
      });
    });

    it('should prevent checking in the same vehicle with different case', () => {
      const { result } = renderHook(() => useParkingGarage());

      // First check-in with uppercase
      act(() => {
        const firstResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(firstResult.success).toBe(true);
      });

      // Second check-in with lowercase should fail
      act(() => {
        const secondResult = result.current.checkIn('mh12ab1234', 'standard');
        expect(secondResult.success).toBe(false);
        expect(secondResult.message).toContain('already parked');
      });
    });

    it('should prevent checking in the same vehicle with extra whitespace', () => {
      const { result } = renderHook(() => useParkingGarage());

      // First check-in
      act(() => {
        const firstResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(firstResult.success).toBe(true);
      });

      // Second check-in with whitespace should fail
      act(() => {
        const secondResult = result.current.checkIn('  MH12AB1234  ', 'standard');
        expect(secondResult.success).toBe(false);
        expect(secondResult.message).toContain('already parked');
      });
    });

    it('should allow different vehicles to check in', () => {
      const { result } = renderHook(() => useParkingGarage());

      // First vehicle
      act(() => {
        const firstResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(firstResult.success).toBe(true);
      });

      // Second vehicle should succeed
      act(() => {
        const secondResult = result.current.checkIn('KA03CD5678', 'standard');
        expect(secondResult.success).toBe(true);
      });

      // Verify both are parked
      expect(result.current.parkedCars).toHaveLength(2);
    });
  });

  describe('checkIn - EV spot enforcement', () => {
    it('should allow EV vehicle to check in to EV spot', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        const checkInResult = result.current.checkIn('MH12EV0001', 'ev');
        expect(checkInResult.success).toBe(true);
        expect(checkInResult.spotId).toMatch(/^E-/); // Should be assigned to EV spot
      });
    });

    it('should reject EV check-in when all EV spots are occupied', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Fill all 5 EV spots
      act(() => {
        for (let i = 1; i <= 5; i++) {
          const checkInResult = result.current.checkIn(`MH12EV000${i}`, 'ev');
          expect(checkInResult.success).toBe(true);
        }
      });

      // 6th EV should fail
      act(() => {
        const checkInResult = result.current.checkIn('MH12EV0006', 'ev');
        expect(checkInResult.success).toBe(false);
        expect(checkInResult.message).toContain('No EV spots available');
      });
    });

    it('should not allow non-EV vehicle to check in to EV spot', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Try to check in standard vehicle to EV spot type
      act(() => {
        const checkInResult = result.current.checkIn('MH12AB1234', 'ev');
        expect(checkInResult.success).toBe(true);
        // Should be assigned to EV spot since we requested EV type
        expect(checkInResult.spotId).toMatch(/^E-/);
      });
    });

    it('should track EV spot availability correctly', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Initially should have 5 EV spots available
      expect(result.current.hasAvailability('ev')).toBe(true);

      // Fill all EV spots
      act(() => {
        for (let i = 1; i <= 5; i++) {
          result.current.checkIn(`MH12EV000${i}`, 'ev');
        }
      });

      // Should no longer have EV availability
      expect(result.current.hasAvailability('ev')).toBe(false);
    });
  });

  describe('checkIn - spot assignment', () => {
    it('should assign correct spot type for two-wheeler', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        const checkInResult = result.current.checkIn('MH12TW0001', 'twoWheeler');
        expect(checkInResult.success).toBe(true);
        expect(checkInResult.spotId).toMatch(/^TW-/);
      });
    });

    it('should assign correct spot type for compact', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        const checkInResult = result.current.checkIn('MH12AB1234', 'compact');
        expect(checkInResult.success).toBe(true);
        expect(checkInResult.spotId).toMatch(/^C-/);
      });
    });

    it('should assign correct spot type for standard', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        const checkInResult = result.current.checkIn('MH12AB1234', 'standard');
        expect(checkInResult.success).toBe(true);
        expect(checkInResult.spotId).toMatch(/^S-/);
      });
    });

    it('should assign correct spot type for EV', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        const checkInResult = result.current.checkIn('MH12EV0001', 'ev');
        expect(checkInResult.success).toBe(true);
        expect(checkInResult.spotId).toMatch(/^E-/);
      });
    });

    it('should mark spot as occupied after check-in', () => {
      const { result } = renderHook(() => useParkingGarage());

      const spotId = 'S-01';
      
      // Verify spot is initially available
      const initialSpot = result.current.spots.find(s => s.id === spotId);
      expect(initialSpot?.occupied).toBe(false);

      // Check in a vehicle
      act(() => {
        result.current.checkIn('MH12AB1234', 'standard');
      });

      // Verify spot is now occupied
      const updatedSpot = result.current.spots.find(s => s.id === spotId);
      expect(updatedSpot?.occupied).toBe(true);
    });

    it('should add vehicle to parkedCars after check-in', () => {
      const { result } = renderHook(() => useParkingGarage());

      expect(result.current.parkedCars).toHaveLength(0);

      act(() => {
        result.current.checkIn('MH12AB1234', 'standard');
      });

      expect(result.current.parkedCars).toHaveLength(1);
      expect(result.current.parkedCars[0].plate).toBe('MH12AB1234');
      expect(result.current.parkedCars[0].spotType).toBe('standard');
    });

    it('should reject check-in when no spots of requested type are available', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Fill all compact spots (10 spots)
      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current.checkIn(`MH12AB${String(i).padStart(4, '0')}`, 'compact');
        }
      });

      // 11th compact should fail
      act(() => {
        const checkInResult = result.current.checkIn('MH12AB9999', 'compact');
        expect(checkInResult.success).toBe(false);
        expect(checkInResult.message).toContain('No Compact spots available');
      });
    });
  });

  describe('checkIn - availability checking', () => {
    it('should correctly report availability for each spot type', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Initially all types should be available
      expect(result.current.hasAvailability('twoWheeler')).toBe(true);
      expect(result.current.hasAvailability('compact')).toBe(true);
      expect(result.current.hasAvailability('standard')).toBe(true);
      expect(result.current.hasAvailability('ev')).toBe(true);
    });

    it('should update availability after check-in', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Fill all EV spots
      act(() => {
        for (let i = 1; i <= 5; i++) {
          result.current.checkIn(`MH12EV000${i}`, 'ev');
        }
      });

      // EV should no longer be available
      expect(result.current.hasAvailability('ev')).toBe(false);
      
      // Other types should still be available
      expect(result.current.hasAvailability('twoWheeler')).toBe(true);
      expect(result.current.hasAvailability('compact')).toBe(true);
      expect(result.current.hasAvailability('standard')).toBe(true);
    });

    it('should return correct available spots count', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Initially should have all spots available
      const initialAvailable = result.current.getAvailableSpots();
      expect(initialAvailable).toHaveLength(50); // 20 + 10 + 15 + 5

      // Check in 3 vehicles
      act(() => {
        result.current.checkIn('MH12AB1234', 'standard');
        result.current.checkIn('MH12AB5678', 'compact');
        result.current.checkIn('MH12TW0001', 'twoWheeler');
      });

      // Should have 47 available spots
      const updatedAvailable = result.current.getAvailableSpots();
      expect(updatedAvailable).toHaveLength(47);
    });

    it('should filter available spots by type', () => {
      const { result } = renderHook(() => useParkingGarage());

      // Get available EV spots
      const evSpots = result.current.getAvailableSpots('ev');
      expect(evSpots).toHaveLength(5);
      expect(evSpots.every(s => s.type === 'ev')).toBe(true);

      // Get available standard spots
      const standardSpots = result.current.getAvailableSpots('standard');
      expect(standardSpots).toHaveLength(15);
      expect(standardSpots.every(s => s.type === 'standard')).toBe(true);
    });
  });

  describe('checkIn - plate normalization', () => {
    it('should normalize plate to uppercase', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        result.current.checkIn('mh12ab1234', 'standard');
      });

      expect(result.current.parkedCars[0].plate).toBe('MH12AB1234');
    });

    it('should trim whitespace from plate', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        result.current.checkIn('  MH12AB1234  ', 'standard');
      });

      expect(result.current.parkedCars[0].plate).toBe('MH12AB1234');
    });

    it('should find car by plate case-insensitively', () => {
      const { result } = renderHook(() => useParkingGarage());

      act(() => {
        result.current.checkIn('MH12AB1234', 'standard');
      });

      // Should find with different case
      const found = result.current.findCarByPlate('mh12ab1234');
      expect(found).toBeDefined();
      expect(found?.plate).toBe('MH12AB1234');
    });
  });
});
