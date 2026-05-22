/**
 * Multi-Agent Orchestrator
 *
 * Coordinates multiple agents to work together on application mutations.
 * Manages task routing, dependency resolution, and conflict handling.
 */

import {
  Agent,
  AgentTask,
  MutationRequest,
  generateId,
  getCurrentTimestamp,
  deepClone,
} from "@morphos/shared";
import { EventEmitter } from "events";
import { BaseAgent } from "../agents/base-agent.js";

export interface OrchestrationContext {
  appId: string;
  objective: string;
  constraints: string[];
  agents: Agent[];
  priority?: "low" | "medium" | "high" | "critical";
  timeout?: number;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private taskHistory: Map<string, AgentTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private mutationPipeline: MutationRequest[] = [];

  /**
   * Register an agent
   */
  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    this.emit("agent:registered", agent.name);
  }

  /**
   * Orchestrate mutation creation
   */
  public async orchestrate(context: OrchestrationContext): Promise<MutationRequest[]> {
    const orchestrationId = generateId("orch");

    this.emit("orchestration:started", {
      id: orchestrationId,
      objective: context.objective,
      timestamp: getCurrentTimestamp(),
    });

    try {
      // Step 1: Planning phase
      const plannerAgent = this.findAgentByRole("planner");
      if (!plannerAgent) {
        throw new Error("No planner agent available");
      }

      const mutations = await (plannerAgent as any).plan({
        appId: context.appId,
        currentState: {},
        objective: context.objective,
        constraints: context.constraints,
      });

      this.mutationPipeline.push(...mutations);

      this.emit("orchestration:completed", {
        id: orchestrationId,
        mutationCount: mutations.length,
        timestamp: getCurrentTimestamp(),
      });

      return mutations;
    } catch (error) {
      this.emit("orchestration:failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: getCurrentTimestamp(),
      });
      throw error;
    }
  }

  /**
   * Execute a task across agents
   */
  public async executeTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);

    // Find best agent for task
    const agent = this.selectAgent(task);
    if (!agent) {
      throw new Error(`No suitable agent for task: ${task.description}`);
    }

    this.runningTasks.add(task.id);

    try {
      await agent.executeTask(task);
      this.taskHistory.set(task.id, task);
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Process mutation pipeline
   */
  public async processMutationPipeline(): Promise<MutationRequest[]> {
    const processed: MutationRequest[] = [];

    for (const mutation of this.mutationPipeline) {
      // Validate mutation
      if (this.validateMutation(mutation)) {
        processed.push(mutation);
      }
    }

    return processed;
  }

  /**
   * Get mutation suggestions
   */
  public async suggestMutations(appId: string): Promise<MutationRequest[]> {
    const suggestions: MutationRequest[] = [];

    for (const agent of this.agents.values()) {
      const agentSuggestions = await agent.suggestMutations(appId);
      suggestions.push(...agentSuggestions);
    }

    return suggestions;
  }

  /**
   * Get agent stats
   */
  public getStats(): {
    totalAgents: number;
    activeAgents: number;
    taskCount: number;
    runningTaskCount: number;
    mutationCount: number;
  } {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter((a) => a.enabled).length,
      taskCount: this.taskHistory.size,
      runningTaskCount: this.runningTasks.size,
      mutationCount: this.mutationPipeline.length,
    };
  }

  /**
   * Get task history
   */
  public getTaskHistory(): AgentTask[] {
    return Array.from(this.taskHistory.values());
  }

  /**
   * Get mutation pipeline
   */
  public getMutationPipeline(): MutationRequest[] {
    return deepClone(this.mutationPipeline);
  }

  /**
   * Clear mutation pipeline
   */
  public clearMutationPipeline(): void {
    this.mutationPipeline = [];
  }

  /**
   * Disable an agent
   */
  public disableAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.disable();
    }
  }

  /**
   * Enable an agent
   */
  public enableAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.enable();
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private findAgentByRole(role: string): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.role === role && agent.enabled) {
        return agent;
      }
    }
    return undefined;
  }

  private selectAgent(task: AgentTask): BaseAgent | undefined {
    // Select best agent based on task and agent capabilities
    let bestAgent: BaseAgent | undefined;
    let bestScore = -1;

    for (const agent of this.agents.values()) {
      if (!agent.enabled) continue;

      let score = 0;

      // Higher score for agents matching task requirements
      if (task.objective.toLowerCase().includes("plan")) {
        if (agent.role === "planner") score += 10;
      }
      if (task.objective.toLowerCase().includes("code")) {
        if (agent.role === "codegen") score += 10;
      }
      if (task.objective.toLowerCase().includes("analyze")) {
        if (agent.role === "analyzer") score += 10;
      }

      // Bonus for agents with better success rate
      score += agent.metrics.successRate * 5;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  private validateMutation(mutation: MutationRequest): boolean {
    return (
      !!mutation.description &&
      !!mutation.suggestedMutation &&
      !!mutation.reasoning
    );
  }
}
