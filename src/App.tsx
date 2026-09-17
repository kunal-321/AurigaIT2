import { useState } from 'react';
import { useParkingGarage } from './hooks/useParkingGarage';
import { CheckIn } from './components/CheckIn';
import { CheckOut } from './components/CheckOut';
import { SpotOverview } from './components/SpotOverview';
import { CarLookup } from './components/CarLookup';
import { TransactionLog } from './components/TransactionLog';
import { PricingSettings } from './components/PricingSettings';

type Tab = 'operations' | 'overview' | 'log' | 'settings';

function App() {
  const garage = useParkingGarage();
  const [activeTab, setActiveTab] = useState<Tab>('operations');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'operations', label: 'Check In / Out', icon: '🅿️' },
    { id: 'overview', label: 'Garage Map', icon: '🗺️' },
    { id: 'log', label: 'Transactions', icon: '📋' },
    { id: 'settings', label: 'Rates', icon: '💰' },
  ];

  const summary = garage.getAvailabilitySummary();
  const parkedPlates = garage.parkedCars.map(c => c.plate);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">ParkDesk</h1>
                <p className="text-xs text-gray-500 leading-tight">Multi-Level Parking Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-gray-700 font-medium">{garage.spots.length - garage.spots.filter(s => s.occupied).length} spots open</span>
              </div>
              <div className="text-gray-500 text-xs">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CheckIn onCheckIn={garage.checkIn} hasAvailability={garage.hasAvailability} />
              <CarLookup parkedCars={garage.parkedCars} findCarByPlate={garage.findCarByPlate} />
            </div>
            <div className="space-y-6">
              <CheckOut onCheckOut={garage.checkOut} parkedPlates={parkedPlates} />
              {/* Quick availability */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Availability</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-sky-50 rounded-lg">
                    <div className="text-xl font-bold text-sky-600">{summary.twoWheeler.available}</div>
                    <div className="text-[10px] text-gray-500 font-medium">🏍️ Two-Wheeler</div>
                    <div className="text-[10px] text-gray-400">{summary.twoWheeler.total} total</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{summary.compact.available}</div>
                    <div className="text-[10px] text-gray-500 font-medium">🚗 Compact</div>
                    <div className="text-[10px] text-gray-400">{summary.compact.total} total</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">{summary.standard.available}</div>
                    <div className="text-[10px] text-gray-500 font-medium">🚙 Standard</div>
                    <div className="text-[10px] text-gray-400">{summary.standard.total} total</div>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-600">{summary.ev.available}</div>
                    <div className="text-[10px] text-gray-500 font-medium">⚡ EV</div>
                    <div className="text-[10px] text-gray-400">{summary.ev.total} total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpotOverview spots={garage.spots} availabilitySummary={summary} />
            <CarLookup parkedCars={garage.parkedCars} findCarByPlate={garage.findCarByPlate} />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="max-w-3xl mx-auto">
            <TransactionLog transactions={garage.transactions} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto">
            <PricingSettings pricing={garage.pricing} onUpdate={garage.setPricing} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>ParkDesk — Multi-Level Parking Management System</p>
            <p>Rates: ₹{garage.pricing.firstHourRate}/hr first • ₹{garage.pricing.additionalHourRate}/hr after • ₹{garage.pricing.dailyCap} daily max</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
