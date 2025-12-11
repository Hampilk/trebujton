import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, TrendingUp } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';

// Hooks
import { useMatchDetail } from '@/hooks/useMatchesDirect';
import { useMatchPrediction, useCreateMatchAnalysis } from '@/hooks/useMatchPredictions';

// Widgets
import MatchInfo from '@/widgets/MatchInfo';
import MatchDetailPrediction from '@/widgets/MatchDetailPrediction';

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // TanStack Query hooks
  const { data: match, isLoading: matchLoading, error: matchError } = useMatchDetail(id);
  const { data: prediction, isLoading: predictionLoading, error: predictionError } = useMatchPrediction(id);
  const createAnalysisMutation = useCreateMatchAnalysis();
  
  const [analyzing, setAnalyzing] = useState(false);
  
  const handleAnalyze = useCallback(async () => {
    if (!id) return;
    
    setAnalyzing(true);
    try {
      await createAnalysisMutation.mutateAsync(id);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [id, createAnalysisMutation]);

  const widgets = useMemo(() => {
    const isLoading = matchLoading || predictionLoading;
    const error = matchError || predictionError;

    return {
      info: <MatchInfo match={match} loading={matchLoading} />,
      prediction: (
        <MatchDetailPrediction 
          prediction={prediction} 
          loading={predictionLoading}
          onAnalyze={handleAnalyze}
          analyzing={analyzing || createAnalysisMutation.isPending}
        />
      ),
    };
  }, [match, prediction, matchLoading, predictionLoading, handleAnalyze, analyzing, createAnalysisMutation.isPending]);

  if (!id) {
    return (
      <>
        <div className="mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary/90 transition font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          Invalid match ID
        </div>
      </>
    );
  }

  const error = matchError || predictionError;

  return (
    <>
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/90 transition font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <PageHeader 
          title="Match Detail" 
          metaDescription="Detailed match information and predictions"
        />
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          {error.message}
        </div>
      )}
      
      <AppGrid id="match-detail" widgets={widgets} />
    </>
  );
}