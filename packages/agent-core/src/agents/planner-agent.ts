/**
 * Planner Agent
 *
 * Responsible for high-level planning and task decomposition.
 * Analyzes application goals and creates mutation strategies.
 */

import { AgentTask, MutationRequest, generateId } from "@morphos/shared";
import { BaseAgent } from "./base-agent.js";

export class PlannerAgent extends BaseAgent {
  constructor() {
    super({
      name: "Planner",
      role: "planner",
      model: "claude-opus",
      systemPrompt: `You are the planning agent for MorphOS. Your role is to:
1. Analyze application objectives and constraints
2. Create high-level strategies for mutations
3. Decompose complex goals into concrete mutation tasks
4. Prioritize mutations based on impact and risk
5. Coordinate with other agents`,
    });
  }

  /**
   * Plan mutations based on application analysis
   */
  public async plan(appAnalysis: {
    appId: string;
    currentState: Record<string, unknown>;
    objective: string;
    constraints: string[];
  }): Promise<MutationRequest[]> {
    const task: AgentTask = {
      id: generateId("task"),
      agentId: this.id,
      appId: appAnalysis.appId,
      description: `Plan mutations for: ${appAnalysis.objective}`,
      objective: appAnalysis.objective,
      constraints: appAnalysis.constraints,
      status: "pending",
      priority: "high",
      createdAt: new Date().toISOString(),
    };

    await this.executeTask(task);
    return task.result || [];
  }

  protected async process(task: AgentTask): Promise<MutationRequest[]> {
    // Simplified planning logic
    const mutations: MutationRequest[] = [];

    // Extract key requirements from objective
    const keywords = task.objective.toLowerCase().split(" ");

    // Create mutation suggestions based on keywords
    if (keywords.includes("layout") || keywords.includes("ui")) {
      mutations.push({
        description: "Optimize UI layout for better UX",
        suggestedMutation: {
          type: "ui-layout",
          targetId: "app-root",
          description: "Reorganize UI components",
        },
        reasoning: "The objective mentions UI/layout optimization",
        estimatedImpact: "Improve user experience and accessibility",
        requiresApproval: true,
      });
    }

    if (keywords.includes("workflow") || keywords.includes("process")) {
      mutations.push({
        description: "Streamline workflow execution",
        suggestedMutation: {
          type: "workflow-transform",
          targetId: "workflow-engine",
          description: "Optimize workflow steps",
        },
        reasoning: "The objective mentions workflow improvements",
        estimatedImpact: "Reduce steps and improve efficiency",
        requiresApproval: true,
      });
    }

    if (keywords.includes("performance") || keywords.includes("speed")) {
      mutations.push({
        description: "Add performance optimizations",
        suggestedMutation: {
          type: "middleware-injection",
          targetId: "request-handler",
          description: "Add caching middleware",
        },
        reasoning: "The objective mentions performance",
        estimatedImpact: "Reduce latency and improve throughput",
        requiresApproval: true,
      });
    }

    return mutations;
  }
}
