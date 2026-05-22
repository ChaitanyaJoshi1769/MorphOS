import { Mutation } from "@morphos/shared";

export interface PerformanceMetrics {
  appId: string;
  timestamp: string;
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  userInteractionLatency: number;
  bundleSize: number;
  cacheHitRate: number;
  pageLoadTime: number;
}

export interface OptimizationGoal {
  metric: string;
  targetValue: number;
  priority: "high" | "medium" | "low";
  deadline?: string;
}

export interface OptimizerConfig {
  metricsWindow: number;
  analysisInterval: number;
  autoApplyThreshold: number;
  enableAutoOptimization: boolean;
  optimizationGoals: OptimizationGoal[];
}

export interface OptimizationResult {
  appId: string;
  timestamp: string;
  suggestedMutations: Mutation[];
  metricsTrend: Record<string, number>;
  improvementEstimate: number;
  confidence: number;
}

export class SystemOptimizer {
  private config: OptimizerConfig;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private optimizations: Map<string, Mutation[]> = new Map();

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = {
      metricsWindow: config.metricsWindow || 60000,
      analysisInterval: config.analysisInterval || 30000,
      autoApplyThreshold: config.autoApplyThreshold || 0.85,
      enableAutoOptimization: config.enableAutoOptimization !== false,
      optimizationGoals: config.optimizationGoals || [],
    };
  }

  recordMetrics(metrics: PerformanceMetrics): void {
    const appId = metrics.appId;

    if (!this.metrics.has(appId)) {
      this.metrics.set(appId, []);
    }

    const appMetrics = this.metrics.get(appId)!;
    appMetrics.push(metrics);

    // Keep only recent metrics within the window
    const cutoff = Date.now() - this.config.metricsWindow;
    this.metrics.set(
      appId,
      appMetrics.filter((m) => new Date(m.timestamp).getTime() > cutoff)
    );
  }

  async analyzePerformance(appId: string): Promise<OptimizationResult> {
    const appMetrics = this.metrics.get(appId) || [];

    if (appMetrics.length < 2) {
      return {
        appId,
        timestamp: new Date().toISOString(),
        suggestedMutations: [],
        metricsTrend: {},
        improvementEstimate: 0,
        confidence: 0,
      };
    }

    const trends = this.calculateTrends(appMetrics);
    const suggestedMutations = this.generateOptimizations(appId, appMetrics, trends);
    const improvementEstimate = this.estimateImprovement(suggestedMutations);

    return {
      appId,
      timestamp: new Date().toISOString(),
      suggestedMutations,
      metricsTrend: trends,
      improvementEstimate,
      confidence: this.calculateConfidence(appMetrics),
    };
  }

  private calculateTrends(metrics: PerformanceMetrics[]): Record<string, number> {
    if (metrics.length < 2) return {};

    const latest = metrics[metrics.length - 1];
    const previous = metrics[Math.max(0, metrics.length - 5)];

    return {
      renderTime: ((latest.renderTime - previous.renderTime) / previous.renderTime) * 100,
      memoryUsage: ((latest.memoryUsage - previous.memoryUsage) / previous.memoryUsage) * 100,
      cpuUsage: ((latest.cpuUsage - previous.cpuUsage) / previous.cpuUsage) * 100,
      errorRate: ((latest.errorRate - previous.errorRate) / Math.max(previous.errorRate, 0.01)) * 100,
      pageLoadTime: ((latest.pageLoadTime - previous.pageLoadTime) / previous.pageLoadTime) * 100,
      cacheHitRate: ((latest.cacheHitRate - previous.cacheHitRate) / Math.max(previous.cacheHitRate, 0.01)) * 100,
    };
  }

  private generateOptimizations(
    appId: string,
    metrics: PerformanceMetrics[],
    trends: Record<string, number>
  ): Mutation[] {
    const mutations: Mutation[] = [];
    const latestMetric = metrics[metrics.length - 1];

    // High render time
    if (latestMetric.renderTime > 50) {
      mutations.push({
        id: `opt-render-${appId}-${Date.now()}`,
        type: "performance",
        appId,
        description: "Optimize component rendering with memoization",
        target: "app-components",
        changes: {
          memoizeComponents: true,
          usePureComponents: true,
          deferNonCritical: true,
        },
        confidence: 0.91,
        impact: "high",
        reversible: true,
        estimatedCost: 0.1,
      });
    }

    // High memory usage
    if (latestMetric.memoryUsage > 200) {
      mutations.push({
        id: `opt-memory-${appId}-${Date.now()}`,
        type: "performance",
        appId,
        description: "Reduce memory footprint with lazy loading",
        target: "app-modules",
        changes: {
          lazyLoadModules: true,
          enableBundleAnalysis: true,
          removeUnusedCode: true,
        },
        confidence: 0.88,
        impact: "high",
        reversible: true,
        estimatedCost: 0.15,
      });
    }

    // High network latency
    if (latestMetric.networkLatency > 500) {
      mutations.push({
        id: `opt-network-${appId}-${Date.now()}`,
        type: "performance",
        appId,
        description: "Optimize network usage with caching and compression",
        target: "app-network",
        changes: {
          enableResponseCaching: true,
          enableGzip: true,
          brotliCompression: true,
          cdnOptimization: true,
        },
        confidence: 0.92,
        impact: "high",
        reversible: true,
        estimatedCost: 0.08,
      });
    }

    // Low cache hit rate
    if (latestMetric.cacheHitRate < 0.6) {
      mutations.push({
        id: `opt-cache-${appId}-${Date.now()}`,
        type: "performance",
        appId,
        description: "Improve cache strategy",
        target: "app-cache",
        changes: {
          cacheStrategy: "aggressive",
          ttl: 3600,
          includeVersioning: true,
          enableServiceWorker: true,
        },
        confidence: 0.89,
        impact: "medium",
        reversible: true,
        estimatedCost: 0.12,
      });
    }

    // High error rate
    if (latestMetric.errorRate > 0.05) {
      mutations.push({
        id: `opt-reliability-${appId}-${Date.now()}`,
        type: "reliability",
        appId,
        description: "Improve error handling and recovery",
        target: "app-error-handler",
        changes: {
          enableErrorBoundaries: true,
          enableRetry: true,
          maxRetries: 3,
          enableFallbacks: true,
        },
        confidence: 0.87,
        impact: "high",
        reversible: true,
        estimatedCost: 0.1,
      });
    }

    // Poor user interaction latency
    if (latestMetric.userInteractionLatency > 200) {
      mutations.push({
        id: `opt-interaction-${appId}-${Date.now()}`,
        type: "ux",
        appId,
        description: "Reduce user interaction latency",
        target: "app-interactions",
        changes: {
          debounceInputs: true,
          debounceDelay: 150,
          enableOptimisticUpdates: true,
          prioritizeUserInput: true,
        },
        confidence: 0.85,
        impact: "medium",
        reversible: true,
        estimatedCost: 0.06,
      });
    }

    // Large bundle size
    if (latestMetric.bundleSize > 1000) {
      mutations.push({
        id: `opt-bundle-${appId}-${Date.now()}`,
        type: "performance",
        appId,
        description: "Reduce bundle size with code splitting",
        target: "app-build",
        changes: {
          enableCodeSplitting: true,
          lazyLoadRoutes: true,
          minifyCode: true,
          stripSourceMaps: true,
        },
        confidence: 0.90,
        impact: "high",
        reversible: true,
        estimatedCost: 0.2,
      });
    }

    return mutations;
  }

  private estimateImprovement(mutations: Mutation[]): number {
    if (mutations.length === 0) return 0;

    let totalImprovement = 0;
    mutations.forEach((m) => {
      const baseImprovement = m.confidence * (m.impact === "high" ? 0.3 : m.impact === "medium" ? 0.2 : 0.1);
      totalImprovement += baseImprovement;
    });

    return Math.min(totalImprovement / mutations.length, 1);
  }

  private calculateConfidence(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 5) return 0.5;
    if (metrics.length < 20) return 0.7;
    return 0.95;
  }

  async autoOptimize(appId: string): Promise<Mutation[]> {
    if (!this.config.enableAutoOptimization) {
      return [];
    }

    const result = await this.analyzePerformance(appId);

    if (result.confidence >= this.config.autoApplyThreshold) {
      this.optimizations.set(appId, result.suggestedMutations);
      return result.suggestedMutations;
    }

    return [];
  }

  getOptimizationHistory(appId: string): Mutation[] {
    return this.optimizations.get(appId) || [];
  }

  updateGoals(goals: OptimizationGoal[]): void {
    this.config.optimizationGoals = goals;
  }

  enableAutoOptimization(enabled: boolean): void {
    this.config.enableAutoOptimization = enabled;
  }
}

export class AdaptiveOptimizer {
  private systemOptimizer: SystemOptimizer;
  private learningRate: number = 0.1;
  private performanceBaseline: Map<string, number> = new Map();

  constructor(systemOptimizer: SystemOptimizer) {
    this.systemOptimizer = systemOptimizer;
  }

  async learnFromMetrics(
    appId: string,
    metrics: PerformanceMetrics[]
  ): Promise<void> {
    if (metrics.length === 0) return;

    const avgRenderTime =
      metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;

    if (!this.performanceBaseline.has(appId)) {
      this.performanceBaseline.set(appId, avgRenderTime);
    } else {
      const baseline = this.performanceBaseline.get(appId)!;
      const improvement = (baseline - avgRenderTime) / baseline;

      if (improvement < 0) {
        // Performance degraded, need adjustment
        console.log(
          `⚠️  Performance degradation detected for ${appId}: ${(improvement * 100).toFixed(2)}%`
        );
      } else if (improvement > 0) {
        // Performance improved, update baseline
        this.performanceBaseline.set(
          appId,
          baseline * (1 - this.learningRate) + avgRenderTime * this.learningRate
        );
      }
    }
  }

  setLearningRate(rate: number): void {
    this.learningRate = Math.max(0, Math.min(1, rate));
  }

  getPerformanceBaseline(appId: string): number | undefined {
    return this.performanceBaseline.get(appId);
  }
}
