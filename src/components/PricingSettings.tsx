import { useState } from 'react';
import { PricingConfig, SpotType } from '../types';
import { formatCurrency } from '../utils/pricing';
import { useToast } from './Toast';
import { RateCardImport } from './RateCardImport';

interface PricingSettingsProps {
  pricing: PricingConfig;
  onUpdate: (pricing: PricingConfig) => void;
}

export function PricingSettings({ pricing, onUpdate }: PricingSettingsProps) {
  const [localPricing, setLocalPricing] = useState<PricingConfig>(pricing);
  const { addToast } = useToast();

  const handleSave = () => {
    onUpdate(localPricing);
    addToast({
      type: 'success',
      title: 'Rates Updated',
      message: 'Per-type pricing has been saved',
      icon: '💰',
    });
  };

  const handleTypeChange = (type: SpotType, field: 'firstHourRate' | 'additionalHourRate' | 'dailyCap', value: number) => {
    setLocalPricing(prev => ({
      ...prev,
      byType: {
        ...prev.byType,
        [type]: {
          ...prev.byType[type],
          [field]: value,
        },
      },
    }));
  };

  const typeConfig: { type: SpotType; label: string; icon: string; color: string }[] = [
    { type: 'twoWheeler', label: 'Two-Wheeler', icon: '🏍️', color: 'sky' },
    { type: 'compact', label: 'Compact', icon: '🚗', color: 'blue' },
    { type: 'standard', label: 'Standard', icon: '🚙', color: 'purple' },
    { type: 'ev', label: 'EV', icon: '⚡', color: 'amber' },
  ];

  return (
    <div className="space-y-6">
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
            <h2 className="font-display text-xl font-bold text-gray-900">Per-Type Parking Rates</h2>
            <p className="text-xs text-gray-500">Configure pricing for each vehicle type</p>
          </div>
        </div>

        <div className="space-y-4 relative">
          {typeConfig.map(({ type, label, icon, color }, idx) => {
            const typePricing = localPricing.byType[type];

            return (
              <div
                key={type}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-bold text-gray-900">{label}</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">First Hour</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={typePricing.firstHourRate}
                        onChange={(e) => handleTypeChange(type, 'firstHourRate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm font-bold bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Addl. Hour</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={typePricing.additionalHourRate}
                        onChange={(e) => handleTypeChange(type, 'additionalHourRate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm font-bold bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Daily Cap</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={typePricing.dailyCap}
                        onChange={(e) => handleTypeChange(type, 'dailyCap', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm font-bold bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleSave}
            className="w-full py-4 btn-primary rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>💾</span>
            <span>Save Per-Type Rates</span>
          </button>
        </div>
      </div>

      {/* Import messy rate card */}
      <RateCardImport currentPricing={pricing} onUpdatePricing={onUpdate} />

      {/* Rate breakdown examples */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span> Rate Breakdown Examples
        </h3>
        <div className="space-y-4">
          {typeConfig.map(({ type, label, icon }) => {
            const typePricing = pricing.byType[type];
            return (
              <div key={type} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>{icon}</span>
                  <span className="font-bold text-sm text-gray-900">{label}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">1 hour</div>
                    <div className="font-bold text-gray-900">{formatCurrency(typePricing.firstHourRate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">2 hours</div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(typePricing.firstHourRate + typePricing.additionalHourRate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">4 hours</div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(Math.min(
                        typePricing.firstHourRate + 3 * typePricing.additionalHourRate,
                        typePricing.dailyCap
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">8+ hours</div>
                    <div className="font-bold text-green-700">{formatCurrency(typePricing.dailyCap)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-gray-500 italic">
          💡 Part-hours round up to the next full hour. Each vehicle type has its own rates.
        </p>
      </div>
    </div>
  );
}
