import React, { useState } from 'react';
import Spring from '@components/Spring';
import { usePredictions } from '@hooks/usePredictions';
import dayjs from 'dayjs';

const EnsembleBreakdown: React.FC = () => {
    const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
    const { data: predictions, isLoading, isError, error } = usePredictions();

    if (isLoading) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
            </Spring>
        );
    }

    if (isError) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="text-center text-red-500">
                    {error instanceof Error ? error.message : 'Failed to load ensemble data'}
                </div>
            </Spring>
        );
    }

    // Get the most recent prediction with conflicts
    const selectedPrediction = selectedPredictionId
        ? predictions?.find(p => p.id === selectedPredictionId)
        : predictions?.[0];

    if (!selectedPrediction) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="text-center text-gray-500">
                    No predictions available for ensemble analysis
                </div>
            </Spring>
        );
    }

    const ensemble = selectedPrediction.ensemble_breakdown;
    const weights = ensemble.weights_used;

    // Detect conflicts: when model predictions differ
    const hasConflict = 
        ensemble.full_time.prediction !== ensemble.half_time.prediction ||
        ensemble.full_time.prediction !== ensemble.pattern.prediction;

    return (
        <Spring className="card d-flex flex-column g-30 card-padded">
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Ensemble Model Breakdown
                    </h4>
                    
                    {/* Prediction selector */}
                    {predictions && predictions.length > 1 && (
                        <select
                            value={selectedPrediction.id}
                            onChange={(e) => setSelectedPredictionId(e.target.value)}
                            className="mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            {predictions.map(p => (
                                <option key={p.id} value={p.id}>
                                    {dayjs(p.created_at).format('MMM DD, HH:mm')} - {p.prediction}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Conflict Alert */}
                {hasConflict && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                            <div>
                                <h5 className="font-semibold text-yellow-900 dark:text-yellow-200">Model Conflicts Detected</h5>
                                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                                    The ensemble models are not in agreement. Review the breakdown below for details.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Model Predictions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Full Time Model */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Full Time (FT)</h5>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Prediction</p>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {ensemble.full_time.prediction}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {(ensemble.full_time.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${weights.ft * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {(weights.ft * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Half Time Model */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Half Time (HT)</h5>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Prediction</p>
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {ensemble.half_time.prediction}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {(ensemble.half_time.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div 
                                            className="bg-purple-500 h-2 rounded-full"
                                            style={{ width: `${weights.ht * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {(weights.ht * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pattern Model */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Pattern (PT)</h5>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Prediction</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {ensemble.pattern.prediction}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {(ensemble.pattern.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${weights.pt * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {(weights.pt * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Ensemble Prediction */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Ensemble Result</h5>
                    <div className="flex items-baseline gap-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Final Prediction</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {selectedPrediction.prediction}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Ensemble Confidence</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(selectedPrediction.confidence * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Spring>
    );
};

export default EnsembleBreakdown;
