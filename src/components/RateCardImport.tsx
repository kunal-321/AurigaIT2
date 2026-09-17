import { useState } from 'react';
import { parseMessyRateCard, entriesToPricing, SAMPLE_MESSY_RATE_CARD, ParseResult } from '../utils/rateCardParser';
import { PricingConfig } from '../types';
import { useToast } from './Toast';

interface RateCardImportProps {
  currentPricing: PricingConfig;
  onUpdatePricing: (pricing: PricingConfig) => void;
}

export function RateCardImport({ currentPricing, onUpdatePricing }: RateCardImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawInput, setRawInput] = useState(SAMPLE_MESSY_RATE_CARD);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const { addToast } = useToast();

  const handleParse = () => {
    const result = parseMessyRateCard(rawInput);
    setParseResult(result);

    if (result.entries.length === 0) {
      addToast({
        type: 'error',
        title: 'No Valid Rates Found',
        message: 'Could not parse any rates from the input',
        icon: '❌',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Rate Card Parsed',
        message: `Found ${result.entries.length} rate entries (${result.stats.junkLines} junk lines skipped)`,
        icon: '✅',
      });
    }
  };

  const handleApply = () => {
    if (!parseResult || parseResult.entries.length === 0) {
      addToast({
        type: 'error',
        title: 'No Rates to Apply',
        message: 'Parse the rate card first',
        icon: '❌',
      });
      return;
    }

    const newPricing = entriesToPricing(parseResult.entries);
    const updatedPricing: PricingConfig = {
      ...currentPricing,
      byType: newPricing.byType,
    };

    onUpdatePricing(updatedPricing);
    setIsOpen(false);
    setParseResult(null);

    addToast({
      type: 'success',
      title: 'Rates Updated',
      message: 'Per-type pricing has been updated from the rate card',
      icon: '💰',
    });
  };

  const handleLoadSample = () => {
    setRawInput(SAMPLE_MESSY_RATE_CARD);
    setParseResult(null);
  };

  const handleClear = () => {
    setRawInput('');
    setParseResult(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <span>📥</span>
        <span>Import Messy Rate Card</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="gradient-primary p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="relative">
            <h2 className="font-display font-bold text-2xl mb-1">Import Messy Rate Card</h2>
            <p className="text-white/80 text-sm">
              Level 1 — T4: Clean messy rate data and apply per-type pricing
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-gray-900">Messy Rate Card Data</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadSample}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Load Sample
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => { setRawInput(e.target.value); setParseResult(null); }}
                className="w-full h-96 p-4 border-2 border-gray-200 rounded-xl font-mono text-xs focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                placeholder="Paste messy rate card data here..."
              />
              <button
                onClick={handleParse}
                disabled={!rawInput.trim()}
                className="w-full mt-3 py-3 btn-primary rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                <span>Parse & Clean Data</span>
              </button>
            </div>

            {/* Right: Results */}
            <div>
              <h3 className="font-display font-bold text-gray-900 mb-3">Parsed Results</h3>

              {!parseResult ? (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm text-gray-500">Click "Parse & Clean Data" to see results</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-display font-bold text-blue-700">{parseResult.stats.totalLines}</div>
                      <div className="text-[10px] text-blue-600 font-semibold">Total Lines</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-display font-bold text-green-700">{parseResult.stats.parsedLines}</div>
                      <div className="text-[10px] text-green-600 font-semibold">Parsed</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <div className="text-2xl font-display font-bold text-red-700">{parseResult.stats.junkLines}</div>
                      <div className="text-[10px] text-red-600 font-semibold">Junk</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <div className="text-2xl font-display font-bold text-amber-700">{parseResult.stats.duplicates}</div>
                      <div className="text-[10px] text-amber-600 font-semibold">Duplicates</div>
                    </div>
                  </div>

                  {/* Parsed entries */}
                  <div className="h-80 overflow-y-auto space-y-2">
                    {parseResult.entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-2 ${
                          entry.warnings.some(w => w.includes('Duplicate'))
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-gray-900">
                            {entry.spotType === 'twoWheeler' ? '🏍️' :
                             entry.spotType === 'compact' ? '🚗' :
                             entry.spotType === 'ev' ? '⚡' : '🚙'}
                            {' '}{entry.spotType}
                          </span>
                          <div className="text-right">
                            <div className="font-display font-bold text-green-700">
                              ₹{entry.firstHour} / ₹{entry.additionalHour} / ₹{entry.dailyCap}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate">
                          Raw: {entry.raw}
                        </div>
                        {entry.warnings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {entry.warnings.map((warning, i) => (
                              <div key={i} className="text-[10px] text-amber-600 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {parseResult.entries.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-3xl mb-2">❌</div>
                        <p className="text-sm">No valid rates found</p>
                      </div>
                    )}
                  </div>

                  {/* Skipped lines */}
                  {parseResult.skipped.length > 0 && (
                    <details className="bg-gray-50 rounded-lg p-3">
                      <summary className="text-xs font-semibold text-gray-700 cursor-pointer">
                        Skipped Lines ({parseResult.skipped.length})
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {parseResult.skipped.slice(0, 10).map((line, idx) => (
                          <div key={idx} className="text-[10px] text-gray-500 font-mono truncate">
                            {line}
                          </div>
                        ))}
                        {parseResult.skipped.length > 10 && (
                          <div className="text-[10px] text-gray-400">
                            ... and {parseResult.skipped.length - 10} more
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => { setIsOpen(false); setParseResult(null); }}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!parseResult || parseResult.entries.length === 0}
            className="flex-1 py-3 btn-success rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>✅</span>
            <span>Apply Cleaned Rates</span>
          </button>
        </div>
      </div>
    </div>
  );
}
