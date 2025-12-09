"""
Unit Tests for Feature Engineering Module
Tests feature engineering pipeline to ensure deterministic training.
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch
import tempfile
import os
from pathlib import Path

# Import the module to test
import sys
sys.path.append(str(Path(__file__).parent.parent))

from feature_engineering import FeatureEngineer


class TestFeatureEngineer:
    """Test suite for FeatureEngineer class."""
    
    @pytest.fixture
    def sample_data(self):
        """Create sample match data for testing."""
        np.random.seed(42)  # For deterministic tests
        return pd.DataFrame({
            'match_id': ['match_1', 'match_2', 'match_3', 'match_4', 'match_5'],
            'home_team': ['Team A', 'Team B', 'Team C', 'Team D', 'Team A'],
            'away_team': ['Team B', 'Team C', 'Team D', 'Team A', 'Team C'],
            'league': ['Premier League', 'La Liga', 'Premier League', 'La Liga', 'Premier League'],
            'season': ['2023-24', '2023-24', '2023-24', '2023-24', '2023-24'],
            'match_date': pd.date_range('2023-08-01', periods=5, freq='D'),
            'full_time_home_goals': [2, 1, 3, 0, 1],
            'full_time_away_goals': [1, 2, 1, 2, 0],
            'half_time_home_goals': [1, 0, 2, 0, 1],
            'half_time_away_goals': [0, 1, 1, 1, 0],
            'home_team_strength': [0.5, -0.2, 1.2, -0.8, 0.3],
            'away_team_strength': [-0.1, 0.8, -0.5, 0.4, -0.3],
            'home_team_position': [3, 12, 1, 18, 5],
            'away_team_position': [8, 4, 15, 7, 11],
            'home_recent_form': [0.3, -0.1, 0.8, -0.4, 0.2],
            'away_recent_form': [-0.2, 0.5, -0.3, 0.1, 0.0],
            'full_time_result': ['H', 'A', 'H', 'A', 'H'],
            'half_time_result': ['H', 'A', 'H', 'A', 'H']
        })
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return {
            'training': {
                'feature_engineering': {
                    'scaling_method': 'standard',
                    'encoding_method': 'onehot',
                    'handle_missing': 'impute',
                    'outlier_treatment': 'winsorize'
                }
            }
        }
    
    @pytest.fixture
    def feature_engineer(self, config):
        """Create FeatureEngineer instance for testing."""
        return FeatureEngineer(config)
    
    def test_initialization(self, config):
        """Test FeatureEngineer initialization."""
        fe = FeatureEngineer(config)
        assert fe.scaling_method == 'standard'
        assert fe.encoding_method == 'onehot'
        assert fe.handle_missing == 'impute'
        assert fe.outlier_treatment == 'winsorize'
        assert fe.scalers == {}
        assert fe.encoders == {}
        assert fe.imputers == {}
    
    def test_get_feature_columns_full_time(self, feature_engineer, sample_data):
        """Test feature column selection for full-time model."""
        features = feature_engineer._get_feature_columns(sample_data, 'full_time')
        
        # Check that basic features are included
        expected_features = [
            'team_strength_diff', 'home_advantage', 'form_diff',
            'league_position_diff', 'home_goals_avg', 'away_goals_avg',
            'home_conceded_avg', 'away_conceded_avg', 'head_to_head'
        ]
        
        for feature in expected_features:
            assert feature in features, f"Expected feature {feature} not found"
        
        # Test deterministic behavior with same input
        features2 = feature_engineer._get_feature_columns(sample_data, 'full_time')
        assert features == features2, "Feature selection should be deterministic"
    
    def test_get_feature_columns_half_time(self, feature_engineer, sample_data):
        """Test feature column selection for half-time model."""
        features = feature_engineer._get_feature_columns(sample_data, 'half_time')
        
        expected_features = [
            'team_strength_diff', 'home_advantage', 'form_diff',
            'half_time_home_goals', 'half_time_away_goals'
        ]
        
        for feature in expected_features:
            assert feature in features, f"Expected feature {feature} not found"
    
    def test_get_feature_columns_pattern(self, feature_engineer, sample_data):
        """Test feature column selection for pattern model."""
        features = feature_engineer._get_feature_columns(sample_data, 'pattern')
        
        # Pattern model gets derived numeric features
        assert 'team_strength_diff' in features
        assert 'home_advantage' in features
    
    def test_add_derived_features(self, feature_engineer, sample_data):
        """Test derived feature creation."""
        df = sample_data.copy()
        result = feature_engineer._add_derived_features(df)
        
        # Check that derived features were added
        assert 'goals_difference' in result.columns
        assert 'total_goals' in result.columns
        assert 'ht_goals_difference' in result.columns
        assert 'ht_total_goals' in result.columns
        assert 'form_advantage' in result.columns
        assert 'combined_form' in result.columns
        
        # Test deterministic behavior
        df2 = sample_data.copy()
        result2 = feature_engineer._add_derived_features(df2)
        
        pd.testing.assert_frame_equal(result, result2, check_exact=False)
    
    def test_add_derived_features_time_based(self, feature_engineer, sample_data):
        """Test time-based derived features."""
        df = sample_data.copy()
        result = feature_engineer._add_derived_features(df)
        
        # Check time-based features
        assert 'day_of_week' in result.columns
        assert 'month' in result.columns
        assert 'is_weekend' in result.columns
        
        # Test deterministic time feature creation
        assert result['day_of_week'].iloc[0] == 1  # Tuesday (2023-08-01)
        assert result['month'].iloc[0] == 8
        assert result['is_weekend'].iloc[0] == 0  # Not weekend
    
    def test_handle_missing_values_impute(self, feature_engineer, sample_data):
        """Test missing value handling with imputation."""
        # Create data with missing values
        df = sample_data.copy()
        df.loc[0, 'team_strength_diff'] = np.nan
        df.loc[1, 'league'] = np.nan
        
        result = feature_engineer._handle_missing_values(df, ['team_strength_diff', 'league'])
        
        # Check that missing values were imputed
        assert not result['team_strength_diff'].isnull().any()
        assert not result['league'].isnull().any()
        
        # Test deterministic imputation
        df2 = sample_data.copy()
        df2.loc[0, 'team_strength_diff'] = np.nan
        df2.loc[1, 'league'] = np.nan
        
        result2 = feature_engineer._handle_missing_values(df2, ['team_strength_diff', 'league'])
        
        # Results should be identical
        pd.testing.assert_series_equal(result['team_strength_diff'], result2['team_strength_diff'])
    
    def test_handle_missing_values_flag(self, feature_engineer, sample_data):
        """Test missing value handling with flag method."""
        # Change to flag method
        feature_engineer.handle_missing = 'flag'
        
        df = sample_data.copy()
        df.loc[0, 'team_strength_diff'] = np.nan
        
        feature_columns = ['team_strength_diff']
        result = feature_engineer._handle_missing_values(df, feature_columns)
        
        # Check that flag column was created
        assert 'team_strength_diff_missing' in result.columns
        assert result['team_strength_diff_missing'].iloc[0] == 1
        
        # Check that original column was filled with 0
        assert result['team_strength_diff'].iloc[0] == 0
    
    def test_handle_missing_values_drop(self, feature_engineer, sample_data):
        """Test missing value handling with drop method."""
        # Change to drop method
        feature_engineer.handle_missing = 'drop'
        
        df = sample_data.copy()
        df.loc[0, 'team_strength_diff'] = np.nan
        
        result = feature_engineer._handle_missing_values(df, ['team_strength_diff'])
        
        # Should have one less row
        assert len(result) == len(df) - 1
    
    def test_scale_numerical_features(self, feature_engineer, sample_data):
        """Test numerical feature scaling."""
        df = sample_data.copy()
        feature_columns = ['team_strength_diff', 'form_diff']
        
        # Add some variation
        df['team_strength_diff'] = np.array([0.5, -0.2, 1.2, -0.8, 0.3])
        df['form_diff'] = np.array([0.3, -0.1, 0.8, -0.4, 0.2])
        
        result = feature_engineer._scale_numerical_features(df, feature_columns)
        
        # Check that scaling was applied
        assert 'team_strength_diff' in result.columns
        
        # Test deterministic scaling
        df2 = sample_data.copy()
        df2['team_strength_diff'] = np.array([0.5, -0.2, 1.2, -0.8, 0.3])
        df2['form_diff'] = np.array([0.3, -0.1, 0.8, -0.4, 0.2])
        
        result2 = feature_engineer._scale_numerical_features(df2, feature_columns)
        
        # Results should be identical
        pd.testing.assert_frame_equal(result, result2, check_exact=False)
        
        # Check that scaler was saved
        assert 'main' in feature_engineer.scalers
    
    def test_handle_outliers_winsorize(self, feature_engineer, sample_data):
        """Test outlier handling with winsorization."""
        df = sample_data.copy()
        feature_columns = ['team_strength_diff']
        
        # Add outliers
        df['team_strength_diff'] = np.array([0.5, -0.2, 1.2, -0.8, 10.0])  # 10.0 is outlier
        
        result = feature_engineer._handle_outliers(df, feature_columns)
        
        # Check that outlier was capped
        max_val = result['team_strength_diff'].max()
        assert max_val < 10.0  # Should be capped to 99th percentile
        
        # Test deterministic outlier handling
        df2 = sample_data.copy()
        df2['team_strength_diff'] = np.array([0.5, -0.2, 1.2, -0.8, 10.0])
        
        result2 = feature_engineer._handle_outliers(df2, feature_columns)
        pd.testing.assert_series_equal(result['team_strength_diff'], result2['team_strength_diff'])
    
    def test_feature_selection_constant_removal(self, feature_engineer, sample_data):
        """Test feature selection with constant feature removal."""
        df = sample_data.copy()
        df['constant_feature'] = 5.0  # Constant value
        feature_columns = ['team_strength_diff', 'constant_feature']
        
        result = feature_engineer._feature_selection(df, feature_columns, 'target')
        
        # Constant feature should be removed
        assert 'constant_feature' not in result.columns
        assert 'team_strength_diff' in result.columns
    
    def test_create_feature_info(self, feature_engineer, sample_data):
        """Test feature information creation."""
        model_type = 'full_time'
        original_features = ['team_strength_diff', 'home_advantage']
        
        feature_info = feature_engineer._create_feature_info(sample_data, original_features, model_type)
        
        # Check structure
        assert 'model_type' in feature_info
        assert 'total_features' in feature_info
        assert 'feature_names' in feature_info
        assert 'scaling_method' in feature_info
        assert 'created_at' in feature_info
        
        assert feature_info['model_type'] == model_type
        assert feature_info['scaling_method'] == feature_engineer.scaling_method
        assert feature_info['total_features'] == len(sample_data.columns)
    
    def test_fit_transform_full_pipeline(self, feature_engineer, sample_data):
        """Test complete fit_transform pipeline."""
        # Set seed for deterministic results
        np.random.seed(42)
        
        target_column = 'full_time_result'
        model_type = 'full_time'
        
        result_df, feature_info = feature_engineer.fit_transform(sample_data, model_type, target_column)
        
        # Check output structure
        assert isinstance(result_df, pd.DataFrame)
        assert isinstance(feature_info, dict)
        
        # Check that feature info is correct
        assert feature_info['model_type'] == model_type
        assert feature_info['scaling_method'] == 'standard'
        assert feature_info['encoding_method'] == 'onehot'
        
        # Test deterministic behavior
        np.random.seed(42)
        result_df2, feature_info2 = feature_engineer.fit_transform(sample_data.copy(), model_type, target_column)
        
        pd.testing.assert_frame_equal(result_df, result_df2, check_exact=False)
        assert feature_info == feature_info2
    
    def test_transform_after_fit(self, feature_engineer, sample_data):
        """Test transform method after fit_transform."""
        # First fit_transform
        np.random.seed(42)
        target_column = 'full_time_result'
        model_type = 'full_time'
        
        feature_engineer.fit_transform(sample_data, model_type, target_column)
        
        # Now test transform with new data
        new_data = sample_data.copy()
        result = feature_engineer.transform(new_data, model_type)
        
        assert isinstance(result, pd.DataFrame)
        assert len(result) == len(new_data)
        
        # Test deterministic transform
        new_data2 = sample_data.copy()
        result2 = feature_engineer.transform(new_data2, model_type)
        
        pd.testing.assert_frame_equal(result, result2, check_exact=False)
    
    def test_transform_without_fit_raises_error(self, feature_engineer, sample_data):
        """Test that transform without fit raises appropriate error."""
        with pytest.raises(ValueError, match="not fitted yet"):
            feature_engineer.transform(sample_data, 'full_time')
    
    def test_different_scaling_methods(self, sample_data):
        """Test different scaling methods produce deterministic results."""
        config_standard = {
            'training': {'feature_engineering': {'scaling_method': 'standard'}}
        }
        config_minmax = {
            'training': {'feature_engineering': {'scaling_method': 'minmax'}}
        }
        
        fe_standard = FeatureEngineer(config_standard)
        fe_minmax = FeatureEngineer(config_minmax)
        
        # Both should produce deterministic results
        np.random.seed(42)
        result1, info1 = fe_standard.fit_transform(sample_data, 'full_time', 'full_time_result')
        
        np.random.seed(42)
        result2, info2 = fe_minmax.fit_transform(sample_data.copy(), 'full_time', 'full_time_result')
        
        # Results should be different between scaling methods
        assert not result1.equals(result2)
        
        # But each method should be deterministic
        np.random.seed(42)
        result1b, info1b = fe_standard.fit_transform(sample_data.copy(), 'full_time', 'full_time_result')
        pd.testing.assert_frame_equal(result1, result1b, check_exact=False)
    
    def test_different_encoding_methods(self, sample_data):
        """Test different encoding methods produce deterministic results."""
        config_onehot = {
            'training': {'feature_engineering': {'encoding_method': 'onehot'}}
        }
        config_label = {
            'training': {'feature_engineering': {'encoding_method': 'label'}}
        }
        
        fe_onehot = FeatureEngineer(config_onehot)
        fe_label = FeatureEngineer(config_label)
        
        # Both should produce deterministic results
        np.random.seed(42)
        result1, info1 = fe_onehot.fit_transform(sample_data, 'full_time', 'full_time_result')
        
        np.random.seed(42)
        result2, info2 = fe_label.fit_transform(sample_data.copy(), 'full_time', 'full_time_result')
        
        # Results should be different between encoding methods
        assert not result1.equals(result2)
        
        # But each method should be deterministic
        np.random.seed(42)
        result1b, info1b = fe_onehot.fit_transform(sample_data.copy(), 'full_time', 'full_time_result')
        pd.testing.assert_frame_equal(result1, result1b, check_exact=False)


if __name__ == '__main__':
    # Run tests if called directly
    pytest.main([__file__, '-v'])