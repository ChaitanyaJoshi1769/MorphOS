import express, { Request, Response, Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import {
  AgentOrchestrator,
  PlannerAgent,
  CodegenAgent,
} from "@morphos/agent-core";
import { AgentTask, ApiResponse, MutationRequest } from "@morphos/shared";

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Initialize orchestrator and agents
const orchestrator = new AgentOrchestrator();
const plannerAgent = new PlannerAgent();
const codegenAgent = new CodegenAgent();

// Register agents
orchestrator.registerAgent(plannerAgent);
orchestrator.registerAgent(codegenAgent);

// ============================================================================
// AGENT ENDPOINTS
// ============================================================================

/**
 * POST /orchestrate - Start orchestration
 */
app.post("/orchestrate", async (req: Request, res: Response) => {
  try {
    const { appId, objective, constraints } = req.body;

    const mutations = await orchestrator.orchestrate({
      appId,
      objective,
      constraints,
      agents: [plannerAgent, codegenAgent],
      priority: "high",
    });

    const response: ApiResponse<MutationRequest[]> = {
      success: true,
      data: mutations,
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ORCHESTRATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    });
  }
});

/**
 * POST /agents/:agentId/tasks - Create agent task
 */
app.post("/agents/:agentId/tasks", async (req: Request, res: Response) => {
  try {
    const agentId = req.params.agentId;
    const { appId, description, objective, constraints } = req.body;

    const task: AgentTask = {
      id: Math.random().toString(36).substring(7),
      agentId,
      appId,
      description,
      objective,
      constraints: constraints || [],
      status: "pending",
      priority: "high",
      createdAt: new Date().toISOString(),
    };

    const response: ApiResponse<AgentTask> = {
      success: true,
      data: task,
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    });
  }
});

/**
 * GET /stats - Get orchestrator stats
 */
app.get("/stats", (req: Request, res: Response) => {
  try {
    const stats = orchestrator.getStats();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    });
  }
});

/**
 * GET /mutations - Get mutation pipeline
 */
app.get("/mutations", (req: Request, res: Response) => {
  try {
    const mutations = orchestrator.getMutationPipeline();

    const response: ApiResponse<MutationRequest[]> = {
      success: true,
      data: mutations,
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        latency: 0,
        requestId: req.id || "unknown",
      },
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Agent Orchestrator running on port ${PORT}`);
  console.log(`🤖 Registered agents: ${orchestrator.getStats().totalAgents}`);
  console.log(`⚙️  Ready for orchestration`);
});
