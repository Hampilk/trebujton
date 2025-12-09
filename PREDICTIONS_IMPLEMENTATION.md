# Predictions UI Implementation Guide

## Overview

This document describes the implementation of the Predictions UI feature, which provides analysts with tools to create predictions, view ensemble breakdowns, and analyze prediction accuracy.

## Architecture

### Page Structure
- **Route**: `/predictions`
- **Component**: `src/pages/Predictions.tsx`
- **Layout ID**: `predictions` (defined in `src/layouts.ts`)

### Main Components

#### 1. **Predictions Page** (`src/pages/Predictions.tsx`)
The main page that orchestrates all prediction-related widgets using the responsive `AppGrid` layout.

**Features:**
- Composable widget system using AppGrid
- Create prediction action button
- Responsive layout for desktop/tablet/mobile

**Layout Breakpoints:**
- **XL (1500px+)**: 4-column grid
  - Predictions View (2 cols, 3 rows)
  - Ensemble Breakdown (2 cols, 3 rows)
  - Analytics (4 cols, 2 rows)
  
- **LG (1280px)**: 3-column grid
  - Predictions View (2 cols, 3 rows)
  - Ensemble Breakdown (2 cols, 3 rows)
  - Analytics (1 col, 3 rows)
  
- **MD (768px)**: 2-column grid
  - All widgets stacked vertically

#### 2. **PredictionsView Widget** (`src/widgets/PredictionsView.tsx`)
Lists all predictions with filtering capabilities.

**Features:**
- Filter by league
- Filter by status (pending/correct/incorrect)
- Clear filters button
- Loading/error/empty states
- Shows match metadata and prediction results

**Props**: None (uses hooks directly)

**State Management**: Uses `usePredictions` hook with local filter state

#### 3. **PredictionCard Component** (`src/components/PredictionCard.tsx`)
Displays a single prediction with visual indicators.

**Props:**
- `prediction`: Prediction object
- `index`: Display index for animation stagger

**Features:**
- Match prediction type display
- Model version badge
- Confidence gauge visualization
- Status badge with color coding
- Creation and resolution dates

#### 4. **ConfidenceGauge Component** (`src/components/ConfidenceGauge.tsx`)
Visual gauge for displaying confidence level.

**Props:**
- `confidence`: Number between 0 and 1

**Features:**
- SVG-based circular gauge
- Dynamic color based on confidence level:
  - Green (≥75%)
  - Amber (≥50%)
  - Orange (≥25%)
  - Red (<25%)
- Percentage display in center

#### 5. **EnsembleBreakdown Widget** (`src/widgets/EnsembleBreakdown.tsx`)
Visualizes the ensemble model predictions and weights.

**Features:**
- Selectable prediction history
- Conflict detection when models disagree
- Three model breakdowns:
  - Full Time (FT) Model
  - Half Time (HT) Model
  - Pattern (PT) Model
- Weight visualization with progress bars
- Ensemble result summary
- Warning alert for conflicts

**Props**: None (uses hooks directly)

#### 6. **PredictionAnalytics Widget** (`src/widgets/PredictionAnalytics.tsx`)
Shows prediction statistics and accuracy trends.

**Features:**
- Key metrics cards:
  - Total predictions
  - Overall accuracy
  - Pending predictions
  - Average confidence
- Accuracy trendline chart (last 14 days)
- Detailed breakdown:
  - Correct predictions
  - Incorrect predictions
  - Resolution rate

**Props**: None (uses hooks directly)

#### 7. **CreatePredictionButton Component** (`src/components/CreatePredictionButton.tsx`)
Modal/drawer for creating new predictions.

**Features:**
- Match selection dropdown
- Prediction type selection (1X2, BTTS, O/U)
- Ensemble model inputs:
  - Full Time predictions
  - Half Time predictions
  - Pattern predictions
  - Confidence values for each model
- Weight configuration with normalization
- Optimistic UI updates
- Form validation
- Toast notifications for success/error

**Props:**
- `onOpen`: Callback when modal opens
- `onClose`: Callback when modal closes
- `isOpen`: Boolean to control modal visibility

## Data Flow

### Hooks Used

1. **usePredictions** (`src/hooks/usePredictions.ts`)
   - Fetches predictions from Supabase
   - Supports filtering by match_id, status
   - Returns: `{ data, isLoading, isError, error }`

2. **useCreatePrediction** (`src/hooks/usePredictions.ts`)
   - Creates new predictions via mutation
   - Automatically invalidates predictions cache
   - Returns: `{ mutate, isPending }`

3. **usePredictionStats** (`src/hooks/usePredictions.ts`)
   - Fetches prediction statistics via RPC
   - Returns: `{ data, isLoading }`

4. **useMatches** (`src/hooks/useMatches.ts`)
   - Fetches available matches for prediction selection
   - Returns: `{ data, isLoading }`

5. **useLeagues** (`src/hooks/useLeagues.ts`)
   - Fetches leagues for filtering
   - Returns: `{ data, isLoading }`

## State Management

- **Component State**: Filter state in PredictionsView, form state in CreatePredictionButton
- **Global State**: React Query cache for predictions, stats, matches, leagues
- **Modal State**: Controlled by parent Predictions page

## Loading/Error/Empty States

All widgets implement consistent state handling:

### Loading State
```jsx
<div className="flex items-center justify-center min-h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    <p className="text-sm text-gray-500">Loading...</p>
</div>
```

### Error State
```jsx
<div className="flex items-center justify-center min-h-96">
    <div className="text-red-500">⚠️</div>
    <p className="text-sm text-red-500">{error.message}</p>
</div>
```

### Empty State
```jsx
<div className="flex items-center justify-center min-h-96">
    <div className="text-gray-400 text-4xl">📊</div>
    <p className="text-sm text-gray-500">No data found</p>
</div>
```

## Styling

- **Framework**: Tailwind CSS with dark mode support
- **Component Library**: Spring animations from react-spring
- **Charts**: Recharts for trendline visualization
- **Icons**: Emoji for visual indicators

### Color Scheme
- Status badges use semantic colors (green/yellow/red)
- Confidence gauges use graduated color scale
- Charts use Tailwind blue for lines
- Conflicts alert uses yellow/amber theme

## Testing

### Smoke Tests
Located in `src/pages/Predictions.test.tsx`

Tests include:
- Page renders without crashing
- All widgets are included
- Create prediction button is present
- Basic data display

### Manual Testing Checklist

1. **Route Rendering**
   - [ ] Navigate to `/predictions`
   - [ ] Page loads without console errors
   - [ ] PageHeader displays "Predictions"

2. **PredictionsView Widget**
   - [ ] Predictions load from API
   - [ ] Filters work correctly
   - [ ] Clear filters button resets
   - [ ] Empty state displays appropriately
   - [ ] Error handling works

3. **PredictionCard**
   - [ ] Shows all match metadata
   - [ ] Confidence gauge renders
   - [ ] Status badge has correct colors
   - [ ] Date formatting is correct

4. **ConfidenceGauge**
   - [ ] Renders SVG circle correctly
   - [ ] Colors change based on confidence
   - [ ] Percentage displays accurately

5. **EnsembleBreakdown**
   - [ ] Shows three model cards
   - [ ] Weight progress bars display
   - [ ] Conflict detection alerts
   - [ ] Prediction selector works

6. **PredictionAnalytics**
   - [ ] Key metrics display
   - [ ] Chart renders with data
   - [ ] Detailed breakdown shows
   - [ ] Mobile responsive

7. **CreatePredictionButton**
   - [ ] Button opens modal
   - [ ] Match selection works
   - [ ] Form validation works
   - [ ] Submission creates prediction
   - [ ] Modal closes after success
   - [ ] Toast notification displays
   - [ ] Optimistic UI updates cache

## Accessibility

- Semantic HTML used throughout
- ARIA labels on interactive elements
- Keyboard navigation support via form elements
- Color not sole indicator of status (backed by text)
- Sufficient contrast in dark/light modes

## Performance

- Memoized components using React.memo
- Lazy-loaded page via code splitting
- Efficient React Query caching
- Debounced filter updates in PredictionsView
- Chart data computed with useMemo

## Error Handling

- User-friendly error messages
- Fallback states for API failures
- Toast notifications for user actions
- Try-catch in mutation handlers
- Graceful degradation when data missing

## Future Enhancements

1. **Advanced Filtering**
   - Date range picker
   - Confidence range slider
   - Model version filter
   - Prediction type filter

2. **Bulk Actions**
   - Multi-select predictions
   - Batch resolution
   - Export to CSV

3. **Prediction Details**
   - Click to expand full details
   - Match history comparison
   - Model comparison view
   - Historical accuracy by model

4. **Real-time Updates**
   - WebSocket subscriptions
   - Live accuracy updates
   - New prediction notifications

5. **Export & Reporting**
   - PDF reports
   - CSV export
   - Email alerts
   - Scheduled reports

## Deployment Notes

1. Ensure Supabase tables exist:
   - `predictions` table with all required columns
   - RPC function `get_prediction_stats` for analytics

2. Update environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

3. Test with sample data before production

## Code Style

- Follows existing codebase patterns
- TypeScript for type safety
- React functional components with hooks
- Tailwind utility classes
- Path aliases (@components, @hooks, @widgets, @layout, etc.)

## Support & Maintenance

For issues or enhancements:
1. Check console for errors
2. Verify API connectivity
3. Test with React Query DevTools
4. Review Supabase logs
5. Check TypeScript compilation (npx tsc --noEmit)
