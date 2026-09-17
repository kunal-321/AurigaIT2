import { useState } from 'react';
import confetti from 'canvas-confetti';
import { useToast } from './Toast';
import { Receipt } from './Receipt';
import { Transaction } from '../types';

interface CheckOutProps {
  onCheckOut: (plate: string) => { success: boolean; message: string; fee?: number; duration?: number; transaction?: Transaction };
  parkedPlates: string[];
}

export function CheckOut({ onCheckOut, parkedPlates }: CheckOutProps) {
  const [plate, setPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const { addToast } = useToast();

  const fireConfetti = () => {
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const res = onCheckOut(plate);
    setIsSubmitting(false);

    if (res.success && res.transaction) {
      fireConfetti();
      addToast({
        type: 'success',
        title: 'Vehicle Checked Out',
        message: `${plate.toUpperCase()} • Fee: ₹${res.fee} • ${res.duration}h`,
        icon: '🧾',
      });
      setReceiptTransaction(res.transaction);
      setPlate('');
    } else {
      addToast({
        type: 'error',
        title: 'Check-Out Failed',
        message: res.message,
        icon: '❌',
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full -translate-y-16 -translate-x-16 opacity-50"></div>

        <div className="flex items-center gap-3 mb-6 relative">
          <div className="w-12 h-12 gradient-warning rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">Check Out Vehicle</h2>
            <p className="text-xs text-gray-500">Process exit & collect fee</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Registration Number</label>
            <div className="relative">
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="MH 12 AB 1234"
                className="input-plate w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-lg font-bold bg-gray-50 focus:bg-white transition-all"
                maxLength={15}
                list="parked-plates"
                disabled={isSubmitting}
              />
              <datalist id="parked-plates">
                {parkedPlates.map(p => <option key={p} value={p} />)}
              </datalist>
              {parkedPlates.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {parkedPlates.length} parked
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!plate.trim() || isSubmitting}
            className="w-full py-4 rounded-xl btn-warning disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Calculating Fee...</span>
              </>
            ) : (
              <>
                <span>🧾</span>
                <span>Check Out & Collect Fee</span>
              </>
            )}
          </button>
        </form>

        {/* Quick tips */}
        <div className="mt-5 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-800 flex items-start gap-2">
            <span className="flex-shrink-0">💡</span>
            <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-amber-200 font-mono text-[10px]">Tab</kbd> to autocomplete from parked vehicles</span>
          </p>
        </div>
      </div>

      <Receipt transaction={receiptTransaction} onClose={() => setReceiptTransaction(null)} />
    </>
  );
}
