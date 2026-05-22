import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { MutationEngine } from "@morphos/adaptive-runtime/mutations";
import { CodeGenerator } from "@morphos/mutation-core";
import { Mutation, ApiResponse, MorphOSError } from "@morphos/shared";

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Initialize services
const mutationEngine = new MutationEngine();
const codeGenerator = new CodeGenerator();

// ============================================================================
// MUTATION ENDPOINTS
// ============================================================================

/**
 * GET /mutations - List mutations
 */
app.get("/mutations", (req: Request, res: Response) => {
  try {
    const { appId, status } = req.query;

    let mutations = mutationEngine.export(appId as string | undefined);
    if (status) {
      mutations = mutations.filter((m) => m.status === status);
    }

    const response: ApiResponse<Mutation[]> = {
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

/**
 * GET /mutations/:id - Get mutation details
 */
app.get("/mutations/:id", (req: Request, res: Response) => {
  try {
    const mutation = mutationEngine.get(req.params.id);

    if (!mutation) {
      res.status(404).json({
        success: false,
        error: {
          code: "MUTATION_NOT_FOUND",
          message: `Mutation ${req.params.id} not found`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    const response: ApiResponse<Mutation> = {
      success: true,
      data: mutation,
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
 * POST /mutations - Create mutation
 */
app.post("/mutations", (req: Request, res: Response) => {
  try {
    const {
      appId,
      userId,
      type,
      targetId,
      description,
      payload,
    } = req.body;

    const mutation = mutationEngine.createMutation(
      appId,
      userId,
      type,
      targetId,
      description,
      payload
    );

    // Validate
    const validation = mutationEngine.validate(mutation);
    if (!validation.valid) {
      res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Mutation validation failed",
          details: { errors: validation.errors },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    const response: ApiResponse<Mutation> = {
      success: true,
      data: mutation,
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
 * POST /mutations/:id/apply - Apply mutation
 */
app.post("/mutations/:id/apply", (req: Request, res: Response) => {
  try {
    const mutation = mutationEngine.get(req.params.id);

    if (!mutation) {
      res.status(404).json({
        success: false,
        error: {
          code: "MUTATION_NOT_FOUND",
          message: `Mutation ${req.params.id} not found`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    // Update status
    const updatedMutation = mutationEngine.updateStatus(req.params.id, "active");

    const response: ApiResponse<Mutation> = {
      success: true,
      data: updatedMutation,
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
 * POST /mutations/:id/rollback - Rollback mutation
 */
app.post("/mutations/:id/rollback", (req: Request, res: Response) => {
  try {
    const mutation = mutationEngine.get(req.params.id);

    if (!mutation) {
      res.status(404).json({
        success: false,
        error: {
          code: "MUTATION_NOT_FOUND",
          message: `Mutation ${req.params.id} not found`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    const rollbackMutation = mutationEngine.createRollback(
      req.params.id,
      req.body.userId || "system"
    );

    const response: ApiResponse<Mutation> = {
      success: true,
      data: rollbackMutation,
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
  console.log(`🚀 Mutation Service running on port ${PORT}`);
  console.log(`📝 Mutation Engine initialized`);
  console.log(`🔄 Ready to process mutations`);
});
