# Refactor Proposals

Generated: 2025-12-10

This document provides optimized code snippets and refactoring recommendations synthesized from the code quality audit findings.

---

## Table of Contents

1. [Service Layer Consolidation](#1-service-layer-consolidation)
2. [Context Slicing & State Management](#2-context-slicing--state-management)
3. [Supabase DTO Type Tightening](#3-supabase-dto-type-tightening)
4. [Component Consolidation Patterns](#4-component-consolidation-patterns)
5. [Performance Optimization Patterns](#5-performance-optimization-patterns)

---

## 1. Service Layer Consolidation

### Current State
The service layer has multiple duplicate files:
- `src/services/*.js` files shadowing `src/services/*.ts` equivalents
- `src/integrations/*/service.js` files with identical content

### Proposed Refactor

**Step 1: Delete zero-byte JS shadows (34 files)**
```bash
# Delete all zero-byte JS files that shadow TS files
rm src/hooks/useEvents.js src/hooks/useLeagues.js src/hooks/useMatches.js \
   src/hooks/usePlayers.js src/hooks/useProducts.js src/hooks/useTeams.js \
   src/hooks/useWinmixQuery.js src/lib/supabase.js src/services/eventService.js \
   src/services/leagueService.js src/services/matchService.js \
   src/services/playerService.js src/services/productService.js \
   src/services/teamService.js src/services/userService.js \
   src/services/winmixApi.js src/services/winmixproService.js
```

**Step 2: Create unified service base**
```typescript
// src/services/base/ServiceBase.ts
import { supabase } from '@/lib/supabase';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export type TableNames = keyof Database['public']['Tables'];

export interface ServiceResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export abstract class ServiceBase<T extends TableNames> {
  protected table: T;
  protected client: SupabaseClient<Database>;

  constructor(tableName: T) {
    this.table = tableName;
    this.client = supabase;
  }

  async getAll(): Promise<ServiceResult<Database['public']['Tables'][T]['Row'][]>> {
    const { data, error } = await this.client.from(this.table).select('*');
    return { data, error };
  }

  async getById(id: string): Promise<ServiceResult<Database['public']['Tables'][T]['Row']>> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  }
}
```

**Step 3: Refactor individual services to extend base**
```typescript
// src/services/leagueService.ts
import { ServiceBase } from './base/ServiceBase';
import type { Database } from '@/integrations/supabase/types';

type League = Database['public']['Tables']['leagues']['Row'];

class LeagueService extends ServiceBase<'leagues'> {
  constructor() {
    super('leagues');
  }

  async getByCountry(country: string): Promise<League[]> {
    const { data } = await this.client
      .from(this.table)
      .select('*')
      .eq('country', country);
    return data ?? [];
  }
}

export const leagueService = new LeagueService();
```

---

## 2. Context Slicing & State Management

### Current State
Large monolithic contexts (e.g., `ShopProvider`, `ThemeContext`) cause unnecessary re-renders across unrelated consumers.

### Proposed Refactor

**Before: Monolithic context**
```tsx
// contexts/ShopContext.jsx (current)
const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <ShopContext.Provider value={{
      cart, setCart,
      wishlist, setWishlist,
      filters, setFilters,
      searchQuery, setSearchQuery
    }}>
      {children}
    </ShopContext.Provider>
  );
};
```

**After: Sliced contexts with selective subscription**
```tsx
// contexts/shop/CartContext.tsx
import { createContext, useContext, useMemo, useReducer } from 'react';
import type { Product } from '@/types';

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'CLEAR':
      return { items: [], total: 0 };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const value = useMemo(() => ({ state, dispatch }), [state]);
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// contexts/shop/FiltersContext.tsx - Similar pattern for filters
// contexts/shop/WishlistContext.tsx - Similar pattern for wishlist
```

**Compose sliced providers**
```tsx
// contexts/shop/index.tsx
import { CartProvider } from './CartContext';
import { FiltersProvider } from './FiltersContext';
import { WishlistProvider } from './WishlistContext';

export const ShopProviders = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>
    <WishlistProvider>
      <FiltersProvider>
        {children}
      </FiltersProvider>
    </WishlistProvider>
  </CartProvider>
);
```

---

## 3. Supabase DTO Type Tightening

### Current State
API responses use `any` or loose types, risking runtime errors on schema changes.

### Proposed Refactor

**Step 1: Generate types from Supabase**
```bash
npx supabase gen types typescript --project-id "$PROJECT_ID" > src/integrations/supabase/types.ts
```

**Step 2: Create typed API wrappers**
```typescript
// src/services/api/typedClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// All queries now have full type inference
// supabase.from('matches').select('*') returns Match[]
```

**Step 3: Define strict response DTOs**
```typescript
// src/types/dto/match.dto.ts
import type { Database } from '@/integrations/supabase/types';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];

// Composed DTO for match with relations
export interface MatchWithTeams extends MatchRow {
  home_team: Pick<TeamRow, 'id' | 'name' | 'logo'>;
  away_team: Pick<TeamRow, 'id' | 'name' | 'logo'>;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: { message: string; code: string } | null;
  count?: number;
}
```

**Step 4: Type hooks with strict generics**
```typescript
// src/hooks/useMatches.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/services/api/typedClient';
import type { MatchWithTeams } from '@/types/dto/match.dto';

export function useMatches(): UseQueryResult<MatchWithTeams[], Error> {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo)
        `);
      
      if (error) throw error;
      return data as MatchWithTeams[];
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

---

## 4. Component Consolidation Patterns

### Pattern A: Merge Similar Components via Variant Prop

**Before: Separate files**
```
src/components/ClubInfo.jsx
src/components/ClubFullInfo.jsx
```

**After: Unified component with variant**
```tsx
// src/components/ClubCard/index.tsx
import { memo } from 'react';
import type { Club } from '@/types';
import { ClubActions } from './ClubActions';
import * as S from './styles';

export type ClubCardVariant = 'compact' | 'full';

interface ClubCardProps {
  club: Club;
  variant?: ClubCardVariant;
  showActions?: boolean;
}

export const ClubCard = memo(({ 
  club, 
  variant = 'compact',
  showActions = false 
}: ClubCardProps) => {
  return (
    <S.Container $variant={variant}>
      <S.Logo src={club.logo} alt={club.name} />
      <S.Info>
        <S.Name>{club.name}</S.Name>
        {variant === 'full' && <S.Description>{club.description}</S.Description>}
      </S.Info>
      {showActions && <ClubActions clubId={club.id} />}
    </S.Container>
  );
});

ClubCard.displayName = 'ClubCard';
```

### Pattern B: Extract Shared Hook

**Before: Duplicated data logic**
```jsx
// MatchResultBasic.jsx
const matches = groups_matches.filter(m => m.group === group);

// MatchResultColor.jsx  
const matches = groups_matches.filter(m => m.group.toLowerCase() === group);
```

**After: Shared hook**
```typescript
// src/hooks/useGroupMatches.ts
import { useMemo } from 'react';
import type { Match } from '@/types';

export function useGroupMatches(matches: Match[], group: string) {
  return useMemo(() => {
    if (!group) return matches;
    return matches.filter(m => 
      m.group?.toLowerCase() === group.toLowerCase()
    );
  }, [matches, group]);
}
```

---

## 5. Performance Optimization Patterns

### Pattern A: Replace useWindowSize with useMediaQuery

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage - only re-renders on breakpoint crossing
const isMobile = useMediaQuery('(max-width: 768px)');
```

### Pattern B: Memoize Inline Objects

```tsx
// Before
const Submenu = () => {
  const actions = [{ label: 'Share' }, { label: 'Follow' }]; // New array each render
  return <ActionMenu items={actions} />;
};

// After
const SUBMENU_ACTIONS = [
  { label: 'Share', icon: Share },
  { label: 'Follow', icon: Heart }
] as const;

const Submenu = () => {
  return <ActionMenu items={SUBMENU_ACTIONS} />;
};
```

### Pattern C: Virtualize Long Lists

```tsx
// src/widgets/MatchList/index.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const MatchList = ({ matches }: { matches: Match[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <MatchCard
            key={matches[virtualItem.index].id}
            match={matches[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Implementation Priority

| Phase | Actions | Duration |
|-------|---------|----------|
| **Phase 1** | Delete 34 shadow JS files | 1 hour |
| **Phase 2** | Consolidate `ClubInfo` components | 1 day |
| **Phase 3** | Implement `useMediaQuery` hook | 1 day |
| **Phase 4** | Create service base class | 2 days |
| **Phase 5** | Slice shop context | 2 days |
| **Phase 6** | Generate & integrate Supabase types | 1 day |

---

*See [audit-report.md](./audit-report.md) for the complete audit synthesis.*
