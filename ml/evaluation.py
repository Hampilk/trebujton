"""
Model Evaluation Module
Handles model evaluation, metrics calculation, and results logging.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Union
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
from sklearn.model_selection import cross_val_score, StratifiedKFold
import structlog
from datetime import datetime
import json
from pathlib import Path

logger = structlog.get_logger()


class ModelEvaluator:
    """Handles model evaluation and metrics calculation."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize model evaluator with configuration."""
        self.config = config
        self.logger = logger.bind(component="model_evaluation")
        
        # Load evaluation metrics configuration
        self.metrics_config = config.get('training', {}).get('metrics', {})
        self.primary_metric = self.metrics_config.get('primary', 'accuracy')
        self.secondary_metrics = self.metrics_config.get('secondary', ['f1_score'])
    
    def evaluate_model(self, model, X_test: pd.DataFrame, y_test: pd.Series, 
                      model_type: str, model_name: str = None) -> Dict[str, Any]:
        """
        Evaluate a trained model on test data.
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test target
            model_type: Type of model ('full_time', 'half_time', 'pattern')
            model_name: Name/identifier for the model
            
        Returns:
            Dictionary containing evaluation results
        """
        self.logger.info("Starting model evaluation", model_type=model_type, model_name=model_name)
        
        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = None
        
        # Get prediction probabilities if available
        if hasattr(model, 'predict_proba'):
            y_pred_proba = model.predict_proba(X_test)
        
        # Calculate metrics
        results = self._calculate_metrics(y_test, y_pred, y_pred_proba, model_type)
        
        # Add metadata
        results['metadata'] = {
            'model_type': model_type,
            'model_name': model_name or f"{model_type}_model",
            'evaluation_timestamp': datetime.now().isoformat(),
            'test_samples': len(y_test),
            'test_features': X_test.shape[1]
        }
        
        # Add model information
        results['model_info'] = self._get_model_info(model)
        
        # Calculate feature importance if available
        if hasattr(X_test, 'columns'):
            results['feature_importance'] = self._get_feature_importance(model, X_test.columns.tolist())
        
        self.logger.info(
            "Model evaluation completed", 
            model_type=model_type,
            primary_metric=self.primary_metric,
            primary_score=results['metrics'][self.primary_metric]
        )
        
        return results
    
    def evaluate_with_cross_validation(self, model, X: pd.DataFrame, y: pd.Series, 
                                     model_type: str, cv_folds: int = 5) -> Dict[str, Any]:
        """
        Evaluate model using cross-validation.
        
        Args:
            model: Model to evaluate
            X: Features
            y: Target
            model_type: Type of model
            cv_folds: Number of cross-validation folds
            
        Returns:
            Cross-validation results
        """
        self.logger.info("Starting cross-validation evaluation", model_type=model_type, cv_folds=cv_folds)
        
        # Use stratified k-fold for classification
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        # Calculate cross-validation scores for primary metric
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring=self.primary_metric)
        
        # Calculate scores for all metrics
        all_cv_scores = {}
        for metric in [self.primary_metric] + self.secondary_metrics:
            try:
                scores = cross_val_score(model, X, y, cv=cv, scoring=metric)
                all_cv_scores[metric] = {
                    'mean': scores.mean(),
                    'std': scores.std(),
                    'scores': scores.tolist()
                }
            except Exception as e:
                self.logger.warning("Could not calculate CV score for metric", metric=metric, error=str(e))
        
        cv_results = {
            'model_type': model_type,
            'evaluation_method': 'cross_validation',
            'cv_folds': cv_folds,
            'primary_metric': self.primary_metric,
            'cv_scores': all_cv_scores,
            'evaluation_timestamp': datetime.now().isoformat()
        }
        
        self.logger.info(
            "Cross-validation completed",
            model_type=model_type,
            primary_mean=all_cv_scores.get(self.primary_metric, {}).get('mean', 0),
            primary_std=all_cv_scores.get(self.primary_metric, {}).get('std', 0)
        )
        
        return cv_results
    
    def _calculate_metrics(self, y_true: pd.Series, y_pred: np.ndarray, 
                          y_pred_proba: Optional[np.ndarray], model_type: str) -> Dict[str, Any]:
        """Calculate all relevant metrics based on model type."""
        metrics = {}
        
        # Classification metrics (for all model types in this case)
        metrics['accuracy'] = accuracy_score(y_true, y_pred)
        metrics['precision'] = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        metrics['recall'] = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        metrics['f1_score'] = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # ROC-AUC if probabilities are available
        if y_pred_proba is not None:
            try:
                # Convert to binary classification if needed
                if len(np.unique(y_true)) == 2:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba[:, 1])
                else:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba, multi_class='ovr')
            except Exception as e:
                self.logger.warning("Could not calculate ROC-AUC", error=str(e))
                metrics['roc_auc'] = None
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics['confusion_matrix'] = cm.tolist()
        
        # Classification report
        class_report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        metrics['classification_report'] = class_report
        
        # Add model-specific metrics
        metrics.update(self._calculate_model_specific_metrics(y_true, y_pred, model_type))
        
        return {
            'metrics': metrics,
            'predictions': y_pred.tolist(),
            'prediction_probabilities': y_pred_proba.tolist() if y_pred_proba is not None else None
        }
    
    def _calculate_model_specific_metrics(self, y_true: pd.Series, y_pred: np.ndarray, 
                                        model_type: str) -> Dict[str, Any]:
        """Calculate model-specific metrics."""
        specific_metrics = {}
        
        if model_type == 'full_time':
            # For full-time result prediction
            home_wins = np.sum(y_pred == 'H')
            away_wins = np.sum(y_pred == 'A')
            draws = np.sum(y_pred == 'D')
            
            specific_metrics['prediction_distribution'] = {
                'home_wins': int(home_wins),
                'away_wins': int(away_wins),
                'draws': int(draws),
                'home_win_rate': float(home_wins / len(y_pred)),
                'away_win_rate': float(away_wins / len(y_pred)),
                'draw_rate': float(draws / len(y_pred))
            }
        
        elif model_type == 'half_time':
            # For half-time result prediction
            ht_home_wins = np.sum(y_pred == 'H')
            ht_away_wins = np.sum(y_pred == 'A')
            ht_draws = np.sum(y_pred == 'D')
            
            specific_metrics['prediction_distribution'] = {
                'ht_home_wins': int(ht_home_wins),
                'ht_away_wins': int(ht_away_wins),
                'ht_draws': int(ht_draws)
            }
        
        elif model_type == 'pattern':
            # For pattern recognition
            pattern_matches = np.sum(y_pred == 1)
            pattern_mismatch = np.sum(y_pred == 0)
            
            specific_metrics['pattern_predictions'] = {
                'pattern_matches': int(pattern_matches),
                'pattern_mismatch': int(pattern_mismatch),
                'pattern_rate': float(pattern_matches / len(y_pred))
            }
        
        return specific_metrics
    
    def _get_model_info(self, model) -> Dict[str, Any]:
        """Get information about the model."""
        model_info = {
            'model_class': model.__class__.__name__,
            'model_module': model.__class__.__module__
        }
        
        # Add hyperparameters if available
        if hasattr(model, 'get_params'):
            try:
                model_info['hyperparameters'] = model.get_params()
            except Exception:
                model_info['hyperparameters'] = {}
        
        # Add additional model-specific info
        if hasattr(model, 'n_estimators'):
            model_info['n_estimators'] = model.n_estimators
        if hasattr(model, 'max_depth'):
            model_info['max_depth'] = model.max_depth
        if hasattr(model, 'C'):
            model_info['C'] = model.C
        
        return model_info
    
    def _get_feature_importance(self, model, feature_names: List[str]) -> Dict[str, Any]:
        """Get feature importance from the model."""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feature_importance = list(zip(feature_names, importances))
            feature_importance.sort(key=lambda x: x[1], reverse=True)
            
            return {
                'importance_type': 'feature_importances_',
                'features': [f[0] for f in feature_importance],
                'importances': [f[1] for f in feature_importance]
            }
        elif hasattr(model, 'coef_'):
            coefficients = np.abs(model.coef_[0])
            feature_importance = list(zip(feature_names, coefficients))
            feature_importance.sort(key=lambda x: x[1], reverse=True)
            
            return {
                'importance_type': 'coefficients',
                'features': [f[0] for f in feature_importance],
                'importances': [f[1] for f in feature_importance]
            }
        else:
            return {
                'importance_type': 'none',
                'features': [],
                'importances': []
            }
    
    def compare_models(self, evaluation_results: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Compare multiple model evaluation results.
        
        Args:
            evaluation_results: List of evaluation result dictionaries
            
        Returns:
            DataFrame with comparison metrics
        """
        comparison_data = []
        
        for result in evaluation_results:
            row = {
                'model_name': result['metadata']['model_name'],
                'model_type': result['metadata']['model_type'],
                'evaluation_timestamp': result['metadata']['evaluation_timestamp']
            }
            
            # Add main metrics
            for metric_name, metric_value in result['metrics'].items():
                if isinstance(metric_value, (int, float)) and not isinstance(metric_value, bool):
                    row[metric_name] = metric_value
            
            comparison_data.append(row)
        
        comparison_df = pd.DataFrame(comparison_data)
        
        self.logger.info("Model comparison completed", num_models=len(evaluation_results))
        return comparison_df
    
    def save_evaluation_results(self, results: Dict[str, Any], output_path: str):
        """Save evaluation results to a file."""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert numpy arrays to lists for JSON serialization
        serializable_results = self._make_json_serializable(results)
        
        with open(output_file, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        self.logger.info("Evaluation results saved", output_path=output_path)
    
    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert object to JSON serializable format."""
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: self._make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif isinstance(obj, (pd.Timestamp, datetime)):
            return obj.isoformat()
        else:
            return obj
    
    def generate_evaluation_summary(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable evaluation summary."""
        metrics = results['metrics']
        metadata = results['metadata']
        
        summary = f"""
Model Evaluation Summary
=======================

Model: {metadata['model_name']} ({metadata['model_type']})
Evaluation Date: {metadata['evaluation_timestamp']}
Test Samples: {metadata['test_samples']}
Test Features: {metadata['test_features']}

Primary Metrics:
- Accuracy: {metrics.get('accuracy', 0):.4f}
- Precision: {metrics.get('precision', 0):.4f}
- Recall: {metrics.get('recall', 0):.4f}
- F1-Score: {metrics.get('f1_score', 0):.4f}
- ROC-AUC: {metrics.get('roc_auc', 0):.4f}

Model Performance Rating: {self._get_performance_rating(metrics.get('accuracy', 0))}

        """.strip()
        
        return summary
    
    def _get_performance_rating(self, accuracy: float) -> str:
        """Get a performance rating based on accuracy."""
        if accuracy >= 0.9:
            return "Excellent"
        elif accuracy >= 0.8:
            return "Good"
        elif accuracy >= 0.7:
            return "Fair"
        elif accuracy >= 0.6:
            return "Poor"
        else:
            return "Very Poor"