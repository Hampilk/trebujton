import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePredictions } from '@/hooks/usePredictions';

// Mock Supabase
const mockPrediction = {
  id: '1',
  predicted_outcome: 'Home Win',
  confidence_score: 0.75,
  actual_outcome: null,
  was_correct: null,
  match: {
    home_team: 'Team A',
    away_team: 'Team B',
    match_date: '2024-01-15T10:00:00Z',
    league: 'Premier League'
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [mockPrediction],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('usePredictions', () => {
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
    const { result } = renderHook(() => usePredictions(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should return predictions data on success', async () => {
    const { result } = renderHook(() => usePredictions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([mockPrediction]);
    expect(result.current.error).toBeNull();
  });
});