# ParkDesk - Multi-Level Parking Management System

A comprehensive parking garage management system built for Indian city-centre parking facilities. Built with React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Vehicle Check-In/Check-Out**: Track vehicles entering and leaving the garage
- **Tiered Pricing**: First hour rate, reduced additional hour rate, daily maximum cap
- **Multiple Spot Types**:
  - Two-Wheeler (🏍️) - 20 spots for bikes/scooters
  - Compact (🚗) - 10 spots for small cars
  - Standard (🚙) - 15 spots for sedans/SUVs
  - EV (⚡) - 5 spots with chargers
- **Real-Time Availability**: Instant spot availability checking
- **Vehicle Lookup**: Find any parked vehicle by license plate
- **Transaction Logging**: Complete history with revenue tracking
- **Configurable Rates**: Adjust pricing on-the-fly

### Indian Market Adaptations
- Currency in INR (₹) with Indian number formatting
- Indian license plate format (e.g., MH 12 AB 1234)
- Two-wheeler parking (bikes/scooters are common in India)
- DD/MM/YYYY date format
- UPI/Cash/Card payment options
- Indian state codes for license plates

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd parkdesk
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Type Checking

```bash
npm run typecheck
```

## Usage Guide

### Check In a Vehicle
1. Navigate to "Check In / Out" tab
2. Enter the vehicle registration number (e.g., MH 12 AB 1234)
3. Select the appropriate spot type (Two-Wheeler, Compact, Standard, or EV)
4. Click "Check In"
5. The system assigns an available spot and records the check-in time

### Check Out a Vehicle
1. Navigate to "Check In / Out" tab
2. Enter the vehicle registration number
3. Click "Check Out & Collect Fee"
4. The system calculates the fee based on duration and displays the amount
5. Collect payment (UPI/Cash/Card)

### Find a Vehicle
1. Navigate to "Check In / Out" or "Garage Map" tab
2. Use the "Find a Vehicle" search box
3. Enter the license plate number
4. View the vehicle's spot location, check-in time, and duration

### View Garage Overview
1. Navigate to "Garage Map" tab
2. See overall statistics (total spots, occupied, available)
3. View per-type availability with visual progress bars
4. See individual spot status (occupied/available)

### View Transaction Log
1. Navigate to "Transactions" tab
2. View all completed transactions
3. See total revenue collected today
4. Each transaction shows vehicle number, duration, fee, and timestamp

### Configure Pricing Rates
1. Navigate to "Rates" tab
2. Adjust first hour rate, additional hour rate, and daily cap
3. See example rate breakdown
4. Click "Update Rates" to save changes

## Pricing Logic

The system uses tiered pricing:
- **First Hour**: ₹40 (configurable)
- **Each Additional Hour**: ₹20 (configurable)
- **Daily Maximum**: ₹200 (configurable)
- **Part-hours**: Round up to the next full hour

Example calculations:
- 1 hour: ₹40
- 2 hours: ₹40 + ₹20 = ₹60
- 4 hours: ₹40 + (3 × ₹20) = ₹100
- 8+ hours: ₹200 (capped at daily maximum)

## Debugging

### Common Issues

**Issue: Build fails with TypeScript errors**
- Run `npm run typecheck` to see all type errors
- Ensure all dependencies are installed: `npm install`

**Issue: Development server won't start**
- Check if port 5173 is already in use
- Kill the process: `lsof -ti:5173 | xargs kill -9` (Mac/Linux)
- Or modify `vite.config.js` to use a different port

**Issue: Styles not loading**
- Clear browser cache
- Ensure Tailwind CSS is properly configured in `src/index.css`

**Issue: Data not persisting**
- This is a client-side application - data is stored in React state
- Refreshing the page will reset all data
- For persistence, you would need to add localStorage or a backend

### Browser Console
Open browser DevTools (F12) to see:
- React component renders
- State changes
- Any runtime errors

### Network Tab
Check the Network tab in DevTools to see:
- All HTTP requests (if backend is added)
- Response status codes
- Request/response payloads

## Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── CheckIn.tsx      # Vehicle check-in form
│   ├── CheckOut.tsx     # Vehicle check-out form
│   ├── CarLookup.tsx    # Vehicle search
│   ├── SpotOverview.tsx # Garage map/overview
│   ├── TransactionLog.tsx # Transaction history
│   └── PricingSettings.tsx # Rate configuration
├── hooks/
│   └── useParkingGarage.ts # Main state management
├── utils/
│   └── pricing.ts       # Fee calculation logic
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles with Tailwind
```

### State Management
The application uses React hooks for state management:
- `useState` for local component state
- Custom hook `useParkingGarage` for global garage state
- No external state management library needed

### Key Design Decisions

1. **Client-Side Only**: No backend - all data in React state for simplicity
2. **TypeScript**: Full type safety for better maintainability
3. **Tailwind CSS**: Utility-first CSS for rapid UI development
4. **Component-Based**: Modular components for reusability
5. **Indian Market Focus**: Adapted for Indian parking needs (two-wheelers, INR, local formats)

## API Endpoints

**Note**: This is a client-side application with no backend API. All operations are performed locally in the browser.

If you want to extend this with a backend, here are the suggested API endpoints:

### Suggested Backend API (Not Implemented)

```
POST /api/checkin
- Body: { plate: string, spotType: string }
- Response: { success: boolean, message: string, spotId?: string }

POST /api/checkout
- Body: { plate: string }
- Response: { success: boolean, message: string, fee?: number, duration?: number }

GET /api/vehicles/:plate
- Response: { plate: string, spotId: string, spotType: string, checkInTime: string }

GET /api/spots
- Response: { spots: ParkingSpot[], availability: AvailabilitySummary }

GET /api/transactions
- Response: { transactions: Transaction[], totalRevenue: number }

PUT /api/pricing
- Body: { firstHourRate: number, additionalHourRate: number, dailyCap: number }
- Response: { success: boolean }
```

## Testing

### Manual Testing Checklist

- [ ] Check in a vehicle with valid plate number
- [ ] Check in a vehicle that's already parked (should fail)
- [ ] Check out a vehicle and verify fee calculation
- [ ] Check out a vehicle not in garage (should fail)
- [ ] Search for a parked vehicle by plate
- [ ] View garage overview and verify spot counts
- [ ] Update pricing rates and verify new rates apply
- [ ] Test with different spot types (two-wheeler, compact, standard, EV)
- [ ] Verify daily cap is applied correctly
- [ ] Test part-hour rounding (e.g., 1h 15m should charge for 2 hours)

### Edge Cases to Test

- Vehicle with same plate checked in twice
- Check out with exact hour duration
- Check out with partial hour (should round up)
- Check out after daily cap threshold
- All spots of one type occupied
- Empty garage (no parked vehicles)
- Very long plate numbers
- Special characters in plate numbers

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **date-fns** - Date manipulation (available but not heavily used)
- **Lucide React** - Icons (available)

## License

MIT

## Contributing

This is a demonstration project. For production use, consider:
- Adding a backend API with database
- Implementing authentication
- Adding localStorage for data persistence
- Adding input validation and sanitization
- Implementing proper error handling
- Adding unit and integration tests
- Adding accessibility features (ARIA labels, keyboard navigation)
- Adding internationalization (i18n) support
