import { useState } from 'react';
import { SpotType } from '../types';
import { INDIAN_STATES } from '../utils/pricing';
import { useToast } from './Toast';

interface CheckInProps {
  onCheckIn: (plate: string, spotType: SpotType) => { success: boolean; message: string; spotId?: string };
  hasAvailability: (type: SpotType) => boolean;
}

export function CheckIn({ onCheckIn, hasAvailability }: CheckInProps) {
  const [plate, setPlate] = useState('');
  const [spotType, setSpotType] = useState<SpotType>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setIsSubmitting(true);

    // Simulate brief processing
    await new Promise(resolve => setTimeout(resolve, 400));

    const res = onCheckIn(plate, spotType);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessAnimation(true);
      addToast({
        type: 'success',
        title: 'Vehicle Checked In',
        message: `${plate.toUpperCase()} parked at spot ${res.spotId}`,
        icon: '🚗',
      });
      setTimeout(() => {
        setPlate('');
        setSuccessAnimation(false);
      }, 1200);
    } else {
      addToast({
        type: 'error',
        title: 'Check-In Failed',
        message: res.message,
        icon: '❌',
      });
    }
  };

  const spotOptions: { type: SpotType; label: string; icon: string; desc: string; color: string }[] = [
    { type: 'twoWheeler', label: 'Two-Wheeler', icon: '🏍️', desc: 'Bike / Scooter', color: 'sky' },
    { type: 'compact', label: 'Compact', icon: '🚗', desc: 'Small Car', color: 'blue' },
    { type: 'standard', label: 'Standard', icon: '🚙', desc: 'Sedan / SUV', color: 'purple' },
    { type: 'ev', label: 'EV', icon: '⚡', desc: 'Electric', color: 'amber' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-50"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Check In Vehicle</h2>
          <p className="text-xs text-gray-500">Register a new vehicle entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vehicle Registration Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="MH 12 AB 1234"
              className="input-plate w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-lg font-bold bg-gray-50 focus:bg-white transition-all"
              maxLength={15}
              disabled={isSubmitting}
            />
            {successAnimation && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce-in">
                <span className="text-3xl">✅</span>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <span>💡</span>
            <span>Format: State Code + RTO No. + Series + Number (e.g., {INDIAN_STATES.slice(0, 3).join(', ')})</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Parking Spot Type</label>
          <div className="grid grid-cols-2 gap-3">
            {spotOptions.map((opt) => {
              const available = hasAvailability(opt.type);
              const isSelected = spotType === opt.type;

              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => available && setSpotType(opt.type)}
                  disabled={!available}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 scale-105'
                      : available
                      ? 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                      : 'border-gray-200 opacity-40 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                      {opt.icon}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </div>
                  {!available && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                      FULL
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center animate-pop-in">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={!plate.trim() || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
            successAnimation
              ? 'gradient-success text-white scale-95'
              : 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : successAnimation ? (
            <>
              <span className="text-xl">✓</span>
              <span>Checked In!</span>
            </>
          ) : (
            <>
              <span>🚗</span>
              <span>Check In Vehicle</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
