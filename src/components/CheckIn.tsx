import { useState } from 'react';
import { SpotType } from '../types';
import { INDIAN_STATES } from '../utils/pricing';

interface CheckInProps {
  onCheckIn: (plate: string, spotType: SpotType) => { success: boolean; message: string; spotId?: string };
  hasAvailability: (type: SpotType) => boolean;
}

export function CheckIn({ onCheckIn, hasAvailability }: CheckInProps) {
  const [plate, setPlate] = useState('');
  const [spotType, setSpotType] = useState<SpotType>('standard');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    const res = onCheckIn(plate, spotType);
    setResult(res);
    if (res.success) {
      setPlate('');
    }
  };

  const spotOptions: { type: SpotType; label: string; icon: string; desc: string }[] = [
    { type: 'twoWheeler', label: 'Two-Wheeler', icon: '🏍️', desc: 'Bike / Scooter' },
    { type: 'compact', label: 'Compact', icon: '🚗', desc: 'Small Car' },
    { type: 'standard', label: 'Standard', icon: '🚙', desc: 'Sedan / SUV' },
    { type: 'ev', label: 'EV', icon: '⚡', desc: 'Electric Vehicle' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Check In Vehicle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Number (Registration Plate)
          </label>
          <input
            type="text"
            value={plate}
            onChange={(e) => { setPlate(e.target.value); setResult(null); }}
            placeholder="e.g., MH 12 AB 1234"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono uppercase tracking-wider"
            maxLength={15}
          />
          <p className="mt-1 text-xs text-gray-400">
            Format: {INDIAN_STATES.slice(0, 5).join(', ')} ... (State Code) (RTO No.) (Series) (Number)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Parking Spot Type</label>
          <div className="grid grid-cols-2 gap-2">
            {spotOptions.map((opt) => {
              const available = hasAvailability(opt.type);
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => available && setSpotType(opt.type)}
                  className={`relative px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    spotType === opt.type
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  } ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{opt.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </div>
                  {!available && (
                    <span className="absolute top-1 right-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">FULL</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={!plate.trim()}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          ✅ Check In
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
          result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
