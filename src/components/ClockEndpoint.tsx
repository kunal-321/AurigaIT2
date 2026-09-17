import { useState } from 'react';
import { useToast } from './Toast';

interface ClockEndpointProps {
  onClock: () => {
    closed: Array<{ plate: string; fee: number; duration: number }>;
    totalRevenue: number;
  };
}

/**
 * Level 2 — T2: Simulates POST /clock endpoint
 * This represents the nightly job that auto-closes sessions parked over 24h
 */
export function ClockEndpoint({ onClock }: ClockEndpointProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [results, setResults] = useState<{
    closed: Array<{ plate: string; fee: number; duration: number }>;
    totalRevenue: number;
  } | null>(null);
  const { addToast } = useToast();

  const handleClock = async () => {
    setIsRunning(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const result = onClock();
      setResults(result);
      setLastRun(new Date());
      
      if (result.closed.length === 0) {
        addToast({
          type: 'info',
          title: 'POST /clock executed',
          message: 'No vehicles parked over 24 hours',
          icon: '⏰',
        });
      } else {
        addToast({
          type: 'success',
          title: 'POST /clock executed',
          message: `Auto-closed ${result.closed.length} vehicle(s), collected ₹${result.totalRevenue}`,
          icon: '✅',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'POST /clock failed',
        message: 'Error executing nightly job',
        icon: '❌',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl">⏰</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
            POST /clock — Nightly Auto-Close Job
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Automatically checks out and bills vehicles parked for more than 24 hours.
            This simulates the nightly cron job that runs at midnight.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleClock}
              disabled={isRunning}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running nightly job...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  Execute POST /clock
                </span>
              )}
            </button>

            {lastRun && (
              <div className="text-xs text-gray-500 text-center">
                Last run: {lastRun.toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}

            {results && results.closed.length > 0 && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📋</span>
                  Auto-Closed Vehicles ({results.closed.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.closed.map((vehicle, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div>
                        <div className="font-mono font-semibold text-gray-900">
                          {vehicle.plate}
                        </div>
                        <div className="text-xs text-gray-500">
                          Duration: {vehicle.duration} hours
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₹{vehicle.fee}
                        </div>
                        <div className="text-xs text-gray-500">
                          billed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Revenue:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{results.totalRevenue}
                  </span>
                </div>
              </div>
            )}

            {results && results.closed.length === 0 && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm text-gray-600">
                  No vehicles parked over 24 hours. Nothing to auto-close.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-indigo-100 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-800">
              <strong>API Endpoint:</strong> POST /clock<br />
              <strong>Schedule:</strong> Runs automatically at midnight (00:00)<br />
              <strong>Action:</strong> Finds all vehicles with checkInTime &gt; 24 hours ago, calculates fees, creates transactions, frees spots
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
