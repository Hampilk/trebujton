#!/usr/bin/env python3
"""
Demo script for ML Pipeline
Demonstrates the complete ML pipeline functionality.
"""

import sys
import os
from pathlib import Path

# Add ml directory to path
sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
import numpy as np
import json
import yaml
from datetime import datetime

# Import ML modules
from data_loader import DataLoader
from feature_engineering import FeatureEngineer
from evaluation import ModelEvaluator
from train_model import ModelTrainer
from ensemble_predictor import EnsemblePredictor
from model_registry import ModelRegistry
from supabase_client import SupabaseClient


def create_demo_config():
    """Create demo configuration file."""
    demo_config = {
        'database': {
            'supabase_url': 'https://demo.supabase.co',
            'supabase_key': 'demo-key',
            'schema': 'public'
        },
        'models': {
            'full_time': {
                'name': 'Full-time Result Predictor',
                'algorithm': 'LogisticRegression',
                'target_column': 'full_time_result',
                'features': [
                    'team_strength_diff', 'home_advantage', 'recent_form',
                    'league_position_diff', 'home_goals_avg', 'away_goals_avg'
                ],
                'hyperparameters': {
                    'C': 1.0,
                    'max_iter': 1000,
                    'random_state': 42
                }
            },
            'half_time': {
                'name': 'Half-time Result Predictor',
                'algorithm': 'RandomForestClassifier',
                'target_column': 'half_time_result',
                'hyperparameters': {
                    'n_estimators': 50,
                    'max_depth': 5,
                    'random_state': 42
                }
            }
        },
        'training': {
            'test_size': 0.3,
            'validation_size': 0.1,
            'cross_validation_folds': 3,
            'stratification_columns': ['league'],
            'random_state': 42,
            'feature_engineering': {
                'scaling_method': 'standard',
                'encoding_method': 'onehot',
                'handle_missing': 'impute',
                'outlier_treatment': 'winsorize'
            },
            'metrics': {
                'primary': 'accuracy',
                'secondary': ['f1_score', 'precision', 'recall']
            }
        },
        'logging': {
            'level': 'INFO',
            'format': 'json',
            'output': ['stdout'],
            'rotation': {
                'size': '10MB',
                'backup_count': 3
            }
        },
        'output': {
            'model_registry_path': 'demo_model_registry.json',
            'model_artifacts_path': 'demo_models',
            'logs_path': 'demo_logs'
        }
    }
    
    # Write demo config
    with open('demo_config.yaml', 'w') as f:
        yaml.dump(demo_config, f, default_flow_style=False)
    
    print("✅ Created demo configuration: demo_config.yaml")
    return 'demo_config.yaml'


def demo_data_loading():
    """Demonstrate data loading functionality."""
    print("\n" + "="*60)
    print("DEMO: Data Loading")
    print("="*60)
    
    config_path = create_demo_config()
    
    # Initialize data loader
    loader = DataLoader(config_path)
    
    # Load sample data
    print("Loading match data...")
    df = loader.load_match_data("database")
    
    # Display data summary
    summary = loader.get_data_summary(df)
    print(f"\n📊 Data Summary:")
    print(f"   • Total matches: {summary['total_rows']}")
    print(f"   • Total columns: {summary['total_columns']}")
    print(f"   • Leagues: {len(summary['leagues'])}")
    print(f"   • Seasons: {len(summary['seasons'])}")
    print(f"   • Date range: {summary['date_range']['start']} to {summary['date_range']['end']}")
    
    # Show sample data
    print(f"\n📋 Sample Data (first 3 rows):")
    print(df.head(3).to_string())
    
    return df, loader


def demo_feature_engineering(df, loader):
    """Demonstrate feature engineering."""
    print("\n" + "="*60)
    print("DEMO: Feature Engineering")
    print("="*60)
    
    # Create config for feature engineering
    config = {
        'training': {
            'feature_engineering': {
                'scaling_method': 'standard',
                'encoding_method': 'onehot',
                'handle_missing': 'impute',
                'outlier_treatment': 'winsorize'
            }
        }
    }
    
    # Initialize feature engineer
    fe = FeatureEngineer(config)
    
    # Add derived features
    print("Adding derived features...")
    df_with_features = loader.create_derived_features(df.copy())
    
    # Prepare features and target
    target_column = 'full_time_result'
    X = df_with_features.drop(columns=[target_column])
    y = df_with_features[target_column]
    
    print(f"Original features: {len(X.columns)}")
    
    # Feature engineering
    print("Running feature engineering...")
    X_processed, feature_info = fe.fit_transform(X, 'full_time', target_column)
    
    print(f"Processed features: {len(X_processed.columns)}")
    print(f"Feature engineering config: {feature_info['scaling_method']} scaling, {feature_info['encoding_method']} encoding")
    
    # Show feature importance (placeholder)
    print(f"\n🔧 Feature Info:")
    print(f"   • Model type: {feature_info['model_type']}")
    print(f"   • Total features: {feature_info['total_features']}")
    print(f"   • Scaling method: {feature_info['scaling_method']}")
    print(f"   • Missing handling: {feature_info['missing_handling']}")
    
    return X_processed, y, fe, feature_info


def demo_model_training(X, y, config_path):
    """Demonstrate model training."""
    print("\n" + "="*60)
    print("DEMO: Model Training")
    print("="*60)
    
    # Initialize trainer
    trainer = ModelTrainer(config_path, 'full_time', dry_run=True)
    
    print("Training full-time model (dry run)...")
    
    # Run training
    results = trainer.train()
    
    # Display results
    print(f"\n🎯 Training Results:")
    print(f"   • Model type: {results['model_type']}")
    print(f"   • Algorithm: {results['model_class']}")
    print(f"   • Accuracy: {results['evaluation_results']['metrics']['accuracy']:.4f}")
    print(f"   • F1-Score: {results['evaluation_results']['metrics']['f1_score']:.4f}")
    print(f"   • Training session: {results['training_session_id']}")
    print(f"   • Data rows: {results['data_summary']['total_rows']}")
    
    return results


def demo_model_registry():
    """Demonstrate model registry functionality."""
    print("\n" + "="*60)
    print("DEMO: Model Registry")
    print("="*60)
    
    # Create demo config
    config_path = create_demo_config()
    
    # Initialize registry
    config = yaml.safe_load(open(config_path))
    registry = ModelRegistry(config)
    
    # Add demo models
    print("Adding demo models to registry...")
    
    model1 = {
        'id': 'demo-model-1',
        'version': 'v1.0.0',
        'algorithm': 'LogisticRegression',
        'metrics': {'accuracy': 0.85, 'f1_score': 0.82},
        'status': 'active',
        'file_path': 'demo_models/full_time_v1_0_0.joblib',
        'model_type': 'full_time'
    }
    
    model2 = {
        'id': 'demo-model-2',
        'version': 'v1.1.0',
        'algorithm': 'RandomForestClassifier',
        'metrics': {'accuracy': 0.87, 'f1_score': 0.85},
        'status': 'candidate',
        'file_path': 'demo_models/full_time_v1_1_0.joblib',
        'model_type': 'full_time'
    }
    
    registry.add_model(model1)
    registry.add_model(model2)
    
    # Query models
    active_models = registry.get_models_by_status('active')
    candidate_models = registry.get_models_by_status('candidate')
    all_models = registry.get_all_models()
    
    print(f"\n📋 Registry Summary:")
    print(f"   • Total models: {len(all_models)}")
    print(f"   • Active models: {len(active_models)}")
    print(f"   • Candidate models: {len(candidate_models)}")
    
    # Performance summary
    summary = registry.get_model_performance_summary()
    print(f"\n📊 Performance Summary:")
    print(f"   • Best full-time model: {summary['best_models'].get('full_time', {}).get('version', 'None')}")
    print(f"   • Best accuracy: {summary['best_models'].get('full_time', {}).get('accuracy', 0):.4f}")
    
    return registry


def demo_ensemble_prediction():
    """Demonstrate ensemble prediction."""
    print("\n" + "="*60)
    print("DEMO: Ensemble Prediction")
    print("="*60)
    
    # Create demo config
    config_path = create_demo_config()
    
    # Initialize predictor (no models loaded in demo)
    predictor = EnsemblePredictor(config_path, 'full_time')
    
    print("Ensemble predictor initialized")
    print("Note: No models loaded in demo mode")
    
    # Show model status (empty)
    status = predictor.get_model_status()
    print(f"\n📊 Model Status:")
    print(f"   • Total models loaded: {status['total_models']}")
    print(f"   • Model type: {status['model_type']}")
    
    return predictor


def demo_supabase_client():
    """Demonstrate Supabase client functionality."""
    print("\n" + "="*60)
    print("DEMO: Supabase Client")
    print("="*60)
    
    # Create demo config
    config_path = create_demo_config()
    config = yaml.safe_load(open(config_path))
    
    # Initialize client
    client = SupabaseClient(config)
    
    # Test connection (will be mock in demo)
    connection_ok = client.test_connection()
    print(f"Supabase connection: {'✅ Connected' if connection_ok else '❌ Not connected (demo mode)'}")
    
    # Demo data insertion (will be logged to file)
    print("Inserting demo training run...")
    training_data = {
        'model_id': 'demo-model-123',
        'model_type': 'full_time',
        'algorithm': 'LogisticRegression',
        'training_session_id': 'demo-session-123',
        'status': 'completed',
        'metrics': {'accuracy': 0.85, 'f1_score': 0.82},
        'cross_validation_scores': {},
        'training_timestamp': datetime.now().isoformat(),
        'data_summary': {'total_rows': 1000}
    }
    
    result = client.insert_model_retraining_run(training_data)
    print(f"Training run insertion: {'✅ Success' if result else '❌ Failed'}")
    
    # Demo performance insertion
    print("Inserting demo performance metrics...")
    performance_data = {
        'model_id': 'demo-model-123',
        'accuracy': 0.85,
        'f1_score': 0.82,
        'precision': 0.83,
        'recall': 0.81,
        'roc_auc': 0.87,
        'evaluation_timestamp': datetime.now().isoformat(),
        'test_samples': 200,
        'model_type': 'full_time'
    }
    
    result = client.insert_model_performance(performance_data)
    print(f"Performance insertion: {'✅ Success' if result else '❌ Failed'}")
    
    # Demo history retrieval
    print("Retrieving performance history...")
    history = client.get_model_performance_history('full_time', limit=5)
    print(f"Retrieved {len(history)} performance records")
    
    return client


def demo_evaluation():
    """Demonstrate model evaluation functionality."""
    print("\n" + "="*60)
    print("DEMO: Model Evaluation")
    print("="*60)
    
    # Create demo config
    config_path = create_demo_config()
    config = yaml.safe_load(open(config_path))
    
    # Initialize evaluator
    evaluator = ModelEvaluator(config)
    
    # Create demo model and data
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    
    # Generate demo data
    np.random.seed(42)
    X_demo = pd.DataFrame({
        'feature1': np.random.randn(200),
        'feature2': np.random.randn(200),
        'feature3': np.random.randn(200)
    })
    y_demo = pd.Series(np.random.choice(['H', 'A', 'D'], 200))
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_demo, y_demo, test_size=0.3, random_state=42, stratify=y_demo
    )
    
    # Train demo model
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    print("Evaluating demo model...")
    results = evaluator.evaluate_model(model, X_test, y_test, 'full_time', 'Demo Model')
    
    # Display metrics
    metrics = results['metrics']
    print(f"\n📊 Evaluation Results:")
    print(f"   • Accuracy: {metrics['accuracy']:.4f}")
    print(f"   • Precision: {metrics['precision']:.4f}")
    print(f"   • Recall: {metrics['recall']:.4f}")
    print(f"   • F1-Score: {metrics['f1_score']:.4f}")
    print(f"   • Test samples: {results['metadata']['test_samples']}")
    
    # Cross-validation
    print("\nRunning cross-validation...")
    cv_results = evaluator.evaluate_with_cross_validation(model, X_demo, y_demo, 'full_time', cv_folds=3)
    
    primary_metric_scores = cv_results['cv_scores'].get('accuracy', {})
    if primary_metric_scores:
        print(f"   • CV Accuracy: {primary_metric_scores['mean']:.4f} (±{primary_metric_scores['std']:.4f})")
    
    return results, cv_results


def cleanup_demo_files():
    """Clean up demo files."""
    print("\n" + "="*60)
    print("CLEANUP")
    print("="*60)
    
    import shutil
    
    files_to_remove = [
        'demo_config.yaml',
        'demo_model_registry.json',
        'demo_logs',
        'demo_models'
    ]
    
    for file_path in files_to_remove:
        path = Path(file_path)
        try:
            if path.exists():
                if path.is_file():
                    path.unlink()
                    print(f"✅ Removed file: {file_path}")
                elif path.is_dir():
                    shutil.rmtree(path)
                    print(f"✅ Removed directory: {file_path}")
        except Exception as e:
            print(f"❌ Failed to remove {file_path}: {e}")


def main():
    """Run complete ML pipeline demo."""
    print("🚀 ML Pipeline Demo")
    print("="*60)
    print("This demo showcases the complete ML pipeline functionality.")
    print("="*60)
    
    try:
        # Run all demos
        df, loader = demo_data_loading()
        X, y, fe, feature_info = demo_feature_engineering(df, loader)
        
        config_path = create_demo_config()
        training_results = demo_model_training(X, y, config_path)
        
        registry = demo_model_registry()
        predictor = demo_ensemble_prediction()
        client = demo_supabase_client()
        eval_results, cv_results = demo_evaluation()
        
        print("\n" + "="*60)
        print("✅ DEMO COMPLETED SUCCESSFULLY")
        print("="*60)
        print("All ML pipeline components have been demonstrated:")
        print("• ✅ Data Loading & Preprocessing")
        print("• ✅ Feature Engineering")
        print("• ✅ Model Training")
        print("• ✅ Model Registry")
        print("• ✅ Ensemble Prediction")
        print("• ✅ Supabase Integration")
        print("• ✅ Model Evaluation")
        print("="*60)
        print("Demo files have been created in the current directory.")
        print("Run with --cleanup to remove demo files.")
        
        # Check for cleanup flag
        if '--cleanup' in sys.argv:
            cleanup_demo_files()
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()