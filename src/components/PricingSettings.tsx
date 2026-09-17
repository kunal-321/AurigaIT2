import { useState } from 'react';
import { PricingConfig } from '../types';
import { formatCurrency } from '../utils/pricing';
import { useToast } from './Toast';

interface PricingSettingsProps {
  pricing: PricingConfig;
  onUpdate: (pricing: PricingConfig) => void;
}

export function PricingSettings({ pricing, onUpdate }: PricingSettingsProps) {
  const [localPricing, setLocalPricing] = useState(pricing);
  const { addToast } = useToast();

  const handleSave = () => {
    onUpdate(localPricing);
    addToast({
      type: 'success',
      title: 'Rates Updated',
      message: `First hour: ₹${localPricing.firstHourRate} • Additional: ₹${localPricing.additionalHourRate}/hr • Cap: ₹${localPricing.dailyCap}`,
      icon: '💰',
    });
  };

  const rateFields = [
    { key: 'firstHourRate' as const, label: 'First Hour Rate', desc: 'Charged for the first hour of parking', icon: '🕐', step: 5, color: 'indigo' },
    { key: 'additionalHourRate' as const, label: 'Each Additional Hour', desc: 'Cheaper rate for every hour after the first', icon: '⏰', step: 5, color: 'purple' },
    { key: 'dailyCap' as const, label: 'Daily Maximum Cap', desc: 'Maximum charge regardless of duration', icon: '🔒', step: 10, color: 'amber' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-teal-100 to-transparent rounded-full translate-y-20 translate-x-20 opacity-50"></div>

      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Parking Rates</h2>
          <p className="text-xs text-gray-500">Configure pricing for all vehicle types</p>
        </div>
      </div>

      <div className="space-y-4 relative">
        {rateFields.map((field, idx) => (
          <div
            key={field.key}
            className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all animate-fade-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{field.icon}</span>
              <div>
                <label className="block text-sm font-bold text-gray-900">{field.label}</label>
                <p className="text-[10px] text-gray-500">{field.desc}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input
                type="number"
                step={field.step}
                min="0"
                value={localPricing[field.key]}
                onChange={(e) => setLocalPricing(p => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 text-lg font-display font-bold bg-white transition-all"
              />
            </div>
          </div>
        ))}

        {/* Rate breakdown example */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <span>📊</span> Rate Breakdown Example
          </h4>
          <div className="space-y-2">
            {[
              { hours: 1, label: '1 hour' },
              { hours: 2, label: '2 hours' },
              { hours: 4, label: '4 hours' },
              { hours: 8, label: '8+ hours (capped)' },
            ].map((item, i) => {
              const fee = item.hours === 1
                ? localPricing.firstHourRate
                : Math.min(
                    localPricing.firstHourRate + (item.hours - 1) * localPricing.additionalHourRate,
                    localPricing.dailyCap
                  );
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-display font-bold text-indigo-700">{formatCurrency(fee)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-gray-500 italic border-t border-indigo-100 pt-2">
            💡 Part-hours round up to the next full hour. Same rates apply for all vehicle types.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 btn-primary rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>💾</span>
          <span>Update Rates</span>
        </button>
      </div>
    </div>
  );
}
