"""
Model Registry Module
Manages model versioning, status tracking, and local JSON registry.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from uuid import uuid4
import structlog

logger = structlog.get_logger()


class ModelRegistry:
    """Manages model registry with JSON-based storage."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize model registry with configuration."""
        self.config = config
        self.logger = structlog.get_logger().bind(component="model_registry")
        
        # Get registry path from config
        output_config = config.get('output', {})
        self.registry_path = Path(output_config.get('model_registry_path', 'ml/models/model_registry.json'))
        
        # Ensure directory exists
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize registry
        self.registry = self._load_or_initialize_registry()
        
        self.logger.info("Model registry initialized", registry_path=str(self.registry_path))
    
    def _load_or_initialize_registry(self) -> Dict[str, Any]:
        """Load existing registry or create new one."""
        if self.registry_path.exists():
            try:
                with open(self.registry_path, 'r') as f:
                    registry = json.load(f)
                self.logger.info("Model registry loaded", entries=len(registry.get('models', [])))
                return registry
            except Exception as e:
                self.logger.warning("Failed to load existing registry, creating new one", error=str(e))
        
        # Create new registry structure
        new_registry = {
            'version': '1.0.0',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'models': []
        }
        
        self._save_registry(new_registry)
        return new_registry
    
    def _save_registry(self, registry: Dict[str, Any] = None):
        """Save registry to file."""
        if registry is None:
            registry = self.registry
        
        # Update timestamp
        registry['updated_at'] = datetime.now().isoformat()
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        
        self.logger.debug("Model registry saved", path=str(self.registry_path))
    
    def add_model(self, model_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new model to the registry.
        
        Args:
            model_data: Model information dictionary
            
        Returns:
            Added model entry
        """
        # Validate required fields
        required_fields = ['id', 'version', 'algorithm', 'metrics', 'status', 'file_path']
        for field in required_fields:
            if field not in model_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Set default values
        model_entry = {
            'id': str(uuid4()) if not model_data.get('id') else model_data['id'],
            'version': model_data.get('version', 'v1.0.0'),
            'algorithm': model_data['algorithm'],
            'metrics': model_data['metrics'],
            'created_at': datetime.now().isoformat(),
            'status': model_data.get('status', 'candidate'),
            'file_path': model_data['file_path'],
            'model_type': model_data.get('model_type', 'unknown'),
            'training_session_id': model_data.get('training_session_id'),
            'description': model_data.get('description', ''),
            'tags': model_data.get('tags', [])
        }
        
        # Add to registry
        self.registry['models'].append(model_entry)
        
        # Update active model if this one is active
        if model_entry['status'] == 'active':
            self._deactivate_other_models(model_entry['model_type'])
        
        # Save registry
        self._save_registry()
        
        self.logger.info(
            "Model added to registry", 
            model_id=model_entry['id'],
            version=model_entry['version'],
            status=model_entry['status']
        )
        
        return model_entry
    
    def _deactivate_other_models(self, model_type: str):
        """Deactivate other models of the same type."""
        for model in self.registry['models']:
            if (model.get('model_type') == model_type and 
                model['status'] == 'active' and
                model['status'] != 'candidate'):  # Don't deactivate candidates
                model['status'] = 'archived'
                self.logger.debug("Deactivated model", model_id=model['id'])
    
    def get_all_models(self) -> List[Dict[str, Any]]:
        """Get all models in the registry."""
        return self.registry['models']
    
    def get_models_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get models filtered by status."""
        return [model for model in self.registry['models'] if model['status'] == status]
    
    def get_models_by_type(self, model_type: str) -> List[Dict[str, Any]]:
        """Get models filtered by type."""
        return [model for model in self.registry['models'] if model.get('model_type') == model_type]
    
    def get_active_model(self, model_type: str = None) -> Optional[Dict[str, Any]]:
        """
        Get the active model.
        
        Args:
            model_type: Filter by model type (optional)
            
        Returns:
            Active model or None
        """
        active_models = self.get_models_by_status('active')
        
        if model_type:
            active_models = [m for m in active_models if m.get('model_type') == model_type]
        
        # Return the most recent active model
        if active_models:
            return max(active_models, key=lambda x: x['created_at'])
        
        return None
    
    def get_model_by_id(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific model by ID."""
        for model in self.registry['models']:
            if model['id'] == model_id:
                return model
        return None
    
    def update_model_status(self, model_id: str, new_status: str) -> bool:
        """
        Update model status.
        
        Args:
            model_id: Model identifier
            new_status: New status ('active', 'candidate', 'archived')
            
        Returns:
            Success status
        """
        valid_statuses = ['active', 'candidate', 'archived']
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status: {new_status}. Must be one of {valid_statuses}")
        
        model = self.get_model_by_id(model_id)
        if not model:
            raise ValueError(f"Model not found: {model_id}")
        
        old_status = model['status']
        model['status'] = new_status
        model['updated_at'] = datetime.now().isoformat()
        
        # Handle status transitions
        if new_status == 'active':
            # Deactivate other models of the same type
            self._deactivate_other_models(model.get('model_type', 'unknown'))
        elif old_status == 'active' and new_status != 'active':
            # If demoting an active model, we might want to activate the best candidate
            self._promote_best_candidate(model.get('model_type', 'unknown'))
        
        # Save registry
        self._save_registry()
        
        self.logger.info(
            "Model status updated", 
            model_id=model_id, 
            old_status=old_status, 
            new_status=new_status
        )
        
        return True
    
    def _promote_best_candidate(self, model_type: str):
        """Promote the best candidate model to active."""
        candidates = self.get_models_by_type(model_type)
        candidates = [c for c in candidates if c['status'] == 'candidate']
        
        if candidates:
            # Sort by accuracy (or primary metric)
            best_candidate = max(candidates, key=lambda x: x['metrics'].get('accuracy', 0))
            best_candidate['status'] = 'active'
            best_candidate['promoted_at'] = datetime.now().isoformat()
            
            self.logger.info(
                "Best candidate promoted to active", 
                model_id=best_candidate['id'],
                accuracy=best_candidate['metrics'].get('accuracy', 0)
            )
    
    def get_model_performance_summary(self) -> Dict[str, Any]:
        """Get summary statistics of all models."""
        models = self.registry['models']
        
        if not models:
            return {'total_models': 0}
        
        summary = {
            'total_models': len(models),
            'status_distribution': {},
            'type_distribution': {},
            'algorithm_distribution': {},
            'best_models': {}
        }
        
        # Status distribution
        for model in models:
            status = model['status']
            summary['status_distribution'][status] = summary['status_distribution'].get(status, 0) + 1
        
        # Type distribution
        for model in models:
            model_type = model.get('model_type', 'unknown')
            summary['type_distribution'][model_type] = summary['type_distribution'].get(model_type, 0) + 1
        
        # Algorithm distribution
        for model in models:
            algorithm = model['algorithm']
            summary['algorithm_distribution'][algorithm] = summary['algorithm_distribution'].get(algorithm, 0) + 1
        
        # Best models by type
        for model_type in set(model.get('model_type', 'unknown') for model in models):
            type_models = self.get_models_by_type(model_type)
            if type_models:
                best_model = max(type_models, key=lambda x: x['metrics'].get('accuracy', 0))
                summary['best_models'][model_type] = {
                    'id': best_model['id'],
                    'version': best_model['version'],
                    'accuracy': best_model['metrics'].get('accuracy', 0),
                    'status': best_model['status']
                }
        
        return summary
    
    def cleanup_old_models(self, keep_per_type: int = 5) -> int:
        """
        Clean up old archived models, keeping only the most recent ones.
        
        Args:
            keep_per_type: Number of models to keep per type
            
        Returns:
            Number of models cleaned up
        """
        models_by_type = {}
        cleaned_up = 0
        
        # Group models by type
        for model in self.registry['models']:
            model_type = model.get('model_type', 'unknown')
            if model_type not in models_by_type:
                models_by_type[model_type] = []
            models_by_type[model_type].append(model)
        
        # For each type, keep only the most recent models
        for model_type, models in models_by_type.items():
            # Sort by creation date, most recent first
            models.sort(key=lambda x: x['created_at'], reverse=True)
            
            # Keep active and candidate models always
            to_keep = [m for m in models if m['status'] in ['active', 'candidate']]
            
            # Add additional archived models up to the limit
            archived_models = [m for m in models if m['status'] == 'archived']
            to_keep.extend(archived_models[:keep_per_type])
            
            # Remove models not in to_keep list
            models_to_remove = [m for m in models if m not in to_keep]
            for model in models_to_remove:
                self.registry['models'].remove(model)
                cleaned_up += 1
                
                self.logger.debug(
                    "Removed old model", 
                    model_id=model['id'],
                    model_type=model_type,
                    status=model['status']
                )
        
        if cleaned_up > 0:
            self._save_registry()
            self.logger.info("Cleanup completed", models_removed=cleaned_up)
        
        return cleaned_up
    
    def export_registry(self, export_path: str) -> bool:
        """
        Export registry to a specific file path.
        
        Args:
            export_path: Path to export file
            
        Returns:
            Success status
        """
        try:
            export_file = Path(export_path)
            export_file.parent.mkdir(parents=True, exist_ok=True)
            
            export_data = {
                'exported_at': datetime.now().isoformat(),
                'registry_version': self.registry.get('version', '1.0.0'),
                'summary': self.get_model_performance_summary(),
                'models': self.registry['models']
            }
            
            with open(export_file, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            self.logger.info("Registry exported", export_path=export_path)
            return True
            
        except Exception as e:
            self.logger.error("Failed to export registry", error=str(e))
            return False
    
    def import_registry(self, import_path: str, merge: bool = True) -> bool:
        """
        Import registry from a file.
        
        Args:
            import_path: Path to import file
            merge: Whether to merge with existing registry
            
        Returns:
            Success status
        """
        try:
            import_file = Path(import_path)
            if not import_file.exists():
                raise ValueError(f"Import file not found: {import_path}")
            
            with open(import_file, 'r') as f:
                import_data = json.load(f)
            
            imported_models = import_data.get('models', [])
            
            if merge:
                # Merge with existing models (avoid duplicates)
                existing_ids = {model['id'] for model in self.registry['models']}
                new_models = [m for m in imported_models if m['id'] not in existing_ids]
                self.registry['models'].extend(new_models)
                
                self.logger.info("Registry imported and merged", new_models=len(new_models))
            else:
                # Replace entire registry
                self.registry = {
                    'version': '1.0.0',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'models': imported_models
                }
                
                self.logger.info("Registry replaced", total_models=len(imported_models))
            
            self._save_registry()
            return True
            
        except Exception as e:
            self.logger.error("Failed to import registry", error=str(e))
            return False