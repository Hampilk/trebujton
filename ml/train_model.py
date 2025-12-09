#!/usr/bin/env python3
"""
Model Training Module
Main CLI entry point for training ML models with full pipeline orchestration.
"""

import argparse
import logging
import sys
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import yaml
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from xgboost import XGBClassifier
import structlog
import os
import subprocess

# Import our custom modules
try:
    from .data_loader import DataLoader
    from .feature_engineering import FeatureEngineer
    from .evaluation import ModelEvaluator
    from .supabase_client import SupabaseClient
    from .model_registry import ModelRegistry
except ImportError:
    from data_loader import DataLoader
    from feature_engineering import FeatureEngineer
    from evaluation import ModelEvaluator
    from supabase_client import SupabaseClient
    from model_registry import ModelRegistry

logger = structlog.get_logger()


class ModelTrainer:
    """Orchestrates the complete ML model training pipeline."""
    
    def __init__(self, config_path: str, model_type: str, dry_run: bool = False):
        """
        Initialize the model trainer.
        
        Args:
            config_path: Path to configuration file
            model_type: Type of model to train ('full_time', 'half_time', 'pattern')
            dry_run: If True, only simulate the training process
        """
        self.config_path = config_path
        self.model_type = model_type
        self.dry_run = dry_run
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize components
        self.data_loader = DataLoader(config_path)
        self.feature_engineer = FeatureEngineer(self.config)
        self.evaluator = ModelEvaluator(self.config)
        self.supabase_client = SupabaseClient(self.config)
        self.model_registry = ModelRegistry(self.config)
        
        # Set up logging
        self._setup_logging()
        
        # Training metadata
        self.training_session_id = str(uuid.uuid4())
        self.model_id = str(uuid.uuid4())
        
        self.logger = logger.bind(
            component="model_trainer",
            model_type=model_type,
            training_session_id=self.training_session_id
        )
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            # Replace environment variables
            config = self._replace_env_variables(config)
            
            self.logger.info("Configuration loaded successfully", config_path=self.config_path)
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
        
        # Set log level
        log_level = log_config.get('level', 'INFO')
        logging.getLogger().setLevel(getattr(logging, log_level))
    
    def train(self) -> Dict[str, Any]:
        """
        Execute the complete model training pipeline.
        
        Returns:
            Training results dictionary
        """
        self.logger.info("Starting model training pipeline", model_type=self.model_type)
        
        try:
            # Step 1: Load and validate data
            self.logger.info("Step 1: Loading data")
            df = self.data_loader.load_match_data("database")
            self.logger.info("Data loaded successfully", rows=len(df), columns=len(df.columns))
            
            # Step 2: Data exploration and summary
            data_summary = self.data_loader.get_data_summary(df)
            self.logger.info("Data summary", summary=data_summary)
            
            # Step 3: Feature engineering
            self.logger.info("Step 2: Feature engineering")
            target_column = self.config['models'][self.model_type]['target_column']
            
            # Check if target column exists
            if target_column not in df.columns:
                raise ValueError(f"Target column '{target_column}' not found in data")
            
            # Split features and target
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            # Feature engineering
            X_processed, feature_info = self.feature_engineer.fit_transform(X, self.model_type, target_column)
            
            # Ensure we have the same number of samples
            y = y.loc[X_processed.index]
            
            self.logger.info("Feature engineering completed", features=len(X_processed.columns))
            
            # Step 4: Data splitting with stratification
            self.logger.info("Step 3: Data splitting")
            X_train, X_test, y_train, y_test = self._split_data(X_processed, y)
            
            self.logger.info("Data split completed", 
                           train_size=len(X_train), 
                           test_size=len(X_test))
            
            # Step 5: Model training
            self.logger.info("Step 4: Model training")
            model = self._train_model(X_train, y_train)
            
            self.logger.info("Model training completed", model_class=model.__class__.__name__)
            
            # Step 6: Model evaluation
            self.logger.info("Step 5: Model evaluation")
            evaluation_results = self.evaluator.evaluate_model(
                model, X_test, y_test, self.model_type
            )
            
            # Step 7: Cross-validation
            self.logger.info("Step 6: Cross-validation")
            cv_results = self.evaluator.evaluate_with_cross_validation(
                model, X_processed, y, self.model_type
            )
            
            # Step 8: Model persistence (skip in dry run)
            if not self.dry_run:
                self.logger.info("Step 7: Saving model")
                model_path = self._save_model(model, feature_info)
                
                # Step 9: Register model
                self.logger.info("Step 8: Registering model")
                registry_entry = self._register_model(evaluation_results, model_path)
                
                # Step 10: Save to Supabase
                self.logger.info("Step 9: Saving to Supabase")
                self._save_to_supabase(evaluation_results, cv_results, registry_entry)
            
            # Compile final results
            training_results = {
                'training_session_id': self.training_session_id,
                'model_id': self.model_id,
                'model_type': self.model_type,
                'model_class': model.__class__.__name__,
                'configuration': {
                    'model_config': self.config['models'][self.model_type],
                    'training_config': self.config.get('training', {}),
                    'feature_config': feature_info
                },
                'data_summary': data_summary,
                'evaluation_results': evaluation_results,
                'cross_validation_results': cv_results,
                'training_timestamp': datetime.now().isoformat(),
                'dry_run': self.dry_run
            }
            
            self.logger.info("Model training pipeline completed successfully", 
                           primary_metric=evaluation_results['metrics']['accuracy'])
            
            return training_results
            
        except Exception as e:
            self.logger.error("Model training failed", error=str(e), exc_info=True)
            raise
    
    def _split_data(self, X: pd.DataFrame, y: pd.Series) -> tuple:
        """Split data with stratification."""
        training_config = self.config.get('training', {})
        test_size = training_config.get('test_size', 0.2)
        random_state = training_config.get('random_state', 42)
        
        # Use stratification columns if available
        stratification_columns = training_config.get('stratification_columns', [])
        
        if stratification_columns:
            # Add target to stratification if needed
            stratify_cols = stratification_columns + [y.name]
            X_with_target = X.copy()
            X_with_target['target'] = y
            
            X_train, X_test, y_train, y_test = train_test_split(
                X_with_target.drop('target', axis=1), 
                X_with_target['target'],
                test_size=test_size,
                random_state=random_state,
                stratify=X_with_target[stratification_columns]
            )
        else:
            # Simple stratified split on target
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )
        
        return X_train, X_test, y_train, y_test
    
    def _train_model(self, X_train: pd.DataFrame, y_train: pd.Series):
        """Train the model based on configuration."""
        model_config = self.config['models'][self.model_type]
        algorithm = model_config['algorithm']
        hyperparameters = model_config.get('hyperparameters', {})
        
        # Add random_state to hyperparameters if not present
        if 'random_state' not in hyperparameters:
            hyperparameters['random_state'] = self.config.get('training', {}).get('random_state', 42)
        
        # Initialize model based on algorithm
        if algorithm == 'LogisticRegression':
            model = LogisticRegression(**hyperparameters)
        elif algorithm == 'RandomForestClassifier':
            model = RandomForestClassifier(**hyperparameters)
        elif algorithm == 'GradientBoostingClassifier':
            model = GradientBoostingClassifier(**hyperparameters)
        elif algorithm == 'XGBClassifier':
            model = XGBClassifier(**hyperparameters)
        elif algorithm == 'SVC':
            model = SVC(**hyperparameters, probability=True)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Train the model
        model.fit(X_train, y_train)
        
        self.logger.info("Model trained", algorithm=algorithm, hyperparameters=hyperparameters)
        return model
    
    def _save_model(self, model, feature_info: Dict[str, Any]) -> str:
        """Save the trained model and metadata."""
        output_config = self.config.get('output', {})
        models_path = Path(output_config.get('model_artifacts_path', 'ml/models'))
        models_path.mkdir(parents=True, exist_ok=True)
        
        # Generate model filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{self.model_type}_{timestamp}_{self.model_id[:8]}.joblib"
        model_path = models_path / filename
        
        # Prepare model package
        model_package = {
            'model': model,
            'feature_info': feature_info,
            'model_config': self.config['models'][self.model_type],
            'training_config': self.config.get('training', {}),
            'model_id': self.model_id,
            'model_type': self.model_type,
            'created_at': datetime.now().isoformat(),
            'version': f"v1.0.0"  # Could be more sophisticated
        }
        
        # Save model
        joblib.dump(model_package, model_path)
        
        self.logger.info("Model saved", model_path=str(model_path))
        return str(model_path)
    
    def _register_model(self, evaluation_results: Dict[str, Any], model_path: str) -> Dict[str, Any]:
        """Register model in the local registry."""
        registry_entry = {
            'id': self.model_id,
            'version': f"v1.0.0",
            'algorithm': evaluation_results['model_info']['model_class'],
            'metrics': {
                'accuracy': evaluation_results['metrics']['accuracy'],
                'f1_score': evaluation_results['metrics']['f1_score'],
                'precision': evaluation_results['metrics']['precision'],
                'recall': evaluation_results['metrics']['recall'],
                'roc_auc': evaluation_results['metrics'].get('roc_auc', 0)
            },
            'created_at': datetime.now().isoformat(),
            'status': 'candidate',  # Initially as candidate
            'file_path': model_path,
            'model_type': self.model_type,
            'training_session_id': self.training_session_id
        }
        
        # Add to registry
        registry_data = self.model_registry.add_model(registry_entry)
        
        self.logger.info("Model registered", model_id=self.model_id, status='candidate')
        return registry_entry
    
    def _save_to_supabase(self, evaluation_results: Dict[str, Any], 
                         cv_results: Dict[str, Any], registry_entry: Dict[str, Any]):
        """Save training results to Supabase."""
        try:
            # Save training run
            training_run_data = {
                'model_id': self.model_id,
                'model_type': self.model_type,
                'algorithm': registry_entry['algorithm'],
                'training_session_id': self.training_session_id,
                'status': 'completed',
                'metrics': evaluation_results['metrics'],
                'cross_validation_scores': cv_results.get('cv_scores', {}),
                'model_config': self.config['models'][self.model_type],
                'feature_config': evaluation_results.get('feature_importance', {}),
                'training_timestamp': datetime.now().isoformat(),
                'data_summary': evaluation_results['metadata']
            }
            
            self.supabase_client.insert_model_retraining_run(training_run_data)
            
            # Save model performance
            performance_data = {
                'model_id': self.model_id,
                'accuracy': evaluation_results['metrics']['accuracy'],
                'f1_score': evaluation_results['metrics']['f1_score'],
                'precision': evaluation_results['metrics']['precision'],
                'recall': evaluation_results['metrics']['recall'],
                'roc_auc': evaluation_results['metrics'].get('roc_auc', 0),
                'confusion_matrix': evaluation_results['metrics'].get('confusion_matrix', []),
                'evaluation_timestamp': evaluation_results['metadata']['evaluation_timestamp'],
                'test_samples': evaluation_results['metadata']['test_samples'],
                'model_type': self.model_type
            }
            
            self.supabase_client.insert_model_performance(performance_data)
            
            self.logger.info("Results saved to Supabase", model_id=self.model_id)
            
        except Exception as e:
            self.logger.error("Failed to save to Supabase", error=str(e))
            # Don't raise here - training should still be considered successful


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Train ML models for football prediction',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train full-time model
  python -m ml.train_model --model-type full_time --config config/config.yaml
  
  # Train with dry run (no model saving)
  python -m ml.train_model --model-type half_time --config config/config.yaml --dry-run
  
  # Train pattern model
  python -m ml.train_model --model-type pattern --config config/config.yaml
        """
    )
    
    parser.add_argument(
        '--model-type',
        required=True,
        choices=['full_time', 'half_time', 'pattern'],
        help='Type of model to train'
    )
    
    parser.add_argument(
        '--config',
        required=True,
        help='Path to configuration file'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate training without saving models or updating database'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Set up logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize trainer
        trainer = ModelTrainer(
            config_path=args.config,
            model_type=args.model_type,
            dry_run=args.dry_run
        )
        
        # Run training
        results = trainer.train()
        
        # Print summary
        print("\n" + "="*60)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"Model Type: {results['model_type']}")
        print(f"Training Session ID: {results['training_session_id']}")
        print(f"Model ID: {results['model_id']}")
        print(f"Algorithm: {results['model_class']}")
        print(f"Accuracy: {results['evaluation_results']['metrics']['accuracy']:.4f}")
        print(f"F1-Score: {results['evaluation_results']['metrics']['f1_score']:.4f}")
        print(f"Training Timestamp: {results['training_timestamp']}")
        
        if not args.dry_run:
            print(f"Model Status: {results['evaluation_results']['metadata'].get('status', 'candidate')}")
            print("Model has been saved and registered successfully.")
        else:
            print("Dry run completed - no models saved.")
        
        print("="*60)
        
        # Exit with success code
        sys.exit(0)
        
    except Exception as e:
        logger.error("Training failed", error=str(e), exc_info=True)
        print(f"\nERROR: Training failed: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()