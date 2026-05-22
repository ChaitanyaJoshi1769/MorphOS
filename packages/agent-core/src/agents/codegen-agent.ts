/**
 * Codegen Agent
 *
 * Generates mutation code from specifications.
 * Creates type-safe, tested mutations.
 */

import { AgentTask, MutationRequest, generateId, MorphOSError } from "@morphos/shared";
import { BaseAgent } from "./base-agent.js";
import { CodeGenerator, type MutationSpec } from "@morphos/mutation-core";

export class CodegenAgent extends BaseAgent {
  private codeGenerator: CodeGenerator;

  constructor() {
    super({
      name: "Codegen",
      role: "codegen",
      model: "claude-sonnet",
      systemPrompt: `You are the code generation agent for MorphOS. Your role is to:
1. Generate mutation code from specifications
2. Ensure code safety and type correctness
3. Create comprehensive tests for mutations
4. Generate rollback code
5. Validate generated code`,
    });

    this.codeGenerator = new CodeGenerator();

    this.registerTool({
      name: "generate_mutation",
      description: "Generate mutation code from spec",
      parameters: {
        spec: {
          type: "object",
          description: "Mutation specification",
        },
      },
      execute: async (params: any) => {
        return this.generateMutation(params.spec);
      },
    });
  }

  /**
   * Generate mutation code
   */
  public async generateMutation(spec: MutationSpec): Promise<string> {
    const task: AgentTask = {
      id: generateId("task"),
      agentId: this.id,
      appId: "",
      description: `Generate ${spec.type} mutation: ${spec.description}`,
      objective: `Generate safe, tested mutation code`,
      constraints: ["Must be type-safe", "Must include tests", "Must be reversible"],
      status: "pending",
      priority: "high",
      createdAt: new Date().toISOString(),
    };

    await this.executeTask(task);

    return this.codeGenerator.generateMutationBundle(spec).mutation;
  }

  /**
   * Generate test code
   */
  public generateTests(mutationCode: string, spec: MutationSpec): string {
    return this.codeGenerator.generateTests(mutationCode, spec);
  }

  /**
   * Validate generated code
   */
  public validateCode(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for basic syntax
    try {
      // Simple validation - in production, use actual parser
      if (!code.includes("export")) {
        errors.push("Code must export something");
      }
    } catch (e) {
      errors.push("Invalid code syntax");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  protected async process(task: AgentTask): Promise<MutationRequest[]> {
    // Generate mutations from task objective
    const mutations: MutationRequest[] = [];

    // Parse objective to determine mutation type
    const objective = task.objective.toLowerCase();

    let mutationType: "ui" | "workflow" | "logic" | "middleware" = "logic";
    if (objective.includes("ui") || objective.includes("layout")) {
      mutationType = "ui";
    } else if (objective.includes("workflow")) {
      mutationType = "workflow";
    } else if (objective.includes("middleware")) {
      mutationType = "middleware";
    }

    const spec: MutationSpec = {
      type: mutationType,
      targetComponent: task.appId,
      description: task.objective,
      changes: {},
    };

    const bundle = this.codeGenerator.generateMutationBundle(spec);

    mutations.push({
      description: `Generated ${mutationType} mutation`,
      suggestedMutation: {
        type: spec.type as any,
        targetId: spec.targetComponent,
        description: spec.description,
        payload: {
          code: bundle.mutation,
        },
      },
      reasoning: `Automatically generated mutation code based on objective: ${task.objective}`,
      estimatedImpact: `Implements: ${task.objective}`,
      requiresApproval: true,
    });

    return mutations;
  }
}
