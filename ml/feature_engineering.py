"""
Feature Engineering Module
Handles feature scaling, encoding, and transformation for ML pipeline.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Union
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    OneHotEncoder, LabelEncoder, OrdinalEncoder
)
from sklearn.impute import SimpleImputer
from category_encoders import TargetEncoder, WOEEncoder
import structlog
from pathlib import Path

logger = structlog.get_logger()


class FeatureEngineer:
    """Handles feature engineering and preprocessing for ML models."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize feature engineer with configuration."""
        self.config = config
        self.scalers = {}
        self.encoders = {}
        self.imputers = {}
        self.feature_names = {}
        self.logger = logger.bind(component="feature_engineering")
        
        # Load feature engineering config
        self.feature_config = config.get('training', {}).get('feature_engineering', {})
        self.scaling_method = self.feature_config.get('scaling_method', 'standard')
        self.encoding_method = self.feature_config.get('encoding_method', 'onehot')
        self.handle_missing = self.feature_config.get('handle_missing', 'impute')
        self.outlier_treatment = self.feature_config.get('outlier_treatment', 'winsorize')
    
    def fit_transform(self, df: pd.DataFrame, model_type: str, target_column: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Fit transformers and transform the data.
        
        Args:
            df: Input DataFrame
            model_type: Type of model ('full_time', 'half_time', 'pattern')
            target_column: Name of target column
            
        Returns:
            Tuple of (transformed_df, feature_info)
        """
        self.logger.info("Starting feature engineering fit_transform", model_type=model_type)
        
        # Create a copy to avoid modifying original
        df_processed = df.copy()
        
        # Get feature columns for model type
        feature_columns = self._get_feature_columns(df_processed, model_type)
        self.feature_names[model_type] = feature_columns
        
        # Add derived features
        df_processed = self._add_derived_features(df_processed)
        
        # Handle missing values
        df_processed = self._handle_missing_values(df_processed, feature_columns)
        
        # Encode categorical variables
        df_processed = self._encode_categorical_features(df_processed, feature_columns, target_column)
        
        # Scale numerical features
        df_processed = self._scale_numerical_features(df_processed, feature_columns)
        
        # Handle outliers
        df_processed = self._handle_outliers(df_processed, feature_columns)
        
        # Feature selection (optional)
        df_processed = self._feature_selection(df_processed, feature_columns, target_column)
        
        # Create feature info
        feature_info = self._create_feature_info(df_processed, feature_columns, model_type)
        
        self.logger.info("Feature engineering completed", model_type=model_type, features=len(feature_columns))
        return df_processed, feature_info
    
    def transform(self, df: pd.DataFrame, model_type: str) -> pd.DataFrame:
        """
        Transform new data using fitted transformers.
        
        Args:
            df: Input DataFrame to transform
            model_type: Type of model
            
        Returns:
            Transformed DataFrame
        """
        if model_type not in self.feature_names:
            raise ValueError(f"Model type {model_type} not fitted yet. Call fit_transform first.")
        
        df_processed = df.copy()
        feature_columns = self.feature_names[model_type]
        
        # Add derived features
        df_processed = self._add_derived_features(df_processed)
        
        # Handle missing values
        df_processed = self._handle_missing_values(df_processed, feature_columns)
        
        # Encode categorical variables
        df_processed = self._encode_categorical_features(df_processed, feature_columns)
        
        # Scale numerical features
        df_processed = self._scale_numerical_features(df_processed, feature_columns)
        
        # Handle outliers
        df_processed = self._handle_outliers(df_processed, feature_columns)
        
        # Select features
        df_processed = df_processed[feature_columns]
        
        return df_processed
    
    def _get_feature_columns(self, df: pd.DataFrame, model_type: str) -> List[str]:
        """Get feature columns based on model type."""
        # Base features for each model type
        base_features = {
            'full_time': [
                'team_strength_diff', 'home_advantage', 'form_diff',
                'league_position_diff', 'home_goals_avg', 'away_goals_avg',
                'home_conceded_avg', 'away_conceded_avg', 'head_to_head'
            ],
            'half_time': [
                'team_strength_diff', 'home_advantage', 'form_diff',
                'half_time_home_goals', 'half_time_away_goals'
            ],
            'pattern': [
                'scoring_pattern', 'defensive_pattern', 'momentum_indicators',
                'historical_patterns', 'situational_factors'
            ]
        }
        
        # Get available features that exist in the dataframe
        available_features = base_features.get(model_type, [])
        existing_features = [f for f in available_features if f in df.columns]
        
        # Add any additional numeric columns as potential features
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        potential_features = [col for col in numeric_columns if col not in existing_features and col != 'target']
        
        return existing_features + potential_features[:10]  # Limit to prevent overfitting
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features to the dataframe."""
        # Goals difference
        if 'full_time_home_goals' in df.columns and 'full_time_away_goals' in df.columns:
            df['goals_difference'] = df['full_time_home_goals'] - df['full_time_away_goals']
            df['total_goals'] = df['full_time_home_goals'] + df['full_time_away_goals']
        
        # Half-time difference
        if 'half_time_home_goals' in df.columns and 'half_time_away_goals' in df.columns:
            df['ht_goals_difference'] = df['half_time_home_goals'] - df['half_time_away_goals']
            df['ht_total_goals'] = df['half_time_home_goals'] + df['half_time_away_goals']
        
        # Form indicators
        if 'home_recent_form' in df.columns and 'away_recent_form' in df.columns:
            df['form_advantage'] = df['home_recent_form'] - df['away_recent_form']
            df['combined_form'] = df['home_recent_form'] + df['away_recent_form']
        
        # League strength (if available)
        if 'league' in df.columns:
            league_strength = df.groupby('league').agg({
                'home_team_strength': 'mean',
                'away_team_strength': 'mean'
            }).mean(axis=1)
            df['league_strength'] = df['league'].map(league_strength)
        
        # Time-based features
        if 'match_date' in df.columns:
            df['day_of_week'] = df['match_date'].dt.dayofweek
            df['month'] = df['match_date'].dt.month
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        self.logger.debug("Derived features added", new_features=5)
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame, feature_columns: List[str]) -> pd.DataFrame:
        """Handle missing values in the dataset."""
        if self.handle_missing == 'drop':
            return df.dropna(subset=feature_columns)
        
        elif self.handle_missing == 'impute':
            # Separate numeric and categorical columns
            numeric_features = df[feature_columns].select_dtypes(include=[np.number]).columns
            categorical_features = df[feature_columns].select_dtypes(exclude=[np.number]).columns
            
            # Impute numeric features
            if len(numeric_features) > 0:
                self.imputers['numeric'] = SimpleImputer(strategy='median')
                df[numeric_features] = self.imputers['numeric'].fit_transform(df[numeric_features])
            
            # Impute categorical features
            if len(categorical_features) > 0:
                self.imputers['categorical'] = SimpleImputer(strategy='most_frequent')
                df[categorical_features] = self.imputers['categorical'].fit_transform(df[categorical_features])
        
        elif self.handle_missing == 'flag':
            # Add missing value flags
            for col in feature_columns:
                df[f'{col}_missing'] = df[col].isnull().astype(int)
                df[col].fillna(0, inplace=True)
        
        return df
    
    def _encode_categorical_features(self, df: pd.DataFrame, feature_columns: List[str], target_column: str = None) -> pd.DataFrame:
        """Encode categorical features."""
        categorical_columns = df[feature_columns].select_dtypes(exclude=[np.number]).columns
        
        if len(categorical_columns) == 0:
            return df
        
        if self.encoding_method == 'onehot':
            # One-hot encoding
            for col in categorical_columns:
                if col not in self.encoders:
                    self.encoders[col] = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
                
                # Fit and transform
                encoded = self.encoders[col].fit_transform(df[[col]])
                encoded_df = pd.DataFrame(
                    encoded,
                    columns=[f"{col}_{cat}" for cat in self.encoders[col].categories_[0]],
                    index=df.index
                )
                
                # Drop original column and add encoded ones
                df = df.drop(columns=[col])
                df = pd.concat([df, encoded_df], axis=1)
        
        elif self.encoding_method == 'label':
            # Label encoding
            for col in categorical_columns:
                if col not in self.encoders:
                    self.encoders[col] = LabelEncoder()
                df[col] = self.encoders[col].fit_transform(df[col])
        
        elif self.encoding_method == 'target' and target_column:
            # Target encoding (be careful with overfitting)
            for col in categorical_columns:
                if col not in self.encoders:
                    self.encoders[col] = TargetEncoder()
                df[col] = self.encoders[col].fit_transform(df[col], df[target_column])
        
        return df
    
    def _scale_numerical_features(self, df: pd.DataFrame, feature_columns: List[str]) -> pd.DataFrame:
        """Scale numerical features."""
        numeric_columns = df[feature_columns].select_dtypes(include=[np.number]).columns
        
        if len(numeric_columns) == 0:
            return df
        
        # Initialize scaler
        if self.scaling_method == 'standard':
            self.scalers['main'] = StandardScaler()
        elif self.scaling_method == 'minmax':
            self.scalers['main'] = MinMaxScaler()
        elif self.scaling_method == 'robust':
            self.scalers['main'] = RobustScaler()
        
        # Fit and transform
        df[numeric_columns] = self.scalers['main'].fit_transform(df[numeric_columns])
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame, feature_columns: List[str]) -> pd.DataFrame:
        """Handle outliers in the dataset."""
        if self.outlier_treatment == 'winsorize':
            # Winsorize outliers (cap at 1st and 99th percentiles)
            numeric_columns = df[feature_columns].select_dtypes(include=[np.number]).columns
            for col in numeric_columns:
                q1 = df[col].quantile(0.01)
                q99 = df[col].quantile(0.99)
                df[col] = df[col].clip(lower=q1, upper=q99)
        
        elif self.outlier_treatment == 'drop':
            # Remove rows with outliers
            numeric_columns = df[feature_columns].select_dtypes(include=[np.number]).columns
            for col in numeric_columns:
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                df = df[z_scores < 3]  # Remove rows with z-score > 3
        
        return df
    
    def _feature_selection(self, df: pd.DataFrame, feature_columns: List[str], target_column: str) -> pd.DataFrame:
        """Perform basic feature selection."""
        # Remove constant features
        constant_features = []
        for col in feature_columns:
            if col in df.columns and df[col].nunique() <= 1:
                constant_features.append(col)
        
        if constant_features:
            df = df.drop(columns=constant_features)
            self.logger.debug("Removed constant features", features=constant_features)
        
        # Keep only numeric features for now (simplified approach)
        numeric_features = df.select_dtypes(include=[np.number]).columns
        numeric_features = [col for col in numeric_features if col != target_column]
        
        return df[numeric_features]
    
    def _create_feature_info(self, df: pd.DataFrame, original_features: List[str], model_type: str) -> Dict[str, Any]:
        """Create feature information dictionary."""
        return {
            'model_type': model_type,
            'total_features': len(df.columns),
            'feature_names': df.columns.tolist(),
            'original_features': original_features,
            'scaling_method': self.scaling_method,
            'encoding_method': self.encoding_method,
            'missing_handling': self.handle_missing,
            'outlier_treatment': self.outlier_treatment,
            'created_at': pd.Timestamp.now().isoformat()
        }
    
    def get_feature_importance_plot_data(self, model, feature_names: List[str]) -> Dict[str, Any]:
        """Extract feature importance data for plotting."""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feature_importance = pd.DataFrame({
                'feature': feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            return {
                'features': feature_importance['feature'].tolist(),
                'importances': feature_importance['importance'].tolist(),
                'plot_type': 'bar'
            }
        elif hasattr(model, 'coef_'):
            # For linear models, use absolute coefficients
            coefficients = np.abs(model.coef_[0])
            feature_importance = pd.DataFrame({
                'feature': feature_names,
                'importance': coefficients
            }).sort_values('importance', ascending=False)
            
            return {
                'features': feature_importance['feature'].tolist(),
                'importances': feature_importance['importance'].tolist(),
                'plot_type': 'bar'
            }
        else:
            return {
                'features': [],
                'importances': [],
                'plot_type': 'none'
            }