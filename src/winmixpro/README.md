# WinMixPro UI Kit

A premium admin UI component library built with React, TypeScript, and Tailwind CSS, featuring glassmorphism effects and a dark theme optimized for WinMixPro applications.

## Quick Start

```bash
# Import components from the winmixpro package
import { AdminLayout, SectionTitle, LayoutGrid, GridCell, StatCard } from '@/winmixpro';
import { BarChart3 } from 'lucide-react';

export function MyPage() {
  return (
    <AdminLayout userEmail="user@example.com">
      <div className="space-y-8">
        <SectionTitle
          title="My Dashboard"
          subtitle="Overview of key metrics"
          icon={<BarChart3 />}
        />
        
        <LayoutGrid variant="3-6-3" className="gap-6">
          <StatCard
            title="Total Users"
            value="1,234"
            change={{ value: 12, direction: 'up' }}
          />
        </LayoutGrid>
      </div>
    </AdminLayout>
  );
}
```

## Navigation

The Sidebar includes 15 admin destinations with Hungarian labels:

1. **Dashboard** (Szétlátás) - `/admin`
2. **Users** (Felhasználók) - `/admin/users`
3. **Jobs** (Feladatok) - `/admin/jobs`
4. **Health** (Egészség) - `/admin/health`
5. **Monitoring** (Megfigyelés) - `/admin/monitoring`
6. **Analytics** (Elemzés) - `/admin/analytics`
7. **Models** (Modellek) - `/admin/model-status`
8. **Statistics** (Statisztika) - `/admin/stats`
9. **Integrations** (Integrációk) - `/admin/integrations`
10. **Phase 9** (Szakasz 9) - `/admin/phase9`
11. **Matches** (Mérkőzések) - `/admin/matches`
12. **Predictions** (Előrejelzések) - `/admin/predictions`
13. **Feedback** ( Visszajelzés) - `/admin/feedback`
14. **Environment** (Környezet) - `/admin/environment`
15. **Settings** (Beállítások) - `/settings`

## Components

### Layout Components

#### AdminLayout
Main shell component with header, sidebar, mobile drawer, and glassmorphism styling.

**Props:**
- `userEmail` (required): User email for the header
- `userName` (optional): Display name for the user
- `userAvatar` (optional): Avatar URL
- `navigation` (optional): Custom navigation items
- `collapsed` (optional): Sidebar collapsed state

#### Header
Sticky header component with logo and user menu slots.

**Props:**
- `logo`: ReactNode for the logo area
- `userMenu`: ReactNode for the user menu/actions
- `sticky`: Boolean to make header sticky

#### Sidebar
Navigation sidebar with Hungarian labels and active state tracking.

**Props:**
- `collapsed`: Boolean for collapsed sidebar
- `items`: Navigation items array
- `activePath`: Current active path for highlighting

#### LayoutGrid
Responsive grid wrapper with variants for different layouts.

**Props:**
- `variant`: '3-6-3' | 'full' | 'sidebar'
- `gap`: '4' | '6' spacing
- `children`: Grid contents

#### GridCell
Responsive grid cells that work with LayoutGrid.

**Props:**
- `span`: 'full' | 'half' | 'left' | 'center' | 'right'
- `children`: Cell contents

### UI Components

#### GlassCard
Premium glass-morphism card component.

**Props:**
- `interactive`: Boolean for hover effects
- `glow`: 'emerald' | 'violet' | 'orange' | 'none'
- `border`: Boolean to show border
- `children`: Card content

#### MetricPill
Stat badge component for displaying metrics.

**Props:**
- `label`: Label text
- `value`: Value to display
- `icon`: Optional icon element
- `variant`: Color variant
- `size`: Size variant 'sm' | 'md' | 'lg' | 'xl'

#### SectionTitle
Gradient section headers with optional icon.

**Props:**
- `title`: Main title text
- `subtitle`: Optional subtitle
- `icon`: Optional icon element
- `align`: 'left' | 'center' | 'right'

#### StatCard
Stat display card with trend indicator.

**Props:**
- `title`: Card title
- `value`: Value to display
- `icon`: Optional icon element
- `change`: Object with value and direction

## Grid Layouts

### 3-6-3 Layout
Perfect for displaying a sidebar, main content, and right panel:

```tsx
<LayoutGrid variant="3-6-3" className="gap-6">
  <GridCell span="left">
    {/* Sidebar - 3 columns on desktop */}
  </GridCell>
  
  <GridCell span="center">
    {/* Main content - 6 columns on desktop */}
  </GridCell>
  
  <GridCell span="right">
    {/* Right panel - 3 columns on desktop */}
  </GridCell>
</LayoutGrid>
```

### Full 12-Column Grid
For flexible layouts with custom column spans:

```tsx
<LayoutGrid variant="full" className="gap-6">
  <GridCell span="half">
    {/* 50% width on desktop */}
  </GridCell>
  
  <GridCell span="full">
    {/* Full width */}
  </GridCell>
</LayoutGrid>
```

## CSS Utilities

### Glass Effect
```tsx
<div className="glass-panel p-6">
  {/* Glass panel with blur and border */}
</div>

<div className="glass-panel-hover p-6">
  {/* Glass panel with hover effects */}
</div>
```

### Gradient Text
```tsx
<h1 className="text-gradient-emerald">Emerald Gradient Text</h1>
<h1 className="text-gradient-violet">Violet Gradient Text</h1>
```

### Glow Effects
```tsx
<div className="glow-emerald">Emerald glow</div>
<div className="glow-violet">Violet glow</div>
```

### Transitions
```tsx
<div className="transition-fast hover:bg-white/10">Fast (150ms)</div>
<div className="transition-base hover:bg-white/10">Base (200ms)</div>
<div className="transition-slow hover:bg-white/10">Slow (300ms)</div>
```

## Theming

### Colors

- **Background**: #050505 (winmix-dark)
- **Primary**: #22c55e (emerald)
- **Secondary**: #a855f7 (violet)
- **Text**: Zinc palette for text hierarchy
- **Glass**: Semi-transparent overlays
- **Borders**: 10% white opacity for glass effect

### Responsive Behavior

**Mobile (< 768px)**
- 1-column layout
- Mobile menu drawer (hamburger icon)
- Sidebar hidden
- Full-width content

**Tablet (768px - 1024px)**
- 12-column grid
- Sidebar visible (280px width)
- Content area responsive

**Desktop (≥ 1024px)**
- 12-column grid with 3-6-3 support
- Sidebar visible (320px width)
- Optimized spacing and typography

## Performance

- Components are fully tree-shakeable
- CSS utilities only included in final build
- GPU-accelerated blur and animations
- Smooth 200ms transitions by default
- Optimized for 60fps on mobile and desktop

## Accessibility

- Full WCAG AA color contrast compliance
- Proper semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Mobile menu closes with Escape key
- Screen reader optimized

## Development

Running tests:
```bash
npm run test src/tests/WinMixPro.test.tsx
```

Building for production:
```bash
npm run build
```

## License

WinMixPro UI Kit - Copyright (c) 2025 WinMix Technologies
