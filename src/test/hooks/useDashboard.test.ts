import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/useDashboard';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              {
                id: '1',
                predicted_outcome: 'Home Win',
                confidence_score: 0.75,
                actual_outcome: null,
                was_correct: null,
                match: {
                  home_team: { name: 'Team A' },
                  away_team: { name: 'Team B' },
                  match_date: '2024-01-15T10:00:00Z',
                  league: { name: 'Premier League' }
                }
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('useDashboard', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should return dashboard data on success', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data.stats).toBeDefined();
    expect(result.current.data.predictions).toBeDefined();
    expect(result.current.data.patterns).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should handle error state', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })
    });

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });
});