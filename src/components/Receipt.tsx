import { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';

interface ReceiptProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function Receipt({ transaction, onClose }: ReceiptProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTimeout(() => setShow(true), 50);
    } else {
      setShow(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        show ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-500 ${
          show ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="gradient-success p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce-in">
                <span className="text-2xl">🎉</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">Payment Received</h2>
                <p className="text-white/80 text-sm">Thank you for parking with us</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold">{formatCurrency(transaction.fee)}</span>
            </div>
          </div>
        </div>

        {/* Receipt body */}
        <div className="p-6 space-y-4">
          {/* Dashed separator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-gray-300"></div>
            <span className="text-xs text-gray-400 font-medium">RECEIPT</span>
            <div className="flex-1 border-t border-dashed border-gray-300"></div>
          </div>

          <div className="space-y-3">
            <ReceiptRow label="Vehicle No." value={transaction.plate} mono />
            <ReceiptRow label="Spot" value={transaction.spotId} mono />
            <ReceiptRow
              label="Type"
              value={
                transaction.spotType === 'twoWheeler' ? '🏍️ Two-Wheeler' :
                transaction.spotType === 'compact' ? '🚗 Compact' :
                transaction.spotType === 'ev' ? '⚡ EV' :
                '🚙 Standard'
              }
            />
            <ReceiptRow label="Check-In" value={formatDateTime(transaction.checkInTime)} />
            <ReceiptRow label="Check-Out" value={formatDateTime(transaction.checkOutTime)} />
            <ReceiptRow
              label="Duration"
              value={`${transaction.durationHours} hour${transaction.durationHours !== 1 ? 's' : ''}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-gray-300"></div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-gray-700">Total Paid</span>
            <span className="text-2xl font-display font-bold gradient-text">{formatCurrency(transaction.fee)}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Payment via</p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-xs font-semibold text-gray-700">💳 UPI</span>
              <span className="text-xs font-semibold text-gray-700">💵 Cash</span>
              <span className="text-xs font-semibold text-gray-700">💳 Card</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg btn-primary text-sm flex items-center justify-center gap-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono-plate' : ''}`}>{value}</span>
    </div>
  );
}
