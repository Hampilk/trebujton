# Type Safety Implementation Checklist

Track progress through the type safety improvements using this checklist.

---

## Phase 1: Critical Fixes ⏱️ ~1 week

### High Impact, Low Effort Fixes

- [ ] **AuthContext: Add missing `role` to value object**
  - File: `src/contexts/AuthContext.tsx`
  - Lines: 214-224
  - Task: Add `role` property to context value
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **AuthContext: Replace `Promise<any>` with typed responses**
  - File: `src/contexts/AuthContext.tsx`
  - Lines: 17-20
  - Task: Import AuthResponse, update signUp/signIn/resetPassword signatures
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **AuthContext: Export UserProfile and AuthContextType**
  - File: `src/contexts/AuthContext.tsx`
  - Task: Add `export` keyword to interfaces at top of file
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **RoleGate: Fix null safety in profile.role access**
  - File: `src/components/RoleGate.tsx`
  - Lines: 14-22
  - Task: Add null check before accessing profile.role
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **matchService: Add MatchStatistic type definition**
  - File: `src/services/matchService.ts`
  - Lines: 196-259
  - Task: Define MatchStatistic interface, update return type
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **Delete empty duplicate .js hook files**
  - Files: `src/hooks/*.js` (7 files)
  - Task: Delete these empty files:
    - useEvents.js
    - useLeagues.js
    - useMatches.js
    - usePlayers.js
    - useProducts.js
    - useTeams.js
    - useWinmixQuery.js
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **Delete empty duplicate .js service files**
  - Files: `src/services/*.js` (8 files)
  - Task: Delete these empty files:
    - eventService.js
    - leagueService.js
    - matchService.js
    - playerService.js
    - productService.js
    - teamService.js
    - userService.js
    - winmixApi.js
  - Effort: 5 min
  - Owner: 
  - Status: 

### Subtotal Phase 1: 50 minutes work

---

## Phase 2: High Priority Improvements ⏱️ ~2-3 weeks

### Type Casting and Generic Type Improvements

- [ ] **useWinmixQuery: Fix `any` type casting on winmixApi**
  - File: `src/hooks/useWinmixQuery.ts`
  - Lines: 87-88
  - Task: Replace `(winmixApi as any)[method]` with proper typing
  - Effort: 15 min
  - Owner: 
  - Status: 

- [ ] **useWinmixQuery: Fix selector function type parameters**
  - File: `src/hooks/useWinmixQuery.ts`
  - Lines: 234-259 (4 selector functions)
  - Task: Replace `any` parameters with specific return types in:
    - useLeagueStandingsSelector
    - useMatchSelector
    - usePlayerSelector
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **useWinmixQuery: Fix error type in retry logic**
  - File: `src/hooks/useWinmixQuery.ts`
  - Lines: 97-101
  - Task: Change `error: any` to proper error handling
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **useWinmixQuery: Fix optimistic update types**
  - File: `src/hooks/useWinmixQuery.ts`
  - Lines: 340-365
  - Task: Add generic types to useOptimisticUpdate function
  - Effort: 15 min
  - Owner: 
  - Status: 

- [ ] **useWinmixQuery: Fix unsafe JSON.parse**
  - File: `src/hooks/useWinmixQuery.ts`
  - Lines: 284-286
  - Task: Add try-catch error handling for JSON.parse
  - Effort: 10 min
  - Owner: 
  - Status: 

### Service Layer Type Exports

- [ ] **matchService: Export MatchWithTeams interface**
  - File: `src/services/matchService.ts`
  - Task: Add export keyword to MatchWithTeams interface
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **matchService: Export CreateMatchInput interface**
  - File: `src/services/matchService.ts`
  - Task: Add export keyword to CreateMatchInput interface
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **teamService: Export service interface types**
  - File: `src/services/teamService.ts`
  - Task: Identify and export all public types
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **winmixApi: Export extended types**
  - File: `src/services/winmixApi.ts`
  - Task: Export MatchWithTeams, TeamWithStats, etc.
  - Effort: 15 min
  - Owner: 
  - Status: 

### Documentation and Constants

- [ ] **Create MATCH_STATUS constant enum**
  - File: `src/constants/matchStatus.ts` (new)
  - Task: Create constant object and type for match statuses
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **Create USER_ROLES constant enum**
  - File: `src/constants/userRoles.ts` (new)
  - Task: Create constant object and type for user roles
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **Add JSDoc to useWinmixQuery**
  - File: `src/hooks/useWinmixQuery.ts`
  - Task: Document generic parameters and type contracts
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **Add JSDoc to useFeatureManager**
  - File: `src/hooks/useFeatureManager.ts`
  - Task: Document Feature interface and method signatures
  - Effort: 15 min
  - Owner: 
  - Status: 

### Subtotal Phase 2: ~2 hours 20 minutes work (+ review time)

---

## Phase 3: File Organization & Centralization ⏱️ ~3-4 weeks

### Create Centralized Types Directory

- [ ] **Create types/index.ts central export**
  - File: `src/types/index.ts` (new)
  - Task: Create single point of export for all app types
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **Create types/auth.ts**
  - File: `src/types/auth.ts` (new)
  - Task: Move auth-related types here
  - Effort: 15 min
  - Owner: 
  - Status: 

- [ ] **Create types/match.ts**
  - File: `src/types/match.ts` (new)
  - Task: Move match-related types here
  - Effort: 15 min
  - Owner: 
  - Status: 

- [ ] **Create types/domain.ts**
  - File: `src/types/domain.ts` (new)
  - Task: Move team, league, player types here
  - Effort: 15 min
  - Owner: 
  - Status: 

- [ ] **Create types/api.ts**
  - File: `src/types/api.ts` (new)
  - Task: Move API request/response types
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **Create types/common.ts**
  - File: `src/types/common.ts` (new)
  - Task: Move shared utility types
  - Effort: 15 min
  - Owner: 
  - Status: 

### TypeScript Configuration Updates

- [ ] **Document path alias standards**
  - File: Update `docs/CONTRIBUTING.md` or similar
  - Task: Clarify @/* path alias usage patterns
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **Review tsconfig settings**
  - File: `tsconfig.app.json`
  - Task: Plan transition to stricter settings
  - Effort: 10 min
  - Owner: 
  - Status: 

### JSX to TSX Conversion (First Batch: 50 files)

- [ ] **Convert LoadingScreen.jsx to .tsx**
  - File: `src/components/LoadingScreen.jsx`
  - Task: Add prop interface, convert to .tsx
  - Effort: 10 min
  - Owner: 
  - Status: 

- [ ] **Convert RoleGate (already .tsx, but improve types)**
  - File: `src/components/RoleGate.tsx`
  - Task: Review and validate after Phase 1 fixes
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **Convert ProtectedRoute (already .tsx, validate)**
  - File: `src/components/ProtectedRoute.tsx`
  - Task: Review type safety
  - Effort: 5 min
  - Owner: 
  - Status: 

- [ ] **Create JSX→TSX conversion plan**
  - Task: Prioritize remaining 275 component files
  - Effort: 30 min
  - Owner: 
  - Status: 

- [ ] **Convert first batch of 50 JSX files to TSX**
  - Task: Execute conversion plan (see full audit doc)
  - Effort: 5-10 hours (spread across sprint)
  - Owner: 
  - Status: 

### Subtotal Phase 3: ~8-10 hours work (spread across 3+ weeks)

---

## Phase 4: Long-term Improvements ⏱️ ~4-8 weeks

### Comprehensive Type Coverage

- [ ] **Convert remaining 228 JSX files to TSX**
  - Task: Complete component library typification
  - Batches: 6 batches of ~38 files each
  - Effort: 30-40 hours (distributed)
  - Owner: 
  - Status: 

- [ ] **Migrate 121 .js utility files to .ts**
  - Task: Convert all JavaScript utilities
  - Effort: 10-15 hours (distributed)
  - Owner: 
  - Status: 

- [ ] **Create error type definitions**
  - File: `src/types/errors.ts` (new)
  - Task: Define typed error classes
  - Effort: 20 min
  - Owner: 
  - Status: 

- [ ] **Create component prop interfaces**
  - Task: Export prop types from all components
  - Effort: 5-10 hours (distributed)
  - Owner: 
  - Status: 

### TypeScript Strictness Improvements

- [ ] **Enable noImplicitAny (config change)**
  - File: `tsconfig.app.json`
  - Task: Change "noImplicitAny": false → true
  - Effort: 5 min (change), 2-5 hours (fixes)
  - Owner: 
  - Status: 

- [ ] **Fix all implicit any violations**
  - Task: Address all noImplicitAny errors
  - Effort: 5-10 hours
  - Owner: 
  - Status: 

- [ ] **Enable noUnusedLocals**
  - File: `tsconfig.app.json`
  - Task: Change "noUnusedLocals": false → true
  - Effort: 5 min (change), 2-3 hours (cleanup)
  - Owner: 
  - Status: 

- [ ] **Remove unused variables**
  - Task: Clean up all unused locals
  - Effort: 2-3 hours
  - Owner: 
  - Status: 

- [ ] **Enable full strict mode**
  - File: `tsconfig.app.json`
  - Task: Change "strict": false → true
  - Effort: 5 min (change), 10-20 hours (fixes)
  - Owner: 
  - Status: 

- [ ] **Fix strict mode violations**
  - Task: Address all strict mode errors
  - Effort: 10-20 hours
  - Owner: 
  - Status: 

### Documentation and Validation

- [ ] **Create TypeScript Best Practices guide**
  - File: `docs/TYPESCRIPT-GUIDELINES.md` (new)
  - Task: Document type safety patterns
  - Effort: 1 hour
  - Owner: 
  - Status: 

- [ ] **Create component API documentation**
  - Task: Document all public component props
  - Effort: 2-3 hours
  - Owner: 
  - Status: 

- [ ] **Create type definitions guide**
  - File: `docs/TYPE-DEFINITIONS.md` (new)
  - Task: Guide for where to put types
  - Effort: 30 min
  - Owner: 
  - Status: 

- [ ] **Validate type coverage with tooling**
  - Task: Set up type coverage measurement
  - Effort: 30 min
  - Owner: 
  - Status: 

### Subtotal Phase 4: ~25-50 hours work (distributed over 4-8 weeks)

---

## Summary Statistics

| Phase | Items | Total Time | Status |
|-------|-------|-----------|--------|
| **Phase 1** | 9 | ~50 min | Ready |
| **Phase 2** | 14 | ~2-3 hrs | Depends on Phase 1 |
| **Phase 3** | 14 | ~8-10 hrs | Medium term |
| **Phase 4** | 13+ | ~25-50 hrs | Long term |
| **TOTAL** | 50+ | ~35-65 hrs | Phased over 8 weeks |

---

## Progress Tracking

### Week 1: Phase 1 Execution
```
[____] Mon: AuthContext fixes
[____] Tue: RoleGate + matchService
[____] Wed-Fri: Remove duplicate files, review
```

### Week 2-3: Phase 2 Execution
```
[____] Week 2: useWinmixQuery types + service exports
[____] Week 3: Constants + documentation
```

### Week 4-6: Phase 3 Execution
```
[____] Week 4: Create types directory
[____] Week 5-6: JSX→TSX conversion (50 files)
```

### Week 7-10: Phase 4 Execution
```
[____] Week 7-9: Continue JSX→TSX + .js→.ts
[____] Week 10: TypeScript strictness upgrades
```

---

## Code Review Checklist

When reviewing type safety improvements, verify:

- [ ] Types are properly exported
- [ ] No remaining `any` types (except justified)
- [ ] All interface methods have return types
- [ ] No unsafe null/undefined access
- [ ] Error handling is typed
- [ ] Generics are properly constrained
- [ ] JSDoc comments explain complex types
- [ ] Path aliases are used consistently
- [ ] Circular dependencies avoided
- [ ] Tests cover type contracts

---

## Notes

**Last Updated:** December 10, 2024  
**Total Items:** 50+  
**Estimated Total Effort:** 35-65 development hours  
**Recommended Timeline:** 8 weeks  
**Team Size:** Can be parallelized with 2-3 developers

Use this checklist to track implementation progress and maintain momentum through the type safety improvements.
