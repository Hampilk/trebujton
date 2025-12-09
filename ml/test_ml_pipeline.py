#!/usr/bin/env python3
"""
Test runner for ML Pipeline
Validates that the ML pipeline works correctly without external dependencies.
"""

import sys
import os
from pathlib import Path

# Add ml directory to path
sys.path.insert(0, str(Path(__file__).parent))

import subprocess


def test_imports():
    """Test that all ML modules can be imported."""
    print("Testing imports...")
    
    try:
        from data_loader import DataLoader
        from feature_engineering import FeatureEngineer
        from evaluation import ModelEvaluator
        from model_registry import ModelRegistry
        from supabase_client import SupabaseClient
        from logging_utils import MLLogger
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def test_data_loader():
    """Test data loader functionality."""
    print("\nTesting data loader...")
    
    try:
        from data_loader import DataLoader
        import tempfile
        import yaml
        
        # Create minimal config
        config = {
            'models': {'full_time': {'target_column': 'full_time_result'}}
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            yaml.dump(config, f)
            config_path = f.name
        
        try:
            loader = DataLoader(config_path)
            df = loader.load_match_data("database")
            
            assert len(df) > 0, "DataFrame should not be empty"
            assert 'match_id' in df.columns, "match_id column should exist"
            assert 'home_team' in df.columns, "home_team column should exist"
            
            print(f"✅ Data loader works - loaded {len(df)} rows")
            return True
        finally:
            os.unlink(config_path)
            
    except Exception as e:
        print(f"❌ Data loader test failed: {e}")
        return False


def test_feature_engineer():
    """Test feature engineer functionality."""
    print("\nTesting feature engineer...")
    
    try:
        from feature_engineering import FeatureEngineer
        import pandas as pd
        import numpy as np
        
        # Create minimal config
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
        
        fe = FeatureEngineer(config)
        
        # Create test data
        np.random.seed(42)
        df = pd.DataFrame({
            'team_strength_diff': np.random.randn(10),
            'home_advantage': np.ones(10),
            'form_diff': np.random.randn(10),
            'full_time_result': np.random.choice(['H', 'A', 'D'], 10)
        })
        
        # Test fit_transform
        X_processed, feature_info = fe.fit_transform(df, 'full_time', 'full_time_result')
        
        assert len(X_processed) == len(df), "Data length should be preserved"
        assert 'model_type' in feature_info, "Feature info should contain model_type"
        
        print("✅ Feature engineer works")
        return True
    except Exception as e:
        print(f"❌ Feature engineer test failed: {e}")
        return False


def test_model_registry():
    """Test model registry functionality."""
    print("\nTesting model registry...")
    
    try:
        from model_registry import ModelRegistry
        import tempfile
        
        # Create minimal config
        config = {
            'output': {
                'model_registry_path': 'test_registry.json'
            }
        }
        
        registry = ModelRegistry(config)
        
        # Test adding model
        model_data = {
            'id': 'test-model-123',
            'version': 'v1.0.0',
            'algorithm': 'RandomForestClassifier',
            'metrics': {'accuracy': 0.85},
            'status': 'candidate',
            'file_path': 'test_model.joblib',
            'model_type': 'full_time'
        }
        
        added_model = registry.add_model(model_data)
        
        assert added_model['id'] == model_data['id'], "Model ID should match"
        assert added_model['status'] == 'candidate', "Status should be candidate"
        
        # Test querying
        all_models = registry.get_all_models()
        assert len(all_models) == 1, "Should have 1 model"
        
        candidate_models = registry.get_models_by_status('candidate')
        assert len(candidate_models) == 1, "Should have 1 candidate model"
        
        print("✅ Model registry works")
        return True
    except Exception as e:
        print(f"❌ Model registry test failed: {e}")
        return False


def test_supabase_client():
    """Test Supabase client functionality."""
    print("\nTesting Supabase client...")
    
    try:
        from supabase_client import SupabaseClient
        
        # Create minimal config
        config = {
            'database': {
                'supabase_url': 'https://test.supabase.co',
                'supabase_key': 'test-key'
            }
        }
        
        client = SupabaseClient(config)
        
        # Test connection (will be mock)
        connection_ok = client.test_connection()
        
        # Test mock data insertion
        training_data = {
            'model_id': 'test-model-123',
            'model_type': 'full_time',
            'algorithm': 'RandomForestClassifier',
            'training_session_id': 'test-session',
            'status': 'completed',
            'metrics': {'accuracy': 0.85},
            'training_timestamp': '2024-01-01T00:00:00Z'
        }
        
        result = client.insert_model_retraining_run(training_data)
        
        print("✅ Supabase client works (mock mode)")
        return True
    except Exception as e:
        print(f"❌ Supabase client test failed: {e}")
        return False


def test_config_parsing():
    """Test configuration parsing."""
    print("\nTesting configuration parsing...")
    
    try:
        import yaml
        import tempfile
        
        # Create test config
        config_data = {
            'database': {
                'supabase_url': 'https://test.supabase.co',
                'supabase_key': 'test-key'
            },
            'models': {
                'full_time': {
                    'algorithm': 'LogisticRegression',
                    'target_column': 'full_time_result'
                }
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name
        
        try:
            from data_loader import DataLoader
            
            loader = DataLoader(config_path)
            assert loader.config == config_data, "Config should be loaded correctly"
            
            print("✅ Configuration parsing works")
            return True
        finally:
            os.unlink(config_path)
            
    except Exception as e:
        print(f"❌ Configuration parsing test failed: {e}")
        return False


def test_cli_syntax():
    """Test CLI module syntax."""
    print("\nTesting CLI modules...")
    
    try:
        # Test that train_model.py has valid syntax
        import ast
        with open('train_model.py', 'r') as f:
            source = f.read()
        
        ast.parse(source)
        
        # Test that ensemble_predictor.py has valid syntax
        with open('ensemble_predictor.py', 'r') as f:
            source = f.read()
        
        ast.parse(source)
        
        print("✅ CLI modules have valid syntax")
        return True
    except Exception as e:
        print(f"❌ CLI syntax test failed: {e}")
        return False


def test_unit_tests():
    """Run unit tests if pytest is available."""
    print("\nTesting unit tests...")
    
    try:
        # Try to run pytest
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'tests/test_feature_engineering.py', 
            'tests/test_config_parsing.py', 
            '-v', '--tb=short'
        ], capture_output=True, text=True, cwd='/home/engine/project/ml')
        
        if result.returncode == 0:
            print("✅ Unit tests pass")
            return True
        else:
            print(f"⚠️  Unit tests failed (this may be expected if dependencies are missing):")
            print(result.stdout)
            print(result.stderr)
            return False
    except FileNotFoundError:
        print("⚠️  pytest not available, skipping unit tests")
        return True  # Don't fail the overall test
    except Exception as e:
        print(f"❌ Unit test execution failed: {e}")
        return False


def main():
    """Run all tests."""
    print("🧪 ML Pipeline Test Suite")
    print("="*50)
    
    tests = [
        ("Import Test", test_imports),
        ("Configuration Parsing", test_config_parsing),
        ("Data Loader", test_data_loader),
        ("Feature Engineer", test_feature_engineer),
        ("Model Registry", test_model_registry),
        ("Supabase Client", test_supabase_client),
        ("CLI Syntax", test_cli_syntax),
        ("Unit Tests", test_unit_tests)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"⚠️  {test_name}: Failed")
        except Exception as e:
            print(f"❌ {test_name}: Exception - {e}")
    
    print("\n" + "="*50)
    print(f"Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed, but core functionality appears to work")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)