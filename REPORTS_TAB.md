# Reports Tab - Analytics & Export Feature

## Overview

The Reports tab provides comprehensive analytics and export functionality for the parking management system. It includes revenue tracking across different time periods, occupancy pattern visualization, and CSV export capabilities.

## Features

### 1. Revenue Metrics

Three key revenue cards showing:

- **Today's Revenue**: Total revenue from all transactions completed today (midnight to now)
- **This Week**: Total revenue from the last 7 days
- **This Month**: Total revenue from the last 30 days

Each card displays:
- Total revenue amount (₹)
- Number of transactions in that period
- Color-coded gradients for visual distinction

### 2. Total Statistics

Additional metrics panel showing:
- **Total Transactions**: Count of all completed transactions
- **Average Fee**: Mean fee across all transactions
- **Currently Parked**: Number of vehicles currently in the garage

### 3. Occupancy by Hour Chart

Visual bar chart showing check-in patterns throughout the day:
- 24 horizontal bars (one for each hour: 00:00 to 23:00)
- Bar length proportional to check-in count
- Count displayed on each bar
- Peak hour identification at the bottom

**Data Sources:**
- Currently parked vehicles (by check-in time)
- Historical transactions (by check-in time)

**Use Case:** Identify busy hours to optimize staffing and pricing strategies.

### 4. CSV Export

Export all transaction data to a CSV file with one click:

**CSV Columns:**
- Transaction ID
- Vehicle Plate
- Spot ID
- Spot Type
- Check-In Time
- Check-Out Time
- Duration (Hours)
- Fee (₹)

**File Naming:** `parking-transactions-YYYY-MM-DD.csv`

**Features:**
- Loading state during export
- Success/error toast notifications
- Automatic download trigger
- Handles empty transaction list gracefully

### 5. Recent Transactions Preview

Shows the last 5 transactions with:
- Vehicle type icon
- License plate
- Spot ID and duration
- Fee amount
- Check-out timestamp

## Implementation Details

### Component Structure

```typescript
interface ReportsProps {
  transactions: Transaction[];
  parkedCars: ParkedCar[];
}
```

### Revenue Calculation Logic

```typescript
// Daily revenue - transactions from today (midnight onwards)
const dailyRevenue = transactions
  .filter(t => new Date(t.checkOutTime) >= today)
  .reduce((sum, t) => sum + t.fee, 0);

// Weekly revenue - last 7 days
const weeklyRevenue = transactions
  .filter(t => new Date(t.checkOutTime) >= weekAgo)
  .reduce((sum, t) => sum + t.fee, 0);

// Monthly revenue - last 30 days
const monthlyRevenue = transactions
  .filter(t => new Date(t.checkOutTime) >= monthAgo)
  .reduce((sum, t) => sum + t.fee, 0);
```

### Occupancy by Hour Calculation

```typescript
const hourCounts = new Array(24).fill(0);

// Count from parked cars
parkedCars.forEach(car => {
  const hour = new Date(car.checkInTime).getHours();
  hourCounts[hour]++;
});

// Count from historical transactions
transactions.forEach(txn => {
  const hour = new Date(txn.checkInTime).getHours();
  hourCounts[hour]++;
});
```

### CSV Export Implementation

```typescript
const exportToCSV = async () => {
  // Define headers
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

  // Map transactions to rows
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

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `parking-transactions-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

## User Interface

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Reports Tab                                             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Today's      │  │ This Week    │  │ This Month   │ │
│  │ Revenue      │  │ Revenue      │  │ Revenue      │ │
│  │ ₹1,234       │  │ ₹8,567       │  │ ₹32,890      │ │
│  │ 15 trans.    │  │ Last 7 days  │  │ Last 30 days │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │ Total Statistics        │  │ Export Data          │ │
│  │ Total Transactions: 150 │  │ Download all trans.  │ │
│  │ Average Fee: ₹234       │  │ [Export as CSV]      │ │
│  │ Currently Parked: 23    │  │                      │ │
│  └─────────────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Occupancy by Hour of Day                               │
│  Check-in patterns throughout the day                   │
│                                                         │
│  00:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 45         │
│  01:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 38            │
│  02:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 32               │
│  ...                                                    │
│  09:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 67 │
│  ...                                                    │
│  18:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 72│
│  ...                                                    │
│  23:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 41              │
│                                                         │
│  Peak Hour: 18:00 (72 check-ins)                       │
├─────────────────────────────────────────────────────────┤
│  Recent Transactions                          Last 5    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🚙 MH12AB1234    S-05 • 3h        ₹180         │   │
│  │    15/01/2024, 06:45 PM                         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🏍️ KA03CD5678    TW-12 • 2h       ₹40         │   │
│  │    15/01/2024, 05:30 PM                         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ...                                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Use Cases

### 1. Daily Revenue Tracking

**Scenario:** Parking attendant wants to know today's earnings at end of shift.

**Action:**
1. Navigate to Reports tab
2. Check "Today's Revenue" card
3. See total revenue and transaction count

**Benefit:** Quick end-of-day reconciliation.

### 2. Peak Hour Analysis

**Scenario:** Manager wants to optimize staffing based on busy hours.

**Action:**
1. Navigate to Reports tab
2. Scroll to "Occupancy by Hour" chart
3. Identify peak hours (longest bars)
4. Schedule more staff during peak times

**Benefit:** Data-driven staffing decisions.

### 3. Monthly Financial Reporting

**Scenario:** Accountant needs monthly revenue report.

**Action:**
1. Navigate to Reports tab
2. Check "This Month" revenue card
3. Click "Export Transactions as CSV"
4. Open CSV in Excel/spreadsheet software
5. Create financial reports

**Benefit:** Easy export for accounting purposes.

### 4. Performance Analysis

**Scenario:** Owner wants to analyze average parking duration and fees.

**Action:**
1. Navigate to Reports tab
2. Check "Total Statistics" panel
3. Review average fee and total transactions
4. Compare with previous periods

**Benefit:** Business performance insights.

### 5. Historical Pattern Recognition

**Scenario:** Identify if weekends are busier than weekdays.

**Action:**
1. Export CSV data
2. Analyze check-in patterns by day of week
3. Identify trends

**Benefit:** Strategic planning for promotions or pricing adjustments.

## Technical Details

### Performance Optimizations

1. **Memoized Calculations**: All metrics calculated using `useMemo` to prevent unnecessary recalculations
2. **Efficient Filtering**: Date comparisons done once per metric
3. **Lazy Rendering**: Only render visible data

### Error Handling

- Empty transaction list: Shows "No transactions to export yet"
- Export failure: Shows error toast notification
- Invalid dates: Gracefully handled in calculations

### Browser Compatibility

- CSV export uses Blob API (supported in all modern browsers)
- Download trigger uses programmatic link click
- No external dependencies required

## Data Flow

```
User clicks "Reports" tab
         ↓
Reports component mounts
         ↓
Calculate metrics (useMemo)
         ↓
┌────────┴────────┬────────────────┬──────────────┐
↓                 ↓                ↓              ↓
Revenue        Occupancy      Statistics      Recent
Cards          Chart          Panel           Transactions
         ↓
User interacts
         ↓
┌────────┴────────┐
↓                 ↓
Export CSV    View Details
         ↓
Download file
```

## Future Enhancements

### Potential Additions

1. **Date Range Picker**: Custom date range for revenue analysis
2. **Revenue by Spot Type**: Breakdown by two-wheeler/compact/standard/EV
3. **Trend Charts**: Line graphs showing revenue over time
4. **Comparison Mode**: Compare this week vs last week
5. **Heat Map Calendar**: Visual calendar showing busy days
6. **Predictive Analytics**: Forecast future revenue based on trends
7. **Custom Reports**: User-defined report templates
8. **Email Reports**: Automated daily/weekly email summaries
9. **PDF Export**: Generate PDF reports in addition to CSV
10. **Multi-Garage Support**: Aggregate reports across multiple locations

### Advanced Analytics

- **Customer Retention**: Track repeat customers by plate
- **Session Duration Distribution**: Histogram of parking durations
- **Revenue per Spot**: Identify most profitable spots
- **Occupancy Rate**: Percentage of spots occupied over time
- **Turnover Rate**: How quickly spots are reused

## Integration with Other Features

### Transactions Tab vs Reports Tab

**Transactions Tab:**
- Detailed list of all transactions
- Search and filter capabilities
- Individual transaction details
- Real-time updates

**Reports Tab:**
- Aggregated metrics and analytics
- Visual charts and graphs
- Export functionality
- Historical analysis

### Data Consistency

Both tabs use the same `transactions` array from `useParkingGarage` hook, ensuring:
- Consistent data across views
- Real-time updates when transactions occur
- Synchronized state management

## Testing Scenarios

### Test Case 1: Empty State

**Setup:**
- No transactions in the system
- No parked vehicles

**Expected:**
- All revenue cards show ₹0
- Total transactions: 0
- Average fee: ₹0
- Occupancy chart: all bars at 0
- Export button disabled with message "No transactions to export yet"
- Recent transactions section not shown

### Test Case 2: Single Transaction

**Setup:**
- 1 transaction completed today
- Fee: ₹100

**Expected:**
- Today's revenue: ₹100 (1 transaction)
- Weekly revenue: ₹100
- Monthly revenue: ₹100
- Total transactions: 1
- Average fee: ₹100
- Export creates CSV with 1 data row

### Test Case 3: Multiple Time Periods

**Setup:**
- 5 transactions today
- 10 transactions this week (including today's)
- 25 transactions this month (including this week's)

**Expected:**
- Today's revenue: sum of 5 transactions
- Weekly revenue: sum of 10 transactions
- Monthly revenue: sum of 25 transactions
- All metrics calculated correctly

### Test Case 4: CSV Export

**Setup:**
- 100 transactions in the system

**Action:**
- Click "Export Transactions as CSV"

**Expected:**
- Loading state shown
- CSV file downloaded
- File contains 101 rows (1 header + 100 data rows)
- All columns present and correctly formatted
- Success toast notification shown

### Test Case 5: Occupancy Chart

**Setup:**
- 3 vehicles checked in at 09:00
- 5 vehicles checked in at 18:00
- 2 vehicles checked in at 12:00

**Expected:**
- 09:00 bar shows count of 3
- 18:00 bar shows count of 5 (longest bar)
- 12:00 bar shows count of 2
- Peak hour shows "18:00 (5 check-ins)"

## Files Modified

| File | Changes |
|------|---------|
| `src/components/Reports.tsx` | New component (300+ lines) |
| `src/App.tsx` | Added Reports tab and routing |

## Success Criteria

- ✅ Daily, weekly, monthly revenue totals
- ✅ Occupancy by hour chart
- ✅ CSV export functionality
- ✅ Total statistics panel
- ✅ Recent transactions preview
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Performance optimized (useMemo)
- ✅ Accessible UI
- ✅ Production-ready

## Conclusion

The Reports tab provides comprehensive analytics and export capabilities for the parking management system. It enables data-driven decision making through revenue tracking, occupancy pattern analysis, and easy data export for external analysis. The implementation is performant, user-friendly, and production-ready.
