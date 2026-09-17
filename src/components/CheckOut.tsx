import { useState } from 'react';
import confetti from 'canvas-confetti';
import { useToast } from './Toast';
import { ReceiptModal } from './ReceiptModal';
import { Transaction } from '../types';
import { processPayment, getPaymentMethodDisplayName } from '../utils/razorpay';

interface CheckOutProps {
  onCheckOut: (
    plate: string,
    paymentDetails?: {
      paymentId: string;
      paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash';
      paymentStatus: 'success' | 'failed' | 'pending';
      paymentTimestamp: Date;
    }
  ) => { success: boolean; message: string; fee?: number; duration?: number; transaction?: Transaction };
  parkedPlates: string[];
}

type PaymentMethod = 'upi' | 'card';

export function CheckOut({ onCheckOut, parkedPlates }: CheckOutProps) {
  const [plate, setPlate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
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

  // Look up parked car to estimate fee
  const handlePlateChange = (newPlate: string) => {
    setPlate(newPlate);
    setEstimatedFee(null);
    
    if (newPlate.trim()) {
      // Try to find the car to estimate fee
      // This is a simplified estimation - in production, you'd call an API
      try {
        const res = onCheckOut(newPlate);
        if (res.success && res.fee !== undefined) {
          setEstimatedFee(res.fee);
        }
      } catch {
        // Car not found or other error - that's okay
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Process payment through Razorpay
      addToast({
        type: 'info',
        title: 'Processing Payment',
        message: `Opening ${getPaymentMethodDisplayName(paymentMethod)} payment...`,
        icon: '💳',
      });

      const paymentResponse = await processPayment({
        amount: estimatedFee || 0,
        currency: 'INR',
        receipt: `receipt_${plate}_${Date.now()}`,
        description: `Parking fee for vehicle ${plate}`,
        method: paymentMethod,
      });

      // Step 2: Complete checkout with payment details
      const res = onCheckOut(plate, {
        paymentId: paymentResponse.razorpay_payment_id,
        paymentMethod: paymentResponse.method as 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash',
        paymentStatus: 'success',
        paymentTimestamp: new Date(),
      });

      setIsSubmitting(false);

      if (res.success && res.transaction) {
        fireConfetti();
        addToast({
          type: 'success',
          title: 'Payment Successful!',
          message: `${plate.toUpperCase()} • ${getPaymentMethodDisplayName(paymentResponse.method)} • ₹${res.fee}`,
          icon: '✅',
        });
        setReceiptTransaction(res.transaction);
        setPlate('');
        setEstimatedFee(null);
      } else {
        addToast({
          type: 'error',
          title: 'Check-Out Failed',
          message: res.message,
          icon: '❌',
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: error instanceof Error ? error.message : 'Payment processing failed',
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
            <p className="text-xs text-gray-500">Process exit & collect payment via Razorpay</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {/* Vehicle Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Registration Number</label>
            <div className="relative">
              <input
                type="text"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value.toUpperCase())}
                placeholder="MH 12 AB 1234"
                className="input-plate w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-lg font-bold bg-gray-50 focus:bg-white transition-all"
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

          {/* Estimated Fee */}
          {estimatedFee !== null && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Estimated Fee:</span>
                <span className="text-2xl font-display font-bold text-green-700">₹{estimatedFee}</span>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                disabled={isSubmitting}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📱</div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-900">UPI</div>
                    <div className="text-xs text-gray-500">GPay, PhonePe, Paytm</div>
                  </div>
                </div>
                {paymentMethod === 'upi' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                disabled={isSubmitting}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">💳</div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-900">Card</div>
                    <div className="text-xs text-gray-500">Credit / Debit</div>
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Razorpay Badge */}
          <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Secured by</span>
            <span className="font-bold text-indigo-600 text-sm">Razorpay</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">Test Mode</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!plate.trim() || isSubmitting || estimatedFee === null}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>Pay ₹{estimatedFee || '---'} via {getPaymentMethodDisplayName(paymentMethod)}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick tips */}
        <div className="mt-5 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-800 flex items-start gap-2">
            <span className="flex-shrink-0">💡</span>
            <span>
              <strong>Test Mode:</strong> This is a demo integration. In production, payments would be processed through Razorpay's secure gateway with backend verification.
            </span>
          </p>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        transaction={receiptTransaction}
        onClose={() => setReceiptTransaction(null)}
      />
    </>
  );
}
