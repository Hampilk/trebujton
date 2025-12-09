# ML Pipeline Documentation

This directory contains the complete machine learning pipeline for football prediction models, implementing Phase 6 of the project roadmap.

## Overview

The ML pipeline provides:

- **Data Loading**: Unified data loading from multiple sources (database, CSV, JSON)
- **Feature Engineering**: Automated feature scaling, encoding, and transformation
- **Model Training**: Support for three model families with stratified data splitting
- **Evaluation**: Comprehensive metrics calculation and cross-validation
- **Ensemble Prediction**: Weighted blending of multiple models
- **Model Registry**: JSON-based model versioning and status tracking
- **Supabase Integration**: Database tracking of training runs and performance
- **CLI Interface**: Command-line tools for all pipeline operations

## Architecture

```
Data Sources → Data Loader → Feature Engineering → Model Training → Evaluation
                                                       ↓
Model Registry ← Supabase ← Ensemble Predictor ← Model Storage
```

## Model Types

1. **Full-time Result Predictor** (`full_time`)
   - Predicts final match result (Home/Away/Draw)
   - Algorithm: Logistic Regression, Random Forest, XGBoost
   - Features: Team strength, recent form, league position, goals average

2. **Half-time Result Predictor** (`half_time`)
   - Predicts half-time result (Home/Away/Draw)
   - Algorithm: Random Forest, Gradient Boosting
   - Features: Team strength, half-time goals, recent form

3. **Pattern Recognition** (`pattern`)
   - Identifies match patterns (high-scoring, close games, etc.)
   - Algorithm: XGBoost, Random Forest
   - Features: Scoring patterns, defensive patterns, momentum indicators

## Quick Start

### 1. Install Dependencies

```bash
# Install ML dependencies
pip install -r ml/requirements.txt

# Or using pipenv
pipenv install -r ml/requirements.txt

# Or using conda
conda install --file ml/requirements.txt
```

### 2. Configuration Setup

Copy and configure the ML pipeline:

```bash
# Copy configuration template
cp ml/config/config.yaml ml/config/my_config.yaml

# Edit configuration with your settings
vim ml/config/my_config.yaml
```

Required configuration sections:

```yaml
database:
  supabase_url: "${SUPABASE_URL}"
  supabase_key: "${SUPABASE_ANON_KEY}"

models:
  full_time:
    algorithm: "LogisticRegression"
    target_column: "full_time_result"
    hyperparameters:
      C: 1.0
      random_state: 42
```

### 3. Train Models

```bash
# Train full-time model
python -m ml.train_model --model-type full_time --config ml/config/my_config.yaml

# Train with dry run (no model saving)
python -m ml.train_model --model-type half_time --config ml/config/my_config.yaml --dry-run

# Train pattern model with verbose logging
python -m ml.train_model --model-type pattern --config ml/config/my_config.yaml --verbose
```

### 4. Make Predictions

```bash
# Check model status
python -m ml.ensemble_predictor --config ml/config/my_config.yaml --status

# Single match prediction (interactive)
python -m ml.ensemble_predictor --config ml/config/my_config.yaml --predict-single

# Batch prediction from CSV
python -m ml.ensemble_predictor --config ml/config/my_config.yaml --predict-batch matches.csv
```

## Detailed Usage

### Data Loader

```python
from ml import DataLoader

# Initialize data loader
loader = DataLoader('ml/config/my_config.yaml')

# Load data from different sources
df = loader.load_match_data("database")  # From Supabase
df = loader.load_match_data("csv")       # From CSV files
df = loader.load_match_data("json")      # From JSON files

# Get data summary
summary = loader.get_data_summary(df)
print(f"Loaded {summary['total_rows']} matches from {len(summary['leagues'])} leagues")
```

### Feature Engineering

```python
from ml import FeatureEngineer

# Initialize feature engineer
fe = FeatureEngineer(config)

# Fit and transform data
X_processed, feature_info = fe.fit_transform(X, 'full_time', 'full_time_result')

# Transform new data
X_new = fe.transform(X_new_data, 'full_time')

# Get feature importance plot data
importance_data = fe.get_feature_importance_plot_data(model, feature_names)
```

### Model Training

```python
from ml import ModelTrainer

# Initialize trainer
trainer = ModelTrainer('ml/config/my_config.yaml', 'full_time')

# Run training pipeline
results = trainer.train()

print(f"Model accuracy: {results['evaluation_results']['metrics']['accuracy']:.4f}")
```

### Model Evaluation

```python
from ml import ModelEvaluator

# Initialize evaluator
evaluator = ModelEvaluator(config)

# Evaluate model
results = evaluator.evaluate_model(model, X_test, y_test, 'full_time')

# Cross-validation
cv_results = evaluator.evaluate_with_cross_validation(model, X, y, 'full_time')

# Generate comparison
comparison_df = evaluator.compare_models([results1, results2, results3])
```

### Ensemble Prediction

```python
from ml import EnsemblePredictor

# Initialize predictor
predictor = EnsemblePredictor('ml/config/my_config.yaml', 'full_time')

# Single prediction
match_data = {
    'home_team': 'Arsenal',
    'away_team': 'Chelsea',
    'league': 'Premier League',
    'home_team_strength': 0.5,
    'away_team_strength': 0.3
}

result = predictor.predict_single(match_data)
print(f"Prediction: {result['prediction']} (confidence: {result['confidence']:.3f})")

# Batch prediction
batch_results = predictor.predict_batch([match_data1, match_data2, match_data3])
```

### Model Registry

```python
from ml import ModelRegistry

# Initialize registry
registry = ModelRegistry(config)

# Add model
model_entry = registry.add_model({
    'id': 'model-123',
    'version': 'v1.0.0',
    'algorithm': 'RandomForestClassifier',
    'metrics': {'accuracy': 0.87},
    'status': 'candidate',
    'file_path': 'ml/models/model-123.joblib'
})

# Query models
active_models = registry.get_models_by_status('active')
full_time_models = registry.get_models_by_type('full_time')
best_model = registry.get_active_model('full_time')

# Update status
registry.update_model_status('model-123', 'active')
```

### Supabase Integration

```python
from ml import SupabaseClient

# Initialize client
client = SupabaseClient(config)

# Insert training run
training_data = {
    'model_id': 'model-123',
    'model_type': 'full_time',
    'accuracy': 0.87
}
client.insert_model_retraining_run(training_data)

# Insert performance metrics
performance_data = {
    'model_id': 'model-123',
    'accuracy': 0.87,
    'f1_score': 0.85
}
client.insert_model_performance(performance_data)

# Get history
history = client.get_model_performance_history('full_time', limit=100)
```

### Logging

```python
from ml import get_logger, setup_ml_logging

# Setup logging
setup_ml_logging({
    'level': 'INFO',
    'format': 'json',
    'output': ['stdout', 'file:logs/ml_pipeline.log']
})

# Get logger
logger = get_logger('training')
logger.info("Training started", model_type="full_time", epochs=100)

# Specialized logging methods
from ml.logging_utils import log_training_start, log_prediction_request

log_training_start('full_time', 'config.yaml', dry_run=False)
log_prediction_request('full_time', 50)
```

## Configuration Reference

### Model Configuration

```yaml
models:
  full_time:
    name: "Full-time Result Predictor"
    algorithm: "LogisticRegression"  # or RandomForestClassifier, XGBClassifier
    target_column: "full_time_result"
    features:
      - team_strength_diff
      - home_advantage
      - recent_form
    hyperparameters:
      C: 1.0
      max_iter: 1000
      random_state: 42
```

### Training Configuration

```yaml
training:
  test_size: 0.2
  validation_size: 0.1
  cross_validation_folds: 5
  stratification_columns: ["league", "season"]
  random_state: 42
  
  feature_engineering:
    scaling_method: "standard"    # standard, minmax, robust
    encoding_method: "onehot"     # onehot, label, target
    handle_missing: "impute"      # drop, impute, flag
    outlier_treatment: "winsorize"  # drop, cap, winsorize
    
  metrics:
    primary: "accuracy"
    secondary: ["f1_score", "precision", "recall", "roc_auc"]
```

### Database Configuration

```yaml
database:
  supabase_url: "${SUPABASE_URL}"
  supabase_key: "${SUPABASE_ANON_KEY}"
  schema: "public"
```

### Logging Configuration

```yaml
logging:
  level: "INFO"              # DEBUG, INFO, WARNING, ERROR
  format: "json"             # json, text
  output: 
    - "stdout"
    - "file:logs/system_logs.log"
  rotation:
    size: "10MB"             # File size limit
    backup_count: 5          # Number of backup files
```

### Output Configuration

```yaml
output:
  model_registry_path: "ml/models/model_registry.json"
  model_artifacts_path: "ml/models"
  logs_path: "logs"
  reports_path: "reports"
```

## Model Registry

The model registry (`ml/models/model_registry.json`) tracks all trained models:

```json
{
  "version": "1.0.0",
  "created_at": "2024-01-15T10:30:00.000Z",
  "models": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "version": "v1.2.0",
      "algorithm": "RandomForestClassifier",
      "metrics": {
        "accuracy": 0.872,
        "f1_score": 0.845,
        "precision": 0.851,
        "recall": 0.839
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "status": "active",
      "file_path": "ml/models/full_time_v1_2_0.joblib",
      "model_type": "full_time"
    }
  ]
}
```

### Status Lifecycle

- **candidate**: Newly trained model awaiting evaluation
- **active**: Current production model serving predictions
- **archived**: Previous production model kept for reference

## API Integration

The ensemble predictor exposes a Python API that can be integrated with the frontend:

```python
from ml.ensemble_predictor import EnsemblePredictor

# Initialize predictor
predictor = EnsemblePredictor('config.yaml', 'full_time')

# Make prediction
prediction = predictor.predict_single(match_data)

# Return response for frontend
response = {
    'prediction': prediction['prediction'],
    'confidence': prediction['confidence'],
    'model_weights': prediction['model_weights'],
    'ensemble_method': 'weighted_average',
    'timestamp': prediction['timestamp']
}
```

## Testing

Run unit tests to ensure deterministic training:

```bash
# Run all tests
pytest ml/tests/

# Run specific test module
pytest ml/tests/test_feature_engineering.py -v

# Run with coverage
pytest ml/tests/ --cov=ml --cov-report=html

# Run deterministic tests
pytest ml/tests/test_feature_engineering.py::TestFeatureEngineer::test_fit_transform_full_pipeline -v
```

### Test Categories

- **Feature Engineering**: Tests feature selection, scaling, encoding
- **Configuration Parsing**: Tests config loading, validation, environment substitution
- **Data Loading**: Tests data loading from various sources
- **Model Training**: Tests complete training pipeline
- **Evaluation**: Tests metrics calculation and model comparison
- **Ensemble Prediction**: Tests weighted blending and prediction

## File Structure

```
ml/
├── __init__.py                 # Package initialization
├── requirements.txt            # Python dependencies
├── data_loader.py             # Data loading and preprocessing
├── feature_engineering.py     # Feature transformation and scaling
├── evaluation.py              # Model evaluation and metrics
├── train_model.py             # CLI entry point for training
├── ensemble_predictor.py      # Ensemble prediction system
├── supabase_client.py         # Database integration
├── model_registry.py          # Model versioning and tracking
├── logging_utils.py           # Centralized logging configuration
├── config/
│   └── config.yaml           # Configuration template
├── models/                   # Trained model artifacts (gitignored)
│   └── model_registry.json  # Model registry
├── tests/
│   ├── __init__.py
│   ├── test_feature_engineering.py
│   └── test_config_parsing.py
└── README.md                 # This file
```

## Gitignore

Add to `.gitignore`:

```
# ML Model Artifacts
ml/models/*.joblib
ml/models/*.pkl
ml/models/*.h5
ml/models/*.json

# ML Logs
logs/
*.log

# ML Reports
reports/

# ML Cache
.cache/
__pycache__/
*.pyc

# Environment
.env
ml/.env
```

## Environment Variables

Set these environment variables for database integration:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

## Error Handling

The pipeline includes comprehensive error handling:

- **Data Loading**: Graceful fallback to mock data if database unavailable
- **Model Training**: Continues with available data if some sources fail
- **Prediction**: Returns error details instead of crashing
- **Database**: Falls back to file-based logging if Supabase unavailable

## Performance Optimization

- **Data Caching**: Loaded data is cached to avoid redundant loading
- **Feature Engineering**: Transformers are fitted once and reused
- **Model Loading**: Only loads necessary models for prediction
- **Batch Processing**: Efficient batch prediction for multiple matches
- **Logging**: Asynchronous logging to avoid blocking pipeline

## Monitoring

Monitor pipeline performance:

```bash
# Check model registry status
python -c "from ml import ModelRegistry; r = ModelRegistry({}); print(r.get_model_performance_summary())"

# View logs
tail -f logs/system_logs.log

# Check Supabase connection
python -c "from ml import SupabaseClient; c = SupabaseClient({}); print('Connected' if c.test_connection() else 'Not connected')"
```

## Troubleshooting

### Common Issues

1. **ImportError**: Ensure all dependencies are installed
   ```bash
   pip install -r ml/requirements.txt
   ```

2. **Configuration Error**: Validate YAML syntax
   ```bash
   python -c "import yaml; yaml.safe_load(open('ml/config/config.yaml'))"
   ```

3. **Database Connection**: Check environment variables
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

4. **Model Not Found**: Check model registry and file paths
   ```python
   from ml import ModelRegistry
   registry = ModelRegistry(config)
   print(registry.get_model_performance_summary())
   ```

### Debug Mode

Enable verbose logging for debugging:

```bash
python -m ml.train_model --model-type full_time --config config.yaml --verbose
```

Or set environment variable:

```bash
export ML_LOG_LEVEL=DEBUG
```

## Contributing

When adding new features:

1. **Add unit tests** to `ml/tests/`
2. **Update configuration** schema if needed
3. **Document new parameters** in this README
4. **Test deterministic behavior** with fixed random seeds
5. **Update model registry** schema if changing model metadata

## Version History

- **v1.0.0**: Initial ML pipeline implementation
  - Support for 3 model types (full-time, half-time, pattern)
  - Complete training pipeline with CLI
  - Ensemble prediction with weighted blending
  - Model registry with JSON storage
  - Supabase integration for tracking
  - Comprehensive logging and error handling

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs in `logs/system_logs.log`
3. Run tests to ensure deterministic behavior
4. Check configuration file syntax and environment variables

## License

This ML pipeline is part of the main project and follows the same licensing terms.