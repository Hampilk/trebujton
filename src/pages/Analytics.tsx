import React from 'react';
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import AccuracyChart from '@widgets/AccuracyChart';
import ConfidenceDistribution from '@widgets/ConfidenceDistribution';
import ModelComparison from '@widgets/ModelComparison';
import StreakAnalysis from '@widgets/StreakAnalysis';
import PatternHeatmap from '@widgets/PatternHeatmap';
import TransitionMatrix from '@widgets/TransitionMatrix';

const widgets = {
  accuracy_chart: <AccuracyChart />,
  confidence_distribution: <ConfidenceDistribution />,
  model_comparison: <ModelComparison />,
  streak_analysis: <StreakAnalysis />,
  pattern_heatmap: <PatternHeatmap />,
  transition_matrix: <TransitionMatrix />,
};

const Analytics: React.FC = () => {
  return (
    <>
      <PageHeader title="Analytics Dashboard" />
      <AppGrid id="analytics" widgets={widgets} />
    </>
  );
};

export default Analytics;
