import { useState } from 'react';
import { PricingConfig } from '../types';
import { formatCurrency } from '../utils/pricing';

interface PricingSettingsProps {
  pricing: PricingConfig;
  onUpdate: (pricing: PricingConfig) => void;
}

export function PricingSettings({ pricing, onUpdate }: PricingSettingsProps) {
  const [localPricing, setLocalPricing] = useState(pricing);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(localPricing);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Pricing Rates</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Hour Rate
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.50"
              min="0"
              value={localPricing.firstHourRate}
              onChange={(e) => setLocalPricing(p => ({ ...p, firstHourRate: parseFloat(e.target.value) || 0 }))}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Each Additional Hour
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.50"
              min="0"
              value={localPricing.additionalHourRate}
              onChange={(e) => setLocalPricing(p => ({ ...p, additionalHourRate: parseFloat(e.target.value) || 0 }))}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Daily Maximum Cap
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="1.00"
              min="0"
              value={localPricing.dailyCap}
              onChange={(e) => setLocalPricing(p => ({ ...p, dailyCap: parseFloat(e.target.value) || 0 }))}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Rate Breakdown Example:</p>
          <ul className="space-y-0.5">
            <li>• 1 hour: {formatCurrency(localPricing.firstHourRate)}</li>
            <li>• 2 hours: {formatCurrency(localPricing.firstHourRate + localPricing.additionalHourRate)}</li>
            <li>• 4 hours: {formatCurrency(Math.min(localPricing.firstHourRate + 3 * localPricing.additionalHourRate, localPricing.dailyCap))}</li>
            <li>• 8+ hours: {formatCurrency(localPricing.dailyCap)} (daily cap)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500 italic">Part-hours round up to the next full hour.</p>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-2.5 font-semibold rounded-lg transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {saved ? '✓ Rates Updated' : 'Update Rates'}
        </button>
      </div>
    </div>
  );
}
