import * as ss from "simple-statistics";

/**
 * System metrics for anomaly detection
 */
export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  requestLatency: number; // ms
  errorRate: number; // 0-1
  queueDepth: number;
  cacheHitRate: number; // 0-1
  databaseConnections: number;
  activeRequests: number;
}

/**
 * Detected anomaly information
 */
export interface AnomalyDetectionResult {
  timestamp: Date;
  isAnomaly: boolean;
  severity: "critical" | "high" | "medium" | "low" | "none";
  anomalousMetrics: {
    metric: string;
    value: number;
    expectedRange: [number, number];
    zScore: number;
  }[];
  rootCauseHypotheses: string[];
  recommendedActions: string[];
  confidence: number; // 0-1
}

/**
 * Time-series based anomaly detection
 */
export class AnomalyDetector {
  private metricsHistory: Map<string, SystemMetrics[]> = new Map();
  private readonly windowSize = 100; // Keep last 100 metrics
  private readonly zScoreThreshold = 2.5; // Standard deviation threshold
  private readonly movingAverageWindow = 10;

  /**
   * Record system metrics for analysis
   */
  recordMetrics(appId: string, metrics: SystemMetrics): void {
    const key = `metrics-${appId}`;
    const history = this.metricsHistory.get(key) || [];
    history.push(metrics);

    if (history.length > this.windowSize) {
      history.shift();
    }

    this.metricsHistory.set(key, history);
  }

  /**
   * Detect anomalies in current metrics
   */
  detectAnomalies(appId: string, currentMetrics: SystemMetrics): AnomalyDetectionResult {
    const key = `metrics-${appId}`;
    const history = this.metricsHistory.get(key) || [];

    if (history.length < 10) {
      return {
        timestamp: currentMetrics.timestamp,
        isAnomaly: false,
        severity: "none",
        anomalousMetrics: [],
        rootCauseHypotheses: [],
        recommendedActions: [],
        confidence: 0,
      };
    }

    // Calculate statistical baselines
    const baselines = this.calculateBaselines(history);
    const anomalousMetrics = this.identifyAnomalousMetrics(currentMetrics, baselines);

    if (anomalousMetrics.length === 0) {
      return {
        timestamp: currentMetrics.timestamp,
        isAnomaly: false,
        severity: "none",
        anomalousMetrics: [],
        rootCauseHypotheses: [],
        recommendedActions: [],
        confidence: 1,
      };
    }

    // Analyze anomalies
    const severity = this.calculateSeverity(anomalousMetrics);
    const rootCauseHypotheses = this.generateRootCauseHypotheses(
      anomalousMetrics,
      currentMetrics
    );
    const recommendedActions = this.generateRecommendations(severity, rootCauseHypotheses);
    const confidence = this.calculateConfidence(anomalousMetrics);

    return {
      timestamp: currentMetrics.timestamp,
      isAnomaly: true,
      severity,
      anomalousMetrics,
      rootCauseHypotheses,
      recommendedActions,
      confidence,
    };
  }

  /**
   * Predict upcoming anomalies using trend analysis
   */
  predictAnomalies(appId: string, lookAheadMinutes: number = 5): {
    likelyAnomaly: boolean;
    riskFactors: string[];
    timeToAnomaly: number | null;
  } {
    const key = `metrics-${appId}`;
    const history = this.metricsHistory.get(key) || [];

    if (history.length < 20) {
      return { likelyAnomaly: false, riskFactors: [], timeToAnomaly: null };
    }

    // Analyze trends in recent metrics
    const cpuTrend = this.calculateTrend(history.map((m) => m.cpuUsage));
    const memoryTrend = this.calculateTrend(history.map((m) => m.memoryUsage));
    const latencyTrend = this.calculateTrend(history.map((m) => m.requestLatency));
    const errorTrend = this.calculateTrend(history.map((m) => m.errorRate));

    const riskFactors: string[] = [];
    let anomalyScore = 0;

    // Check for concerning trends
    if (cpuTrend > 0.5) {
      riskFactors.push("CPU usage rapidly increasing");
      anomalyScore += 0.2;
    }

    if (memoryTrend > 0.4) {
      riskFactors.push("Memory usage steadily growing");
      anomalyScore += 0.2;
    }

    if (latencyTrend > 0.3) {
      riskFactors.push("Request latency degrading");
      anomalyScore += 0.15;
    }

    if (errorTrend > 0.2) {
      riskFactors.push("Error rate increasing");
      anomalyScore += 0.15;
    }

    const likelyAnomaly = anomalyScore > 0.4;
    const timeToAnomaly = likelyAnomaly
      ? Math.max(1, lookAheadMinutes - Math.floor(anomalyScore * 10))
      : null;

    return { likelyAnomaly, riskFactors, timeToAnomaly };
  }

  /**
   * Calculate statistical baselines for normal behavior
   */
  private calculateBaselines(history: SystemMetrics[]): Map<string, { mean: number; stdDev: number }> {
    const metrics = {
      cpuUsage: history.map((m) => m.cpuUsage),
      memoryUsage: history.map((m) => m.memoryUsage),
      requestLatency: history.map((m) => m.requestLatency),
      errorRate: history.map((m) => m.errorRate),
      queueDepth: history.map((m) => m.queueDepth),
      cacheHitRate: history.map((m) => m.cacheHitRate),
      databaseConnections: history.map((m) => m.databaseConnections),
      activeRequests: history.map((m) => m.activeRequests),
    };

    const baselines = new Map<string, { mean: number; stdDev: number }>();

    for (const [key, values] of Object.entries(metrics)) {
      baselines.set(key, {
        mean: ss.mean(values),
        stdDev: ss.standardDeviation(values),
      });
    }

    return baselines;
  }

  /**
   * Identify metrics that deviate from baseline
   */
  private identifyAnomalousMetrics(
    metrics: SystemMetrics,
    baselines: Map<string, { mean: number; stdDev: number }>
  ): AnomalyDetectionResult["anomalousMetrics"] {
    const anomalous = [];

    const checks = [
      { key: "cpuUsage", value: metrics.cpuUsage, direction: "high" as const },
      { key: "memoryUsage", value: metrics.memoryUsage, direction: "high" as const },
      { key: "requestLatency", value: metrics.requestLatency, direction: "high" as const },
      { key: "errorRate", value: metrics.errorRate, direction: "high" as const },
      { key: "queueDepth", value: metrics.queueDepth, direction: "high" as const },
      { key: "cacheHitRate", value: metrics.cacheHitRate, direction: "low" as const },
      { key: "databaseConnections", value: metrics.databaseConnections, direction: "high" as const },
      { key: "activeRequests", value: metrics.activeRequests, direction: "high" as const },
    ];

    for (const check of checks) {
      const baseline = baselines.get(check.key);
      if (!baseline) continue;

      const zScore = (check.value - baseline.mean) / (baseline.stdDev || 1);

      if (check.direction === "high" && zScore > this.zScoreThreshold) {
        anomalous.push({
          metric: check.key,
          value: check.value,
          expectedRange: [
            Math.max(0, baseline.mean - 2 * baseline.stdDev),
            baseline.mean + 2 * baseline.stdDev,
          ] as [number, number],
          zScore,
        });
      } else if (check.direction === "low" && zScore < -this.zScoreThreshold) {
        anomalous.push({
          metric: check.key,
          value: check.value,
          expectedRange: [
            Math.max(0, baseline.mean - 2 * baseline.stdDev),
            baseline.mean + 2 * baseline.stdDev,
          ] as [number, number],
          zScore,
        });
      }
    }

    return anomalous;
  }

  /**
   * Calculate severity based on anomalous metrics
   */
  private calculateSeverity(
    anomalousMetrics: AnomalyDetectionResult["anomalousMetrics"]
  ): "critical" | "high" | "medium" | "low" {
    const avgZScore = ss.mean(anomalousMetrics.map((m) => Math.abs(m.zScore)));
    const criticalCount = anomalousMetrics.filter((m) => Math.abs(m.zScore) > 4).length;

    if (criticalCount >= 2 || avgZScore > 4) return "critical";
    if (avgZScore > 3.5) return "high";
    if (avgZScore > 3) return "medium";
    return "low";
  }

  /**
   * Generate root cause hypotheses
   */
  private generateRootCauseHypotheses(
    anomalousMetrics: AnomalyDetectionResult["anomalousMetrics"],
    currentMetrics: SystemMetrics
  ): string[] {
    const hypotheses: string[] = [];

    // Analyze combinations of anomalous metrics
    const highCpu = anomalousMetrics.some((m) => m.metric === "cpuUsage");
    const highMemory = anomalousMetrics.some((m) => m.metric === "memoryUsage");
    const highLatency = anomalousMetrics.some((m) => m.metric === "requestLatency");
    const highErrors = anomalousMetrics.some((m) => m.metric === "errorRate");
    const highQueueDepth = anomalousMetrics.some((m) => m.metric === "queueDepth");
    const lowCacheHitRate = anomalousMetrics.some((m) => m.metric === "cacheHitRate");

    if (highCpu && highMemory) {
      hypotheses.push("Memory leak or unbounded resource allocation");
      hypotheses.push("Heavy batch processing or data migration in progress");
    }

    if (highLatency && highQueueDepth) {
      hypotheses.push("Request queue saturation");
      hypotheses.push("Database connection pool exhaustion");
    }

    if (lowCacheHitRate && highLatency) {
      hypotheses.push("Cache eviction or invalidation event");
      hypotheses.push("Data set size increased beyond cache capacity");
    }

    if (highErrors && highLatency) {
      hypotheses.push("External service degradation or timeout");
      hypotheses.push("Database performance degradation");
    }

    if (currentMetrics.databaseConnections > 80) {
      hypotheses.push("Database connection pool nearly exhausted");
    }

    return hypotheses.length > 0
      ? hypotheses
      : ["Unknown anomaly pattern - investigate recent changes"];
  }

  /**
   * Generate recommendations for detected anomalies
   */
  private generateRecommendations(
    severity: string,
    rootCauseHypotheses: string[]
  ): string[] {
    const recommendations: string[] = [];

    switch (severity) {
      case "critical":
        recommendations.push("IMMEDIATE ACTION: Page on-call engineer");
        recommendations.push("Initiate incident response procedure");
        recommendations.push("Prepare rollback strategy");
        break;
      case "high":
        recommendations.push("Alert monitoring team");
        recommendations.push("Begin investigation of root cause");
        recommendations.push("Prepare scaling strategy if needed");
        break;
      case "medium":
        recommendations.push("Monitor closely for escalation");
        recommendations.push("Review recent changes and deployments");
        break;
    }

    // Add specific recommendations based on root causes
    for (const hypothesis of rootCauseHypotheses) {
      if (hypothesis.includes("Memory leak")) {
        recommendations.push("Review recent code changes for potential memory leaks");
        recommendations.push("Consider restarting affected services");
      }
      if (hypothesis.includes("Cache")) {
        recommendations.push("Verify cache layer health and eviction policies");
        recommendations.push("Consider increasing cache capacity");
      }
      if (hypothesis.includes("Database")) {
        recommendations.push("Check database replication lag");
        recommendations.push("Review slow query logs");
        recommendations.push("Consider connection pooling optimization");
      }
    }

    return recommendations;
  }

  /**
   * Calculate confidence in anomaly detection
   */
  private calculateConfidence(anomalousMetrics: AnomalyDetectionResult["anomalousMetrics"]): number {
    const avgZScore = ss.mean(anomalousMetrics.map((m) => Math.abs(m.zScore)));
    // Higher z-score = higher confidence
    return Math.min(1, (avgZScore - this.zScoreThreshold) / 2);
  }

  /**
   * Calculate trend in metric values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 5) return 0;

    const recent = values.slice(-5);
    const older = values.slice(-10, -5);

    const recentMean = ss.mean(recent);
    const olderMean = ss.mean(older);

    // Return trend as proportion (0-1)
    return Math.abs((recentMean - olderMean) / (olderMean || 1));
  }

  /**
   * Get anomaly statistics for app
   */
  getAnomalyStats(appId: string): {
    totalMetricsRecorded: number;
    anomalyRate: number;
    averageSeverity: string;
    mostCommonAnomalies: string[];
  } {
    const key = `metrics-${appId}`;
    const history = this.metricsHistory.get(key) || [];

    return {
      totalMetricsRecorded: history.length,
      anomalyRate: 0, // Would be calculated from detected anomalies
      averageSeverity: "medium",
      mostCommonAnomalies: ["high_latency", "memory_spike"],
    };
  }
}
