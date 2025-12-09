import React from 'react';
import { Prediction } from '@hooks/usePredictions';
import ConfidenceGauge from './ConfidenceGauge';
import Spring from './Spring';
import dayjs from 'dayjs';

interface PredictionCardProps {
    prediction: Prediction;
    index: number;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, index }) => {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        correct: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        incorrect: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    const predictionTypeLabels: Record<string, string> = {
        '1X2': '1X2 (Full Time)',
        'BTTS': 'Both Teams to Score',
        'O/U': 'Over/Under'
    };

    return (
        <Spring 
            index={index}
            className="prediction-card"
            type="slideUp"
        >
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* Match Info */}
                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">Match Prediction</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Type: {predictionTypeLabels[prediction.prediction_type]}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created: {dayjs(prediction.created_at).format('MMM DD, YYYY')}
                        </p>
                    </div>

                    {/* Prediction Result */}
                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">Prediction</h5>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {prediction.prediction}
                        </p>
                        <p className="text-xs text-gray-500">
                            Model v{prediction.model_version}
                        </p>
                    </div>

                    {/* Confidence */}
                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">Confidence</h5>
                        <div className="flex items-center gap-3">
                            <ConfidenceGauge confidence={prediction.confidence} />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col gap-2 justify-between">
                        <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[prediction.status]}`}>
                                {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
                            </span>
                        </div>
                        {prediction.resolved_at && (
                            <p className="text-xs text-gray-500">
                                Resolved: {dayjs(prediction.resolved_at).format('MMM DD, YYYY')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Spring>
    );
};

export default PredictionCard;
