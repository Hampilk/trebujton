import { describe, it, expect } from 'vitest';
import { EnsemblePredictor } from './ensemble';

describe('EnsemblePredictor', () => {
  describe('predict', () => {
    it('should correctly weight predictions with 50% FT / 30% HT / 20% Pattern', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.8 },
        half_time_prediction: { prediction: 'home', confidence: 0.7 },
        pattern_prediction: { prediction: 'home', confidence: 0.6 },
      });

      expect(result.prediction).toBe('home');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.ensemble_breakdown.weights_used).toEqual({ ft: 0.5, ht: 0.3, pt: 0.2 });
      expect(result.ensemble_breakdown.full_time).toEqual({ prediction: 'home', confidence: 0.8 });
      expect(result.ensemble_breakdown.half_time).toEqual({ prediction: 'home', confidence: 0.7 });
      expect(result.ensemble_breakdown.pattern).toEqual({ prediction: 'home', confidence: 0.6 });
    });

    it('should handle missing FT prediction and auto re-weight', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        half_time_prediction: { prediction: 'away', confidence: 0.7 },
        pattern_prediction: { prediction: 'away', confidence: 0.6 },
      });

      expect(result.prediction).toBe('away');
      expect(result.ensemble_breakdown.full_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toMatchObject({
        ft: 0,
        ht: expect.closeTo(0.6, 1),
        pt: expect.closeTo(0.4, 1),
      });
    });

    it('should handle missing HT prediction and auto re-weight', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'draw', confidence: 0.8 },
        pattern_prediction: { prediction: 'draw', confidence: 0.6 },
      });

      expect(result.prediction).toBe('draw');
      expect(result.ensemble_breakdown.half_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toMatchObject({
        ft: expect.closeTo(0.714, 2),
        ht: 0,
        pt: expect.closeTo(0.286, 2),
      });
    });

    it('should handle missing Pattern prediction and auto re-weight', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.8 },
        half_time_prediction: { prediction: 'home', confidence: 0.7 },
      });

      expect(result.prediction).toBe('home');
      expect(result.ensemble_breakdown.pattern.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toMatchObject({
        ft: expect.closeTo(0.625, 2),
        ht: expect.closeTo(0.375, 2),
        pt: 0,
      });
    });

    it('should handle only FT prediction', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.8 },
      });

      expect(result.prediction).toBe('home');
      expect(result.ensemble_breakdown.half_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.pattern.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toEqual({ ft: 1, ht: 0, pt: 0 });
      expect(result.confidence).toBe(0.8);
    });

    it('should handle only HT prediction', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        half_time_prediction: { prediction: 'away', confidence: 0.7 },
      });

      expect(result.prediction).toBe('away');
      expect(result.ensemble_breakdown.full_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.pattern.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toEqual({ ft: 0, ht: 1, pt: 0 });
      expect(result.confidence).toBe(0.7);
    });

    it('should handle only Pattern prediction', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        pattern_prediction: { prediction: 'draw', confidence: 0.6 },
      });

      expect(result.prediction).toBe('draw');
      expect(result.ensemble_breakdown.full_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.half_time.prediction).toBe('N/A');
      expect(result.ensemble_breakdown.weights_used).toEqual({ ft: 0, ht: 0, pt: 1 });
      expect(result.confidence).toBe(0.6);
    });

    it('should throw error when no predictions provided', () => {
      const predictor = new EnsemblePredictor();
      expect(() => predictor.predict({})).toThrow('At least one model prediction must be provided');
    });

    it('should select prediction with highest weighted confidence', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.9 },
        half_time_prediction: { prediction: 'away', confidence: 0.8 },
        pattern_prediction: { prediction: 'draw', confidence: 0.7 },
      });

      expect(result.prediction).toBe('home');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });\n\n  describe('conflict detection', () => {
    it('should detect conflict when two predictions differ by <10%', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.85 },
        half_time_prediction: { prediction: 'away', confidence: 0.88 },
        pattern_prediction: { prediction: 'home', confidence: 0.1 },
      });

      expect(result.ensemble_breakdown.conflict).toBeDefined();
      expect(result.ensemble_breakdown.conflict?.detected).toBe(true);
      expect(result.ensemble_breakdown.conflict?.severity).toBeDefined();
    });
\n    it('should detect high severity conflict when difference <5%', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.9 },
        half_time_prediction: { prediction: 'away', confidence: 0.88 },
        pattern_prediction: { prediction: 'draw', confidence: 0.3 },
      });
\n      expect(result.ensemble_breakdown.conflict?.detected).toBe(true);
      expect(result.ensemble_breakdown.conflict?.severity).toBe('high');
    });
\n    it('should detect medium severity conflict when difference between 5-10%', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.9 },
        half_time_prediction: { prediction: 'away', confidence: 0.75 },
        pattern_prediction: { prediction: 'draw', confidence: 0.3 },
      });
\n      expect(result.ensemble_breakdown.conflict?.detected).toBe(true);
      expect(result.ensemble_breakdown.conflict?.severity).toBe('medium');
    });
\n    it('should not detect conflict when predictions agree', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.9 },
        half_time_prediction: { prediction: 'home', confidence: 0.7 },
        pattern_prediction: { prediction: 'home', confidence: 0.5 },
      });
\n      expect(result.ensemble_breakdown.conflict).toBeUndefined();
    });
\n    it('should not detect conflict when difference >10%', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.95 },
        half_time_prediction: { prediction: 'away', confidence: 0.6 },
        pattern_prediction: { prediction: 'draw', confidence: 0.5 },
      });
\n      expect(result.ensemble_breakdown.conflict).toBeUndefined();
    });
\n    it('should not detect conflict with only one prediction', () => {
      const predictor = new EnsemblePredictor();
      const result = predictor.predict({
        full_time_prediction: { prediction: 'home', confidence: 0.8 },
      });
\n      expect(result.ensemble_breakdown.conflict).toBeUndefined();
    });
  });
});\n