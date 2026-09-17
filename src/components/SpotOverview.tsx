import { ParkingSpot, SpotType } from '../types';
import { AvailabilitySummary } from '../hooks/useParkingGarage';

interface SpotOverviewProps {
  spots: ParkingSpot[];
  availabilitySummary: AvailabilitySummary;
}

export function SpotOverview({ spots, availabilitySummary }: SpotOverviewProps) {
  const totalSpots = spots.length;
  const totalOccupied = spots.filter(s => s.occupied).length;
  const totalAvailable = totalSpots - totalOccupied;

  const typeConfig: { [K in SpotType]: { label: string; icon: string; desc: string } } = {
    twoWheeler: { label: 'Two-Wheeler', icon: '🏍️', desc: 'Bike / Scooter' },
    compact: { label: 'Compact', icon: '🚗', desc: 'Small Car' },
    standard: { label: 'Standard', icon: '🚙', desc: 'Sedan / SUV' },
    ev: { label: 'EV / Charger', icon: '⚡', desc: 'Electric Vehicle' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Garage Overview</h2>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalSpots}</div>
          <div className="text-xs text-gray-500 font-medium">Total Spots</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{totalOccupied}</div>
          <div className="text-xs text-red-600 font-medium">Occupied</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{totalAvailable}</div>
          <div className="text-xs text-green-600 font-medium">Available</div>
        </div>
      </div>

      {/* Per-type summary */}
      <div className="space-y-3">
        {(['twoWheeler', 'compact', 'standard', 'ev'] as SpotType[]).map((type) => {
          const config = typeConfig[type];
          const summary = availabilitySummary[type];
          const occupancyRate = summary.total > 0 ? (summary.occupied / summary.total) * 100 : 0;

          return (
            <div key={type} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{config.label}</span>
                    <span className="text-xs text-gray-400 ml-1">({config.desc})</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {summary.available}/{summary.total} free
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    occupancyRate >= 90 ? 'bg-red-500' : occupancyRate >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              {/* Visual spot grid */}
              <div className="flex flex-wrap gap-1 mt-2">
                {spots.filter(s => s.type === type).map(spot => (
                  <div
                    key={spot.id}
                    title={`${spot.label} - ${spot.occupied ? 'Occupied' : 'Available'}`}
                    className={`w-5 h-5 rounded text-[8px] flex items-center justify-center font-bold ${
                      spot.occupied ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
                    }`}
                  >
                    {spot.occupied ? '✕' : '✓'}
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
