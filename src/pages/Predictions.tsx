import React, { useState } from 'react';
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import PredictionsView from '@widgets/PredictionsView';
import EnsembleBreakdown from '@widgets/EnsembleBreakdown';
import PredictionAnalytics from '@widgets/PredictionAnalytics';
import CreatePredictionButton from '@components/CreatePredictionButton';

const widgets = {
    predictions_view: <PredictionsView />,
    ensemble_breakdown: <EnsembleBreakdown />,
    prediction_analytics: <PredictionAnalytics />
};

const Predictions: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <>
            <PageHeader title="Predictions" />
            <CreatePredictionButton 
                onOpen={() => setShowCreateModal(true)}
                onClose={() => setShowCreateModal(false)}
                isOpen={showCreateModal}
            />
            <AppGrid id="predictions" widgets={widgets} />
        </>
    );
};

export default Predictions;
