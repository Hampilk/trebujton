# WinMix CMS - Widget Registry & Runtime Rendering

## Overview

This is the foundation of the WinMix CMS system, implementing a dynamic widget registry that auto-discovers and loads widget components with metadata. This system powers the Page Builder, Runtime Renderer, and AI tools.

## Architecture

### Widget Registry (`/registry/widgetRegistry.ts`)

The widget registry automatically discovers all widgets using Vite's glob import feature:

```typescript
import.meta.glob('/src/widgets/**/index.{jsx,tsx}', { eager: true })
```

**Features:**
- Auto-discovery of widgets from `/src/widgets/**/index.{jsx,tsx}`
- Type-safe widget definitions with TypeScript
- Metadata extraction from `Component.meta` property
- Helper functions for querying widgets

**API:**
```typescript
// Get all registered widgets
import { widgetRegistry } from '@cms/registry/widgetRegistry';

// Get widget by ID
import { getWidgetById } from '@cms/registry/widgetRegistry';
const widget = getWidgetById('team_stats');

// Get widgets by category
import { getWidgetsByCategory } from '@cms/registry/widgetRegistry';
const footballWidgets = getWidgetsByCategory('Football');

// Get all categories
import { getCategories } from '@cms/registry/widgetRegistry';
const categories = getCategories();
```

### Widget Renderer (`/runtime/WidgetRenderer.tsx`)

A safe, robust component for rendering widgets with error handling and loading states.

**Features:**
- Error boundary for catching widget errors
- Suspense for handling async loading
- Fallback UI for unknown widgets
- Type-safe props passing
- Style variant support

**Usage:**
```jsx
import WidgetRenderer from '@cms/runtime/WidgetRenderer';

<WidgetRenderer 
  type="team_stats" 
  props={{ teamId: 'bayern', season: '2024' }}
  variant="default"
  instanceId="widget-123"
/>
```

### CMS Page Runtime (`/components/CmsPageRuntime.jsx`)

A wrapper component that enables pages to dynamically load layouts from Supabase while maintaining fallback to static widgets.

**Features:**
- Fetches page layouts from Supabase using React Query
- Graceful fallback to static widgets when CMS unavailable
- Integrates with Redux for state management
- Applies theme overrides via CmsThemeProvider
- Comprehensive error handling and loading states

**Usage:**
```jsx
import CmsPageRuntime from '@components/CmsPageRuntime';

<CmsPageRuntime 
  id="admin_dashboard_page" 
  widgets={staticWidgets}
  cmsSlug="admin-dashboard"
  onCmsDataLoaded={(data) => console.log('CMS loaded:', data)}
  onFallbackMode={(reason) => console.log('Fallback:', reason)}
/>
```

### Theme System (`/theme/ThemeProvider.jsx`)

Provides theme variants and CSS variable injection for CMS pages.

**Features:**
- Multiple theme variants (default, dark, etc.)
- CSS custom properties for dynamic theming
- Page-level and widget-level theme overrides
- Light/dark mode support

**Usage:**
```jsx
import { CmsThemeProvider } from '@cms/theme/ThemeProvider';

<CmsThemeProvider defaultVariant="dark" defaultMode="dark">
  <AppGrid {...props} />
</CmsThemeProvider>
```

## Widget Definition Interface

```typescript
interface WidgetDefinition {
  id: string;                          // Unique widget identifier
  name: string;                        // Display name
  category: string;                    // Category for grouping
  preview?: string;                    // Optional preview image path
  defaultSize: { w: number; h: number }; // Default grid size
  props: Record<string, any>;          // Props schema
  Component: React.FC<any>;            // React component
  styleVariants?: WidgetStyleVariant[]; // Style variants
}

interface WidgetStyleVariant {
  slug: string;                        // Variant identifier
  label: string;                      // Display label
  description?: string;               // Optional description
  supportedTokens?: string[];          // Supported theme tokens
  cssClass?: string;                   // Additional CSS classes
  overrides?: Record<string, any>;     // Style overrides
}
```

## Creating a Widget

1. Create a directory in `/src/widgets/YourWidget/`
2. Create `index.jsx` or `index.tsx` with your component
3. Attach metadata to the component using `.meta` property

### Example Widget

```jsx
import React from 'react';
import styles from './styles.module.scss';
import Spring from '@components/Spring';

const TeamStats = ({ teamId = 'bayern', season = '2024' }) => {
  return (
    <Spring className="card card-padded h-100">
      <div className={styles.header}>
        <h3>Team Statistics</h3>
        <div>{teamId} - {season}</div>
      </div>
      {/* Widget content */}
    </Spring>
  );
};

// Attach metadata to component
TeamStats.meta = {
  id: 'team_stats',
  name: 'Team Stats',
  category: 'Football',
  defaultSize: { w: 2, h: 2 },
  props: {
    teamId: { type: 'string', default: 'bayern' },
    season: { type: 'string', default: '2024' },
  },
  styleVariants: [
    {
      slug: 'default',
      label: 'Default',
      cssClass: 'team-stats-default',
    },
    {
      slug: 'compact',
      label: 'Compact',
      cssClass: 'team-stats-compact',
    },
  ],
};

export default TeamStats;
```

## Runtime Rendering

### Making Pages CMS-Driven

To enable CMS-driven layouts for a page:

1. **Replace AppGrid with CmsPageRuntime:**
   ```jsx
   // Before
   <AppGrid id="my_page" widgets={widgets} />
   
   // After
   <CmsPageRuntime 
     id="my_page" 
     widgets={widgets}
     cmsSlug="my-page"
   />
   ```

2. **Create CMS Page in Supabase:**
   ```sql
   INSERT INTO pages (slug, title, is_published) 
   VALUES ('my-page', 'My Page', true);
   ```

3. **Create Layout Data:**
   ```javascript
   const layoutData = {
     layout: [
       { i: 'widget1', x: 0, y: 0, w: 2, h: 2 },
       { i: 'widget2', x: 2, y: 0, w: 2, h: 2 },
     ],
     instances: {
       widget1: {
         type: 'team_stats',
         props: { teamId: 'bayern' },
         variant: 'default',
       },
       widget2: {
         type: 'league_table',
         props: { league: 'bundesliga' },
         variant: 'compact',
       },
     },
     theme_overrides: {
       variant: 'dark',
       mode: 'dark',
     },
   };
   ```

4. **Save Layout:**
   ```javascript
   import { savePageLayout, getPageBySlug } from '@services/cms/pageLayouts';
   
   const page = await getPageBySlug('my-page');
   await savePageLayout(page.id, layoutData);
   ```

### Fallback Behavior

- **No CMS slug:** Renders static widgets immediately
- **Page not found:** Falls back to static widgets
- **Layout not found:** Falls back to static widgets  
- **Network error:** Shows error state with retry option
- **Loading:** Shows loading spinner while fetching CMS data

## Example Widgets

### TeamStats (`/src/widgets/TeamStats/`)
- **ID:** `team_stats`
- **Category:** Football
- **Props:** `teamId`, `season`
- **Size:** 2x2
- Displays team statistics including matches, wins, draws, losses, goals

### LeagueTable (`/src/widgets/LeagueTable/`)
- **ID:** `league_table`
- **Category:** Football
- **Props:** `league`, `season`
- **Size:** 3x3
- Displays league standings with position indicators

## Testing

Tests are located in:
- `/src/cms/__tests__/` - CMS component tests
- `/src/components/__tests__/CmsPageRuntime.test.jsx` - Runtime component tests
- `/src/test/integration/cms-layout-integration.test.js` - Integration tests
- `/src/test/services/cms/pageLayouts.test.js` - Service layer tests

Run tests:
```bash
npm test -- CmsPageRuntime
npm test -- cms-layout-integration
npm test -- pageLayouts
```

Storybook stories are available for visual testing:
```bash
npm run storybook
# Navigate to "Components/CmsPageRuntime"
```

## Import Paths

The CMS system is available via the `@cms` alias:

```typescript
import { widgetRegistry } from '@cms/registry/widgetRegistry';
import { WidgetRenderer } from '@cms/runtime/WidgetRenderer';
import { CmsThemeProvider } from '@cms/theme/ThemeProvider';
import type { WidgetDefinition } from '@cms/registry/widgetRegistry';
```

## Redux Integration

The CMS system includes a Redux slice for managing page state:

```javascript
import { 
  selectCmsPageLayout,
  selectCmsPageInstances,
  selectCmsPageThemeOverrides,
  loadCmsPageLayout 
} from '@redux/slices/cmsPageSlice';
```

**State Structure:**
```javascript
{
  cmsPage: {
    currentPage: null,        // Current page metadata
    layout: null,             // Layout array from CMS
    instances: {},           // Widget instances
    themeOverrides: {},      // Theme configuration
    isLoading: false,        // Loading state
    isInitialized: false,     // Whether CMS data loaded
    error: null,            // Error information
  }
}
```

## Performance Considerations

- **Caching:** CMS data cached for 5 minutes in React Query
- **Memoization:** Widget components and layout data are memoized
- **Lazy Loading:** Widgets support code splitting
- **Error Boundaries:** Prevent widget errors from crashing pages
- **Graceful Degradation:** Fallback to static widgets when CMS unavailable

## Future Enhancements

- **Visual Page Builder** - Drag-and-drop interface for creating layouts
- **AI-Powered Recommendations** - Suggest widgets based on content
- **Real-time Collaboration** - Multiple users editing layouts simultaneously
- **Version Control** - Track and revert layout changes
- **A/B Testing** - Test different layout variations
- **Widget Marketplace** - Community-contributed widgets
- **Advanced Analytics** - Track widget performance and user engagement