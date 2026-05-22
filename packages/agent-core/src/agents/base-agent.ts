/**
 * Base Agent
 *
 * Abstract base class for all MorphOS agents.
 * Agents are autonomous AI systems that modify applications.
 */

import {
  Agent,
  AgentMemory,
  AgentTool,
  AgentTask,
  MutationRequest,
  generateId,
  getCurrentTimestamp,
} from "@morphos/shared";
import { EventEmitter } from "events";

export abstract class BaseAgent extends EventEmitter implements Agent {
  public id: string;
  public name: string;
  public role: Agent["role"];
  public model: Agent["model"];
  public systemPrompt: string;
  public tools: AgentTool[] = [];
  public memory: AgentMemory;
  public enabled: boolean = true;
  public createdAt: string;

  public metrics = {
    totalTasksCompleted: 0,
    successRate: 0,
    averageLatency: 0,
    lastActiveAt: "",
  };

  protected taskHistory: Map<string, AgentTask> = new Map();
  protected mutationHistory: MutationRequest[] = [];

  constructor(config: {
    name: string;
    role: Agent["role"];
    model: Agent["model"];
    systemPrompt: string;
  }) {
    super();

    this.id = generateId("agent");
    this.name = config.name;
    this.role = config.role;
    this.model = config.model;
    this.systemPrompt = config.systemPrompt;
    this.createdAt = getCurrentTimestamp();

    this.memory = {
      episodic: [],
      semantic: [],
      procedural: [],
    };

    this.registerDefaultTools();
  }

  /**
   * Execute a task
   */
  public async executeTask(task: AgentTask): Promise<void> {
    const startTime = Date.now();
    task.status = "in-progress";
    task.startedAt = getCurrentTimestamp();

    this.emit("task:started", task);

    try {
      const result = await this.process(task);
      task.result = result;
      task.status = "completed";
      task.completedAt = getCurrentTimestamp();

      this.recordTaskInMemory(task, true);
      this.updateMetrics(startTime);

      this.emit("task:completed", task);
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = getCurrentTimestamp();

      this.recordTaskInMemory(task, false);

      this.emit("task:failed", task);
    }
  }

  /**
   * Process a task (implemented by subclasses)
   */
  protected abstract process(task: AgentTask): Promise<MutationRequest[]>;

  /**
   * Register a tool
   */
  public registerTool(tool: AgentTool): void {
    this.tools.push(tool);
    this.emit("tool:registered", tool.name);
  }

  /**
   * Get mutation suggestions
   */
  public async suggestMutations(appId: string): Promise<MutationRequest[]> {
    // Override in subclasses
    return [];
  }

  /**
   * Learn from interaction
   */
  public learn(interaction: {
    action: string;
    context: Record<string, unknown>;
    outcome: "success" | "failure";
  }): void {
    this.memory.episodic.push({
      taskId: generateId("episode"),
      timestamp: getCurrentTimestamp(),
      description: interaction.action,
      input: interaction.context,
      output: interaction.context,
      success: interaction.outcome === "success",
      latency: 0,
    });
  }

  /**
   * Get task history
   */
  public getTaskHistory(): AgentTask[] {
    return Array.from(this.taskHistory.values());
  }

  /**
   * Get mutation history
   */
  public getMutationHistory(): MutationRequest[] {
    return [...this.mutationHistory];
  }

  /**
   * Disable agent
   */
  public disable(): void {
    this.enabled = false;
    this.emit("agent:disabled");
  }

  /**
   * Enable agent
   */
  public enable(): void {
    this.enabled = true;
    this.emit("agent:enabled");
  }

  // ========================================================================
  // PROTECTED METHODS
  // ========================================================================

  protected registerDefaultTools(): void {
    // Register standard tools available to all agents
    this.registerTool({
      name: "analyze_app",
      description: "Analyze application structure and primitives",
      parameters: {
        appId: { type: "string", description: "Application ID" },
      },
      execute: async (params) => {
        return { status: "analyzed" };
      },
    });

    this.registerTool({
      name: "suggest_mutation",
      description: "Suggest a mutation to the application",
      parameters: {
        type: { type: "string" },
        description: { type: "string" },
      },
      execute: async (params) => {
        return { mutationId: generateId("mutation") };
      },
    });

    this.registerTool({
      name: "validate_mutation",
      description: "Validate a proposed mutation",
      parameters: {
        mutationId: { type: "string" },
      },
      execute: async (params) => {
        return { valid: true };
      },
    });
  }

  protected recordTaskInMemory(task: AgentTask, success: boolean): void {
    this.taskHistory.set(task.id, task);

    if (task.result) {
      this.mutationHistory.push(...task.result);
    }

    this.memory.episodic.push({
      taskId: task.id,
      timestamp: task.completedAt || getCurrentTimestamp(),
      description: task.description,
      input: { objective: task.objective },
      output: { mutations: task.result?.length || 0 },
      success,
      latency: task.startedAt
        ? new Date(task.completedAt || getCurrentTimestamp()).getTime() -
          new Date(task.startedAt).getTime()
        : 0,
    });
  }

  protected updateMetrics(startTime: number): void {
    const latency = Date.now() - startTime;
    const successCount = this.taskHistory.size; // Simplified
    const totalTasks = this.taskHistory.size;

    this.metrics.totalTasksCompleted = totalTasks;
    this.metrics.successRate =
      totalTasks > 0 ? successCount / totalTasks : 0;
    this.metrics.averageLatency =
      this.metrics.averageLatency > 0
        ? (this.metrics.averageLatency + latency) / 2
        : latency;
    this.metrics.lastActiveAt = getCurrentTimestamp();
  }
}
