import { useMemo } from 'react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Import the comprehensive PredictionReviewPanel from docs
import { PredictionReviewPanel } from '../../docs/reference-pages/components/admin/model-status/PredictionReviewPanel';

const PredictionReviewPageComponent = () => {
  const widgets = useMemo(() => ({
    review_panel: (
      <WidgetGroup>
        <PredictionReviewPanel 
          autoRefresh={true}
          refreshInterval={30000}
        />
      </WidgetGroup>
    ),
  }), []);

  return (
    <>
      <PageHeader 
        title="Prediction Review" 
        metaDescription="Review and manage blocked predictions with real-time updates"
      />
      <AppGrid id="prediction_review_page" widgets={widgets} />
    </>
  );
};

export default PredictionReviewPageComponent;
