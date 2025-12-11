# CMS Layout Runtime Rendering

This document explains how to use the new CMS layout runtime rendering feature that allows pages to dynamically load their layout and widgets from the Supabase CMS.

## Overview

The CMS layout runtime feature consists of several key components:

1. **CmsPageRuntime** - A wrapper component that handles CMS data fetching and rendering
2. **CMS Redux Slice** - Manages CMS page state in Redux
3. **Enhanced AppGrid** - Can now render both static and CMS-driven layouts
4. **WidgetRenderer** - Renders individual widgets based on CMS configuration
5. **Widget Registry** - Auto-discovers and registers all widgets with metadata
6. **buildWidgetMap** - Helper to construct widget maps from registry entries

## Quick Start

### 1. Basic Usage

To make a page CMS-driven, simply replace `AppGrid` with `CmsPageRuntime` and provide a `cmsSlug`:

```jsx
import CmsPageRuntime from '@components/CmsPageRuntime';

const MyPage = () => {
  const widgets = {
    // Your static fallback widgets
    header: <HeaderWidget />,
    content: <ContentWidget />,
  };

  return (
    <CmsPageRuntime 
      id="my_page_layout"
      widgets={widgets}
      cmsSlug="my-page"
    />
  );
};
```

### 2. With Callbacks

For more control, add callbacks to handle CMS events:

```jsx
<CmsPageRuntime 
  id="my_page_layout"
  widgets={widgets}
  cmsSlug="my-page"
  onCmsDataLoaded={(data) => {
    console.log('CMS loaded:', data);
    // Track analytics, update state, etc.
  }}
  onFallbackMode={(reason) => {
    console.log('Fallback reason:', reason);
    // Track when CMS is unavailable
  }}
/>
```

## API Reference

### CmsPageRuntime Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | ✅ | Layout ID for static fallback (used with layouts.js) |
| `widgets` | `object` | ✅ | Static widgets for fallback mode |
| `cmsSlug` | `string` | ❌ | CMS page slug to fetch layout from |
| `fallbackLayout` | `object` | ❌ | Optional fallback layout when CMS data not found |
| `onCmsDataLoaded` | `function` | ❌ | Callback when CMS data is successfully loaded |
| `onFallbackMode` | ❌ | `function` | Callback when falling back to static mode |

### CMS Data Structure

When CMS data is loaded, it follows this structure:

```javascript
{
  layout: [
    { i: 'widget1', x: 0, y: 0, w: 2, h: 2 },
    { i: 'widget2', x: 2, y: 0, w: 1, h: 1 },
  ],
  instances: {
    widget1: {
      type: 'stats',
      props: { title: 'Statistics' },
      variant: 'default',
    },
    widget2: {
      type: 'chart',
      props: { data: [1, 2, 3] },
      variant: 'compact',
    },
  },
  theme_overrides: {
    variant: 'dark',
    mode: 'dark',
    primaryColor: '#3b82f6',
  },
}
```

## Widget Authoring & Registry

### Creating CMS-Ready Widgets

All widgets must include a `.meta` block attached to the component to be registered in the Widget Registry and usable in CMS layouts.

#### Step 1: Add Component Meta

Add a meta object to your widget component:

```jsx
// src/widgets/MyWidget.jsx
const MyWidget = (props) => {
  return <div>My Widget</div>;
};

MyWidget.meta = {
  id: 'my_widget',
  name: 'My Widget',
  category: 'Custom',
  defaultSize: { w: 2, h: 2 },
  props: {
    title: {
      type: 'string',
      default: 'Default Title',
      description: 'Widget title',
      required: false,
    },
    count: {
      type: 'number',
      default: 0,
      description: 'Display count',
    },
  },
  preview: 'A custom widget for displaying data',
};

export default MyWidget;
```

#### Step 2: Meta Properties Reference

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique widget identifier (snake_case) |
| `name` | `string` | ✅ | Human-readable widget name |
| `category` | `string` | ✅ | Widget category (e.g., "Football", "Shop", "User") |
| `defaultSize` | `object` | ✅ | Default dimensions: `{ w: number, h: number }` |
| `props` | `object` | ✅ | Prop definitions for builder UIs |
| `preview` | `string` | ❌ | Short description for CMS builder |
| `styleVariants` | `array` | ❌ | Supported style variants |

#### Step 3: Widget Discovery

Widgets are automatically discovered from:
- Directory-based widgets: `/src/widgets/WidgetName/index.jsx`
- Flat widget files: `/src/widgets/WidgetName.jsx`

The Widget Registry (`src/cms/registry/widgetRegistry.ts`) automatically globs all widgets and registers those with valid `.meta` blocks.

#### Step 4: Using buildWidgetMap

When building CMS layouts programmatically, use `buildWidgetMap` to construct widget objects:

```jsx
import { buildWidgetMap } from '@cms/runtime/buildWidgetMap';

// From layout definition and instances
const widgets = buildWidgetMap(layout, instances);

// From static layout ID
import { buildWidgetMapFromLayoutId } from '@cms/runtime/buildWidgetMap';
const widgets = await buildWidgetMapFromLayoutId('club_summary', instances);
```

### Widget Registry Queries

Access the widget registry to find available widgets:

```jsx
import {
  widgetRegistry,
  getWidgetById,
  getWidgetsByCategory,
  getCategories,
  getWidgetPropSchema,
} from '@cms/registry/widgetRegistry';

// Find a specific widget
const teamStats = getWidgetById('team_stats');

// Find all widgets in a category
const footballWidgets = getWidgetsByCategory('Football');

// Get all available categories
const categories = getCategories();

// Get prop schema for builder UIs
const schema = getWidgetPropSchema('team_stats');
```

## Migration Guide

### From Static AppGrid

**Before:**
```jsx
<AppGrid id="admin_dashboard_page" widgets={widgets} />
```

**After:**
```jsx
<CmsPageRuntime 
  id="admin_dashboard_page" 
  widgets={widgets}
  cmsSlug="admin-dashboard"
/>
```

### Step-by-Step Migration

1. **Import the new component:**
   ```jsx
   import CmsPageRuntime from '@components/CmsPageRuntime';
   ```

2. **Replace AppGrid with CmsPageRuntime:**
   ```jsx
   // Remove this:
   // import AppGrid from '@layout/AppGrid';
   
   // Add this:
   import CmsPageRuntime from '@components/CmsPageRuntime';
   ```

3. **Add CMS slug:**
   ```jsx
   <CmsPageRuntime 
     id="your_layout_id"
     widgets={widgets}
     cmsSlug="your-page-slug"  // Add this line
   />
   ```

4. **Optional: Add callbacks for monitoring:**
   ```jsx
   <CmsPageRuntime 
     id="your_layout_id"
     widgets={widgets}
     cmsSlug="your-page-slug"
     onCmsDataLoaded={(data) => {
       // Analytics: track successful CMS loads
       analytics.track('cms_layout_loaded', { 
         slug: 'your-page-slug',
         widgetCount: Object.keys(data.instances).length 
       });
     }}
     onFallbackMode={(reason) => {
       // Analytics: track fallback usage
       analytics.track('cms_fallback', { 
         slug: 'your-page-slug',
         reason 
       });
     }}
   />
   ```

## CMS Setup

### 1. Create a Page in Supabase

First, create a page entry in the `pages` table:

```sql
INSERT INTO pages (slug, title, is_published) 
VALUES ('admin-dashboard', 'Admin Dashboard', true);
```

### 2. Create a Layout

Then create a layout for that page:

```javascript
const layoutData = {
  layout: [
    { i: 'stats', x: 0, y: 0, w: 2, h: 2 },
    { i: 'chart', x: 2, y: 0, w: 2, h: 2 },
  ],
  instances: {
    stats: {
      type: 'StatisticsWidget',
      props: { showTrends: true },
      variant: 'default',
    },
    chart: {
      type: 'ChartWidget',
      props: { chartType: 'line' },
      variant: 'compact',
    },
  },
  theme_overrides: {
    variant: 'default',
    mode: 'light',
  },
};
```

### 3. Save to Supabase

Use the page layout service to save:

```javascript
import { savePageLayout, getPageBySlug } from '@services/cms/pageLayouts';

async function saveAdminLayout() {
  const page = await getPageBySlug('admin-dashboard');
  if (page) {
    await savePageLayout(page.id, layoutData);
  }
}
```

## Widget Development

### Registering Widgets for CMS

Widgets need to be registered in the CMS registry to be usable:

```jsx
// src/widgets/StatisticsWidget/index.jsx
import React from 'react';

const StatisticsWidget = ({ showTrends }) => {
  return (
    <div className="stats-widget">
      {/* Widget implementation */}
    </div>
  );
};

// Attach metadata for CMS
StatisticsWidget.meta = {
  id: 'StatisticsWidget',
  name: 'Statistics Widget',
  category: 'Analytics',
  defaultSize: { w: 2, h: 2 },
  props: {
    showTrends: { type: 'boolean', default: false },
  },
  styleVariants: [
    {
      slug: 'default',
      label: 'Default',
      cssClass: 'stats-widget-default',
    },
    {
      slug: 'compact',
      label: 'Compact',
      cssClass: 'stats-widget-compact',
    },
  ],
};

export default StatisticsWidget;
```

## Theme Integration

### Theme Overrides

CMS layouts can include theme overrides that are applied via the `CmsThemeProvider`:

```javascript
const themeOverrides = {
  variant: 'dark',        // Theme variant
  mode: 'dark',          // Light/dark mode
  primaryColor: '#3b82f6',
  backgroundColor: '#1e293b',
  textColor: '#f8fafc',
};
```

### Custom Theme Variants

Create new theme variants in `src/cms/theme/tokens.js`:

```javascript
export const themeVariants = {
  // Existing variants...
  admin: {
    name: 'Admin Theme',
    colors: {
      primary: '#3b82f6',
      background: '#f8fafc',
      // ... more tokens
    },
  },
};
```

## Testing

### Unit Tests

The component includes comprehensive tests. Run them with:

```bash
npm test -- CmsPageRuntime
```

### Storybook Stories

View interactive examples in Storybook:

```bash
npm run storybook
# Navigate to "Components/CmsPageRuntime"
```

### Manual Testing

1. **Static Mode:** Visit a page with `CmsPageRuntime` but no CMS slug
2. **CMS Mode:** Create a CMS page and visit with the corresponding slug
3. **Fallback Mode:** Use a non-existent slug to verify fallback
4. **Error Mode:** Mock network errors to test error handling

## Performance Considerations

### Caching

- CMS data is cached for 5 minutes in React Query
- Redux state prevents unnecessary re-fetches
- Layout data is memoized in components

### Optimization Tips

1. **Keep widgets lightweight** - They should render quickly
2. **Use React.memo** for complex widget components
3. **Optimize props** - Pass minimal required data to widgets
4. **Lazy load heavy widgets** - Use dynamic imports for large components

## Troubleshooting

### Common Issues

**Q: My widgets aren't showing up in CMS mode**
A: Check that:
- Widgets are properly registered in the widget registry
- Widget types in CMS match registry IDs exactly
- Widget components have the required `meta` property

**Q: Theme overrides aren't applying**
A: Verify:
- Theme overrides are in the correct format
- Theme variant exists in `themeVariants`
- `CmsThemeProvider` is wrapping the content

**Q: Fallback mode always activates**
A: Check:
- CMS slug is correct
- Page exists in Supabase
- Layout data is properly formatted
- Network connectivity to Supabase

### Debug Mode

Enable debug logging:

```javascript
// In development, check Redux state
console.log('CMS State:', store.getState().cmsPage);

// Check React Query cache
console.log('Query Cache:', queryClient.getQueryCache().getAll());
```

## Best Practices

1. **Always provide fallback widgets** - Ensure pages work without CMS
2. **Use descriptive slugs** - Make CMS pages easy to identify
3. **Version your layouts** - Keep track of layout changes
4. **Test fallback scenarios** - Verify graceful degradation
5. **Monitor CMS performance** - Track load times and error rates
6. **Document widget props** - Help content creators use widgets effectively

## Future Enhancements

Planned improvements include:

- **Live preview** - Real-time preview of CMS changes
- **A/B testing** - Test different layout variations
- **Personalization** - User-specific layout variations
- **Analytics integration** - Track widget performance
- **Advanced caching** - More sophisticated caching strategies
- **Component library** - Expanded set of CMS-ready widgets