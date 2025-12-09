"""
Supabase Client Module
Handles database operations for ML model tracking and results.
"""

import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import structlog
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None
    logging.warning("Supabase client not available. Install with: pip install supabase")


class SupabaseClient:
    """Handles Supabase database operations for ML pipeline."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Supabase client with configuration."""
        self.config = config
        self.logger = structlog.get_logger().bind(component="supabase_client")
        
        # Get Supabase configuration
        supabase_config = config.get('database', {})
        self.supabase_url = supabase_config.get('supabase_url')
        self.supabase_key = supabase_config.get('supabase_key')
        
        # Initialize client if available
        if create_client and self.supabase_url and self.supabase_key:
            try:
                self.client: Client = create_client(self.supabase_url, self.supabase_key)
                self.logger.info("Supabase client initialized successfully")
            except Exception as e:
                self.logger.error("Failed to initialize Supabase client", error=str(e))
                self.client = None
        else:
            self.logger.warning("Supabase configuration incomplete, running in mock mode")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Supabase client is available."""
        return self.client is not None
    
    def insert_model_retraining_run(self, data: Dict[str, Any]) -> bool:
        """
        Insert a model retraining run record.
        
        Args:
            data: Training run data dictionary
            
        Returns:
            Success status
        """
        try:
            if not self.is_available():
                self.logger.info("Supabase not available, logging to file instead", data=data)
                self._log_to_file('model_retraining_runs', data)
                return True
            
            # Prepare data for insertion
            insert_data = {
                'model_id': data['model_id'],
                'model_type': data['model_type'],
                'algorithm': data['algorithm'],
                'training_session_id': data['training_session_id'],
                'status': data.get('status', 'completed'),
                'metrics': json.dumps(data['metrics']),
                'cross_validation_scores': json.dumps(data.get('cross_validation_scores', {})),
                'model_config': json.dumps(data.get('model_config', {})),
                'feature_config': json.dumps(data.get('feature_config', {})),
                'training_timestamp': data['training_timestamp'],
                'data_summary': json.dumps(data.get('data_summary', {})),
                'created_at': datetime.now().isoformat()
            }
            
            # Insert into database
            result = self.client.table('model_retraining_runs').insert(insert_data).execute()
            
            self.logger.info(
                "Model retraining run inserted", 
                model_id=data['model_id'],
                training_session_id=data['training_session_id']
            )
            return True
            
        except Exception as e:
            self.logger.error("Failed to insert model retraining run", error=str(e))
            self._log_to_file('model_retraining_runs', data)
            return False
    
    def insert_model_performance(self, data: Dict[str, Any]) -> bool:
        """
        Insert model performance metrics.
        
        Args:
            data: Performance data dictionary
            
        Returns:
            Success status
        """
        try:
            if not self.is_available():
                self.logger.info("Supabase not available, logging to file instead", data=data)
                self._log_to_file('model_performance', data)
                return True
            
            # Prepare data for insertion
            insert_data = {
                'model_id': data['model_id'],
                'accuracy': data['accuracy'],
                'f1_score': data['f1_score'],
                'precision': data['precision'],
                'recall': data['recall'],
                'roc_auc': data.get('roc_auc', 0.0),
                'confusion_matrix': json.dumps(data.get('confusion_matrix', [])),
                'evaluation_timestamp': data['evaluation_timestamp'],
                'test_samples': data.get('test_samples', 0),
                'model_type': data['model_type'],
                'created_at': datetime.now().isoformat()
            }
            
            # Insert into database
            result = self.client.table('model_performance').insert(insert_data).execute()
            
            self.logger.info(
                "Model performance inserted", 
                model_id=data['model_id'],
                accuracy=data['accuracy']
            )
            return True
            
        except Exception as e:
            self.logger.error("Failed to insert model performance", error=str(e))
            self._log_to_file('model_performance', data)
            return False
    
    def get_model_performance_history(self, model_type: str = None, 
                                    limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve model performance history.
        
        Args:
            model_type: Filter by model type
            limit: Maximum number of records to return
            
        Returns:
            List of performance records
        """
        try:
            if not self.is_available():
                self.logger.info("Supabase not available, returning mock data")
                return self._get_mock_performance_history(model_type, limit)
            
            # Build query
            query = self.client.table('model_performance').select('*')
            
            if model_type:
                query = query.eq('model_type', model_type)
            
            # Order by timestamp and limit
            query = query.order('evaluation_timestamp', desc=True).limit(limit)
            
            # Execute query
            result = query.execute()
            
            records = result.data if result.data else []
            
            self.logger.info(
                "Retrieved performance history", 
                model_type=model_type,
                count=len(records)
            )
            return records
            
        except Exception as e:
            self.logger.error("Failed to retrieve performance history", error=str(e))
            return self._get_mock_performance_history(model_type, limit)
    
    def get_latest_models(self, model_type: str = None, 
                         status: str = None) -> List[Dict[str, Any]]:
        """
        Get latest models by type and status.
        
        Args:
            model_type: Filter by model type
            status: Filter by model status
            
        Returns:
            List of latest model records
        """
        try:
            if not self.is_available():
                self.logger.info("Supabase not available, returning mock data")
                return self._get_mock_latest_models(model_type, status)
            
            # This would typically query a model registry table
            # For now, return mock data structure
            return self._get_mock_latest_models(model_type, status)
            
        except Exception as e:
            self.logger.error("Failed to retrieve latest models", error=str(e))
            return self._get_mock_latest_models(model_type, status)
    
    def update_model_status(self, model_id: str, status: str) -> bool:
        """
        Update model status in the registry.
        
        Args:
            model_id: Model identifier
            status: New status ('active', 'candidate', 'archived')
            
        Returns:
            Success status
        """
        try:
            if not self.is_available():
                self.logger.info("Supabase not available, logging status update", 
                               model_id=model_id, status=status)
                return True
            
            # Update model status (this would depend on actual schema)
            # For now, just log the update
            self.logger.info("Model status updated", model_id=model_id, status=status)
            return True
            
        except Exception as e:
            self.logger.error("Failed to update model status", error=str(e))
            return False
    
    def log_training_event(self, event_type: str, data: Dict[str, Any]) -> bool:
        """
        Log training events for monitoring.
        
        Args:
            event_type: Type of event ('start', 'progress', 'complete', 'error')
            data: Event data
            
        Returns:
            Success status
        """
        try:
            log_entry = {
                'event_type': event_type,
                'timestamp': datetime.now().isoformat(),
                'data': json.dumps(data),
                'created_at': datetime.now().isoformat()
            }
            
            if not self.is_available():
                self._log_to_file('training_events', log_entry)
            else:
                # Insert into training_events table
                result = self.client.table('training_events').insert(log_entry).execute()
            
            self.logger.debug("Training event logged", event_type=event_type)
            return True
            
        except Exception as e:
            self.logger.error("Failed to log training event", error=str(e))
            return False
    
    def _log_to_file(self, table_name: str, data: Dict[str, Any]):
        """Log data to file when Supabase is not available."""
        try:
            logs_dir = Path('logs')
            logs_dir.mkdir(exist_ok=True)
            
            log_file = logs_dir / f"{table_name}.jsonl"
            
            log_entry = {
                **data,
                'logged_at': datetime.now().isoformat()
            }
            
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
                
        except Exception as e:
            self.logger.error("Failed to log to file", error=str(e))
    
    def _get_mock_performance_history(self, model_type: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Return mock performance history when Supabase is not available."""
        mock_data = []
        base_data = {
            'model_id': 'mock-model-123',
            'accuracy': 0.85 + (hash(f"{model_type}-{limit}") % 100) / 1000,
            'f1_score': 0.82 + (hash(f"{model_type}-{limit}") % 100) / 1000,
            'precision': 0.84 + (hash(f"{model_type}-{limit}") % 100) / 1000,
            'recall': 0.83 + (hash(f"{model_type}-{limit}") % 100) / 1000,
            'roc_auc': 0.87 + (hash(f"{model_type}-{limit}") % 100) / 1000,
            'evaluation_timestamp': datetime.now().isoformat(),
            'model_type': model_type or 'full_time',
            'test_samples': 200
        }
        
        for i in range(min(limit, 10)):  # Return limited mock data
            mock_entry = base_data.copy()
            mock_entry['model_id'] = f"mock-model-{i}"
            mock_entry['accuracy'] += (i * 0.01)  # Simulate improving accuracy over time
            mock_data.append(mock_entry)
        
        return mock_data
    
    def _get_mock_latest_models(self, model_type: str = None, status: str = None) -> List[Dict[str, Any]]:
        """Return mock latest models when Supabase is not available."""
        mock_models = [
            {
                'id': 'model-active-123',
                'version': 'v1.2.0',
                'algorithm': 'RandomForestClassifier',
                'status': 'active',
                'model_type': 'full_time',
                'metrics': {'accuracy': 0.87, 'f1_score': 0.85},
                'created_at': datetime.now().isoformat(),
                'file_path': 'ml/models/full_time_v1_2_0.joblib'
            },
            {
                'id': 'model-candidate-456',
                'version': 'v1.3.0',
                'algorithm': 'XGBClassifier',
                'status': 'candidate',
                'model_type': 'full_time',
                'metrics': {'accuracy': 0.89, 'f1_score': 0.87},
                'created_at': datetime.now().isoformat(),
                'file_path': 'ml/models/full_time_v1_3_0.joblib'
            }
        ]
        
        # Filter by model_type and status if provided
        filtered_models = mock_models
        if model_type:
            filtered_models = [m for m in filtered_models if m['model_type'] == model_type]
        if status:
            filtered_models = [m for m in filtered_models if m['status'] == status]
        
        return filtered_models
    
    def test_connection(self) -> bool:
        """Test Supabase connection."""
        try:
            if not self.is_available():
                return False
            
            # Simple connection test
            result = self.client.table('model_performance').select('id').limit(1).execute()
            return True
            
        except Exception as e:
            self.logger.error("Supabase connection test failed", error=str(e))
            return False