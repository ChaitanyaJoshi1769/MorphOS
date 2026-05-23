import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import axios from "axios";

import { PredictiveMutationEngine, MutationMetrics } from "@morphos/predictive-mutations";
import { AnomalyDetector, SystemMetrics } from "@morphos/anomaly-detector";
import { PluginManager } from "@morphos/plugin-system";
import { Mutation, RuntimeApplication } from "@morphos/shared";

const app: Express = express();
const PORT = process.env.ML_SERVICE_PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize ML systems
const predictiveEngine = new PredictiveMutationEngine();
const anomalyDetector = new AnomalyDetector();
const pluginManager = new PluginManager();

// Service instances
const MUTATION_SERVICE_URL = process.env.MUTATION_SERVICE_URL || "http://localhost:3002";
const AGENT_ORCHESTRATOR_URL = process.env.AGENT_ORCHESTRATOR_URL || "http://localhost:3003";
const PRIMITIVES_SERVICE_URL = process.env.PRIMITIVES_SERVICE_URL || "http://localhost:3004";

/**
 * Health check endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "ml-integration",
    version: "1.0.0",
  });
});

/**
 * Predict mutation success before application
 * POST /mutations/{id}/predict
 */
app.post("/mutations/:mutationId/predict", async (req: Request, res: Response) => {
  try {
    const { appId } = req.body;

    // Fetch mutation details
    const mutationRes = await axios.get(`${MUTATION_SERVICE_URL}/mutations/${req.params.mutationId}`);
    const mutation: Mutation = mutationRes.data.data;

    // Fetch app details
    const appRes = await axios.get(`${AGENT_ORCHESTRATOR_URL}/apps/${appId}`);
    const app: RuntimeApplication = appRes.data.data;

    // Get prediction
    const prediction = predictiveEngine.predictMutationSuccess(mutation, app);

    // Validate through plugins
    const pluginValidation = await pluginManager.validateMutation(mutation);

    res.json({
      success: true,
      data: {
        mutationId: mutation.id,
        prediction,
        pluginValidation,
        combined: {
          shouldApply:
            prediction.recommendedApproach !== "defer" &&
            pluginValidation.valid,
          riskLevel:
            prediction.risks.length > 0
              ? prediction.risks[0].severity
              : "low",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Record mutation execution metrics for learning
 * POST /metrics/mutations
 */
app.post("/metrics/mutations", (req: Request, res: Response) => {
  try {
    const metrics: MutationMetrics = req.body;

    predictiveEngine.recordMutationExecution(metrics);

    // Check for anomalies
    const anomaly = predictiveEngine.detectMutationAnomalies(
      { id: metrics.mutationId } as Mutation,
      metrics
    );

    res.json({
      success: true,
      data: {
        metricsRecorded: true,
        anomalyDetected: anomaly.isAnomaly,
        anomalySeverity: anomaly.severity,
        message: anomaly.reason,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Record system metrics for anomaly detection
 * POST /metrics/system
 */
app.post("/metrics/system", (req: Request, res: Response) => {
  try {
    const { appId, metrics } = req.body;
    const systemMetrics: SystemMetrics = metrics;

    anomalyDetector.recordMetrics(appId, systemMetrics);
    const result = anomalyDetector.detectAnomalies(appId, systemMetrics);

    if (result.isAnomaly) {
      // Alert if critical
      if (result.severity === "critical") {
        console.error(`CRITICAL ANOMALY in ${appId}:`, result);
        // Would integrate with alerting system
      }
    }

    res.json({
      success: true,
      data: {
        metricsRecorded: true,
        ...result,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get anomalies for an app
 * GET /anomalies?appId=app-1
 */
app.get("/anomalies", async (req: Request, res: Response) => {
  try {
    const { appId, lookAhead = 5 } = req.query;

    const prediction = anomalyDetector.predictAnomalies(
      appId as string,
      Number(lookAhead)
    );

    const stats = anomalyDetector.getAnomalyStats(appId as string);

    res.json({
      success: true,
      data: {
        prediction,
        statistics: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get mutation sequence recommendations
 * POST /mutations/sequence/recommend
 */
app.post("/mutations/sequence/recommend", async (req: Request, res: Response) => {
  try {
    const { appId, mutations } = req.body;

    const appRes = await axios.get(`${AGENT_ORCHESTRATOR_URL}/apps/${appId}`);
    const app: RuntimeApplication = appRes.data.data;

    const optimalSequence = predictiveEngine.predictOptimalMutationSequence(
      mutations,
      app
    );

    // Get plugin suggestions
    const pluginSuggestions = await pluginManager.suggestMutations(app);

    res.json({
      success: true,
      data: {
        optimalSequence,
        pluginSuggestions,
        totalSuggestions: optimalSequence.length + pluginSuggestions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Plugin management endpoints
 */

/**
 * Register a plugin
 * POST /plugins/register
 */
app.post("/plugins/register", async (req: Request, res: Response) => {
  try {
    // This would register an actual plugin from the request
    // For now, we just return success structure
    res.json({
      success: true,
      data: {
        message: "Plugin registration endpoint ready",
        note: "Actual plugin registration requires plugin implementation",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * List plugins
 * GET /plugins
 */
app.get("/plugins", (req: Request, res: Response) => {
  try {
    const plugins = pluginManager.getPlugins();

    res.json({
      success: true,
      data: {
        totalPlugins: plugins.length,
        enabledPlugins: pluginManager.getEnabledPlugins().length,
        plugins: plugins.map((p) => ({
          id: p.metadata.id,
          name: p.metadata.name,
          version: p.metadata.version,
          enabled: p.config.enabled,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Plugin health check
 * GET /plugins/health
 */
app.get("/plugins/health", async (req: Request, res: Response) => {
  try {
    const health = await pluginManager.healthCheckPlugins();
    const metrics = await pluginManager.getPluginMetrics();

    res.json({
      success: true,
      data: {
        health,
        metrics,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get ML service statistics
 * GET /stats
 */
app.get("/stats", (req: Request, res: Response) => {
  try {
    const { appId } = req.query;

    if (appId) {
      const predictionStats = predictiveEngine.getPredictionStats(appId as string);
      const anomalyStats = anomalyDetector.getAnomalyStats(appId as string);

      res.json({
        success: true,
        data: {
          appId,
          predictions: predictionStats,
          anomalies: anomalyStats,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          service: "ML Integration",
          components: [
            "PredictiveMutationEngine",
            "AnomalyDetector",
            "PluginManager",
          ],
          version: "1.0.0",
          uptime: process.uptime(),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`ML Integration Service running on port ${PORT}`);
  console.log(`  - Predictive Mutations Engine: Ready`);
  console.log(`  - Anomaly Detector: Ready`);
  console.log(`  - Plugin Manager: Ready`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
