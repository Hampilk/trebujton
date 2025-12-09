export interface ModelPrediction {
  prediction: string;
  confidence: number; // Value between 0 and 1
}

export interface EnsembleInput {
  full_time_prediction?: ModelPrediction;
  half_time_prediction?: ModelPrediction;
  pattern_prediction?: ModelPrediction;
}

export interface EnsembleBreakdown {
  full_time: ModelPrediction;
  half_time: ModelPrediction;
  pattern: ModelPrediction;
  weights_used: { ft: number; ht: number; pt: number };
  conflict?: {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
  };
}

export interface EnsembleResult {
  prediction: string;
  confidence: number;
  ensemble_breakdown: EnsembleBreakdown;
}

export class EnsemblePredictor {
  private static readonly DEFAULT_WEIGHTS = {
    ft: 0.5, // 50% Full Time
    ht: 0.3, // 30% Half Time
    pt: 0.2, // 20% Pattern
  };

  private static readonly CONFLICT_THRESHOLD = 0.1; // 10% difference threshold

  /**
   * Calculates the weighted ensemble prediction based on multiple model outputs
   * Applies 50% FT / 30% HT / 20% Pattern weighting with auto re-weighting
   * when models are missing and conflict detection
   */
  predict(input: EnsembleInput): EnsembleResult {
    const availableModels = this.getAvailableModels(input);
    const weights = this.calculateWeights(availableModels);
    const weightedPredictions = this.calculateWeightedPredictions(input, weights);
    const finalPrediction = this.aggregatePredictions(weightedPredictions);
    const conflict = this.detectConflict(weightedPredictions, weights);

    return {
      prediction: finalPrediction.prediction,
      confidence: finalPrediction.confidence,
      ensemble_breakdown: {
        full_time: input.full_time_prediction || { prediction: 'N/A', confidence: 0 },
        half_time: input.half_time_prediction || { prediction: 'N/A', confidence: 0 },
        pattern: input.pattern_prediction || { prediction: 'N/A', confidence: 0 },
        weights_used: weights,
        conflict,
      },
    };
  }

  /**
   * Determines which models provided predictions
   */
  private getAvailableModels(input: EnsembleInput): string[] {
    const models: string[] = [];
    if (input.full_time_prediction) models.push('ft');
    if (input.half_time_prediction) models.push('ht');
    if (input.pattern_prediction) models.push('pt');
    return models;
  }

  /**
   * Calculates weights dynamically based on available models
   * If models are missing, redistributes weights proportionally
   */
  private calculateWeights(availableModels: string[]): { ft: number; ht: number; pt: number } {
    if (availableModels.length === 0) {
      throw new Error('At least one model prediction must be provided');
    }

    if (availableModels.length === 3) {
      return { ...EnsemblePredictor.DEFAULT_WEIGHTS };
    }

    // Calculate total weight of available models
    let totalAvailableWeight = 0;
    const weights: { ft: number; ht: number; pt: number } = { ft: 0, ht: 0, pt: 0 };

    availableModels.forEach(model => {
      switch (model) {
        case 'ft':
          weights.ft = EnsemblePredictor.DEFAULT_WEIGHTS.ft;
          totalAvailableWeight += EnsemblePredictor.DEFAULT_WEIGHTS.ft;
          break;
        case 'ht':
          weights.ht = EnsemblePredictor.DEFAULT_WEIGHTS.ht;
          totalAvailableWeight += EnsemblePredictor.DEFAULT_WEIGHTS.ht;
          break;
        case 'pt':
          weights.pt = EnsemblePredictor.DEFAULT_WEIGHTS.pt;
          totalAvailableWeight += EnsemblePredictor.DEFAULT_WEIGHTS.pt;
          break;
      }
    });

    // Normalize weights to sum to 1
    if (totalAvailableWeight > 0) {
      weights.ft = weights.ft / totalAvailableWeight;
      weights.ht = weights.ht / totalAvailableWeight;
      weights.pt = weights.pt / totalAvailableWeight;
    }

    return weights;
  }

  /**
   * Calculates weighted predictions for each model
   */
  private calculateWeightedPredictions(
    input: EnsembleInput,
    weights: { ft: number; ht: number; pt: number }
  ): Map<string, { prediction: string; weightedConfidence: number }> {
    const weightedPredictions = new Map<string, { prediction: string; weightedConfidence: number }>();

    if (input.full_time_prediction) {
      weightedPredictions.set('ft', {
        prediction: input.full_time_prediction.prediction,
        weightedConfidence: input.full_time_prediction.confidence * weights.ft,
      });
    }

    if (input.half_time_prediction) {
      weightedPredictions.set('ht', {
        prediction: input.half_time_prediction.prediction,
        weightedConfidence: input.half_time_prediction.confidence * weights.ht,
      });
    }

    if (input.pattern_prediction) {
      weightedPredictions.set('pt', {
        prediction: input.pattern_prediction.prediction,
        weightedConfidence: input.pattern_prediction.confidence * weights.pt,
      });
    }

    return weightedPredictions;
  }

  /**
   * Aggregates weighted predictions to find the final prediction
   * Currently uses simple voting weighted by confidence
   */
  private aggregatePredictions(
    weightedPredictions: Map<string, { prediction: string; weightedConfidence: number }>
  ): { prediction: string; confidence: number } {
    const predictionScores = new Map<string, number>();
    let totalConfidence = 0;

    // Sum weighted confidences for each prediction
    weightedPredictions.forEach(({ prediction, weightedConfidence }) => {
      const currentScore = predictionScores.get(prediction) || 0;
      predictionScores.set(prediction, currentScore + weightedConfidence);
      totalConfidence += weightedConfidence;
    });

    // Find prediction with highest total weighted confidence
    let bestPrediction = '';
    let bestScore = 0;

    predictionScores.forEach((score, prediction) => {
      if (score > bestScore) {
        bestScore = score;
        bestPrediction = prediction;
      }
    });

    // Normalize confidence to 0-1 range
    const normalizedConfidence = totalConfidence > 0 ? bestScore / totalConfidence : 0;

    return {
      prediction: bestPrediction,
      confidence: normalizedConfidence,
    };
  }

  /**
   * Detects conflicts when two highest weighted outcomes differ by <10%
   */
  private detectConflict(
    weightedPredictions: Map<string, { prediction: string; weightedConfidence: number }>,
    weights: { ft: number; ht: number; pt: number }
  ): EnsembleBreakdown['conflict'] {
    if (weightedPredictions.size < 2) {
      return undefined;
    }

    // Get the two highest weighted predictions
    const sortedPredictions = Array.from(weightedPredictions.entries()).sort(
      (a, b) => b[1].weightedConfidence - a[1].weightedConfidence
    );

    if (sortedPredictions.length < 2) {
      return undefined;
    }

    const topPrediction = sortedPredictions[0][1];
    const secondPrediction = sortedPredictions[1][1];

    // Check if predictions are different
    if (topPrediction.prediction === secondPrediction.prediction) {
      return undefined;
    }

    // Calculate difference in weighted confidence
    const confidenceDiff = Math.abs(
      topPrediction.weightedConfidence - secondPrediction.weightedConfidence
    );

    // Normalize by total possible weight
    const totalWeight = Array.from(weightedPredictions.values()).reduce(
      (sum, pred) => sum + pred.weightedConfidence,
      0
    );

    if (totalWeight === 0) {
      return undefined;
    }

    const normalizedDiff = confidenceDiff / totalWeight;

    if (normalizedDiff < EnsemblePredictor.CONFLICT_THRESHOLD) {
      // Conflict detected - determine severity
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (normalizedDiff < 0.05) {
        severity = 'high';
      } else if (normalizedDiff < 0.075) {
        severity = 'medium';
      }

      return {
        detected: true,
        severity,
        message: `Conflict detected: Models predict different outcomes with only ${(normalizedDiff * 100).toFixed(1)}% difference`,
      };
    }

    return undefined;
  }
}
