import { Transaction, SpotType } from '../types';
import { formatDateTime, formatCurrency, formatDuration } from '../utils/pricing';
import { AnimatedCounter } from './AnimatedCounter';

interface TransactionLogProps {
  transactions: Transaction[];
}

export function TransactionLog({ transactions }: TransactionLogProps) {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.fee, 0);

  const getSpotIcon = (spotType: SpotType) => {
    switch (spotType) {
      case 'twoWheeler': return '🏍️';
      case 'compact': return '🚗';
      case 'standard': return '🚙';
      case 'ev': return '⚡';
    }
  };

  const getSpotBadge = (spotType: SpotType) => {
    switch (spotType) {
      case 'twoWheeler': return 'bg-sky-100 text-sky-700';
      case 'compact': return 'bg-blue-100 text-blue-700';
      case 'standard': return 'bg-purple-100 text-purple-700';
      case 'ev': return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-transparent rounded-full -translate-y-20 -translate-x-20 opacity-50"></div>

      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">Transaction Log</h2>
            <p className="text-xs text-gray-500">{transactions.length} checkout{transactions.length !== 1 ? 's' : ''} today</p>
          </div>
        </div>
        {transactions.length > 0 && (
          <div className="text-right bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-2 rounded-xl border border-green-200">
            <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Today's Collection</div>
            <AnimatedCounter value={totalRevenue} className="text-xl font-display font-bold text-green-700 block" prefix="₹" />
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 relative">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 font-semibold">No transactions yet</p>
          <p className="text-xs text-gray-400 mt-1">Check out a vehicle to see it here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {transactions.map((txn, idx) => (
            <div
              key={txn.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group cursor-pointer animate-fade-up border border-gray-100 hover:border-indigo-200 hover:shadow-md"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${getSpotBadge(txn.spotType)} group-hover:scale-110 transition-transform`}>
                  {getSpotIcon(txn.spotType)}
                </div>
                <div>
                  <div className="font-mono-plate font-bold text-gray-900 text-sm">{txn.plate}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Spot {txn.spotId}</span>
                    <span className="text-gray-300">•</span>
                    <span>{formatDuration(txn.durationHours)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-green-700 text-lg">{formatCurrency(txn.fee)}</div>
                <div className="text-[10px] text-gray-500">{formatDateTime(txn.checkOutTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
