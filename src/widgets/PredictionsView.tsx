import React, { useState } from 'react';
import Spring from '@components/Spring';
import PredictionCard from '@components/PredictionCard';
import { usePredictions } from '@hooks/usePredictions';
import { useLeagues } from '@hooks/useLeagues';

interface FilterState {
    status?: 'pending' | 'correct' | 'incorrect';
}

interface UIFilterState extends FilterState {
    league_id?: string;
}

const PredictionsView: React.FC = () => {
    const [uiFilters, setUIFilters] = useState<UIFilterState>({});
    const { data: predictions, isLoading, isError, error } = usePredictions({
        status: uiFilters.status
    });
    const { data: leagues } = useLeagues();

    if (isLoading) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                        <p className="text-sm text-gray-500">Loading predictions...</p>
                    </div>
                </div>
            </Spring>
        );
    }

    if (isError) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-red-500 text-lg">⚠️</div>
                        <p className="text-sm text-red-500">
                            {error instanceof Error ? error.message : 'Failed to load predictions'}
                        </p>
                    </div>
                </div>
            </Spring>
        );
    }

    if (!predictions || predictions.length === 0) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-gray-400 text-4xl">📊</div>
                        <p className="text-sm text-gray-500">No predictions found</p>
                    </div>
                </div>
            </Spring>
        );
    }

    return (
        <Spring className="card d-flex flex-column g-30 card-padded">
            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold">Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* League Filter */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                League
                            </label>
                            <select
                                value={uiFilters.league_id || ''}
                                onChange={(e) =>
                                    setUIFilters({
                                        ...uiFilters,
                                        league_id: e.target.value || undefined,
                                    })
                                }
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All Leagues</option>
                                {leagues?.map((league) => (
                                    <option key={league.id} value={league.id}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Status
                            </label>
                            <select
                                value={uiFilters.status || ''}
                                onChange={(e) =>
                                    setUIFilters({
                                        ...uiFilters,
                                        status: (e.target.value as 'pending' | 'correct' | 'incorrect') || undefined,
                                    })
                                }
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="correct">Correct</option>
                                <option value="incorrect">Incorrect</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setUIFilters({})}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Predictions List */}
                <div className="space-y-4">
                    {predictions.map((prediction, index) => (
                        <PredictionCard
                            key={prediction.id}
                            prediction={prediction}
                            index={index + 1}
                        />
                    ))}
                </div>
            </div>
        </Spring>
    );
};

export default PredictionsView;
