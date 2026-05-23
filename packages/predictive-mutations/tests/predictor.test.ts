import { describe, it, expect, beforeEach } from "vitest";
import { PredictiveMutationEngine, MutationMetrics } from "../src/predictor";
import { Mutation, RuntimeApplication } from "@morphos/shared";

describe("PredictiveMutationEngine", () => {
  let engine: PredictiveMutationEngine;
  let testMutation: Mutation;
  let testApp: RuntimeApplication;

  beforeEach(() => {
    engine = new PredictiveMutationEngine();

    testMutation = {
      id: "test-mut",
      type: "ui-optimization",
      appId: "test-app",
      description: "Test mutation",
      target: "root",
      changes: { layout: "flex" },
      confidence: 0.85,
      impact: "medium",
      reversible: true,
      estimatedCost: 0.1,
    };

    testApp = {
      id: "test-app",
      name: "Test App",
      version: "1.0.0",
      description: "Test application",
      state: {},
      primitives: [],
      mutations: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        personalizationLevel: "basic",
      },
    };
  });

  describe("Cold start predictions", () => {
    it("should predict mutation success with no historical data", () => {
      const prediction = engine.predictMutationSuccess(testMutation, testApp);

      expect(prediction.successProbability).toBe(testMutation.confidence);
      expect(prediction.confidenceScore).toBe(0.3);
      expect(prediction.isAnomaly).toBeUndefined();
      expect(prediction.recommendedApproach).toBe("staged");
    });

    it("should identify risks for high-impact mutations", () => {
      const highImpactMutation: Mutation = {
        ...testMutation,
        impact: "high",
        confidence: 0.7,
      };

      const prediction = engine.predictMutationSuccess(highImpactMutation, testApp);

      expect(prediction.risks.length).toBeGreaterThan(0);
      expect(prediction.risks[0].severity).toBe("high");
    });
  });

  describe("Mutation metrics recording", () => {
    it("should record mutation metrics", () => {
      const metrics: MutationMetrics = {
        mutationId: "mut-1",
        appId: "app-1",
        successRate: 0.95,
        avgExecutionTime: 50,
        rollbackRate: 0.02,
        userImpactScore: 0.8,
        errorRate: 0.01,
        timestamp: new Date(),
      };

      engine.recordMutationExecution(metrics);

      // Predict with recorded metrics
      const prediction = engine.predictMutationSuccess(
        { ...testMutation, appId: "app-1" },
        { ...testApp, id: "app-1" }
      );

      expect(prediction.confidenceScore).toBeGreaterThan(0.3);
    });

    it("should maintain sliding window of metrics", () => {
      // Record 1100 metrics (window size is 1000)
      for (let i = 0; i < 1100; i++) {
        engine.recordMutationExecution({
          mutationId: `mut-${i}`,
          appId: "app-1",
          successRate: 0.9 + Math.random() * 0.05,
          avgExecutionTime: 40 + Math.random() * 20,
          rollbackRate: 0.01 + Math.random() * 0.02,
          userImpactScore: 0.7,
          errorRate: 0.005,
          timestamp: new Date(),
        });
      }

      // Stats should reflect recent data
      const stats = engine.getPredictionStats("app-1");
      expect(stats.totalMutations).toBeLessThanOrEqual(1000);
    });
  });

  describe("Mutation success prediction", () => {
    it("should predict higher success based on historical success", () => {
      // Record successful executions
      for (let i = 0; i < 20; i++) {
        engine.recordMutationExecution({
          mutationId: testMutation.id,
          appId: testApp.id,
          successRate: 0.95,
          avgExecutionTime: 45,
          rollbackRate: 0.01,
          userImpactScore: 0.8,
          errorRate: 0.005,
          timestamp: new Date(),
        });
      }

      const prediction = engine.predictMutationSuccess(testMutation, testApp);

      expect(prediction.successProbability).toBeGreaterThan(testMutation.confidence);
      expect(prediction.confidenceScore).toBeGreaterThan(0.3);
    });

    it("should downgrade success prediction after failures", () => {
      // Record failed executions
      for (let i = 0; i < 20; i++) {
        engine.recordMutationExecution({
          mutationId: testMutation.id,
          appId: testApp.id,
          successRate: i < 5 ? 1.0 : 0.4, // First 5 succeed, rest fail
          avgExecutionTime: 45,
          rollbackRate: 0.3,
          userImpactScore: 0.2,
          errorRate: 0.5,
          timestamp: new Date(),
        });
      }

      const prediction = engine.predictMutationSuccess(testMutation, testApp);

      expect(prediction.recommendedApproach).toBe("defer");
      expect(prediction.risks.length).toBeGreaterThan(0);
    });
  });

  describe("Optimal mutation sequence", () => {
    it("should order mutations by success probability", () => {
      const mutations = [
        { ...testMutation, id: "mut-1", confidence: 0.7 },
        { ...testMutation, id: "mut-2", confidence: 0.95 },
        { ...testMutation, id: "mut-3", confidence: 0.85 },
      ];

      const sequence = engine.predictOptimalMutationSequence(mutations, testApp);

      expect(sequence[0].confidence).toBeGreaterThanOrEqual(sequence[1].confidence);
      expect(sequence[1].confidence).toBeGreaterThanOrEqual(sequence[2].confidence);
    });

    it("should prioritize high-impact mutations with similar probabilities", () => {
      const mutations = [
        { ...testMutation, id: "mut-1", confidence: 0.85, impact: "low" as const },
        { ...testMutation, id: "mut-2", confidence: 0.85, impact: "high" as const },
        { ...testMutation, id: "mut-3", confidence: 0.85, impact: "medium" as const },
      ];

      const sequence = engine.predictOptimalMutationSequence(mutations, testApp);

      expect(sequence[0].impact).toBe("high");
      expect(sequence[1].impact).toBe("medium");
      expect(sequence[2].impact).toBe("low");
    });
  });

  describe("Anomaly detection in mutations", () => {
    it("should detect execution time anomalies", () => {
      // Record baseline metrics
      for (let i = 0; i < 20; i++) {
        engine.recordMutationExecution({
          mutationId: testMutation.id,
          appId: testApp.id,
          successRate: 0.95,
          avgExecutionTime: 50,
          rollbackRate: 0.01,
          userImpactScore: 0.8,
          errorRate: 0.005,
          timestamp: new Date(),
        });
      }

      // Record anomalous metric
      const anomalyMetrics: MutationMetrics = {
        mutationId: testMutation.id,
        appId: testApp.id,
        successRate: 0.2,
        avgExecutionTime: 2000, // 40x higher than baseline
        rollbackRate: 0.5,
        userImpactScore: 0.1,
        errorRate: 0.8,
        timestamp: new Date(),
      };

      const anomaly = engine.detectMutationAnomalies(testMutation, anomalyMetrics);

      expect(anomaly.isAnomaly).toBe(true);
      expect(anomaly.severity).toBe("critical");
    });
  });

  describe("Prediction statistics", () => {
    it("should calculate statistics for app", () => {
      for (let i = 0; i < 30; i++) {
        engine.recordMutationExecution({
          mutationId: `mut-${i}`,
          appId: "app-1",
          successRate: 0.85 + Math.random() * 0.1,
          avgExecutionTime: 45 + Math.random() * 10,
          rollbackRate: 0.01,
          userImpactScore: 0.8,
          errorRate: 0.005,
          timestamp: new Date(),
        });
      }

      const stats = engine.getPredictionStats("app-1");

      expect(stats.totalMutations).toBe(30);
      expect(stats.avgSuccessRate).toBeGreaterThan(0.8);
      expect(stats.stdDevSuccessRate).toBeLessThan(0.1);
    });

    it("should return zeros for app with no metrics", () => {
      const stats = engine.getPredictionStats("unknown-app");

      expect(stats.totalMutations).toBe(0);
      expect(stats.avgSuccessRate).toBe(0);
      expect(stats.stdDevSuccessRate).toBe(0);
    });
  });
});
