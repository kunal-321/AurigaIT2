import { useState, MouseEvent } from 'react';
import { ParkingSpot, SpotType } from '../types';
import { AvailabilitySummary } from '../hooks/useParkingGarage';
import { AnimatedCounter } from './AnimatedCounter';

interface SpotOverviewProps {
  spots: ParkingSpot[];
  availabilitySummary: AvailabilitySummary;
}

export function SpotOverview({ spots, availabilitySummary }: SpotOverviewProps) {
  const totalSpots = spots.length;
  const totalOccupied = spots.filter(s => s.occupied).length;
  const totalAvailable = totalSpots - totalOccupied;
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);

  const typeConfig: { [K in SpotType]: { label: string; icon: string; desc: string; gradient: string; bg: string } } = {
    twoWheeler: { label: 'Two-Wheeler', icon: '🏍️', desc: 'Bike / Scooter', gradient: 'from-sky-400 to-cyan-500', bg: 'bg-sky-50' },
    compact: { label: 'Compact', icon: '🚗', desc: 'Small Car', gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50' },
    standard: { label: 'Standard', icon: '🚙', desc: 'Sedan / SUV', gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
    ev: { label: 'EV / Charger', icon: '⚡', desc: 'Electric Vehicle', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
  };

  const handleSpotMouseMove = (e: MouseEvent<HTMLDivElement>, spotId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mx', `${x}%`);
    e.currentTarget.style.setProperty('--my', `${y}%`);
    setHoveredSpot(spotId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-transparent rounded-full -translate-y-20 translate-x-20 opacity-50"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Garage Overview</h2>
          <p className="text-xs text-gray-500">Real-time spot availability</p>
        </div>
      </div>

      {/* Overall stats with animated counters */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative">
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <AnimatedCounter value={totalSpots} className="text-3xl font-display font-bold text-gray-900 block" />
          <div className="text-xs text-gray-500 font-semibold mt-1">Total Spots</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
          <AnimatedCounter value={totalOccupied} className="text-3xl font-display font-bold text-red-700 block" />
          <div className="text-xs text-red-600 font-semibold mt-1">Occupied</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <AnimatedCounter value={totalAvailable} className="text-3xl font-display font-bold text-green-700 block" />
          <div className="text-xs text-green-600 font-semibold mt-1">Available</div>
        </div>
      </div>

      {/* Per-type summary */}
      <div className="space-y-4 relative">
        {(['twoWheeler', 'compact', 'standard', 'ev'] as SpotType[]).map((type, idx) => {
          const config = typeConfig[type];
          const summary = availabilitySummary[type];
          const occupancyRate = summary.total > 0 ? (summary.occupied / summary.total) * 100 : 0;

          return (
            <div
              key={type}
              className={`p-4 rounded-xl ${config.bg} border border-gray-100 animate-fade-up`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-md`}>
                    <span className="text-lg">{config.icon}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm">{config.label}</span>
                    <span className="text-xs text-gray-500 ml-2">({config.desc})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-display font-bold text-gray-900">{summary.available}</span>
                  <span className="text-sm text-gray-500">/{summary.total} free</span>
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="w-full bg-white rounded-full h-2.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out relative overflow-hidden`}
                  style={{ width: `${occupancyRate}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              {/* Visual spot grid with hover effects */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {spots.filter(s => s.type === type).map(spot => (
                  <div
                    key={spot.id}
                    onMouseMove={(e) => handleSpotMouseMove(e, spot.id)}
                    onMouseLeave={() => setHoveredSpot(null)}
                    className={`spot-tile w-7 h-7 rounded-lg text-[9px] flex items-center justify-center font-bold shadow-sm ${
                      spot.occupied
                        ? 'bg-gradient-to-br from-red-400 to-red-500 text-white'
                        : 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                    }`}
                  >
                    {hoveredSpot === spot.id ? (
                      <span className="text-[7px]">{spot.label}</span>
                    ) : (
                      <span>{spot.occupied ? '✕' : '✓'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
