import { Mutation, RuntimeApplication } from "@morphos/shared";
import * as ss from "simple-statistics";

/**
 * Mutation success prediction based on historical patterns and metrics
 */
export interface MutationPrediction {
  mutationId: string;
  successProbability: number; // 0-1
  confidenceScore: number; // 0-1
  predictedImpact: "high" | "medium" | "low";
  risks: PredictionRisk[];
  recommendedApproach: "immediate" | "staged" | "monitored" | "defer";
  explanation: string;
}

export interface PredictionRisk {
  category: "performance" | "stability" | "compatibility" | "security";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  mitigationStrategy: string;
}

export interface MutationMetrics {
  mutationId: string;
  appId: string;
  successRate: number;
  avgExecutionTime: number;
  rollbackRate: number;
  userImpactScore: number;
  errorRate: number;
  timestamp: Date;
}

/**
 * Predictive Mutation Engine
 * Uses ML-based models to predict mutation success and recommend strategies
 */
export class PredictiveMutationEngine {
  private historicalMetrics: Map<string, MutationMetrics[]> = new Map();
  private mutationTypePatterns: Map<string, { avgSuccess: number; commonErrors: string[] }> =
    new Map();

  /**
   * Record a mutation execution for learning
   */
  recordMutationExecution(metrics: MutationMetrics): void {
    const key = metrics.appId;
    const existing = this.historicalMetrics.get(key) || [];
    existing.push(metrics);

    // Keep last 1000 records per app
    if (existing.length > 1000) {
      existing.shift();
    }
    this.historicalMetrics.set(key, existing);

    // Update type patterns
    const typeKey = `${metrics.appId}-mutation-pattern`;
    const pattern = this.mutationTypePatterns.get(typeKey) || {
      avgSuccess: 0,
      commonErrors: [],
    };
    this.mutationTypePatterns.set(typeKey, pattern);
  }

  /**
   * Predict mutation success probability
   */
  predictMutationSuccess(
    mutation: Mutation,
    app: RuntimeApplication,
    historicalData?: MutationMetrics[]
  ): MutationPrediction {
    const metrics = historicalData || this.historicalMetrics.get(app.id) || [];

    if (metrics.length === 0) {
      // Cold start: use confidence and impact as proxies
      return this.coldStartPrediction(mutation, app);
    }

    // Calculate success probability from historical data
    const successProbability = this.calculateSuccessProbability(mutation, metrics);
    const confidenceScore = Math.min(1, metrics.length / 50); // Normalize by data volume
    const risks = this.identifyRisks(mutation, metrics, app);
    const recommendedApproach = this.recommendApproach(
      successProbability,
      confidenceScore,
      risks
    );

    return {
      mutationId: mutation.id,
      successProbability,
      confidenceScore,
      predictedImpact: mutation.impact,
      risks,
      recommendedApproach,
      explanation: this.generateExplanation(
        mutation,
        successProbability,
        confidenceScore,
        risks
      ),
    };
  }

  /**
   * Predict optimal mutation sequence
   */
  predictOptimalMutationSequence(mutations: Mutation[], app: RuntimeApplication): Mutation[] {
    const metrics = this.historicalMetrics.get(app.id) || [];

    // Score each mutation
    const scored = mutations.map((m) => ({
      mutation: m,
      score: this.calculateSuccessProbability(m, metrics),
    }));

    // Sort by success probability (descending) then by impact (high to low)
    scored.sort((a, b) => {
      const probDiff = b.score - a.score;
      if (Math.abs(probDiff) > 0.1) return probDiff;

      // Secondary sort by impact for similar probabilities
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return (
        (impactOrder[b.mutation.impact as keyof typeof impactOrder] || 0) -
        (impactOrder[a.mutation.impact as keyof typeof impactOrder] || 0)
      );
    });

    return scored.map((s) => s.mutation);
  }

  /**
   * Detect anomalies in mutation execution
   */
  detectMutationAnomalies(
    mutation: Mutation,
    metrics: MutationMetrics
  ): { isAnomaly: boolean; severity: string; reason: string } {
    const appMetrics = this.historicalMetrics.get(mutation.appId) || [];

    if (appMetrics.length < 10) {
      return { isAnomaly: false, severity: "none", reason: "insufficient historical data" };
    }

    const executionTimes = appMetrics.map((m) => m.avgExecutionTime);
    const errorRates = appMetrics.map((m) => m.errorRate);

    const meanExecTime = ss.mean(executionTimes);
    const stdDevExecTime = ss.standardDeviation(executionTimes);
    const meanErrorRate = ss.mean(errorRates);
    const stdDevErrorRate = ss.standardDeviation(errorRates);

    // Z-score based anomaly detection
    const execTimeZScore = Math.abs((metrics.avgExecutionTime - meanExecTime) / (stdDevExecTime || 1));
    const errorRateZScore = Math.abs((metrics.errorRate - meanErrorRate) / (stdDevErrorRate || 1));

    const isAnomaly = execTimeZScore > 2.5 || errorRateZScore > 2.5;
    const severity = execTimeZScore > 3.5 || errorRateZScore > 3.5 ? "critical" : "high";
    const reason =
      execTimeZScore > 2.5
        ? `Execution time anomaly (Z=${execTimeZScore.toFixed(2)})`
        : `Error rate anomaly (Z=${errorRateZScore.toFixed(2)})`;

    return { isAnomaly, severity, reason };
  }

  /**
   * Calculate success probability for a mutation
   */
  private calculateSuccessProbability(mutation: Mutation, metrics: MutationMetrics[]): number {
    if (metrics.length === 0) return mutation.confidence;

    // Weight recent mutations more heavily
    const weighted = metrics
      .slice(-20) // Last 20 executions
      .map((m, idx) => {
        const weight = 1 + idx * 0.1; // Increasing weight for recent
        return m.successRate * weight;
      });

    const totalWeight = weighted.reduce((sum, _, idx) => sum + (1 + idx * 0.1), 0);
    const weightedAvg =
      weighted.length > 0 ? weighted.reduce((a, b) => a + b, 0) / totalWeight : 0;

    // Combine with mutation confidence
    return 0.6 * weightedAvg + 0.4 * mutation.confidence;
  }

  /**
   * Identify risks in mutation execution
   */
  private identifyRisks(
    mutation: Mutation,
    metrics: MutationMetrics[],
    app: RuntimeApplication
  ): PredictionRisk[] {
    const risks: PredictionRisk[] = [];

    const recentMetrics = metrics.slice(-10);
    const avgRollbackRate = recentMetrics.reduce((sum, m) => sum + m.rollbackRate, 0) / Math.max(1, recentMetrics.length);

    if (avgRollbackRate > 0.1) {
      risks.push({
        category: "stability",
        severity: "high",
        description: `High rollback rate (${(avgRollbackRate * 100).toFixed(1)}%) detected in recent executions`,
        mitigationStrategy: "Implement comprehensive pre-deployment testing and gradual rollout",
      });
    }

    if (mutation.impact === "high" && mutation.confidence < 0.8) {
      risks.push({
        category: "performance",
        severity: "high",
        description: "High-impact mutation with moderate confidence",
        mitigationStrategy: "Run A/B test with small user segment before full rollout",
      });
    }

    if (app.mutations.length > 5) {
      risks.push({
        category: "compatibility",
        severity: "medium",
        description: "Multiple pending mutations detected",
        mitigationStrategy: "Consider applying mutations sequentially instead of in parallel",
      });
    }

    // Check for performance degradation patterns
    const avgExecTime = ss.mean(recentMetrics.map((m) => m.avgExecutionTime));
    if (avgExecTime > 500) {
      risks.push({
        category: "performance",
        severity: "medium",
        description: `High execution time detected (${avgExecTime.toFixed(0)}ms)`,
        mitigationStrategy: "Profile and optimize mutation execution; consider caching strategies",
      });
    }

    return risks;
  }

  /**
   * Recommend approach based on prediction metrics
   */
  private recommendApproach(
    successProbability: number,
    confidenceScore: number,
    risks: PredictionRisk[]
  ): "immediate" | "staged" | "monitored" | "defer" {
    const criticalRisks = risks.filter((r) => r.severity === "critical").length;

    if (criticalRisks > 0) return "defer";
    if (successProbability > 0.95 && confidenceScore > 0.8) return "immediate";
    if (
      successProbability > 0.85 &&
      confidenceScore > 0.6 &&
      risks.filter((r) => r.severity === "high").length === 0
    )
      return "monitored";
    return "staged";
  }

  /**
   * Cold start prediction for new mutations
   */
  private coldStartPrediction(mutation: Mutation, app: RuntimeApplication): MutationPrediction {
    const risks: PredictionRisk[] = [];

    if (mutation.impact === "high") {
      risks.push({
        category: "stability",
        severity: "high",
        description: "High-impact mutation with no historical data",
        mitigationStrategy:
          "Deploy to staging first, conduct thorough testing before production rollout",
      });
    }

    return {
      mutationId: mutation.id,
      successProbability: mutation.confidence,
      confidenceScore: 0.3, // Low confidence due to no historical data
      predictedImpact: mutation.impact,
      risks,
      recommendedApproach: mutation.confidence > 0.85 ? "staged" : "defer",
      explanation:
        "Cold start prediction: No historical data available. Recommendation based on mutation confidence level.",
    };
  }

  /**
   * Generate explanation for prediction
   */
  private generateExplanation(
    mutation: Mutation,
    successProbability: number,
    confidenceScore: number,
    risks: PredictionRisk[]
  ): string {
    const parts = [
      `Mutation '${mutation.id}' predicted success rate: ${(successProbability * 100).toFixed(1)}%`,
      `Confidence: ${(confidenceScore * 100).toFixed(1)}%`,
    ];

    if (risks.length > 0) {
      const riskStr = risks
        .filter((r) => r.severity === "critical" || r.severity === "high")
        .map((r) => r.category)
        .join(", ");
      parts.push(`Key risk areas: ${riskStr}`);
    }

    return parts.join(" | ");
  }

  /**
   * Get prediction statistics for app
   */
  getPredictionStats(appId: string): {
    totalMutations: number;
    avgSuccessRate: number;
    stdDevSuccessRate: number;
    mostSuccessfulMutationType: string;
  } {
    const metrics = this.historicalMetrics.get(appId) || [];

    if (metrics.length === 0) {
      return {
        totalMutations: 0,
        avgSuccessRate: 0,
        stdDevSuccessRate: 0,
        mostSuccessfulMutationType: "unknown",
      };
    }

    const successRates = metrics.map((m) => m.successRate);
    const avgSuccessRate = ss.mean(successRates);
    const stdDevSuccessRate = ss.standardDeviation(successRates);

    return {
      totalMutations: metrics.length,
      avgSuccessRate,
      stdDevSuccessRate,
      mostSuccessfulMutationType: "feature-enhancement", // Placeholder
    };
  }
}
