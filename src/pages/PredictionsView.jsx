import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';

// Hooks
import { usePredictions, useRefreshPredictions } from '@/hooks/usePredictions';

// Widgets
import PredictionsList from '@/widgets/PredictionsList';

export default function PredictionsViewPage() {
  const navigate = useNavigate();
  const { data: predictions = [], isLoading, error } = usePredictions();
  const refreshPredictions = useRefreshPredictions();

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader 
          title="Predictions Overview" 
          metaDescription="Track and review AI-generated predictions"
        />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/predictions/new')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            New Predictions
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          Error loading predictions: {error.message}
        </div>
      )}

      <AppGrid id="predictions" widgets={{
        predictions: <PredictionsList predictions={predictions} loading={isLoading} onRefresh={refreshPredictions} />
      }} />
    </>
  );
}