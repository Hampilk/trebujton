"""
ML Pipeline Package
Machine Learning module for football prediction models.

This package provides a complete ML pipeline including:
- Data loading and preprocessing
- Feature engineering
- Model training and evaluation
- Ensemble prediction
- Model registry and tracking
"""

__version__ = "1.0.0"
__author__ = "ML Pipeline Team"

# Import main classes for easy access
from .data_loader import DataLoader
from .feature_engineering import FeatureEngineer
from .evaluation import ModelEvaluator
from .train_model import ModelTrainer
from .ensemble_predictor import EnsemblePredictor
from .supabase_client import SupabaseClient
from .model_registry import ModelRegistry
from .logging_utils import MLLogger, get_logger, setup_ml_logging

__all__ = [
    'DataLoader',
    'FeatureEngineer', 
    'ModelEvaluator',
    'ModelTrainer',
    'EnsemblePredictor',
    'SupabaseClient',
    'ModelRegistry',
    'MLLogger',
    'get_logger',
    'setup_ml_logging'
]