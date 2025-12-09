# WinMix TipsterHub - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account (or local Supabase instance)
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd liga-soccer-tipsterhub

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags (optional)
VITE_FEATURE_PHASE5=false
VITE_FEATURE_PHASE6=false
VITE_FEATURE_PHASE7=false
VITE_FEATURE_PHASE8=false
VITE_FEATURE_PHASE9=false

# Environment
VITE_APP_ENV=development
```

### 3. Set Up Supabase

#### Option A: Using Supabase Cloud

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API
3. Paste them into your `.env` file

#### Option B: Using Local Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Your local credentials will be displayed
```

### 4. Database Setup

Run the database migrations (if available):

```bash
# Using Supabase CLI
supabase db push

# Or manually create tables in Supabase Dashboard
```

#### Required Tables

Create these tables in your Supabase database:

**matches**
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  league_id UUID REFERENCES leagues(id),
  date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  half_time_home_score INTEGER,
  half_time_away_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(date);
```

**teams**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  league_id UUID REFERENCES leagues(id),
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_league ON teams(league_id);
```

**leagues**
```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  logo_url TEXT,
  season TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**team_stats**
```sql
CREATE TABLE team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) UNIQUE,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  form TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**league_standings**
```sql
CREATE TABLE league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  team_id UUID REFERENCES teams(id),
  team_name TEXT NOT NULL,
  position INTEGER NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_standings_league ON league_standings(league_id, position);
```

**predictions**
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  prediction_type TEXT CHECK (prediction_type IN ('1X2', 'BTTS', 'O/U')),
  prediction TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT NOT NULL,
  ensemble_breakdown JSONB,
  status TEXT CHECK (status IN ('pending', 'correct', 'incorrect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_status ON predictions(status);
```

### 5. Set Up Authentication

In Supabase Dashboard:

1. Go to Authentication > Settings
2. Enable Email/Password provider
3. Configure email templates (optional)
4. Set up Row Level Security (RLS) policies:

```sql
-- Enable RLS on all tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Public read access for matches, teams, leagues
CREATE POLICY "Public read access" ON matches FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON teams FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON leagues FOR SELECT TO public USING (true);

-- Authenticated users can read predictions
CREATE POLICY "Authenticated read predictions" ON predictions 
  FOR SELECT TO authenticated USING (true);

-- Only authenticated users can create predictions
CREATE POLICY "Authenticated create predictions" ON predictions 
  FOR INSERT TO authenticated WITH CHECK (true);
```

### 6. Run the Application

```bash
# Start development server
npm run dev

# Application will be available at http://localhost:5173
```

### 7. Verify Setup

Test that everything works:

1. Open http://localhost:5173
2. Try to sign up with a new account
3. Sign in with your account
4. Check that widgets load (even if empty)
5. Open React Query DevTools (bottom-left corner)

## Troubleshooting

### "Failed to fetch" errors

**Problem**: Cannot connect to Supabase

**Solution**:
- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Check that your Supabase project is running
- Check browser console for CORS errors

### Authentication not working

**Problem**: Can't sign up or sign in

**Solution**:
- Verify Email/Password auth is enabled in Supabase
- Check Network tab for authentication errors
- Verify your anon key has correct permissions

### Empty data in widgets

**Problem**: Widgets show "No data" messages

**Solution**:
- This is expected if your database is empty
- Seed some data manually in Supabase dashboard
- Or wait for data import features in Phase 2

### Build errors

**Problem**: npm install fails with peer dependency errors

**Solution**:
```bash
npm install --legacy-peer-deps
```

### TypeScript errors

**Problem**: Type errors in imports

**Solution**:
- Restart TypeScript server in your editor
- Run `npm run build` to check for errors
- Verify path aliases in `tsconfig.json`

## Development Tips

### Using React Query DevTools

The React Query DevTools are automatically enabled in development. Look for a small React Query icon in the bottom-left corner of your screen.

**Features**:
- View all queries and their status
- Manually refetch queries
- Inspect query data and errors
- See cache status

### Hot Reload

Vite provides instant hot reload. Changes to your code will be reflected immediately without page refresh.

### Mock Mode

If you don't have Supabase configured, the app will run in "mock mode" with placeholder data. Check the browser console for warnings.

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

## Next Steps

After setup:

1. **Phase 2**: Migrate widgets from mock data to real API
2. **Seed Data**: Add sample data to your database
3. **Configure Edge Functions**: Set up Supabase Edge Functions (optional)
4. **Customize**: Adapt the UI to your needs

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Supabase (if using CLI)
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db reset        # Reset local database
supabase db push         # Push migrations
supabase gen types typescript --local > src/lib/database.types.ts  # Generate types
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Vite Documentation](https://vitejs.dev)
- [Phase 1 Integration Docs](./PHASE1_INTEGRATION_COMPLETE.md)
- [Widget Migration Guide](./WIDGET_MIGRATION_GUIDE.md)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation in `/docs`
3. Check browser console for errors
4. Verify Supabase dashboard for data issues

---

**Last Updated**: 2025-12-09
