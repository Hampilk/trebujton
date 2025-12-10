# Duplicate Audit Report

Generated on: 2025-12-10T04:44:20.835Z

## Zero-byte JS Shadows

Found 34 zero-byte JS files that shadow TS files. These should be deleted as they may interfere with module resolution or are leftovers from migration.

| JS File (Delete) | TS File (Keep) |
|---|---|
| `src/hooks/useEvents.js` | `src/hooks/useEvents.ts` |
| `src/hooks/useLeagues.js` | `src/hooks/useLeagues.ts` |
| `src/hooks/useMatches.js` | `src/hooks/useMatches.ts` |
| `src/hooks/usePlayers.js` | `src/hooks/usePlayers.ts` |
| `src/hooks/useProducts.js` | `src/hooks/useProducts.ts` |
| `src/hooks/useTeams.js` | `src/hooks/useTeams.ts` |
| `src/hooks/useWinmixQuery.js` | `src/hooks/useWinmixQuery.ts` |
| `src/lib/supabase.js` | `src/lib/supabase.ts` |
| `src/services/eventService.js` | `src/services/eventService.ts` |
| `src/services/leagueService.js` | `src/services/leagueService.ts` |
| `src/services/matchService.js` | `src/services/matchService.ts` |
| `src/services/playerService.js` | `src/services/playerService.ts` |
| `src/services/productService.js` | `src/services/productService.ts` |
| `src/services/teamService.js` | `src/services/teamService.ts` |
| `src/services/userService.js` | `src/services/userService.ts` |
| `src/services/winmixApi.js` | `src/services/winmixApi.ts` |
| `src/services/winmixproService.js` | `src/services/winmixproService.ts` |
| `src/test/setup.js` | `src/test/setup.ts` |
| `src/integrations/supabase/types.js` | `src/integrations/supabase/types.ts` |
| `src/test/e2e/auth-flow.spec.js` | `src/test/e2e/auth-flow.spec.ts` |
| `src/test/msw/handlers.js` | `src/test/msw/handlers.ts` |
| `src/test/msw/server.js` | `src/test/msw/server.ts` |
| `src/test/services/winmixApi.test.js` | `src/test/services/winmixApi.test.ts` |
| `src/winmixpro/hooks/useFeatureFlags.js` | `src/winmixpro/hooks/useFeatureFlags.ts` |
| `src/winmixpro/hooks/useLocalStorage.js` | `src/winmixpro/hooks/useLocalStorage.ts` |
| `src/winmixpro/hooks/usePersistentState.js` | `src/winmixpro/hooks/usePersistentState.ts` |
| `src/winmixpro/hooks/useShimmer.js` | `src/winmixpro/hooks/useShimmer.ts` |
| `src/winmixpro/hooks/useTheme.js` | `src/winmixpro/hooks/useTheme.ts` |
| `src/winmixpro/data/dashboard.js` | `src/winmixpro/data/dashboard.ts` |
| `src/winmixpro/lib/feature-flags.js` | `src/winmixpro/lib/feature-flags.ts` |
| `src/winmixpro/lib/reset-state.js` | `src/winmixpro/lib/reset-state.ts` |
| `src/winmixpro/lib/theme-manager.js` | `src/winmixpro/lib/theme-manager.ts` |
| `src/winmixpro/lib/utils.js` | `src/winmixpro/lib/utils.ts` |
| `src/winmixpro/types/index.js` | `src/winmixpro/types/index.ts` |

**Remediation**: Delete the .js files listed above.

## Duplicate Type Definitions

Found 1 instances where `types.js` coexists with `types.ts`.

| JS File | TS File |
|---|---|
| `src/types.js` | `src/types.ts` |

**Remediation**: Merge any unique types from `types.js` into `types.ts` and delete `types.js`.

## Identical Modules

Found 3 sets of identical or near-identical files (after normalization).

### Group 1 (Other)
Files:
- `src/integrations/health-check.js`
- `src/integrations/admin-model-status/service.js`
- `src/integrations/admin-prediction-review/service.js`
- `src/integrations/models/service.js`
- `src/test/admin/feature-import-export.test.jsx`
- `src/test/admin/theme-import-export.test.jsx`
- `src/test/components/AuthProvider.test.jsx`
- `src/test/widgets/LeagueStandings.test.jsx`
- `src/winmixpro/data/components.js`
- `src/winmixpro/data/feedback.js`
- `src/winmixpro/data/health.js`
- `src/winmixpro/data/integrations.js`
- `src/winmixpro/data/jobs.js`
- `src/winmixpro/data/models.js`
- `src/winmixpro/data/phase9.js`
- `src/winmixpro/data/stats.js`
- `src/winmixpro/data/themes.js`
- `src/winmixpro/data/users.js`
- `src/winmixpro/providers/FeatureFlagsProvider.jsx`
- `src/winmixpro/providers/ThemeProvider.jsx`

**Remediation**: Consolidate these files. Delete duplicate or move to shared directory.

### Group 2 (Other)
Files:
- `src/winmixpro/hooks/index.js`
- `src/winmixpro/hooks/index.ts`

**Remediation**: Consolidate these files. Delete duplicate or move to shared directory.

### Group 3 (Other)
Files:
- `src/winmixpro/lib/index.js`
- `src/winmixpro/lib/index.ts`

**Remediation**: Consolidate these files. Delete duplicate or move to shared directory.

## Repeated SCSS Rule Sets

Found 20 CSS rule sets that appear in multiple files.

### Rule Set 1
Selector: `&:hover, &:focus`

Occurrences:
- `src/styles/_elements.scss` (line 70)
- `src/ui/SizeSelector/styles.module.scss` (line 27)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 2
Selector: `&:hover, &:focus`

Occurrences:
- `src/styles/_elements.scss` (line 314)
- `src/widgets/AccountSettings/styles.module.scss` (line 28)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 3
Selector: `img`

Occurrences:
- `src/styles/_elements.scss` (line 429)
- `src/widgets/PlayerFullInfo/styles.module.scss` (line 27)
- `src/widgets/PlayerProfileCard/styles.module.scss` (line 9)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 4
Selector: `&.light`

Occurrences:
- `src/styles/_elements.scss` (line 584)
- `src/styles/_typo.scss` (line 9)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 5
Selector: `&.dark`

Occurrences:
- `src/styles/_elements.scss` (line 588)
- `src/styles/_typo.scss` (line 13)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 6
Selector: `img`

Occurrences:
- `src/styles/_global.scss` (line 81)
- `src/components/SimpleProduct/styles.module.scss` (line 14)
- `src/widgets/Ticket/styles.module.scss` (line 11)
- `src/widgets/User/styles.module.scss` (line 5)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 7
Selector: `&.visible`

Occurrences:
- `src/components/Error404/styles.module.scss` (line 23)
- `src/widgets/Attendance/styles.module.scss` (line 49)
- `src/widgets/ClubFansMap/styles.module.scss` (line 17)
- `src/widgets/LocalFans/styles.module.scss` (line 35)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 8
Selector: `&.compact`

Occurrences:
- `src/components/Lineups/styles.module.scss` (line 59)
- `src/components/LeagueHeader/styles.module.scss` (line 6)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 9
Selector: `&.dark`

Occurrences:
- `src/components/MatchMonthCard/styles.module.scss` (line 12)
- `src/widgets/MonthMatches/styles.module.scss` (line 13)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 10
Selector: `&:not(:last-child)`

Occurrences:
- `src/components/ProductInfoItem/styles.module.scss` (line 8)
- `src/layout/BottomNav/styles.module.scss` (line 33)
- `src/widgets/ProductAdditionalInfo/styles.module.scss` (line 7)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 11
Selector: `&:first-child`

Occurrences:
- `src/components/SizeGuide/styles.module.scss` (line 17)
- `src/widgets/ShoppingCart/styles.module.scss` (line 5)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 12
Selector: `&:last-child`

Occurrences:
- `src/components/SizeGuide/styles.module.scss` (line 21)
- `src/widgets/ShoppingCart/styles.module.scss` (line 9)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 13
Selector: `input`

Occurrences:
- `src/ui/SizeSelector/styles.module.scss` (line 3)
- `src/ui/Radio/styles.module.scss` (line 11)
- `src/ui/Switch/style.module.scss` (line 2)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 14
Selector: `.media`

Occurrences:
- `src/widgets/Attendance/styles.module.scss` (line 8)
- `src/widgets/ClubFansMap/styles.module.scss` (line 1)
- `src/widgets/LocalFans/styles.module.scss` (line 1)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 15
Selector: `.header`

Occurrences:
- `src/widgets/BallPossessionAreaChart/styles.module.scss` (line 1)
- `src/widgets/ChampionshipPositionChart/styles.module.scss` (line 1)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 16
Selector: `&_img`

Occurrences:
- `src/widgets/ClubFansMap/styles.module.scss` (line 9)
- `src/widgets/LocalFans/styles.module.scss` (line 27)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 17
Selector: `.main`

Occurrences:
- `src/widgets/MatchLiveReport/styles.module.scss` (line 1)
- `src/widgets/StoreSupport/styles.module.scss` (line 1)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 18
Selector: `&.dark`

Occurrences:
- `src/widgets/PaymentMethod/styles.module.scss` (line 26)
- `src/components/Todos/Todo/styles.module.scss` (line 106)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 19
Selector: `.container`

Occurrences:
- `src/widgets/PlayerProfileCard/styles.module.scss` (line 40)
- `src/widgets/ProductDisplay/styles.module.scss` (line 1)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

### Rule Set 20
Selector: `// tablet portrait
    @media screen and (min-width: 768px)`

Occurrences:
- `src/widgets/TeamResults/styles.module.scss` (line 24)
- `src/widgets/TeamFullInfo/styles.module.scss` (line 7)

**Remediation**: Consider moving this style to a shared mixin in `src/styles/_mixins.scss` or a common class in `src/styles/_elements.scss`.

