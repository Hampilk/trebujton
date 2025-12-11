---
title: "Provider Stack Architecture"
description: "Comprehensive guide to the global provider composition hierarchy and integration patterns"
category: "04-architecture"
language: "en"
version: "1.0.0"
last_updated: "2025-12-11"
author: "WinMix Architecture Team"
status: "active"
related_docs:
  - "/docs/04-architecture/ARCHITECTURE_OVERVIEW.md"
  - "/docs/reference-pages/App.tsx"
tags: ["architecture", "providers", "composition", "context-api"]
---

# Provider Stack Architecture

> **Overview:** The WinMix TipsterHub application uses a layered provider composition to manage global state, styling, authentication, and data fetching. This document defines the official provider hierarchy and guidelines for maintaining consistency across the codebase.

---

## Provider Hierarchy

The complete provider stack is composed in `src/main.jsx` in the following order (outermost to innermost):

```
┌─────────────────────────────────────────────────────────┐
│ 1. ErrorBoundary (Global error handler)                 │
├─────────────────────────────────────────────────────────┤
│ 2. Redux Provider (Global state)                         │
├─────────────────────────────────────────────────────────┤
│ 3. BrowserRouter (Routing)                               │
├─────────────────────────────────────────────────────────┤
│ 4. SupabaseProvider (Database & Auth client)            │
├─────────────────────────────────────────────────────────┤
│ 5. ThemeProvider (Theme context + RTL support)          │
├─────────────────────────────────────────────────────────┤
│ 6. StyledComponentsProvider (CSS-in-JS styling)         │
├─────────────────────────────────────────────────────────┤
│ 7. ShopProvider (E-commerce state)                       │
├─────────────────────────────────────────────────────────┤
│ 8. QueryClientProvider (Data fetching + caching)        │
├─────────────────────────────────────────────────────────┤
│ 9. AuthProvider (Authentication & user context)         │
├─────────────────────────────────────────────────────────┤
│ 10. AppWithTheme (Theme-dependent components)           │
│    ├─ CacheProvider (Emotion cache for RTL)            │
│    ├─ MuiThemeProvider (Material-UI theme)             │
│    ├─ SidebarProvider (Layout sidebar state)           │
│    └─ ToastContainer (Toast notifications)            │
├─────────────────────────────────────────────────────────┤
│ 11. App (Layout, GA4, Routes)                           │
└─────────────────────────────────────────────────────────┘
```

---

## Provider Descriptions

### 1. ErrorBoundary
**Location:** `src/main.jsx`  
**Purpose:** Catches unhandled React errors and displays fallback UI  
**Configuration:** Custom component class, logs errors to console  
**Notes:** Graceful reload button provided in fallback UI  

### 2. Redux Provider (React Redux)
**Location:** `src/main.jsx`  
**Purpose:** Global application state management  
**Key State:** Theme overrides, CMS page data, admin settings  
**Configuration:** `src/app/store` configured with Redux Toolkit  

### 3. BrowserRouter (React Router)
**Location:** `src/main.jsx`  
**Purpose:** Client-side routing with future flags enabled  
**Configuration:**
```jsx
future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}}
```
**Notes:** All route definitions live in `src/App.jsx`  

### 4. SupabaseProvider
**Location:** `src/contexts/SupabaseProvider.tsx`  
**Purpose:** Centralizes Supabase client initialization and session management  
**Responsibilities:**
- Initializes Supabase client with environment variables
- Manages auth state subscriptions
- Provides single source of truth for Supabase client
- Handles graceful fallback when credentials missing

**Hook:** `useSupabase()`
```typescript
const { client, session, loading, error } = useSupabase();
```

**Key Notes:**
- Fails gracefully if `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are missing
- Requires localStorage for persistent sessions
- All auth operations flow through this provider

### 5. ThemeProvider
**Location:** `src/contexts/themeContext.jsx`  
**Purpose:** Manages theme state (light/dark) and RTL direction  
**Hook:** `useThemeProvider()`
```javascript
const { theme, direction, toggleTheme, setDirection } = useThemeProvider();
```

**Features:**
- RTL/LTR support
- Theme persistence in localStorage
- Font scaling configuration
- Integrates with `src/styles/theme.ts` for design tokens

### 6. StyledComponentsProvider
**Location:** `src/providers/StyledComponentsProvider.jsx`  
**Purpose:** Configures styled-components for optimal performance  
**Features:**
- Vendor prefix optimization
- CSSOM injection for performance
- Shadow DOM compatibility
- SSR-ready configuration

### 7. ShopProvider
**Location:** `src/contexts/shopContext.jsx`  
**Purpose:** Manages e-commerce state (cart, store view)  
**Hook:** `useShop()`
```javascript
const { cart, addToCart, removeFromCart } = useShop();
```

### 8. QueryClientProvider
**Location:** `src/main.jsx`  
**Purpose:** TanStack Query client for server state management  
**Configuration:**
```javascript
{
  retry: 3,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
}
```

**Notes:** Handles data fetching, caching, and synchronization  

### 9. AuthProvider
**Location:** `src/contexts/AuthContext.tsx`  
**Purpose:** User authentication and profile management  
**Hook:** `useAuth()`
```typescript
const { user, session, profile, role, loading, error, signIn, signUp, signOut, resetPassword } = useAuth();
```

**Dependencies:** Requires `SupabaseProvider` to be upstream  
**Key Functions:**
- `signIn(email, password)` - Sign in with credentials
- `signUp(email, password, fullName?)` - Register new user
- `signOut()` - Sign out current user
- `resetPassword(email)` - Password reset flow

**State:**
- `user` - Supabase auth user
- `session` - Current auth session
- `profile` - User profile from database
- `role` - User's assigned role (admin, analyst, viewer, user)
- `loading` - Auth state initialization
- `error` - Error messages

### 10. AppWithTheme
**Location:** `src/main.jsx`  
**Purpose:** Theme-aware wrapper for theme-dependent providers  
**Contains:**
- **CacheProvider** - Emotion cache with RTL support
- **MuiThemeProvider** - Material-UI theme
- **SidebarProvider** - Sidebar layout state
- **ToastContainer** - Toast notification system

**Notes:** Placed here to access `useThemeProvider()` hook  

### 11. App
**Location:** `src/App.jsx`  
**Purpose:** Application layout, GA4 initialization, and route scaffolding  
**Responsibilities:**
- Initializes Google Analytics 4
- Manages scroll-to-top on navigation
- Renders layout chrome (Sidebar, Navbar, BottomNav)
- Defines all application routes
- Handles auth route detection

**Key Components:**
```jsx
<ScrollToTop />
<Sidebar /> {/* Desktop nav */}
<Navbar /> {/* Mobile top nav */}
<BottomNav /> {/* Mobile bottom nav */}
<ShoppingCart /> {/* Global shopping cart */}
<Routes> {/* All route definitions */}
```

---

## Environment Variables Required

### Supabase Configuration (Required for Auth)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous key

### Analytics (Optional)
- `VITE_PUBLIC_GA` - Google Analytics 4 measurement ID

### Graceful Fallback
If Supabase credentials are missing, the application will:
1. Log warnings to console
2. Render normally with Auth features disabled
3. Allow navigation and non-authenticated features to work

If GA4 key is missing, the application will:
1. Log a warning
2. Continue normally without analytics tracking

---

## Usage Patterns

### Basic Hook Usage

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseProvider';
import { useThemeProvider } from '@/contexts/themeContext';

function MyComponent() {
  const { user, signIn } = useAuth();
  const { client: supabase } = useSupabase();
  const { theme, direction } = useThemeProvider();

  return <div>{user?.email}</div>;
}
```

### Testing with Provider Stack

Tests should mock the `SupabaseProvider` and render their component within the necessary provider stack:

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/contexts/SupabaseProvider', () => ({
  SupabaseProvider: ({ children }) => children,
  useSupabase: () => ({
    client: mockSupabase,
    session: null,
    loading: false,
    error: null,
  }),
}));

function TestWrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

test('my feature', () => {
  render(<MyComponent />, { wrapper: TestWrapper });
  expect(screen.getByText('...')).toBeInTheDocument();
});
```

### Accessing Supabase Client

Direct Supabase client access is **NOT** recommended in most cases. Use domain-specific hooks instead:

```typescript
// ❌ Avoid direct imports
import { supabase } from '@/integrations/supabase/client';

// ✅ Use the hook
const { client: supabase } = useSupabase();

// ✅ Or use service layer wrappers
import { useWinmixQuery } from '@/hooks/useWinmixQuery';
```

---

## Migration from Old Setup

### Old Pattern (❌ Avoid)
```jsx
// Before: App.jsx had all providers
<QueryClientProvider>
  <AuthProvider>
    <CacheProvider>
      <MuiThemeProvider>
        <SidebarProvider>
          {/* content */}
        </SidebarProvider>
      </MuiThemeProvider>
    </CacheProvider>
  </AuthProvider>
</QueryClientProvider>
```

### New Pattern (✅ Use)
```jsx
// After: main.jsx has all providers in correct order
// App.jsx only manages layout and routes
<AppProviders>
  <App />
</AppProviders>
```

---

## Common Issues & Solutions

### Issue: "useAuth must be used inside <AuthProvider>"
**Cause:** Component using `useAuth()` is not wrapped with provider stack  
**Solution:** Ensure component is rendered within the app or wrapped with test providers

### Issue: Supabase client is null
**Cause:** Missing environment variables or SupabaseProvider not initialized  
**Solution:** Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set  

### Issue: Theme changes not applying
**Cause:** Component needs to be inside both `ThemeProvider` and downstream providers  
**Solution:** Use `useThemeProvider()` hook or ensure CSS is loaded from `ThemeStyles`  

### Issue: Toast notifications not showing
**Cause:** `ToastContainer` not visible or wrong position  
**Solution:** `ToastContainer` is in `AppWithTheme` in `main.jsx`, position auto-set based on RTL  

---

## Best Practices

1. **Never duplicate providers** - Only wrap `<App />` once with `<AppProviders>` in `main.jsx`

2. **Use the right hook** - Always use domain-specific hooks rather than accessing global state directly:
   - Auth: `useAuth()` not `useSupabase().client.auth`
   - Shop: `useShop()` not Redux directly
   - Theme: `useThemeProvider()` for theme access

3. **Test with appropriate wrapper** - Tests should mock only `SupabaseProvider` and use minimal wrapper:
   ```jsx
   const wrapper = ({ children }) => (
     <QueryClientProvider client={queryClient}>
       <AuthProvider>{children}</AuthProvider>
     </QueryClientProvider>
   );
   ```

4. **Check environment on startup** - App logs warnings if critical env vars missing; monitor browser console

5. **Keep App.jsx lean** - Focus on layout and routes; business logic belongs in hooks/contexts

---

## Architecture Diagram

```
Application Entry (main.jsx)
    ↓
ErrorBoundary (error handling)
    ↓
Redux (global state)
    ↓
BrowserRouter (routing)
    ↓
SupabaseProvider (client + session)
    ↓
ThemeProvider (theme + RTL)
    ↓
StyledComponentsProvider (styled-components config)
    ↓
ShopProvider (e-commerce state)
    ↓
QueryClientProvider (data fetching)
    ↓
AuthProvider (user auth + profile) ← depends on SupabaseProvider
    ↓
AppWithTheme
    ├─ CacheProvider (RTL emotion cache)
    ├─ MuiThemeProvider (MUI theme)
    ├─ SidebarProvider (layout state)
    └─ ToastContainer (notifications)
    ↓
App Component
    ├─ ThemeStyles (CSS injection)
    ├─ ScrollToTop (route navigation)
    ├─ Layout (Sidebar, Navbar, BottomNav)
    ├─ Routes
    └─ ShoppingCart
```

---

## Troubleshooting Checklist

- [ ] Supabase env vars are set in `.env.local`
- [ ] App starts without "useAuth must be inside provider" errors
- [ ] Theme changes apply across the application
- [ ] Toast notifications appear in correct position (right/left based on RTL)
- [ ] Auth flow (login → profile load → role assignment) completes
- [ ] Routes render with correct layout chrome
- [ ] GA4 events fire (if VITE_PUBLIC_GA is set)

---

## Related Documentation

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System-wide architecture
- [/docs/reference-pages/App.tsx](../../reference-pages/App.tsx) - Component reference
- [AuthContext](../../src/contexts/AuthContext.tsx) - Authentication context implementation
- [SupabaseProvider](../../src/contexts/SupabaseProvider.tsx) - Supabase client context
