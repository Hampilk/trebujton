"""
Logging Utilities Module
Centralized logging configuration for the ML pipeline.
"""

import logging
import logging.handlers
import structlog
from typing import Dict, Any, Optional
from pathlib import Path
import os
import sys
from datetime import datetime


class MLLogger:
    """Centralized logging manager for ML pipeline."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize ML logger.
        
        Args:
            config: Logging configuration dictionary
        """
        self.config = config or self._default_config()
        self.logger = None
        self._setup_logging()
    
    def _default_config(self) -> Dict[str, Any]:
        """Get default logging configuration."""
        return {
            'level': 'INFO',
            'format': 'json',
            'output': ['stdout'],
            'rotation': {
                'size': '10MB',
                'backup_count': 5
            }
        }
    
    def _setup_logging(self):
        """Set up logging configuration."""
        # Get log level
        log_level = self.config.get('level', 'INFO').upper()
        numeric_level = getattr(logging, log_level, logging.INFO)
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(numeric_level)
        
        # Clear existing handlers
        root_logger.handlers.clear()
        
        # Create formatters
        if self.config.get('format') == 'json':
            formatter = self._get_json_formatter()
        else:
            formatter = self._get_text_formatter()
        
        # Set up outputs
        outputs = self.config.get('output', ['stdout'])
        
        for output in outputs:
            if output == 'stdout':
                handler = logging.StreamHandler(sys.stdout)
            elif output.startswith('file:'):
                file_path = output[5:]  # Remove 'file:' prefix
                handler = self._get_file_handler(file_path, formatter)
            else:
                continue  # Skip unknown outputs
            
            handler.setFormatter(formatter)
            root_logger.addHandler(handler)
        
        # Configure structlog
        self._setup_structlog(numeric_level)
        
        self.logger = structlog.get_logger().bind(component="ml_logger")
        self.logger.info("Logging system initialized")
    
    def _get_json_formatter(self) -> structlog.stdlib.ProcessorFormatter:
        """Get JSON formatter for structured logging."""
        return structlog.stdlib.ProcessorFormatter(
            processor=structlog.processors.JSONRenderer()
        )
    
    def _get_text_formatter(self) -> logging.Formatter:
        """Get text formatter for traditional logging."""
        return logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def _get_file_handler(self, file_path: str, formatter) -> logging.handlers.RotatingFileHandler:
        """Get rotating file handler."""
        # Create directory if it doesn't exist
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Parse rotation config
        rotation_config = self.config.get('rotation', {})
        max_bytes = self._parse_size(rotation_config.get('size', '10MB'))
        backup_count = rotation_config.get('backup_count', 5)
        
        handler = logging.handlers.RotatingFileHandler(
            file_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        
        handler.setFormatter(formatter)
        return handler
    
    def _parse_size(self, size_str: str) -> int:
        """Parse size string to bytes."""
        size_str = size_str.upper()
        if size_str.endswith('KB'):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith('MB'):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith('GB'):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)  # Assume bytes
    
    def _setup_structlog(self, log_level: int):
        """Configure structlog for structured logging."""
        structlog.configure(
            processors=[
                # Filter by level
                structlog.stdlib.filter_by_level,
                
                # Add logger name and level
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                
                # Positional arguments formatter
                structlog.stdlib.PositionalArgumentsFormatter(),
                
                # Add timestamp
                structlog.processors.TimeStamper(
                    fmt="iso",
                    utc=True
                ),
                
                # Stack info renderer
                structlog.processors.StackInfoRenderer(),
                
                # Exception info
                structlog.processors.format_exc_info,
                
                # Add event PID and hostname
                structlog.processors.add_log_level,
                structlog.processors.TimeStamper(fmt="ISO"),
                
                # JSON renderer (will be overridden by stdlib formatter)
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Set stdlib log level
        stdlib_logger = logging.getLogger("structlog")
        stdlib_logger.setLevel(log_level)
    
    def get_logger(self, name: str = None) -> structlog.BoundLogger:
        """
        Get a logger instance.
        
        Args:
            name: Logger name
            
        Returns:
            Configured logger instance
        """
        if name:
            return structlog.get_logger(name)
        return self.logger
    
    def log_training_start(self, model_type: str, config_path: str, 
                          dry_run: bool = False) -> structlog.BoundLogger:
        """Log training start event."""
        logger = self.get_logger('training')
        logger.info(
            "Model training started",
            model_type=model_type,
            config_path=config_path,
            dry_run=dry_run,
            timestamp=datetime.now().isoformat(),
            event_type="training_start"
        )
        return logger
    
    def log_training_progress(self, step: str, details: Dict[str, Any]) -> structlog.BoundLogger:
        """Log training progress."""
        logger = self.get_logger('training')
        logger.info(
            f"Training {step} completed",
            step=step,
            details=details,
            event_type="training_progress"
        )
        return logger
    
    def log_training_complete(self, results: Dict[str, Any]) -> structlog.BoundLogger:
        """Log training completion."""
        logger = self.get_logger('training')
        logger.info(
            "Model training completed",
            model_id=results.get('model_id'),
            model_type=results.get('model_type'),
            accuracy=results.get('evaluation_results', {}).get('metrics', {}).get('accuracy'),
            event_type="training_complete"
        )
        return logger
    
    def log_prediction_request(self, model_type: str, num_matches: int) -> structlog.BoundLogger:
        """Log prediction request."""
        logger = self.get_logger('prediction')
        logger.info(
            "Prediction request received",
            model_type=model_type,
            num_matches=num_matches,
            event_type="prediction_request"
        )
        return logger
    
    def log_prediction_result(self, prediction: Any, confidence: float) -> structlog.BoundLogger:
        """Log prediction result."""
        logger = self.get_logger('prediction')
        logger.info(
            "Prediction generated",
            prediction=prediction,
            confidence=confidence,
            event_type="prediction_result"
        )
        return logger
    
    def log_model_registry_event(self, action: str, model_id: str, 
                               details: Dict[str, Any]) -> structlog.BoundLogger:
        """Log model registry event."""
        logger = self.get_logger('registry')
        logger.info(
            f"Model registry {action}",
            action=action,
            model_id=model_id,
            details=details,
            event_type="registry_event"
        )
        return logger
    
    def log_data_loading(self, source: str, rows: int, columns: int) -> structlog.BoundLogger:
        """Log data loading event."""
        logger = self.get_logger('data')
        logger.info(
            "Data loaded",
            source=source,
            rows=rows,
            columns=columns,
            event_type="data_loaded"
        )
        return logger
    
    def log_feature_engineering(self, model_type: str, num_features: int, 
                              method: str) -> structlog.BoundLogger:
        """Log feature engineering event."""
        logger = self.get_logger('features')
        logger.info(
            "Feature engineering completed",
            model_type=model_type,
            num_features=num_features,
            method=method,
            event_type="feature_engineering"
        )
        return logger
    
    def log_model_evaluation(self, model_type: str, metrics: Dict[str, float]) -> structlog.BoundLogger:
        """Log model evaluation."""
        logger = self.get_logger('evaluation')
        logger.info(
            "Model evaluation completed",
            model_type=model_type,
            accuracy=metrics.get('accuracy'),
            f1_score=metrics.get('f1_score'),
            event_type="evaluation_complete"
        )
        return logger
    
    def log_error(self, component: str, error: Exception, context: Dict[str, Any] = None):
        """Log error with context."""
        logger = self.get_logger('error')
        logger.error(
            "Error occurred",
            component=component,
            error=str(error),
            error_type=type(error).__name__,
            context=context or {},
            event_type="error",
            exc_info=True
        )
    
    def log_system_event(self, event_type: str, details: Dict[str, Any]):
        """Log system-level event."""
        logger = self.get_logger('system')
        logger.info(
            "System event",
            event_type=event_type,
            details=details,
            timestamp=datetime.now().isoformat(),
            event_type="system_event"
        )


# Global logger instance
_global_logger = None


def get_logger(name: str = None) -> structlog.BoundLogger:
    """
    Get global logger instance.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    global _global_logger
    if _global_logger is None:
        _global_logger = MLLogger()
    return _global_logger.get_logger(name)


def setup_ml_logging(config: Dict[str, Any] = None):
    """
    Set up ML pipeline logging.
    
    Args:
        config: Logging configuration
    """
    global _global_logger
    _global_logger = MLLogger(config)
    return _global_logger


def log_training_session(model_type: str, session_id: str, **kwargs):
    """Log training session start."""
    logger = get_logger('training_session')
    logger.info(
        "Training session started",
        model_type=model_type,
        session_id=session_id,
        event_type="training_session_start",
        **kwargs
    )


def log_ensemble_prediction(models_used: list, prediction: Any, confidence: float):
    """Log ensemble prediction."""
    logger = get_logger('ensemble')
    logger.info(
        "Ensemble prediction made",
        models_used=models_used,
        prediction=prediction,
        confidence=confidence,
        event_type="ensemble_prediction"
    )


def log_model_deployment(model_id: str, model_type: str, status: str):
    """Log model deployment event."""
    logger = get_logger('deployment')
    logger.info(
        "Model deployment event",
        model_id=model_id,
        model_type=model_type,
        status=status,
        event_type="model_deployment"
    )


def log_data_quality_check(rows_processed: int, issues_found: int, issues: list):
    """Log data quality check results."""
    logger = get_logger('data_quality')
    logger.info(
        "Data quality check completed",
        rows_processed=rows_processed,
        issues_found=issues_found,
        issues=issues,
        event_type="data_quality_check"
    )


def log_api_request(endpoint: str, method: str, user_id: str = None):
    """Log API request."""
    logger = get_logger('api')
    logger.info(
        "API request received",
        endpoint=endpoint,
        method=method,
        user_id=user_id,
        event_type="api_request"
    )


def log_api_response(endpoint: str, status_code: int, response_time_ms: float):
    """Log API response."""
    logger = get_logger('api')
    logger.info(
        "API response sent",
        endpoint=endpoint,
        status_code=status_code,
        response_time_ms=response_time_ms,
        event_type="api_response"
    )