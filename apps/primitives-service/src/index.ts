import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrimitiveRegistry } from "@morphos/adaptive-runtime";
import { Primitive, ApiResponse } from "@morphos/shared";

const app: Express = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Initialize registry
const registry = new PrimitiveRegistry();

// ============================================================================
// PRIMITIVE ENDPOINTS
// ============================================================================

/**
 * GET /primitives - List all primitives
 */
app.get("/primitives", (req: Request, res: Response) => {
  try {
    const { appId, category } = req.query;

    let primitives = registry.list(appId as string | undefined);

    if (category) {
      primitives = primitives.filter((p) => p.category === category);
    }

    const response: ApiResponse<Primitive[]> = {
      success: true,
      data: primitives,
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
 * GET /primitives/:id - Get primitive details
 */
app.get("/primitives/:id", (req: Request, res: Response) => {
  try {
    const primitive = registry.get(req.params.id);

    if (!primitive) {
      res.status(404).json({
        success: false,
        error: {
          code: "PRIMITIVE_NOT_FOUND",
          message: `Primitive ${req.params.id} not found`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    const response: ApiResponse<Primitive> = {
      success: true,
      data: primitive,
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
 * POST /primitives - Register new primitive
 */
app.post("/primitives", (req: Request, res: Response) => {
  try {
    const primitive: Primitive = req.body;

    // Validate
    const validation = registry.validate(primitive);
    if (!validation.valid) {
      res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Primitive validation failed",
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

    registry.register(primitive);

    const response: ApiResponse<Primitive> = {
      success: true,
      data: primitive,
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
 * GET /primitives/search - Search primitives
 */
app.get("/primitives/search", (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Query parameter required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          latency: 0,
          requestId: req.id || "unknown",
        },
      });
      return;
    }

    const primitives = registry.search(q);

    const response: ApiResponse<Primitive[]> = {
      success: true,
      data: primitives,
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
 * GET /categories - Get all categories
 */
app.get("/categories", (req: Request, res: Response) => {
  try {
    const categories = registry.getCategories();

    const response: ApiResponse<string[]> = {
      success: true,
      data: categories,
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
  console.log(`🚀 Primitives Service running on port ${PORT}`);
  console.log(`📦 Primitive Registry initialized`);
  console.log(`🔍 Ready to register and discover primitives`);
});
