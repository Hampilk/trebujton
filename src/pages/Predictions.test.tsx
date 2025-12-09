/**
 * Smoke tests for Predictions page and related components
 * Tests basic rendering and functionality without external dependencies
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Predictions from './Predictions';

// Mock the hooks to avoid API calls
jest.mock('@hooks/usePredictions', () => ({
    usePredictions: () => ({
        data: [
            {
                id: '1',
                match_id: 'match1',
                prediction_type: '1X2',
                prediction: '1',
                confidence: 0.85,
                model_version: '1.0',
                ensemble_breakdown: {
                    full_time: { prediction: '1', confidence: 0.85 },
                    half_time: { prediction: 'X', confidence: 0.65 },
                    pattern: { prediction: '1', confidence: 0.90 },
                    weights_used: { ft: 0.4, ht: 0.3, pt: 0.3 }
                },
                status: 'pending',
                created_at: '2024-01-01T00:00:00Z'
            }
        ],
        isLoading: false,
        isError: false,
        error: null
    }),
    usePredictionStats: () => ({
        data: { total: 100, correct: 75 },
        isLoading: false
    }),
    useCreatePrediction: () => ({
        mutate: jest.fn(),
        isPending: false
    })
}));

jest.mock('@hooks/useMatches', () => ({
    useMatches: () => ({
        data: [
            { id: 'match1', home_team_id: 'team1', away_team_id: 'team2', league_id: 'league1', date: '2024-01-01', status: 'scheduled', home_score: 0, away_score: 0 }
        ],
        isLoading: false
    })
}));

jest.mock('@hooks/useLeagues', () => ({
    useLeagues: () => ({
        data: [
            { id: 'league1', name: 'Premier League', country: 'England', season: '2024' }
        ],
        isLoading: false
    })
}));

jest.mock('@layout/PageHeader', () => ({
    __esModule: true,
    default: ({ title }: { title: string }) => <div>{title}</div>
}));

jest.mock('@layout/AppGrid', () => ({
    __esModule: true,
    default: ({ widgets }: { widgets: any }) => <div data-testid="app-grid">{Object.keys(widgets).length} widgets</div>
}));

describe('Predictions Page', () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false }
        }
    });

    test('renders without crashing', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Predictions />
            </QueryClientProvider>
        );
        expect(screen.getByText('Predictions')).toBeInTheDocument();
    });

    test('displays three widgets', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Predictions />
            </QueryClientProvider>
        );
        const grid = screen.getByTestId('app-grid');
        expect(grid).toBeInTheDocument();
        expect(grid.textContent).toContain('3 widgets');
    });

    test('renders create prediction button', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Predictions />
            </QueryClientProvider>
        );
        expect(screen.getByText(/New Prediction/i)).toBeInTheDocument();
    });
});
