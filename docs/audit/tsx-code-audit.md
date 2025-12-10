# TSX/Code Quality Audit Report

## 1. Executive Summary

### Overview
This audit synthesizes findings from duplicate code analysis, JSX performance profiling, and type-safety assessments of the codebase. The project is currently in a transitional state between JavaScript/React and TypeScript, utilizing a mix of `.jsx` and `.tsx` files. While the core architecture using React 18, Vite, and Supabase is sound, there are significant opportunities to improve maintainability, performance, and type safety.

### Severity Ranking
| Category | Severity | Score (1-10) | Description |
|----------|----------|--------------|-------------|
| **Maintainability** | High | 8/10 | Code duplication in widgets and mixed JS/TS patterns increase cognitive load. |
| **Performance** | Medium | 5/10 | Frequent re-renders due to inline objects and `useWindowSize` hook usage. |
| **Type Safety** | Medium | 6/10 | Partial TypeScript adoption; `any` usage is low, but `PropTypes` are still prevalent in new TS files. |

**Overall Health Score:** 6.5/10 (Good foundation, requires standardization)

---

## 2. Categorized Findings

### A. Maintainability & Duplicates
**Impact:** High | **Effort:** Medium

1.  **Component Variants**: Multiple components serve slightly different visual variations of the same data (e.g., `MatchResultBasicItem` vs `MatchResultColorItem`, `ClubInfo` vs `ClubFullInfo`). This leads to logic duplication and inconsistent updates.
2.  **Widget Logic**: Widgets like `MatchResultBasic` and `MatchResultColor` contain similar data mapping logic that could be abstracted into a custom hook.
3.  **Mixed Patterns**: The codebase uses both `PropTypes` (runtime) and TypeScript interfaces (compile-time), sometimes in the same context. This is redundant and confusing.

### B. Performance (JSX/React)
**Impact:** Medium | **Effort:** Low

1.  **Unstable Props**: Frequent creation of inline objects/arrays (e.g., `const submenuActions = [...]` inside render) causes unnecessary re-renders of child components.
2.  **Global Resize Listeners**: Widespread usage of `useWindowSize` causes components to re-render on every pixel change of the window, even if the layout breakpoint hasn't changed.
3.  **List Rendering**: Some lists use array indices as keys (e.g., `MatchResultBasic.jsx`), which hurts reconciliation performance and state preservation if the list order changes.

### C. Type Safety
**Impact:** Medium | **Effort:** High

1.  **Loose Typing**: While `any` usage is low (8 explicit occurrences), many `.jsx` files lack any type safety beyond `PropTypes`.
2.  **API Integration**: API responses often lack strict generic typing, leading to potential runtime errors if the data shape changes.
3.  **Event Handling**: DOM events are frequently typed as `any` or implicitly inferred, missing strict typing opportunities.

---

## 3. Prioritized Action Items Backlog

| Priority | Item | Type | Estimate |
|----------|------|------|----------|
| **P0** | Standardize on TypeScript Interfaces; remove `PropTypes` from converted files. | Refactor | 3 Days |
| **P1** | Consolidate `ClubInfo` and `ClubFullInfo` into a single configurable component. | Refactor | 1 Day |
| **P1** | Replace `useWindowSize` with `useMediaQuery` or CSS container queries where possible. | Perf | 2 Days |
| **P2** | Extract inline object definitions (e.g., `submenuActions`) to `useMemo` or constants. | Perf | 1 Day |
| **P2** | Create `useMatchData` hook to abstract data fetching/transformation for match widgets. | Refactor | 2 Days |
| **P3** | Convert `MatchResult` family of components to a unified `<MatchCard variant="..." />`. | Refactor | 2 Days |
| **P3** | Strict type Supabase API calls using generated database types. | Type Safe | 3 Days |

---

## 4. Consolidation & Removal Candidates

The following files are recommended for consolidation or removal to reduce technical debt.

1.  **Merge**: `src/components/ClubInfo.jsx` + `src/components/ClubFullInfo.jsx` -> `src/components/ClubCard/ClubInfo.tsx`
    *   **Reason**: High overlap in presentation logic. `ClubFullInfo` is just `ClubInfo` with actions.
2.  **Merge**: `src/components/MatchResultBasicItem.jsx` + `src/components/MatchResultColorItem.jsx` -> `src/components/MatchCard/MatchItem.tsx`
    *   **Reason**: Core logic (displaying teams, scores, time) is identical. Visual differences can be handled via CSS or styled-component variants.
3.  **Refactor**: `src/widgets/MatchResultBasic.jsx` & `src/widgets/MatchResultColor.jsx`
    *   **Reason**: Both widgets map over match data. Logic should be moved to a shared component or hook, leaving the widget to just provide the data source and configuration.

---

## 5. Best-Practice Optimization Snippets

The following snippets demonstrate recommended patterns for React 18 + Vite + TypeScript, addressing the findings above.

### Snippet 1: Strict Typing for Props (vs PropTypes)
**Before:**
```jsx
// ClubCard.jsx
ClubCard.propTypes = {
    club: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
}
```
**After:**
```tsx
import { Club } from '@types/db';

interface ClubCardProps {
    club: Club;
    index: number;
}

const ClubCard = ({ club, index }: ClubCardProps) => { ... }
```

### Snippet 2: Stable Constants (Performance)
**Before:**
```jsx
const ClubFullInfo = () => {
    const submenuActions = [
        { label: 'Share', icon: 'share' },
        { label: 'Follow', icon: 'follow' }
    ];
    return <Submenu actions={submenuActions} ... />
}
```
**After:**
```tsx
// Moved outside component if constant, or useMemo if dynamic
const SUBMENU_ACTIONS = [
    { label: 'Share', icon: 'share' },
    { label: 'Follow', icon: 'follow' }
] as const;

const ClubFullInfo = () => {
    return <Submenu actions={SUBMENU_ACTIONS} ... />
}
```

### Snippet 3: Optimized Resize Handler (Performance)
**Before:**
```jsx
import { useWindowSize } from 'react-use';
const ClubCard = () => {
    const { width } = useWindowSize(); // Re-renders on every pixel change
    const isCompact = width < 1024;
    ...
}
```
**After:**
```tsx
import { useMediaQuery } from '@hooks/useMediaQuery';

const ClubCard = () => {
    // Only re-renders when breakpoint is crossed
    const isCompact = useMediaQuery('(max-width: 1024px)');
    ...
}
```

### Snippet 4: Memoizing Expensive Calculations
**Before:**
```jsx
const MatchResultColor = ({ group }) => {
    // Runs on every render
    const groupMatches = groups_matches.filter(match => match.group.toLowerCase() === group);
    ...
}
```
**After:**
```tsx
import { useMemo } from 'react';

const MatchResultColor = ({ group }: Props) => {
    const groupMatches = useMemo(() => {
        return groups_matches.filter(match => match.group.toLowerCase() === group);
    }, [group, groups_matches]);
    ...
}
```

### Snippet 5: Proper List Keys
**Before:**
```jsx
data.map((item, index) => (
    <MatchResultBasicItem key={index} data={item} />
))
```
**After:**
```tsx
data.map((item) => (
    <MatchResultBasicItem key={item.id} data={item} />
))
```

### Snippet 6: Typed Event Handlers
**Before:**
```jsx
const handleChange = (event) => {
    setValue(event.target.value);
}
```
**After:**
```tsx
import { ChangeEvent } from 'react';

const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
}
```

### Snippet 7: Custom Hook for Data Logic
**Before:**
```jsx
// Inside Widget
const [data, setData] = useState([]);
useEffect(() => {
    fetch('/api/matches').then(...)
}, []);
```
**After:**
```tsx
// hooks/useMatches.ts
export const useMatches = () => {
    return useQuery(['matches'], async () => {
        const { data } = await supabase.from('matches').select('*');
        return data;
    });
}

// Inside Widget
const { data: matches } = useMatches();
```

### Snippet 8: Component Consolidation (Variant Prop)
**Before:**
```jsx
// MatchResultBasicItem.jsx & MatchResultColorItem.jsx (Separate files)
```
**After:**
```tsx
interface MatchItemProps {
    variant: 'basic' | 'color';
    match: Match;
}

const MatchItem = ({ variant, match }: MatchItemProps) => {
    return (
        <StyledItem $variant={variant}>
            {variant === 'color' && <ColorBar />}
            <MatchInfo data={match} />
        </StyledItem>
    );
}
```

### Snippet 9: Lazy Loading Widgets
**Before:**
```jsx
import MatchesOverview from '@widgets/MatchesOverview';
```
**After:**
```tsx
import { lazy, Suspense } from 'react';
const MatchesOverview = lazy(() => import('@widgets/MatchesOverview'));

// Usage
<Suspense fallback={<Loading />}>
    <MatchesOverview />
</Suspense>
```

### Snippet 10: Supabase Type Integration
**Before:**
```javascript
const { data, error } = await supabase.from('users').select('*');
// data is any
```
**After:**
```tsx
import { Database } from '@/lib/database.types';
const supabase = createClient<Database>(...);

// data is User[]
const { data, error } = await supabase.from('users').select('*');
```

### Snippet 11: Avoiding Inline Functions in Render
**Before:**
```jsx
<button onClick={() => handleClick(id)} />
```
**After:**
```tsx
const onButtonClick = useCallback(() => handleClick(id), [id, handleClick]);
<button onClick={onButtonClick} />
```

### Snippet 12: Styled Components Optimization
**Before:**
```jsx
const Component = ({ color }) => {
    // Styled component defined inside render (Bad practice)
    const StyledDiv = styled.div`color: ${color}`;
    return <StyledDiv>...</StyledDiv>
}
```
**After:**
```tsx
// Defined outside
const StyledDiv = styled.div<{ $color: string }>`
    color: ${props => props.$color};
`;

const Component = ({ color }: Props) => {
    return <StyledDiv $color={color}>...</StyledDiv>
}
```

### Snippet 13: Error Boundary for Widgets
**Before:**
```jsx
<MatchesOverview />
```
**After:**
```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<div>Error loading widget</div>}>
    <MatchesOverview />
</ErrorBoundary>
```

### Snippet 14: Enums for State
**Before:**
```jsx
const [status, setStatus] = useState('loading'); // stringly typed
```
**After:**
```tsx
enum LoadingStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error'
}
const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.LOADING);
```

### Snippet 15: Utility Types for Props
**Before:**
```tsx
interface Props {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
```
**After:**
```tsx
// Reuse React's types
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    // inherits className, style, children, onClick, etc.
}
```
