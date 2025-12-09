#!/usr/bin/env python3
"""
Ensemble Predictor Module
Loads champion + challenger models and applies weighted blending for predictions.
"""

import argparse
import logging
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path
from sklearn.metrics import accuracy_score
import structlog
import yaml

try:
    from .data_loader import DataLoader
    from .feature_engineering import FeatureEngineer
    from .model_registry import ModelRegistry
    from .supabase_client import SupabaseClient
except ImportError:
    from data_loader import DataLoader
    from feature_engineering import FeatureEngineer
    from model_registry import ModelRegistry
    from supabase_client import SupabaseClient

logger = structlog.get_logger()


class EnsemblePredictor:
    """Handles ensemble prediction using multiple models with weighted blending."""
    
    def __init__(self, config_path: str, model_type: str = None):
        """
        Initialize ensemble predictor.
        
        Args:
            config_path: Path to configuration file
            model_type: Type of models to use (optional, can be specified per prediction)
        """
        self.config_path = config_path
        self.model_type = model_type
        self.config = self._load_config()
        
        # Initialize components
        self.data_loader = DataLoader(config_path)
        self.feature_engineer = None  # Will be initialized when models are loaded
        self.model_registry = ModelRegistry(self.config)
        self.supabase_client = SupabaseClient(self.config)
        
        # Loaded models
        self.models = {}
        self.model_weights = {}
        self.model_info = {}
        
        self.logger = logger.bind(component="ensemble_predictor")
        
        # Set up logging
        self._setup_logging()
        
        # Load available models
        self._load_models()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            # Replace environment variables
            config = self._replace_env_variables(config)
            
            self.logger.info("Configuration loaded", config_path=self.config_path)
            return config
        except Exception as e:
            self.logger.error("Failed to load configuration", error=str(e))
            raise
    
    def _replace_env_variables(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Replace environment variables in config."""
        import os
        
        def replace_value(value):
            if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                env_var = value[2:-1]
                return os.getenv(env_var, value)
            elif isinstance(value, dict):
                return {k: replace_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [replace_value(item) for item in value]
            else:
                return value
        
        return replace_value(config)
    
    def _setup_logging(self):
        """Set up structured logging."""
        log_config = self.config.get('logging', {})
        
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
    
    def _load_models(self):
        """Load champion and challenger models from registry."""
        self.logger.info("Loading ensemble models")
        
        try:
            # Get all active and candidate models
            active_models = self.model_registry.get_models_by_status('active')
            candidate_models = self.model_registry.get_models_by_status('candidate')
            
            # Filter by model type if specified
            if self.model_type:
                active_models = [m for m in active_models if m.get('model_type') == self.model_type]
                candidate_models = [m for m in candidate_models if m.get('model_type') == self.model_type]
            
            # Load champion model (most recent active)
            if active_models:
                champion = max(active_models, key=lambda x: x['created_at'])
                self._load_single_model(champion, weight=0.7)  # Default 70% weight for champion
            
            # Load up to 2 challenger models
            challengers = sorted(candidate_models, key=lambda x: x['metrics'].get('accuracy', 0), reverse=True)[:2]
            
            remaining_weight = 0.3  # Total weight for challengers
            challenger_weight = remaining_weight / len(challengers) if challengers else 0
            
            for challenger in challengers:
                self._load_single_model(challenger, weight=challenger_weight)
            
            self.logger.info(
                "Models loaded", 
                champion_loaded=bool(active_models),
                challengers_loaded=len(challengers),
                total_models=len(self.models)
            )
            
        except Exception as e:
            self.logger.error("Failed to load models", error=str(e))
            raise
    
    def _load_single_model(self, model_entry: Dict[str, Any], weight: float):
        """Load a single model from file."""
        try:
            model_path = Path(model_entry['file_path'])
            if not model_path.exists():
                self.logger.warning("Model file not found", model_path=str(model_path))
                return
            
            # Load model package
            model_package = joblib.load(model_path)
            model = model_package['model']
            feature_info = model_package.get('feature_info', {})
            
            # Store model and metadata
            model_id = model_entry['id']
            self.models[model_id] = {
                'model': model,
                'feature_info': feature_info,
                'model_entry': model_entry
            }
            
            self.model_weights[model_id] = weight
            self.model_info[model_id] = {
                'version': model_entry['version'],
                'algorithm': model_entry['algorithm'],
                'accuracy': model_entry['metrics'].get('accuracy', 0),
                'status': model_entry['status']
            }
            
            # Initialize feature engineer with the first loaded model's feature info
            if self.feature_engineer is None:
                self.feature_engineer = FeatureEngineer(self.config)
            
            self.logger.debug(
                "Model loaded", 
                model_id=model_id,
                weight=weight,
                accuracy=model_entry['metrics'].get('accuracy', 0)
            )
            
        except Exception as e:
            self.logger.error("Failed to load model", model_id=model_entry['id'], error=str(e))
    
    def predict_single(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make prediction for a single match.
        
        Args:
            match_data: Dictionary containing match information
            
        Returns:
            Prediction results with confidence scores
        """
        if not self.models:
            raise ValueError("No models loaded for prediction")
        
        # Convert to DataFrame for processing
        df = pd.DataFrame([match_data])
        
        # Preprocess data
        X_processed = self._preprocess_data(df, self.model_type or 'full_time')
        
        # Get predictions from all models
        predictions = {}
        probabilities = {}
        
        for model_id, model_data in self.models.items():
            model = model_data['model']
            
            try:
                pred = model.predict(X_processed)[0]
                predictions[model_id] = pred
                
                # Get probabilities if available
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(X_processed)[0]
                    probabilities[model_id] = proba
                    
            except Exception as e:
                self.logger.error("Prediction failed", model_id=model_id, error=str(e))
                continue
        
        if not predictions:
            raise ValueError("All model predictions failed")
        
        # Ensemble prediction
        ensemble_result = self._ensemble_predict(predictions, probabilities)
        
        # Prepare response
        result = {
            'prediction': ensemble_result['prediction'],
            'confidence': ensemble_result['confidence'],
            'model_weights': self.model_weights,
            'individual_predictions': predictions,
            'individual_probabilities': probabilities,
            'model_info': self.model_info,
            'ensemble_method': 'weighted_average',
            'timestamp': datetime.now().isoformat()
        }
        
        # Add breakdown if probabilities available
        if probabilities:
            result['probability_breakdown'] = self._get_probability_breakdown(probabilities)
        
        self.logger.info(
            "Prediction completed", 
            model_type=self.model_type,
            prediction=ensemble_result['prediction'],
            confidence=ensemble_result['confidence']
        )
        
        return result
    
    def predict_batch(self, matches_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Make predictions for multiple matches.
        
        Args:
            matches_data: List of match dictionaries
            
        Returns:
            List of prediction results
        """
        results = []
        
        self.logger.info("Starting batch prediction", num_matches=len(matches_data))
        
        for i, match_data in enumerate(matches_data):
            try:
                prediction = self.predict_single(match_data)
                prediction['match_index'] = i
                results.append(prediction)
            except Exception as e:
                self.logger.error("Batch prediction failed", match_index=i, error=str(e))
                # Add error result
                results.append({
                    'match_index': i,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        self.logger.info("Batch prediction completed", successful=len([r for r in results if 'error' not in r]))
        return results
    
    def _preprocess_data(self, df: pd.DataFrame, model_type: str) -> pd.DataFrame:
        """Preprocess data for prediction."""
        # Add derived features (simplified version)
        df = self.data_loader.create_derived_features(df)
        
        # Get feature columns for model type
        feature_columns = self.data_loader.get_features_by_model_type(model_type)
        
        # Add derived features
        df = self._add_prediction_features(df)
        
        # Transform using feature engineer
        if self.feature_engineer and model_type in self.feature_engineer.feature_names:
            feature_cols = self.feature_engineer.feature_names[model_type]
            X_processed = self.feature_engineer.transform(df, model_type)
        else:
            # Fallback: select numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            X_processed = df[numeric_cols].fillna(0)
        
        return X_processed
    
    def _add_prediction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add features needed for prediction."""
        # Ensure required features exist
        if 'team_strength_diff' not in df.columns:
            if 'home_team_strength' in df.columns and 'away_team_strength' in df.columns:
                df['team_strength_diff'] = df['home_team_strength'] - df['away_team_strength']
            else:
                df['team_strength_diff'] = 0
        
        if 'home_advantage' not in df.columns:
            df['home_advantage'] = 1
        
        if 'form_diff' not in df.columns:
            if 'home_recent_form' in df.columns and 'away_recent_form' in df.columns:
                df['form_diff'] = df['home_recent_form'] - df['away_recent_form']
            else:
                df['form_diff'] = 0
        
        return df
    
    def _ensemble_predict(self, predictions: Dict[str, Any], probabilities: Dict[str, Any]) -> Dict[str, Any]:
        """Combine predictions using weighted ensemble."""
        if not predictions:
            raise ValueError("No predictions to ensemble")
        
        # If only one model, return its prediction
        if len(predictions) == 1:
            model_id = list(predictions.keys())[0]
            return {
                'prediction': predictions[model_id],
                'confidence': 1.0
            }
        
        # For classification, use weighted voting
        if probabilities:
            return self._weighted_probability_ensemble(probabilities)
        else:
            return self._weighted_voting_ensemble(predictions)
    
    def _weighted_probability_ensemble(self, probabilities: Dict[str, Any]) -> Dict[str, Any]:
        """Ensemble using weighted average of probabilities."""
        # Get unique classes
        all_classes = set()
        for proba in probabilities.values():
            all_classes.update(range(len(proba)))
        
        all_classes = sorted(list(all_classes))
        
        # Calculate weighted average probabilities
        weighted_probs = np.zeros(len(all_classes))
        total_weight = 0
        
        for model_id, proba in probabilities.items():
            weight = self.model_weights.get(model_id, 0)
            weighted_probs += proba * weight
            total_weight += weight
        
        # Normalize
        if total_weight > 0:
            weighted_probs /= total_weight
        
        # Get final prediction
        predicted_class = all_classes[np.argmax(weighted_probs)]
        confidence = np.max(weighted_probs)
        
        return {
            'prediction': predicted_class,
            'confidence': float(confidence)
        }
    
    def _weighted_voting_ensemble(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Ensemble using weighted voting on class predictions."""
        # Count weighted votes for each class
        vote_counts = {}
        
        for model_id, prediction in predictions.items():
            weight = self.model_weights.get(model_id, 0)
            vote_counts[prediction] = vote_counts.get(prediction, 0) + weight
        
        # Get most voted class
        predicted_class = max(vote_counts.items(), key=lambda x: x[1])[0]
        
        # Calculate confidence as proportion of votes
        total_votes = sum(vote_counts.values())
        confidence = vote_counts[predicted_class] / total_votes if total_votes > 0 else 0
        
        return {
            'prediction': predicted_class,
            'confidence': float(confidence)
        }
    
    def _get_probability_breakdown(self, probabilities: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed probability breakdown by model."""
        breakdown = {}
        
        for model_id, proba in probabilities.items():
            breakdown[model_id] = {
                'probabilities': proba.tolist(),
                'weight': self.model_weights.get(model_id, 0),
                'model_info': self.model_info[model_id]
            }
        
        return breakdown
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of loaded models."""
        return {
            'total_models': len(self.models),
            'models': {
                model_id: {
                    'weight': self.model_weights[model_id],
                    'info': self.model_info[model_id]
                }
                for model_id in self.models.keys()
            },
            'model_type': self.model_type,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_ensemble_performance(self, validation_data: pd.DataFrame, y_true: pd.Series) -> Dict[str, Any]:
        """
        Evaluate ensemble performance on validation data.
        
        Args:
            validation_data: Feature data
            y_true: True labels
            
        Returns:
            Performance metrics
        """
        if not self.models:
            raise ValueError("No models loaded for evaluation")
        
        # Make predictions
        predictions = []
        for _, row in validation_data.iterrows():
            try:
                match_data = row.to_dict()
                pred_result = self.predict_single(match_data)
                predictions.append(pred_result['prediction'])
            except Exception as e:
                self.logger.error("Evaluation prediction failed", error=str(e))
                predictions.append(None)
        
        # Calculate ensemble accuracy (only for successful predictions)
        valid_predictions = [(p, t) for p, t in zip(predictions, y_true) if p is not None]
        
        if valid_predictions:
            y_pred_valid, y_true_valid = zip(*valid_predictions)
            accuracy = accuracy_score(y_true_valid, y_pred_valid)
        else:
            accuracy = 0.0
        
        return {
            'ensemble_accuracy': accuracy,
            'total_predictions': len(predictions),
            'successful_predictions': len(valid_predictions),
            'failure_rate': (len(predictions) - len(valid_predictions)) / len(predictions),
            'timestamp': datetime.now().isoformat()
        }


def main():
    """Main CLI entry point for ensemble prediction."""
    parser = argparse.ArgumentParser(
        description='Ensemble prediction for football matches',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Predict single match
  python -m ml.ensemble_predictor --config config/config.yaml --predict-single
  
  # Predict batch from CSV
  python -m ml.ensemble_predictor --config config/config.yaml --predict-batch matches.csv
  
  # Get model status
  python -m ml.ensemble_predictor --config config/config.yaml --status
        """
    )
    
    parser.add_argument(
        '--config',
        required=True,
        help='Path to configuration file'
    )
    
    parser.add_argument(
        '--model-type',
        choices=['full_time', 'half_time', 'pattern'],
        help='Type of models to use for prediction'
    )
    
    parser.add_argument(
        '--predict-single',
        action='store_true',
        help='Predict single match from interactive input'
    )
    
    parser.add_argument(
        '--predict-batch',
        help='Predict batch of matches from CSV file'
    )
    
    parser.add_argument(
        '--status',
        action='store_true',
        help='Show status of loaded models'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Set up logging
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize predictor
        predictor = EnsemblePredictor(
            config_path=args.config,
            model_type=args.model_type
        )
        
        if args.status:
            # Show model status
            status = predictor.get_model_status()
            print("\n" + "="*60)
            print("ENSEMBLE MODEL STATUS")
            print("="*60)
            print(f"Total Models: {status['total_models']}")
            print(f"Model Type: {status['model_type']}")
            
            for model_id, model_data in status['models'].items():
                info = model_data['info']
                print(f"\nModel: {model_id}")
                print(f"  Version: {info['version']}")
                print(f"  Algorithm: {info['algorithm']}")
                print(f"  Accuracy: {info['accuracy']:.4f}")
                print(f"  Status: {info['status']}")
                print(f"  Weight: {model_data['weight']:.3f}")
            
            print("="*60)
            
        elif args.predict_single:
            # Interactive single prediction
            print("\n" + "="*60)
            print("SINGLE MATCH PREDICTION")
            print("="*60)
            
            # Get match data from user
            match_data = {
                'home_team': input("Home team: "),
                'away_team': input("Away team: "),
                'league': input("League: "),
                'home_team_strength': float(input("Home team strength (-2 to 2): ") or "0"),
                'away_team_strength': float(input("Away team strength (-2 to 2): ") or "0"),
                'home_recent_form': float(input("Home recent form (-2 to 2): ") or "0"),
                'away_recent_form': float(input("Away recent form (-2 to 2): ") or "0")
            }
            
            # Make prediction
            result = predictor.predict_single(match_data)
            
            print("\n" + "="*60)
            print("PREDICTION RESULTS")
            print("="*60)
            print(f"Prediction: {result['prediction']}")
            print(f"Confidence: {result['confidence']:.4f}")
            print(f"Ensemble Method: {result['ensemble_method']}")
            
            if 'probability_breakdown' in result:
                print("\nIndividual Model Predictions:")
                for model_id, breakdown in result['probability_breakdown'].items():
                    info = result['model_info'][model_id]
                    print(f"  {info['version']} ({info['algorithm']}): {breakdown['probabilities']}")
            
            print("="*60)
            
        elif args.predict_batch:
            # Batch prediction from file
            input_file = Path(args.predict_batch)
            if not input_file.exists():
                raise FileNotFoundError(f"Input file not found: {input_file}")
            
            # Load data
            if input_file.suffix.lower() == '.csv':
                matches_data = pd.read_csv(input_file).to_dict('records')
            elif input_file.suffix.lower() == '.json':
                with open(input_file, 'r') as f:
                    matches_data = json.load(f)
            else:
                raise ValueError("Unsupported file format. Use CSV or JSON.")
            
            # Make batch predictions
            results = predictor.predict_batch(matches_data)
            
            # Save results
            output_file = input_file.parent / f"{input_file.stem}_predictions.json"
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            
            print(f"\nBatch prediction completed: {len(results)} matches")
            print(f"Results saved to: {output_file}")
            
        else:
            parser.print_help()
            
    except Exception as e:
        logger.error("Prediction failed", error=str(e), exc_info=True)
        print(f"\nERROR: Prediction failed: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()