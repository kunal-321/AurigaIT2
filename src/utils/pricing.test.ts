import { describe, it, expect } from 'vitest';
import { calculateFee, DEFAULT_PRICING } from './pricing';
import { PricingConfig } from '../types';

describe('calculateFee', () => {
  describe('exact hour durations', () => {
    it('should charge first hour rate for exactly 1 hour', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T11:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(1);
      expect(result.fee).toBe(60); // standard first hour rate
    });

    it('should charge first hour + 1 additional for exactly 2 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(90); // 60 + 30
    });

    it('should charge first hour + 4 additional for exactly 5 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T15:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(5);
      expect(result.fee).toBe(180); // 60 + (4 * 30)
    });

    it('should charge first hour + 9 additional for exactly 10 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T20:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(10);
      expect(result.fee).toBe(300); // 60 + (9 * 30)
    });
  });

  describe('part-hour rounding', () => {
    it('should round up 1 minute to 1 hour', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T10:01:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(1);
      expect(result.fee).toBe(60);
    });

    it('should round up 1 hour 15 minutes to 2 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T11:15:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(90); // 60 + 30
    });

    it('should round up 2 hours 30 minutes to 3 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:30:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(3);
      expect(result.fee).toBe(120); // 60 + (2 * 30)
    });

    it('should round up 3 hours 1 minute to 4 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T13:01:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(4);
      expect(result.fee).toBe(150); // 60 + (3 * 30)
    });

    it('should round up 59 minutes to 1 hour', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T10:59:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(1);
      expect(result.fee).toBe(60);
    });
  });

  describe('daily cap enforcement', () => {
    it('should apply daily cap for standard spots at 10 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T20:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      // Without cap: 60 + (9 * 30) = 330
      // With cap: 300
      expect(result.durationHours).toBe(10);
      expect(result.fee).toBe(300); // daily cap
    });

    it('should apply daily cap for standard spots at 12 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T22:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      // Without cap: 60 + (11 * 30) = 390
      // With cap: 300
      expect(result.durationHours).toBe(12);
      expect(result.fee).toBe(300); // daily cap
    });

    it('should apply daily cap for standard spots at 24 hours', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-16T10:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      // Without cap: 60 + (23 * 30) = 750
      // With cap: 300
      expect(result.durationHours).toBe(24);
      expect(result.fee).toBe(300); // daily cap
    });

    it('should apply daily cap for compact spots', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T20:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'compact');
      
      // Without cap: 40 + (9 * 20) = 220
      // With cap: 200
      expect(result.durationHours).toBe(10);
      expect(result.fee).toBe(200); // daily cap
    });

    it('should apply daily cap for two-wheeler spots', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T20:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'twoWheeler');
      
      // Without cap: 20 + (9 * 10) = 110
      // With cap: 100
      expect(result.durationHours).toBe(10);
      expect(result.fee).toBe(100); // daily cap
    });

    it('should apply daily cap for EV spots', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T20:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'ev');
      
      // Without cap: 80 + (9 * 40) = 440
      // With cap: 400
      expect(result.durationHours).toBe(10);
      expect(result.fee).toBe(400); // daily cap
    });

    it('should not apply cap when fee is below cap', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T13:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      // 60 + (2 * 30) = 120, which is below 300 cap
      expect(result.durationHours).toBe(3);
      expect(result.fee).toBe(120);
    });
  });

  describe('different spot types', () => {
    it('should use two-wheeler rates', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'twoWheeler');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(30); // 20 + 10
    });

    it('should use compact rates', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'compact');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(60); // 40 + 20
    });

    it('should use standard rates', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(90); // 60 + 30
    });

    it('should use EV rates', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T12:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'ev');
      
      expect(result.durationHours).toBe(2);
      expect(result.fee).toBe(120); // 80 + 40
    });
  });

  describe('edge cases', () => {
    it('should return 0 fee for 0 duration', () => {
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T10:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('should return 0 fee for negative duration', () => {
      const checkIn = new Date('2024-01-15T11:00:00');
      const checkOut = new Date('2024-01-15T10:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard');
      
      expect(result.durationHours).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('should use custom pricing config', () => {
      const customPricing: PricingConfig = {
        firstHourRate: 100,
        additionalHourRate: 50,
        dailyCap: 500,
        byType: {
          twoWheeler: { firstHourRate: 100, additionalHourRate: 50, dailyCap: 500 },
          compact: { firstHourRate: 100, additionalHourRate: 50, dailyCap: 500 },
          standard: { firstHourRate: 100, additionalHourRate: 50, dailyCap: 500 },
          ev: { firstHourRate: 100, additionalHourRate: 50, dailyCap: 500 },
        },
      };
      
      const checkIn = new Date('2024-01-15T10:00:00');
      const checkOut = new Date('2024-01-15T13:00:00');
      
      const result = calculateFee(checkIn, checkOut, 'standard', customPricing);
      
      expect(result.durationHours).toBe(3);
      expect(result.fee).toBe(200); // 100 + (2 * 50)
    });
  });
});
