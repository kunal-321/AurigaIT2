import { Transaction } from '../types';
import { formatDateTime, formatCurrency, formatDuration } from '../utils/pricing';

interface TransactionLogProps {
  transactions: Transaction[];
}

export function TransactionLog({ transactions }: TransactionLogProps) {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.fee, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Transaction Log</h2>
        </div>
        {transactions.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Today's Revenue</div>
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalRevenue)}</div>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm">No transactions yet today.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  txn.spotType === 'ev' ? 'bg-amber-100 text-amber-700' :
                  txn.spotType === 'compact' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {txn.spotType === 'ev' ? '⚡' : txn.spotType === 'compact' ? '🚗' : '🚙'}
                </div>
                <div>
                  <div className="font-mono font-semibold text-gray-900 text-sm">{txn.plate}</div>
                  <div className="text-xs text-gray-500">
                    Spot {txn.spotId} • {formatDuration(txn.durationHours)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-700">{formatCurrency(txn.fee)}</div>
                <div className="text-xs text-gray-500">{formatDateTime(txn.checkOutTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
