import { useState } from 'react';
import { ParkedCar } from '../types';
import { formatDateTime } from '../utils/pricing';
import { useToast } from './Toast';

interface ValetTransferProps {
  parkedCars: ParkedCar[];
  onTransfer: (fromPlate: string, toPlate: string) => { success: boolean; message: string };
}

/**
 * Level 3 — T6: Valet Hand-off Component
 * Transfers an open session to a different plate.
 * Spot and entry time carry over.
 */
export function ValetTransfer({ parkedCars, onTransfer }: ValetTransferProps) {
  const [fromPlate, setFromPlate] = useState('');
  const [toPlate, setToPlate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const { addToast } = useToast();

  // Find the source vehicle details for preview
  const sourceCar = parkedCars.find(
    c => c.plate === fromPlate.toUpperCase().trim()
  );

  const handleTransfer = async () => {
    if (!fromPlate.trim() || !toPlate.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please enter both source and destination plates',
        icon: '⚠️',
      });
      return;
    }

    setIsTransferring(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = onTransfer(fromPlate, toPlate);
    setIsTransferring(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Valet Hand-off Complete',
        message: result.message,
        icon: '🔄',
      });
      setFromPlate('');
      setToPlate('');
      setIsExpanded(false);
    } else {
      addToast({
        type: 'error',
        title: 'Transfer Failed',
        message: result.message,
        icon: '❌',
      });
    }
  };

  const handleSelectSource = (plate: string) => {
    setFromPlate(plate);
  };

  const getSpotIcon = (spotType: string) => {
    switch (spotType) {
      case 'twoWheeler': return '🏍️';
      case 'compact': return '🚗';
      case 'standard': return '🚙';
      case 'ev': return '⚡';
      default: return '🚗';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-50"></div>

      {/* Header - always visible */}
      <div
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">Valet Hand-off</h2>
              <p className="text-xs text-gray-500">Transfer session to a different plate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
              Level 3 — T6
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expandable content */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-4 relative">
          {/* Info banner */}
          <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
            <p className="text-xs text-pink-800 flex items-start gap-2">
              <span className="flex-shrink-0">💡</span>
              <span>
                <strong>Valet Hand-off:</strong> Transfer an open parking session from one vehicle plate to another.
                The parking spot and original entry time will carry over to the new plate.
              </span>
            </p>
          </div>

          {/* Source plate selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Source Vehicle (Current Plate)
            </label>
            <input
              type="text"
              value={fromPlate}
              onChange={(e) => setFromPlate(e.target.value.toUpperCase())}
              placeholder="Enter current plate number"
              className="input-plate w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-lg font-bold bg-gray-50 focus:bg-white transition-all"
              list="parked-plates-transfer"
            />
            <datalist id="parked-plates-transfer">
              {parkedCars.map(c => (
                <option key={c.plate} value={c.plate}>
                  {c.spotId} • {getSpotIcon(c.spotType)} {c.spotType}
                </option>
              ))}
            </datalist>

            {/* Quick select from parked vehicles */}
            {parkedCars.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {parkedCars.slice(0, 6).map(car => (
                  <button
                    key={car.plate}
                    onClick={() => handleSelectSource(car.plate)}
                    className={`px-2 py-1 text-xs font-mono rounded-md border transition-all ${
                      fromPlate === car.plate
                        ? 'bg-pink-100 border-pink-400 text-pink-800 font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {car.plate}
                  </button>
                ))}
                {parkedCars.length > 6 && (
                  <span className="px-2 py-1 text-xs text-gray-400">
                    +{parkedCars.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preview: what will carry over */}
          {sourceCar && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <h4 className="font-display font-bold text-sm text-gray-900">Session Details (will carry over)</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/70 p-2 rounded-lg">
                  <div className="text-[10px] text-gray-500 font-medium">Spot</div>
                  <div className="font-display font-bold text-gray-900">
                    {getSpotIcon(sourceCar.spotType)} {sourceCar.spotId}
                  </div>
                </div>
                <div className="bg-white/70 p-2 rounded-lg">
                  <div className="text-[10px] text-gray-500 font-medium">Entry Time</div>
                  <div className="font-semibold text-gray-900 text-xs">
                    {formatDateTime(sourceCar.checkInTime)}
                  </div>
                </div>
                <div className="bg-white/70 p-2 rounded-lg">
                  <div className="text-[10px] text-gray-500 font-medium">Type</div>
                  <div className="font-semibold text-gray-900 text-sm capitalize">
                    {sourceCar.spotType === 'twoWheeler' ? 'Two-Wheeler' : sourceCar.spotType}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>These details will be preserved after the transfer</span>
              </div>
            </div>
          )}

          {/* Destination plate input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Destination Vehicle (New Plate)
            </label>
            <input
              type="text"
              value={toPlate}
              onChange={(e) => setToPlate(e.target.value.toUpperCase())}
              placeholder="Enter new plate number"
              className="input-plate w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-lg font-bold bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          {/* Transfer visualization */}
          {fromPlate && toPlate && (
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl animate-fade-up">
              <div className="text-center">
                <div className="font-mono-plate text-sm font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  {fromPlate}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">From</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400"></div>
                <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="w-8 h-0.5 bg-gradient-to-r from-rose-400 to-pink-400"></div>
              </div>
              <div className="text-center">
                <div className="font-mono-plate text-sm font-bold text-pink-700 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200">
                  {toPlate}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">To</div>
              </div>
            </div>
          )}

          {/* Transfer button */}
          <button
            onClick={handleTransfer}
            disabled={!fromPlate.trim() || !toPlate.trim() || isTransferring}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isTransferring ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Transferring...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Transfer Session</span>
              </>
            )}
          </button>

          {/* Rules */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Transfer Rules:</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-start gap-1">
                <span className="text-green-500">✓</span>
                <span>Source plate must be currently parked</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500">✓</span>
                <span>Destination plate must NOT already be parked</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500">✓</span>
                <span>Parking spot carries over unchanged</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500">✓</span>
                <span>Original entry time is preserved</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500">✓</span>
                <span>No new transaction is created</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
