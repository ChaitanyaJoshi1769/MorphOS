import { describe, it, expect, beforeEach } from "vitest";
import { AnomalyDetector, SystemMetrics } from "../src/detector";

describe("AnomalyDetector", () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
  });

  describe("Cold start behavior", () => {
    it("should return no anomaly with insufficient historical data", () => {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 50,
        memoryUsage: 60,
        requestLatency: 100,
        errorRate: 0.01,
        queueDepth: 5,
        cacheHitRate: 0.95,
        databaseConnections: 20,
        activeRequests: 15,
      };

      const result = detector.detectAnomalies("app-1", metrics);

      expect(result.isAnomaly).toBe(false);
      expect(result.severity).toBe("none");
      expect(result.anomalousMetrics).toHaveLength(0);
    });
  });

  describe("Metrics recording", () => {
    it("should record and maintain metrics history", () => {
      const baseMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 50,
        requestLatency: 80,
        errorRate: 0.005,
        queueDepth: 3,
        cacheHitRate: 0.96,
        databaseConnections: 15,
        activeRequests: 10,
      };

      // Record multiple normal metrics
      for (let i = 0; i < 15; i++) {
        detector.recordMetrics("app-1", {
          ...baseMetrics,
          timestamp: new Date(Date.now() + i * 1000),
          cpuUsage: 40 + Math.random() * 5,
          memoryUsage: 50 + Math.random() * 5,
        });
      }

      // Now test detection with sufficient history
      const result = detector.detectAnomalies("app-1", {
        ...baseMetrics,
        timestamp: new Date(),
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Anomaly detection", () => {
    beforeEach(() => {
      // Create baseline with 20 normal measurements
      const baseMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 55,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      for (let i = 0; i < 20; i++) {
        detector.recordMetrics("app-1", {
          ...baseMetrics,
          timestamp: new Date(Date.now() + i * 1000),
        });
      }
    });

    it("should detect high CPU usage anomaly", () => {
      const anomalousMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 95, // Much higher than baseline of 40
        memoryUsage: 55,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", anomalousMetrics);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalousMetrics.some((m) => m.metric === "cpuUsage")).toBe(true);
      expect(result.severity).not.toBe("none");
    });

    it("should detect memory spike anomaly", () => {
      const anomalousMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 98, // Much higher than baseline of 55
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", anomalousMetrics);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalousMetrics.some((m) => m.metric === "memoryUsage")).toBe(true);
    });

    it("should detect latency degradation", () => {
      const anomalousMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 55,
        requestLatency: 500, // Much higher than baseline of 90
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", anomalousMetrics);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalousMetrics.some((m) => m.metric === "requestLatency")).toBe(true);
    });

    it("should detect multiple concurrent anomalies", () => {
      const anomalousMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 92,
        memoryUsage: 96,
        requestLatency: 450,
        errorRate: 0.05, // Also high
        queueDepth: 20, // Also high
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", anomalousMetrics);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalousMetrics.length).toBeGreaterThan(2);
      expect(result.severity).toBe("critical");
    });

    it("should classify severity based on z-score magnitude", () => {
      const severeMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 99, // Extremely high
        memoryUsage: 98,
        requestLatency: 600,
        errorRate: 0.1,
        queueDepth: 50,
        cacheHitRate: 0.5,
        databaseConnections: 100,
        activeRequests: 100,
      };

      const result = detector.detectAnomalies("app-1", severeMetrics);

      expect(result.severity).toBe("critical");
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe("Root cause hypothesis generation", () => {
    beforeEach(() => {
      const baseMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 55,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      for (let i = 0; i < 20; i++) {
        detector.recordMetrics("app-1", baseMetrics);
      }
    });

    it("should suggest memory leak hypothesis", () => {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 80,
        memoryUsage: 95,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", metrics);

      const hypotheses = result.rootCauseHypotheses.join(" ").toLowerCase();
      expect(hypotheses).toContain("memory leak");
    });

    it("should suggest queue saturation hypothesis", () => {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 55,
        requestLatency: 500,
        errorRate: 0.008,
        queueDepth: 100, // Very high
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", metrics);

      const hypotheses = result.rootCauseHypotheses.join(" ").toLowerCase();
      expect(hypotheses).toContain("queue");
    });
  });

  describe("Predictive anomaly detection", () => {
    it("should predict upcoming anomalies from trends", () => {
      // Record metrics with increasing trend
      for (let i = 0; i < 25; i++) {
        detector.recordMetrics("app-1", {
          timestamp: new Date(),
          cpuUsage: 30 + i * 1.5, // Increasing trend
          memoryUsage: 50 + i * 1.0,
          requestLatency: 70 + i * 2.0,
          errorRate: 0.005 + i * 0.001,
          queueDepth: 2 + i * 0.3,
          cacheHitRate: 0.96,
          databaseConnections: 15,
          activeRequests: 10,
        });
      }

      const prediction = detector.predictAnomalies("app-1", 5);

      expect(prediction.likelyAnomaly).toBe(true);
      expect(prediction.riskFactors.length).toBeGreaterThan(0);
    });

    it("should not predict anomalies for stable metrics", () => {
      // Record stable metrics
      for (let i = 0; i < 25; i++) {
        detector.recordMetrics("app-1", {
          timestamp: new Date(),
          cpuUsage: 40,
          memoryUsage: 55,
          requestLatency: 90,
          errorRate: 0.008,
          queueDepth: 4,
          cacheHitRate: 0.94,
          databaseConnections: 18,
          activeRequests: 12,
        });
      }

      const prediction = detector.predictAnomalies("app-1", 5);

      expect(prediction.likelyAnomaly).toBe(false);
      expect(prediction.riskFactors).toHaveLength(0);
    });
  });

  describe("Recommendations generation", () => {
    beforeEach(() => {
      const baseMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 55,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      for (let i = 0; i < 20; i++) {
        detector.recordMetrics("app-1", baseMetrics);
      }
    });

    it("should recommend immediate action for critical anomalies", () => {
      const severeMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 99,
        memoryUsage: 99,
        requestLatency: 800,
        errorRate: 0.2,
        queueDepth: 100,
        cacheHitRate: 0.5,
        databaseConnections: 80,
        activeRequests: 80,
      };

      const result = detector.detectAnomalies("app-1", severeMetrics);

      const recommendations = result.recommendedActions.join(" ").toLowerCase();
      expect(recommendations).toContain("immediate");
    });

    it("should include specific recommendations for known issues", () => {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: 40,
        memoryUsage: 95,
        requestLatency: 90,
        errorRate: 0.008,
        queueDepth: 4,
        cacheHitRate: 0.94,
        databaseConnections: 18,
        activeRequests: 12,
      };

      const result = detector.detectAnomalies("app-1", metrics);

      const recommendations = result.recommendedActions.join(" ");
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Statistics generation", () => {
    it("should generate anomaly statistics", () => {
      for (let i = 0; i < 10; i++) {
        detector.recordMetrics("app-1", {
          timestamp: new Date(),
          cpuUsage: 40,
          memoryUsage: 55,
          requestLatency: 90,
          errorRate: 0.008,
          queueDepth: 4,
          cacheHitRate: 0.94,
          databaseConnections: 18,
          activeRequests: 12,
        });
      }

      const stats = detector.getAnomalyStats("app-1");

      expect(stats.totalMetricsRecorded).toBe(10);
      expect(stats.mostCommonAnomalies).toBeDefined();
    });
  });
});
