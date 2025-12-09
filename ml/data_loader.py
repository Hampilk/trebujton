"""
Data Loader Module
Handles data loading, validation, and preprocessing for ML pipeline.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from datetime import datetime
import yaml
from pydantic import BaseModel, ValidationError
import structlog

logger = structlog.get_logger()


class MatchData(BaseModel):
    """Schema for match data validation."""
    match_id: str
    home_team: str
    away_team: str
    league: str
    season: str
    match_date: datetime
    full_time_home_goals: Optional[int] = None
    full_time_away_goals: Optional[int] = None
    half_time_home_goals: Optional[int] = None
    half_time_away_goals: Optional[int] = None
    full_time_result: Optional[str] = None
    half_time_result: Optional[str] = None
    home_team_strength: Optional[float] = None
    away_team_strength: Optional[float] = None
    home_team_position: Optional[int] = None
    away_team_position: Optional[int] = None
    home_recent_form: Optional[float] = None
    away_recent_form: Optional[float] = None
    home_goals_avg: Optional[float] = None
    away_goals_avg: Optional[float] = None
    home_conceded_avg: Optional[float] = None
    away_conceded_avg: Optional[float] = None


class DataLoader:
    """Handles data loading and preprocessing for ML models."""
    
    def __init__(self, config_path: str):
        """Initialize data loader with configuration."""
        self.config = self._load_config(config_path)
        self.data_cache = {}
        self.logger = logger.bind(component="data_loader")
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            self.logger.info("Configuration loaded successfully", config_path=config_path)
            return config
        except Exception as e:
            self.logger.error("Failed to load configuration", error=str(e))
            raise
    
    def load_match_data(self, data_source: str = "database") -> pd.DataFrame:
        """
        Load match data from specified source.
        
        Args:
            data_source: Source of data ("database", "csv", "json")
            
        Returns:
            DataFrame with match data
        """
        if data_source in self.data_cache:
            self.logger.info("Returning cached data", source=data_source)
            return self.data_cache[data_source]
            
        try:
            if data_source == "database":
                df = self._load_from_database()
            elif data_source == "csv":
                df = self._load_from_csv()
            elif data_source == "json":
                df = self._load_from_json()
            else:
                raise ValueError(f"Unsupported data source: {data_source}")
            
            # Validate and clean data
            df = self._validate_and_clean(df)
            
            # Cache the data
            self.data_cache[data_source] = df
            
            self.logger.info(
                "Data loaded successfully", 
                source=data_source, 
                rows=len(df), 
                columns=len(df.columns)
            )
            return df
            
        except Exception as e:
            self.logger.error("Failed to load data", source=data_source, error=str(e))
            raise
    
    def _load_from_database(self) -> pd.DataFrame:
        """Load data from Supabase database."""
        # This would integrate with Supabase
        # For now, return mock data structure
        return pd.DataFrame({
            'match_id': [f'match_{i}' for i in range(1000)],
            'home_team': [f'Team_{i%20}' for i in range(1000)],
            'away_team': [f'Team_{(i+1)%20}' for i in range(1000)],
            'league': [f'League_{i%5}' for i in range(1000)],
            'season': [f'2023-24' for i in range(1000)],
            'match_date': pd.date_range('2023-08-01', periods=1000, freq='D'),
            'full_time_home_goals': np.random.poisson(1.5, 1000),
            'full_time_away_goals': np.random.poisson(1.2, 1000),
            'half_time_home_goals': np.random.poisson(0.8, 1000),
            'half_time_away_goals': np.random.poisson(0.6, 1000),
            'home_team_strength': np.random.normal(0, 1, 1000),
            'away_team_strength': np.random.normal(0, 1, 1000),
            'home_team_position': np.random.randint(1, 21, 1000),
            'away_team_position': np.random.randint(1, 21, 1000),
            'home_recent_form': np.random.normal(0, 0.5, 1000),
            'away_recent_form': np.random.normal(0, 0.5, 1000),
        })
    
    def _load_from_csv(self) -> pd.DataFrame:
        """Load data from CSV files."""
        csv_path = Path("data/matches.csv")
        if not csv_path.exists():
            self.logger.warning("CSV file not found, using mock data", path=str(csv_path))
            return self._load_from_database()
        
        return pd.read_csv(csv_path)
    
    def _load_from_json(self) -> pd.DataFrame:
        """Load data from JSON files."""
        json_path = Path("data/matches.json")
        if not json_path.exists():
            self.logger.warning("JSON file not found, using mock data", path=str(json_path))
            return self._load_from_database()
        
        return pd.read_json(json_path)
    
    def _validate_and_clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean the loaded data."""
        # Check for required columns
        required_columns = ['match_id', 'home_team', 'away_team', 'league', 'season']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Remove duplicates
        initial_rows = len(df)
        df = df.drop_duplicates(subset=['match_id'])
        removed_rows = initial_rows - len(df)
        
        if removed_rows > 0:
            self.logger.warning("Removed duplicate rows", count=removed_rows)
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Create target variables
        df = self._create_target_variables(df)
        
        # Data type conversions
        df = self._convert_data_types(df)
        
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset."""
        # Numeric columns - fill with median
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if df[col].isnull().any():
                median_value = df[col].median()
                df[col].fillna(median_value, inplace=True)
                self.logger.debug("Filled missing values", column=col, method="median", value=median_value)
        
        # Categorical columns - fill with mode
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if df[col].isnull().any():
                mode_value = df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown'
                df[col].fillna(mode_value, inplace=True)
                self.logger.debug("Filled missing values", column=col, method="mode", value=mode_value)
        
        return df
    
    def _create_target_variables(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create target variables for different model types."""
        # Full-time result
        if 'full_time_home_goals' in df.columns and 'full_time_away_goals' in df.columns:
            df['full_time_result'] = df.apply(
                lambda row: 'H' if row['full_time_home_goals'] > row['full_time_away_goals'] 
                           else 'A' if row['full_time_away_goals'] > row['full_time_home_goals'] 
                           else 'D', axis=1
            )
        
        # Half-time result
        if 'half_time_home_goals' in df.columns and 'half_time_away_goals' in df.columns:
            df['half_time_result'] = df.apply(
                lambda row: 'H' if row['half_time_home_goals'] > row['half_time_away_goals'] 
                           else 'A' if row['half_time_away_goals'] > row['half_time_home_goals'] 
                           else 'D', axis=1
            )
        
        # Pattern matching (simplified)
        if 'full_time_home_goals' in df.columns and 'full_time_away_goals' in df.columns:
            df['high_scoring'] = ((df['full_time_home_goals'] + df['full_time_away_goals']) > 2.5).astype(int)
            df['close_game'] = (abs(df['full_time_home_goals'] - df['full_time_away_goals']) <= 1).astype(int)
            df['pattern_match'] = df['high_scoring']  # Simplified pattern target
        
        return df
    
    def _convert_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert data types appropriately."""
        # Convert datetime columns
        datetime_columns = ['match_date']
        for col in datetime_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col])
        
        # Convert categorical columns
        categorical_columns = ['league', 'season', 'full_time_result', 'half_time_result']
        for col in categorical_columns:
            if col in df.columns:
                df[col] = df[col].astype('category')
        
        return df
    
    def get_features_by_model_type(self, model_type: str) -> List[str]:
        """Get feature columns for a specific model type."""
        feature_map = {
            'full_time': [
                'team_strength_diff', 'home_advantage', 'recent_form', 
                'head_to_head', 'league_position_diff', 'goals_scored_avg', 
                'goals_conceded_avg'
            ],
            'half_time': [
                'team_strength_diff', 'home_advantage', 'recent_form',
                'goals_scored_ht', 'goals_conceded_ht'
            ],
            'pattern': [
                'scoring_pattern', 'defensive_pattern', 'momentum_indicators',
                'historical_patterns', 'situational_factors'
            ]
        }
        
        return feature_map.get(model_type, [])
    
    def create_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features from existing data."""
        # Team strength difference
        if 'home_team_strength' in df.columns and 'away_team_strength' in df.columns:
            df['team_strength_diff'] = df['home_team_strength'] - df['away_team_strength']
        
        # Position difference (lower position = better team)
        if 'home_team_position' in df.columns and 'away_team_position' in df.columns:
            df['league_position_diff'] = df['away_team_position'] - df['home_team_position']
        
        # Recent form difference
        if 'home_recent_form' in df.columns and 'away_recent_form' in df.columns:
            df['form_diff'] = df['home_recent_form'] - df['away_recent_form']
        
        # Home advantage (binary feature)
        df['home_advantage'] = 1
        
        # Goals per game averages
        if 'full_time_home_goals' in df.columns and 'full_time_away_goals' in df.columns:
            df['home_goals_avg'] = df.groupby('home_team')['full_time_home_goals'].transform('mean')
            df['away_goals_avg'] = df.groupby('away_team')['full_time_away_goals'].transform('mean')
            df['home_conceded_avg'] = df.groupby('home_team')['full_time_away_goals'].transform('mean')
            df['away_conceded_avg'] = df.groupby('away_team')['full_time_home_goals'].transform('mean')
        
        # Head-to-head (simplified)
        df['head_to_head'] = 0  # Would need more sophisticated calculation
        
        self.logger.info("Derived features created", new_features=['team_strength_diff', 'position_diff', 'form_diff'])
        return df
    
    def get_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary statistics of the dataset."""
        return {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'numeric_columns': len(df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': len(df.select_dtypes(include=['object', 'category']).columns),
            'missing_values': df.isnull().sum().sum(),
            'date_range': {
                'start': df['match_date'].min().isoformat() if 'match_date' in df.columns else None,
                'end': df['match_date'].max().isoformat() if 'match_date' in df.columns else None
            },
            'leagues': df['league'].unique().tolist() if 'league' in df.columns else [],
            'seasons': df['season'].unique().tolist() if 'season' in df.columns else []
        }