import { useState } from 'react';
import { ParkedCar, SpotType } from '../types';
import { formatDateTime } from '../utils/pricing';

interface CarLookupProps {
  parkedCars: ParkedCar[];
  findCarByPlate: (plate: string) => ParkedCar | undefined;
}

export function CarLookup({ parkedCars, findCarByPlate }: CarLookupProps) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<ParkedCar | null | undefined>(undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const car = findCarByPlate(query);
    setFound(car ?? null);
  };

  const timeAgo = (checkIn: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ${diffMins % 60}m ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const getSpotBadge = (spotType: SpotType) => {
    switch (spotType) {
      case 'twoWheeler': return { bg: 'bg-sky-200', text: 'text-sky-800', label: 'TWO-WHEELER' };
      case 'compact': return { bg: 'bg-blue-200', text: 'text-blue-800', label: 'COMPACT' };
      case 'standard': return { bg: 'bg-purple-200', text: 'text-purple-800', label: 'STANDARD' };
      case 'ev': return { bg: 'bg-amber-200', text: 'text-amber-800', label: 'EV' };
    }
  };

  const getSpotIcon = (spotType: SpotType) => {
    switch (spotType) {
      case 'twoWheeler': return '🏍️';
      case 'compact': return '🚗';
      case 'standard': return '🚙';
      case 'ev': return '⚡';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Find a Vehicle</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFound(undefined); }}
          placeholder="Enter vehicle number..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono uppercase"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          Search
        </button>
      </form>

      {found !== undefined && (
        <div className="mt-4">
          {found === null ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                No vehicle found with number "{query.toUpperCase().trim()}". It may have already checked out.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{getSpotIcon(found.spotType)}</span>
                <span className="text-2xl font-bold font-mono text-purple-900">{found.plate}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSpotBadge(found.spotType).bg} ${getSpotBadge(found.spotType).text}`}>
                  {getSpotBadge(found.spotType).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Spot:</span>
                  <span className="ml-2 font-semibold text-gray-900">{found.spotId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Checked in:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatDateTime(found.checkInTime)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-semibold text-gray-900">{timeAgo(found.checkInTime)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Currently parked list */}
      {parkedCars.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Currently Parked ({parkedCars.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {parkedCars.map(car => (
              <div key={car.spotId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="font-mono font-semibold text-gray-900">{car.plate}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{car.spotId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSpotBadge(car.spotType).bg} ${getSpotBadge(car.spotType).text}`}>
                    {getSpotBadge(car.spotType).label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
