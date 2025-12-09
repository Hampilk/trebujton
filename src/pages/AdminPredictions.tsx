import { useState } from 'react';
import { useBlockedPredictionsForReview, useAcceptPrediction, useRejectPrediction } from '@/hooks/usePredictionReview';
import { GlassCard } from '@/components/Admin/GlassCard';

export const AdminPredictions = () => {
  const [filters, setFilters] = useState({ confidenceThreshold: 0.7 });
  const { data: predictions, isLoading, error } = useBlockedPredictionsForReview(filters);
  const acceptPrediction = useAcceptPrediction();
  const rejectPrediction = useRejectPrediction();
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  if (isLoading) return <div className="text-white p-8">Loading predictions...</div>;
  if (error) return <div className="text-red-400 p-8">Error: {error.message}</div>;

  return (
    <div className="bg-slate-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Prediction Review</h1>
        
        <GlassCard>
          <div className="p-6">
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-white">Min Confidence:</label>
                <select
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                  value={filters.confidenceThreshold}
                  onChange={(e) => setFilters({ ...filters, confidenceThreshold: parseFloat(e.target.value) })}
                >
                  <option value="0.5">50%</option>
                  <option value="0.6">60%</option>
                  <option value="0.7">70%</option>
                  <option value="0.8">80%</option>
                  <option value="0.9">90%</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {predictions?.map((prediction) => (
                <GlassCard key={prediction.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Prediction {prediction.id.slice(0, 8)}...</h3>
                      <p className="text-slate-400">{new Date(prediction.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        prediction.confidence > 0.8 ? 'text-green-400' : prediction.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {(prediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Confidence</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-slate-400">Match</div>
                      <div className="text-white font-medium">{prediction.match_details}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Prediction</div>
                      <div className="text-white font-medium">{prediction.prediction_text}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">User</div>
                      <div className="text-white">{prediction.user_name || 'Unknown'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => acceptPrediction.mutate({ predictionId: prediction.id })}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                      disabled={acceptPrediction.isPending}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectPrediction.mutate({ 
                        predictionId: prediction.id, 
                        reason: rejectionReason[prediction.id] || 'Admin rejection' 
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                      disabled={rejectPrediction.isPending}
                    >
                      Reject
                    </button>
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700"
                      value={rejectionReason[prediction.id] || ''}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, [prediction.id]: e.target.value })}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

            {predictions?.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No blocked predictions requiring review
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};