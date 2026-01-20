# Changelog - WhatOrg

## [2026-01-20] - Fix: Timezone Issue

### Problem
The application was displaying dates one day behind (showing January 19th instead of January 20th, 2026) when deployed to production.

### Root Cause
The issue was caused by using `new Date()` and `date-fns` functions like `isToday()` without explicitly specifying the timezone. These functions were using the client's browser timezone instead of Chile's timezone (America/Santiago).

### Changes Made

#### 1. `/src/app/page.tsx`
- **Before**: `const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))`
- **After**: Added `useEffect` hook that:
  - Gets current date in Chile timezone
  - Uses `new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }))`
  - Properly initializes `selectedDate` with the correct timezone

#### 2. `/src/components/date-selector.tsx`
- **Added**: `isTodayInChile()` helper function that checks if a date is today in Chile timezone
- **Updated**: `canGoNext()` function to compare dates in Chile timezone
- **Updated**: `getDisplayDate()` to use `isTodayInChile()` instead of `isToday()`
- **Updated**: Date dropdown list to use `isTodayInChile()` for proper "Hoy" (Today) display

### Technical Details
The timezone conversion uses:
```typescript
const now = new Date()
const chileNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }))
```

This ensures that all date operations are performed using the Chile timezone, regardless of where the client browser is located.

### Testing
- Verified that the date selector shows the correct current date in Chile
- Ensured that "Hoy" (Today) appears correctly for the current date
- Confirmed that the "Next Day" button is disabled when reaching today's date

### Deployment
After this fix, the application will correctly display:
- Current date: January 20, 2026 (not January 19)
- Proper "Hoy" label for today's messages
- Correct date navigation within Chile's timezone
