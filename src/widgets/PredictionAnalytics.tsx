import React, { useMemo } from 'react';
import Spring from '@components/Spring';
import { usePredictions, usePredictionStats } from '@hooks/usePredictions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const PredictionAnalytics: React.FC = () => {
    const { data: predictions, isLoading: predictionsLoading } = usePredictions();
    const { data: stats, isLoading: statsLoading } = usePredictionStats();

    const analytics = useMemo(() => {
        if (!predictions) return null;

        // Filter resolved predictions
        const resolved = predictions.filter(p => p.status !== 'pending');
        
        if (resolved.length === 0) {
            return {
                total: 0,
                accuracy: 0,
                correctCount: 0,
                incorrectCount: 0,
                pendingCount: predictions.length,
                avgConfidence: 0,
                trendline: []
            };
        }

        const correctCount = resolved.filter(p => p.status === 'correct').length;
        const incorrectCount = resolved.filter(p => p.status === 'incorrect').length;
        const accuracy = (correctCount / resolved.length) * 100;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

        // Build trendline data (grouped by day)
        const trendMap = new Map<string, { total: number; correct: number }>();
        
        resolved.forEach(pred => {
            const day = dayjs(pred.created_at).format('MMM DD');
            const existing = trendMap.get(day) || { total: 0, correct: 0 };
            trendMap.set(day, {
                total: existing.total + 1,
                correct: existing.correct + (pred.status === 'correct' ? 1 : 0)
            });
        });

        const trendline = Array.from(trendMap.entries())
            .map(([date, data]) => ({
                date,
                accuracy: (data.correct / data.total) * 100,
                correct: data.correct,
                total: data.total
            }))
            .slice(-14); // Last 14 days

        return {
            total: predictions.length,
            accuracy,
            correctCount,
            incorrectCount,
            pendingCount: predictions.filter(p => p.status === 'pending').length,
            avgConfidence,
            trendline
        };
    }, [predictions]);

    if (predictionsLoading || statsLoading) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
            </Spring>
        );
    }

    if (!analytics) {
        return (
            <Spring className="card d-flex flex-column g-30 card-padded">
                <div className="text-center text-gray-500">
                    No analytics data available
                </div>
            </Spring>
        );
    }

    return (
        <Spring className="card d-flex flex-column g-30 card-padded">
            <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Prediction Analytics
                </h4>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Predictions */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">
                            Total Predictions
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                            {analytics.total}
                        </p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">
                            Accuracy
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                            {analytics.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ({analytics.correctCount}/{analytics.correctCount + analytics.incorrectCount})
                        </p>
                    </div>

                    {/* Pending */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">
                            Pending
                        </p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                            {analytics.pendingCount}
                        </p>
                    </div>

                    {/* Avg Confidence */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">
                            Avg Confidence
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                            {(analytics.avgConfidence * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Accuracy Trendline */}
                {analytics.trendline.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Accuracy Trend (Last 14 Days)
                        </h5>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.trendline}>
                                <CartesianGrid 
                                    strokeDasharray="3 3"
                                    stroke="rgba(0,0,0,0.1)"
                                />
                                <XAxis 
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    stroke="rgba(0,0,0,0.5)"
                                />
                                <YAxis 
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                    stroke="rgba(0,0,0,0.5)"
                                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '4px'
                                    }}
                                    formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : value}%`}
                                />
                                <Line 
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#3b82f6"
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Accuracy %"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Detailed Stats */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Detailed Breakdown
                    </h5>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Correct Predictions</span>
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {analytics.correctCount}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                            <span className="text-gray-600 dark:text-gray-400">Incorrect Predictions</span>
                            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                                {analytics.incorrectCount}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Resolution Rate</span>
                            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {analytics.total > 0 
                                    ? (((analytics.correctCount + analytics.incorrectCount) / analytics.total) * 100).toFixed(1)
                                    : '0'
                                }%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Spring>
    );
};

export default PredictionAnalytics;
