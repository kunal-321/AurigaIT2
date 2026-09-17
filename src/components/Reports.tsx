import { useMemo, useState } from 'react';
import { Transaction, ParkedCar } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { useToast } from './Toast';

interface ReportsProps {
  transactions: Transaction[];
  parkedCars: ParkedCar[];
}

export function Reports({ transactions, parkedCars }: ReportsProps) {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

  // Calculate revenue metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyRevenue = transactions
      .filter(t => new Date(t.checkOutTime) >= today)
      .reduce((sum, t) => sum + t.fee, 0);

    const weeklyRevenue = transactions
      .filter(t => new Date(t.checkOutTime) >= weekAgo)
      .reduce((sum, t) => sum + t.fee, 0);

    const monthlyRevenue = transactions
      .filter(t => new Date(t.checkOutTime) >= monthAgo)
      .reduce((sum, t) => sum + t.fee, 0);

    const totalTransactions = transactions.length;
    const averageFee = totalTransactions > 0 
      ? transactions.reduce((sum, t) => sum + t.fee, 0) / totalTransactions 
      : 0;

    return {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      totalTransactions,
      averageFee,
    };
  }, [transactions]);

  // Calculate occupancy by hour
  const occupancyByHour = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    
    // Count check-ins by hour
    parkedCars.forEach(car => {
      const hour = new Date(car.checkInTime).getHours();
      hourCounts[hour]++;
    });

    // Also count historical transactions by check-in hour
    transactions.forEach(txn => {
      const hour = new Date(txn.checkInTime).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts, 1);
    
    return hourCounts.map((count, hour) => ({
      hour,
      count,
      percentage: (count / maxCount) * 100,
      label: `${hour.toString().padStart(2, '0')}:00`,
    }));
  }, [parkedCars, transactions]);

  // Export to CSV
  const exportToCSV = async () => {
    setExporting(true);
    
    try {
      // CSV headers
      const headers = [
        'Transaction ID',
        'Vehicle Plate',
        'Spot ID',
        'Spot Type',
        'Check-In Time',
        'Check-Out Time',
        'Duration (Hours)',
        'Fee (₹)',
      ];

      // CSV rows
      const rows = transactions.map(txn => [
        txn.id,
        txn.plate,
        txn.spotId,
        txn.spotType,
        formatDateTime(txn.checkInTime),
        formatDateTime(txn.checkOutTime),
        txn.durationHours.toString(),
        txn.fee.toString(),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `parking-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'Export Complete',
        message: `Exported ${transactions.length} transactions to CSV`,
        icon: '📊',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export transactions',
        icon: '❌',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Today's Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-display font-bold text-green-900">
            {formatCurrency(metrics.dailyRevenue)}
          </div>
          <div className="text-xs text-green-600 mt-2">
            {transactions.filter(t => new Date(t.checkOutTime) >= new Date(new Date().setHours(0,0,0,0))).length} transactions today
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">This Week</h3>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-3xl font-display font-bold text-blue-900">
            {formatCurrency(metrics.weeklyRevenue)}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Last 7 days
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">This Month</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-3xl font-display font-bold text-purple-900">
            {formatCurrency(metrics.monthlyRevenue)}
          </div>
          <div className="text-xs text-purple-600 mt-2">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Total Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Transactions</span>
              <span className="text-2xl font-display font-bold text-gray-900">{metrics.totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Fee</span>
              <span className="text-2xl font-display font-bold text-gray-900">{formatCurrency(metrics.averageFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Currently Parked</span>
              <span className="text-2xl font-display font-bold text-gray-900">{parkedCars.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Export Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download all transaction records as a CSV file for external analysis or record-keeping.
          </p>
          <button
            onClick={exportToCSV}
            disabled={exporting || transactions.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export Transactions as CSV</span>
              </>
            )}
          </button>
          {transactions.length === 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              No transactions to export yet
            </p>
          )}
        </div>
      </div>

      {/* Occupancy by Hour Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-display font-bold text-gray-900">Occupancy by Hour of Day</h3>
            <p className="text-sm text-gray-500">Check-in patterns throughout the day</p>
          </div>
          <span className="text-2xl">📊</span>
        </div>

        <div className="space-y-2">
          {occupancyByHour.map(({ hour, count, percentage, label }) => (
            <div key={hour} className="flex items-center gap-3 group">
              <div className="w-12 text-xs font-mono text-gray-500 text-right">
                {label}
              </div>
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2 group-hover:from-indigo-500 group-hover:to-purple-600"
                    style={{ width: `${percentage}%` }}
                  >
                    {count > 0 && (
                      <span className="text-xs font-bold text-white">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Peak Hour</span>
            <span className="font-display font-bold text-gray-900">
              {occupancyByHour.reduce((max, curr) => curr.count > max.count ? curr : max, occupancyByHour[0]).label}
              {' '}
              ({occupancyByHour.reduce((max, curr) => curr.count > max.count ? curr : max, occupancyByHour[0]).count} check-ins)
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Preview */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-gray-900">Recent Transactions</h3>
            <span className="text-sm text-gray-500">Last 5 transactions</span>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    txn.spotType === 'ev' ? 'bg-amber-100' :
                    txn.spotType === 'compact' ? 'bg-blue-100' :
                    txn.spotType === 'twoWheeler' ? 'bg-sky-100' :
                    'bg-purple-100'
                  }`}>
                    {txn.spotType === 'ev' ? '⚡' :
                     txn.spotType === 'compact' ? '🚗' :
                     txn.spotType === 'twoWheeler' ? '🏍️' :
                     '🚙'}
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-gray-900">{txn.plate}</div>
                    <div className="text-xs text-gray-500">
                      {txn.spotId} • {txn.durationHours}h
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-green-700">{formatCurrency(txn.fee)}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(txn.checkOutTime)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
