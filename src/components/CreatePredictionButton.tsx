import React, { useState } from 'react';
import { useCreatePrediction, Prediction } from '@hooks/usePredictions';
import { useMatches } from '@hooks/useMatches';
import { toast } from 'react-toastify';

interface CreatePredictionButtonProps {
    onOpen: () => void;
    onClose: () => void;
    isOpen: boolean;
}

interface PredictionFormData {
    match_id: string;
    prediction_type: '1X2' | 'BTTS' | 'O/U';
    prediction: string;
    model_version: string;
    ft_prediction: string;
    ft_confidence: number;
    ht_prediction: string;
    ht_confidence: number;
    pt_prediction: string;
    pt_confidence: number;
    ft_weight: number;
    ht_weight: number;
    pt_weight: number;
}

const CreatePredictionButton: React.FC<CreatePredictionButtonProps> = ({
    onOpen,
    onClose,
    isOpen,
}) => {
    const [formData, setFormData] = useState<PredictionFormData>({
        match_id: '',
        prediction_type: '1X2',
        prediction: '',
        model_version: '1.0',
        ft_prediction: '',
        ft_confidence: 0.5,
        ht_prediction: '',
        ht_confidence: 0.5,
        pt_prediction: '',
        pt_confidence: 0.5,
        ft_weight: 0.4,
        ht_weight: 0.3,
        pt_weight: 0.3,
    });

    const { mutate: createPrediction, isPending } = useCreatePrediction();
    const { data: matches, isLoading: matchesLoading } = useMatches();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const numFields = [
            'ft_confidence',
            'ht_confidence',
            'pt_confidence',
            'ft_weight',
            'ht_weight',
            'pt_weight',
        ];
        
        setFormData({
            ...formData,
            [name]: numFields.includes(name) ? parseFloat(value) : value,
        });
    };

    const normalizeWeights = () => {
        const total = formData.ft_weight + formData.ht_weight + formData.pt_weight;
        if (total === 0) return;
        
        setFormData({
            ...formData,
            ft_weight: formData.ft_weight / total,
            ht_weight: formData.ht_weight / total,
            pt_weight: formData.pt_weight / total,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.match_id) {
            toast.error('Please select a match');
            return;
        }

        if (!formData.prediction) {
            toast.error('Please enter a prediction');
            return;
        }

        const normalizedWeights = {
            ft: formData.ft_weight,
            ht: formData.ht_weight,
            pt: formData.pt_weight,
        };

        // Normalize weights
        const totalWeight = normalizedWeights.ft + normalizedWeights.ht + normalizedWeights.pt;
        if (totalWeight > 0) {
            normalizedWeights.ft /= totalWeight;
            normalizedWeights.ht /= totalWeight;
            normalizedWeights.pt /= totalWeight;
        }

        const newPrediction: Omit<Prediction, 'id' | 'created_at' | 'resolved_at'> = {
            match_id: formData.match_id,
            prediction_type: formData.prediction_type,
            prediction: formData.prediction,
            confidence: formData.ft_confidence * normalizedWeights.ft + 
                       formData.ht_confidence * normalizedWeights.ht +
                       formData.pt_confidence * normalizedWeights.pt,
            model_version: formData.model_version,
            ensemble_breakdown: {
                full_time: {
                    prediction: formData.ft_prediction,
                    confidence: formData.ft_confidence,
                },
                half_time: {
                    prediction: formData.ht_prediction,
                    confidence: formData.ht_confidence,
                },
                pattern: {
                    prediction: formData.pt_prediction,
                    confidence: formData.pt_confidence,
                },
                weights_used: normalizedWeights,
            },
            status: 'pending',
        };

        createPrediction(newPrediction, {
            onSuccess: () => {
                toast.success('Prediction created successfully!');
                onClose();
                setFormData({
                    match_id: '',
                    prediction_type: '1X2',
                    prediction: '',
                    model_version: '1.0',
                    ft_prediction: '',
                    ft_confidence: 0.5,
                    ht_prediction: '',
                    ht_confidence: 0.5,
                    pt_prediction: '',
                    pt_confidence: 0.5,
                    ft_weight: 0.4,
                    ht_weight: 0.3,
                    pt_weight: 0.3,
                });
            },
            onError: (error) => {
                toast.error(
                    error instanceof Error ? error.message : 'Failed to create prediction'
                );
            },
        });
    };

    return (
        <>
            <button
                onClick={onOpen}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
                + New Prediction
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
                    {/* Modal/Drawer */}
                    <div className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl max-h-96 sm:max-h-full sm:rounded-lg shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Create New Prediction
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Match Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Match *
                                </label>
                                <select
                                    name="match_id"
                                    value={formData.match_id}
                                    onChange={handleInputChange}
                                    disabled={matchesLoading}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">
                                        {matchesLoading ? 'Loading matches...' : 'Select a match'}
                                    </option>
                                    {matches?.map((match) => (
                                        <option key={match.id} value={match.id}>
                                            Match {match.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Prediction Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prediction Type *
                                    </label>
                                    <select
                                        name="prediction_type"
                                        value={formData.prediction_type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="1X2">1X2</option>
                                        <option value="BTTS">Both Teams to Score</option>
                                        <option value="O/U">Over/Under</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Final Prediction *
                                    </label>
                                    <input
                                        type="text"
                                        name="prediction"
                                        value={formData.prediction}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 1, X, 2, Yes, No"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Model Version */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Model Version
                                </label>
                                <input
                                    type="text"
                                    name="model_version"
                                    value={formData.model_version}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Ensemble Models */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Ensemble Model Inputs
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Full Time */}
                                    <div>
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Full Time (FT)
                                        </h5>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Prediction
                                                </label>
                                                <input
                                                    type="text"
                                                    name="ft_prediction"
                                                    value={formData.ft_prediction}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 1"
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Confidence (0-1)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="ft_confidence"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={formData.ft_confidence}
                                                    onChange={handleInputChange}
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Half Time */}
                                    <div>
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Half Time (HT)
                                        </h5>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Prediction
                                                </label>
                                                <input
                                                    type="text"
                                                    name="ht_prediction"
                                                    value={formData.ht_prediction}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., X"
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Confidence (0-1)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="ht_confidence"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={formData.ht_confidence}
                                                    onChange={handleInputChange}
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pattern */}
                                    <div>
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Pattern (PT)
                                        </h5>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Prediction
                                                </label>
                                                <input
                                                    type="text"
                                                    name="pt_prediction"
                                                    value={formData.pt_prediction}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 2"
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                                    Confidence (0-1)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="pt_confidence"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={formData.pt_confidence}
                                                    onChange={handleInputChange}
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weights */}
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300">
                                            Model Weights
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={normalizeWeights}
                                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                        >
                                            Normalize
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                FT Weight
                                            </label>
                                            <input
                                                type="number"
                                                name="ft_weight"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={formData.ft_weight}
                                                onChange={handleInputChange}
                                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                HT Weight
                                            </label>
                                            <input
                                                type="number"
                                                name="ht_weight"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={formData.ht_weight}
                                                onChange={handleInputChange}
                                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                PT Weight
                                            </label>
                                            <input
                                                type="number"
                                                name="pt_weight"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={formData.pt_weight}
                                                onChange={handleInputChange}
                                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                >
                                    {isPending ? 'Creating...' : 'Create Prediction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreatePredictionButton;
