import { useState } from 'react';
import { useParkingGarage } from './hooks/useParkingGarage';
import { CheckIn } from './components/CheckIn';
import { CheckOut } from './components/CheckOut';
import { SpotOverview } from './components/SpotOverview';
import { CarLookup } from './components/CarLookup';
import { TransactionLog } from './components/TransactionLog';
import { PricingSettings } from './components/PricingSettings';
import { ToastProvider, useToast } from './components/Toast';
import { LiveClock } from './components/LiveClock';
import { AnimatedCounter } from './components/AnimatedCounter';

type Tab = 'operations' | 'overview' | 'log' | 'settings';

function AppContent() {
  const garage = useParkingGarage();
  const [activeTab, setActiveTab] = useState<Tab>('operations');
  const { addToast } = useToast();

  const tabs: { id: Tab; label: string; icon: string; desc: string }[] = [
    { id: 'operations', label: 'Operations', icon: '🅿️', desc: 'Check In / Out' },
    { id: 'overview', label: 'Garage Map', icon: '🗺️', desc: 'Spot Overview' },
    { id: 'log', label: 'Transactions', icon: '📋', desc: 'History & Revenue' },
    { id: 'settings', label: 'Rates', icon: '💰', desc: 'Pricing Config' },
  ];

  const summary = garage.getAvailabilitySummary();
  const parkedPlates = garage.parkedCars.map(c => c.plate);
  const totalAvailable = garage.spots.length - garage.spots.filter(s => s.occupied).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/40 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 animate-glow">
                <span className="text-white text-xl font-display font-bold">P</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold gradient-text">ParkDesk</h1>
                <p className="text-xs text-gray-500 font-medium">Multi-Level Parking Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Live availability badge */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/80 rounded-full shadow-sm border border-gray-200">
                <div className="relative">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  <span className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <AnimatedCounter value={totalAvailable} className="font-display font-bold text-lg text-gray-900" />
                  <span className="text-xs text-gray-500 font-medium">spots open</span>
                </div>
              </div>

              {/* Live clock */}
              <div className="hidden sm:block px-4 py-2 bg-white/80 rounded-full shadow-sm border border-gray-200">
                <LiveClock />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass border-b border-white/40 sticky top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap rounded-t-xl transition-all ${
                  activeTab === tab.id ? 'active' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left hidden sm:block">
                  <div className="leading-tight">{tab.label}</div>
                  <div className="text-[10px] text-gray-400 font-normal leading-tight">{tab.desc}</div>
                </div>
                <span className="sm:hidden">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
            <div className="space-y-6">
              <CheckIn onCheckIn={garage.checkIn} hasAvailability={garage.hasAvailability} />
              <CarLookup parkedCars={garage.parkedCars} findCarByPlate={garage.findCarByPlate} />
            </div>
            <div className="space-y-6">
              <CheckOut onCheckOut={garage.checkOut} parkedPlates={parkedPlates} />
              {/* Quick availability */}
              <QuickAvailability summary={summary} />
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
            <SpotOverview spots={garage.spots} availabilitySummary={summary} />
            <CarLookup parkedCars={garage.parkedCars} findCarByPlate={garage.findCarByPlate} />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="max-w-3xl mx-auto animate-fade-up">
            <TransactionLog transactions={garage.transactions} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto animate-fade-up">
            <PricingSettings pricing={garage.pricing} onUpdate={garage.setPricing} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/40 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-gray-700">ParkDesk</span>
              <span className="text-gray-300">•</span>
              <span>Multi-Level Parking Management System</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-[10px]">
                ₹{garage.pricing.firstHourRate}/hr first
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-[10px]">
                ₹{garage.pricing.additionalHourRate}/hr after
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-[10px]">
                ₹{garage.pricing.dailyCap} max
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function QuickAvailability({ summary }: { summary: ReturnType<ReturnType<typeof useParkingGarage>['getAvailabilitySummary']> }) {
  const items = [
    { key: 'twoWheeler' as const, label: 'Two-Wheeler', icon: '🏍️', gradient: 'from-sky-400 to-cyan-500', bg: 'bg-sky-50', border: 'border-sky-200' },
    { key: 'compact' as const, label: 'Compact', icon: '🚗', gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'standard' as const, label: 'Standard', icon: '🚙', gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { key: 'ev' as const, label: 'EV', icon: '⚡', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
      <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2 relative">
        <span>📊</span> Quick Availability
      </h3>
      <div className="grid grid-cols-4 gap-2 relative">
        {items.map((item, idx) => {
          const data = summary[item.key];
          const pct = data.total > 0 ? (data.available / data.total) * 100 : 0;
          return (
            <div
              key={item.key}
              className={`text-center p-3 ${item.bg} rounded-xl border ${item.border} animate-pop-in hover:scale-105 transition-transform cursor-default`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <AnimatedCounter value={data.available} className="text-2xl font-display font-bold text-gray-900 block" />
              <div className="text-[10px] text-gray-600 font-semibold mt-0.5">{item.label}</div>
              <div className="text-[9px] text-gray-400">{data.total} total</div>
              {/* Mini progress */}
              <div className="w-full bg-white/60 rounded-full h-1 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-1000`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
