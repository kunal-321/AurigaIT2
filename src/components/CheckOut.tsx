import { useState } from 'react';

interface CheckOutProps {
  onCheckOut: (plate: string) => { success: boolean; message: string; fee?: number; duration?: number };
  parkedPlates: string[];
}

export function CheckOut({ onCheckOut, parkedPlates }: CheckOutProps) {
  const [plate, setPlate] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; fee?: number; duration?: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    const res = onCheckOut(plate);
    setResult(res);
    if (res.success) {
      setPlate('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Check Out Vehicle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => { setPlate(e.target.value); setResult(null); }}
            placeholder="e.g., MH 12 AB 1234"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-mono uppercase tracking-wider"
            maxLength={15}
            list="parked-plates"
          />
          <datalist id="parked-plates">
            {parkedPlates.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        <button
          type="submit"
          disabled={!plate.trim()}
          className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          🧾 Check Out & Collect Fee
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.message}
          </p>
          {result.success && result.fee !== undefined && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">{result.duration} hr{result.duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Amount Payable</span>
                <span className="text-2xl font-bold text-green-700">₹{result.fee}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 text-right">Accept UPI / Cash / Card</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
