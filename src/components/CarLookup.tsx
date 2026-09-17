import { useState } from 'react';
import { ParkedCar, SpotType } from '../types';
import { formatDateTime } from '../utils/pricing';
import { useToast } from './Toast';

interface CarLookupProps {
  parkedCars: ParkedCar[];
  findCarByPlate: (plate: string) => ParkedCar | undefined;
}

export function CarLookup({ parkedCars, findCarByPlate }: CarLookupProps) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<ParkedCar | null | undefined>(undefined);
  const { addToast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const car = findCarByPlate(query);
    setFound(car ?? null);
    if (car) {
      addToast({
        type: 'info',
        title: 'Vehicle Found',
        message: `${car.plate} is at spot ${car.spotId}`,
        icon: '📍',
      });
    }
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
      case 'twoWheeler': return { bg: 'bg-sky-100', text: 'text-sky-800', label: 'TWO-WHEELER', icon: '🏍️' };
      case 'compact': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'COMPACT', icon: '🚗' };
      case 'standard': return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'STANDARD', icon: '🚙' };
      case 'ev': return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'EV', icon: '⚡' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100 to-transparent rounded-full translate-y-16 -translate-x-16 opacity-50"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Find a Vehicle</h2>
          <p className="text-xs text-gray-500">Search by registration number</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value.toUpperCase()); setFound(undefined); }}
          placeholder="Enter vehicle number..."
          className="input-plate flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-bold bg-gray-50 focus:bg-white transition-all"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all duration-300"
        >
          Search
        </button>
      </form>

      {found !== undefined && (
        <div className="mt-5 animate-fade-up">
          {found === null ? (
            <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔍</span>
                <div>
                  <p className="font-bold text-yellow-900 text-sm">Vehicle Not Found</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    No vehicle with number "{query.trim()}" is currently parked. It may have already checked out.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl animate-pop-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-3xl">{getSpotBadge(found.spotType).icon}</span>
                </div>
                <div className="flex-1">
                  <div className="font-mono-plate text-2xl font-bold text-purple-900">{found.plate}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getSpotBadge(found.spotType).bg} ${getSpotBadge(found.spotType).text}`}>
                    {getSpotBadge(found.spotType).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/60 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 font-medium">Spot Number</div>
                  <div className="font-display font-bold text-gray-900 text-lg">{found.spotId}</div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 font-medium">Parked Since</div>
                  <div className="font-semibold text-gray-900 text-xs">{formatDateTime(found.checkInTime)}</div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg col-span-2">
                  <div className="text-xs text-gray-500 font-medium">Duration</div>
                  <div className="font-display font-bold text-purple-700 text-lg">{timeAgo(found.checkInTime)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Currently parked list */}
      {parkedCars.length > 0 && (
        <div className="mt-6 relative">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Currently Parked ({parkedCars.length})
          </h3>
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {parkedCars.map((car, idx) => (
              <div
                key={car.spotId}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer group animate-fade-up"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => { setQuery(car.plate); setFound(car); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-sm">{getSpotBadge(car.spotType).icon}</span>
                  </div>
                  <div>
                    <div className="font-mono-plate font-bold text-gray-900 text-sm">{car.plate}</div>
                    <div className="text-[10px] text-gray-500">{timeAgo(car.checkInTime)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded-md shadow-sm">{car.spotId}</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
