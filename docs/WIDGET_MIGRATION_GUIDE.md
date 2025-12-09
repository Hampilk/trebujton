# Widget Migration Guide - From Mock Data to Real API

This guide shows how to migrate widgets from using mock data (from `src/db/*`) to real Supabase data using the new hooks.

## Example: LiveMatches Widget

### Before (Using Mock Data)

```typescript
// widgets/LiveMatches/index.tsx
const data = [
    {
        id: 'live-1',
        cover: cover1,
        team1: {
            id: 'bayern',
            score: 3
        },
        team2: {
            id: 'bvb',
            score: 1
        },
    },
    // ... more hardcoded data
]

const LiveMatches = ({variant = "big"}) => {
    return (
        <Spring className="card h-2 no-shadow p-relative">
            {data.map(item => (
                <MatchScoreItem key={item.id} match={item} />
            ))}
        </Spring>
    )
}
```

### After (Using Real API Data)

```typescript
// widgets/LiveMatches/index.tsx
import { useLiveMatches } from '@hooks/useMatches';
import { useTeam } from '@hooks/useTeams';

const LiveMatches = ({variant = "big"}) => {
    const { data: matches, isLoading, error } = useLiveMatches();
    
    if (isLoading) {
        return (
            <Spring className="card h-2 no-shadow p-relative">
                <MatchSkeleton count={3} />
            </Spring>
        );
    }
    
    if (error) {
        return (
            <Spring className="card h-2 no-shadow p-relative">
                <ErrorMessage message="Failed to load live matches" />
            </Spring>
        );
    }
    
    if (!matches || matches.length === 0) {
        return (
            <Spring className="card h-2 no-shadow p-relative">
                <EmptyState message="No live matches at the moment" />
            </Spring>
        );
    }
    
    return (
        <Spring className="card h-2 no-shadow p-relative">
            <span className={`${styles.live} tag tag--accent tag--overlay animated h6`}>
                Live
            </span>
            <Swiper className="h-100" {...swiperConfig}>
                {matches.map(match => (
                    <SwiperSlide key={match.id}>
                        <MatchScoreItem 
                            match={{
                                id: match.id,
                                team1: {
                                    id: match.home_team_id,
                                    score: match.home_score
                                },
                                team2: {
                                    id: match.away_team_id,
                                    score: match.away_score
                                }
                            }}
                            variant="thumb"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </Spring>
    )
}
```

## Migration Steps

### 1. Identify the Data Source
Find where the widget gets its data:
- Mock data files in `src/db/`
- Hardcoded arrays/objects
- Props passed from parent components

### 2. Choose the Appropriate Hook
Match the data type to the correct hook:

| Data Type | Hook | File |
|-----------|------|------|
| Matches | `useMatches()`, `useLiveMatches()`, `useMatch(id)` | `@hooks/useMatches` |
| Teams | `useTeams()`, `useTeam(id)`, `useTeamStats(id)` | `@hooks/useTeams` |
| Leagues | `useLeagues()`, `useLeague(id)`, `useLeagueStandings(id)` | `@hooks/useLeagues` |
| Predictions | `usePredictions()`, `usePrediction(id)` | `@hooks/usePredictions` |

### 3. Add Loading State
Always handle the loading state:

```typescript
const { data, isLoading, error } = useMatches();

if (isLoading) {
    return <Skeleton />;
}
```

### 4. Add Error Handling
Handle errors gracefully:

```typescript
if (error) {
    return <ErrorState message="Failed to load data" />;
}
```

### 5. Add Empty State
Handle empty results:

```typescript
if (!data || data.length === 0) {
    return <EmptyState message="No data available" />;
}
```

### 6. Transform Data if Needed
Map API data to component props format:

```typescript
const transformedData = data.map(item => ({
    // Transform API format to component format
    id: item.id,
    team1: {
        id: item.home_team_id,
        score: item.home_score
    },
    team2: {
        id: item.away_team_id,
        score: item.away_score
    }
}));
```

## Common Widget Patterns

### Pattern 1: List Widget
Widgets that display a list of items:

```typescript
import { useMatches } from '@hooks/useMatches';

const MatchesListWidget = () => {
    const { data: matches, isLoading, error } = useMatches({ 
        status: 'scheduled' 
    });
    
    return (
        <div>
            {isLoading && <Skeleton count={5} />}
            {error && <ErrorState />}
            {matches?.map(match => <MatchCard key={match.id} match={match} />)}
        </div>
    );
};
```

### Pattern 2: Single Item Widget
Widgets that display a single item by ID:

```typescript
import { useMatch } from '@hooks/useMatches';

const MatchDetailWidget = ({ matchId }) => {
    const { data: match, isLoading, error } = useMatch(matchId);
    
    if (isLoading) return <Skeleton />;
    if (error) return <ErrorState />;
    if (!match) return <NotFound />;
    
    return <MatchDetails match={match} />;
};
```

### Pattern 3: Filtered Data Widget
Widgets with filters or search:

```typescript
import { useMatches } from '@hooks/useMatches';
import { useState } from 'react';

const FilteredMatchesWidget = () => {
    const [status, setStatus] = useState('live');
    const { data: matches, isLoading } = useMatches({ status });
    
    return (
        <div>
            <FilterButtons onChange={setStatus} />
            {isLoading ? <Skeleton /> : <MatchesList matches={matches} />}
        </div>
    );
};
```

### Pattern 4: Related Data Widget
Widgets that need multiple data sources:

```typescript
import { useMatch } from '@hooks/useMatches';
import { useTeam } from '@hooks/useTeams';

const MatchWithTeamsWidget = ({ matchId }) => {
    const { data: match, isLoading: matchLoading } = useMatch(matchId);
    const { data: homeTeam, isLoading: homeLoading } = useTeam(match?.home_team_id);
    const { data: awayTeam, isLoading: awayLoading } = useTeam(match?.away_team_id);
    
    const isLoading = matchLoading || homeLoading || awayLoading;
    
    if (isLoading) return <Skeleton />;
    
    return (
        <div>
            <TeamBadge team={homeTeam} />
            <MatchScore match={match} />
            <TeamBadge team={awayTeam} />
        </div>
    );
};
```

## Component Props Mapping

### Matches
```typescript
// API format
interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'live' | 'finished';
}

// Component format (if different)
interface MatchCardProps {
  team1: { id: string; score: number };
  team2: { id: string; score: number };
  active: boolean; // derived from status === 'live'
}

// Transform
const matchCardProps = {
  team1: { id: match.home_team_id, score: match.home_score },
  team2: { id: match.away_team_id, score: match.away_score },
  active: match.status === 'live'
};
```

## Testing Your Migration

### Checklist
- [ ] Widget loads without errors
- [ ] Loading state displays correctly
- [ ] Error state displays when API fails
- [ ] Empty state displays when no data
- [ ] Data displays correctly when available
- [ ] Widget updates when data changes
- [ ] No console errors or warnings

### Testing with Mock Supabase
If you don't have a Supabase instance yet, you can test with mock data by creating a hook override:

```typescript
// hooks/useMatches.mock.ts
export const useLiveMatches = () => ({
  data: mockMatches,
  isLoading: false,
  error: null
});
```

## Priority Order for Widget Migration

### High Priority (User-Facing)
1. `LiveMatches` - Live match display
2. `MatchesOverview` - Today's matches
3. `LeagueStandings` - League tables
4. `TeamStats` - Team statistics

### Medium Priority
5. `ActiveMatchCard` - Active match cards
6. `MatchLiveEvents` - Live events
7. `TeamCompareChart` - Team comparison
8. `PlayerFullInfo` - Player profiles

### Low Priority (Admin/Advanced)
9. Prediction widgets
10. Analytics widgets
11. Admin widgets

## Next Steps

After migrating a widget:
1. Test thoroughly in development
2. Check for TypeScript errors
3. Verify loading/error states
4. Update component tests
5. Document any API requirements

## Need Help?

If you encounter issues:
1. Check the API hook documentation
2. Verify Supabase table structure
3. Check browser console for errors
4. Review TypeScript types
5. Test with React Query DevTools

---

**Status**: Guide Complete ✅  
**Last Updated**: 2025-12-09
