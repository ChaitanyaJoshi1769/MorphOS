/**
 * Personalization Learning Engine
 *
 * Analyzes user behavior patterns and generates adaptive mutations.
 * Continuously learns from user interactions to improve the experience.
 */

import {
  UserBehavior,
  UserPreferences,
  generateId,
  getCurrentTimestamp,
  MutationRequest,
} from "@morphos/shared";
import { EventEmitter } from "events";
import { PersonalizationStore } from "../memory/index.js";

export interface BehaviorPattern {
  pattern: string;
  confidence: number;
  frequency: number;
  suggestedMutations: MutationRequest[];
}

export class PersonalizationLearner extends EventEmitter {
  private store: PersonalizationStore;

  constructor(store: PersonalizationStore) {
    super();
    this.store = store;
  }

  /**
   * Analyze user behavior for patterns
   */
  public analyzeBehavior(userId: string): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const stats = this.store.getMemoryStats(userId);
    const profile = this.store.learnUserProfile(userId);

    // Pattern 1: Power user behavior
    if (stats.totalEpisodes > 100) {
      patterns.push({
        pattern: "power-user",
        confidence: 0.9,
        frequency: stats.totalEpisodes,
        suggestedMutations: this.generatePowerUserMutations(userId),
      });
    }

    // Pattern 2: Repetitive workflow
    if (stats.commonProcedures.length > 0) {
      patterns.push({
        pattern: "repetitive-workflow",
        confidence: 0.85,
        frequency: stats.totalProcedures,
        suggestedMutations: this.generateWorkflowMutations(userId),
      });
    }

    // Pattern 3: Preference for specific tools
    if (stats.topConcepts.length > 0) {
      patterns.push({
        pattern: "tool-preference",
        confidence: 0.8,
        frequency: stats.topConcepts.length,
        suggestedMutations: this.generateToolPreferenceMutations(
          userId,
          stats.topConcepts
        ),
      });
    }

    this.emit("patterns:analyzed", { userId, patternCount: patterns.length });

    return patterns;
  }

  /**
   * Generate personalization mutations
   */
  public generatePersonalizationMutations(userId: string): MutationRequest[] {
    const mutations: MutationRequest[] = [];
    const patterns = this.analyzeBehavior(userId);

    for (const pattern of patterns) {
      mutations.push(...pattern.suggestedMutations);
    }

    return mutations;
  }

  /**
   * Get recommended UI layout based on behavior
   */
  public getRecommendedLayout(userId: string): string {
    const stats = this.store.getMemoryStats(userId);

    // Recommend layout based on common tasks
    if (stats.commonProcedures.some((p) => p.includes("kanban"))) {
      return "kanban";
    }
    if (stats.commonProcedures.some((p) => p.includes("table"))) {
      return "table";
    }
    if (stats.commonProcedures.some((p) => p.includes("timeline"))) {
      return "timeline";
    }

    return "list"; // default
  }

  /**
   * Get recommended features
   */
  public getRecommendedFeatures(userId: string): string[] {
    const stats = this.store.getMemoryStats(userId);
    const features: string[] = [];

    // Recommend features based on behavior
    if (stats.totalEpisodes > 50) {
      features.push("advanced-search");
      features.push("bulk-operations");
    }

    if (stats.commonProcedures.length > 3) {
      features.push("workflow-automation");
      features.push("templates");
    }

    if (stats.totalSemantics > 10) {
      features.push("predictive-completion");
      features.push("smart-suggestions");
    }

    return features;
  }

  /**
   * Update user preferences based on learning
   */
  public updatePreferencesFromBehavior(userId: string): void {
    const profile = this.store.learnUserProfile(userId);

    // Update preferences based on learned behavior
    const layout = this.getRecommendedLayout(userId);
    if (layout !== profile.preferences.defaultLayout) {
      profile.preferences.defaultLayout = layout;
      this.emit("preferences:updated", { userId, layout });
    }

    const stats = this.store.getMemoryStats(userId);
    if (stats.totalEpisodes > 100 && !profile.preferences.compactMode) {
      profile.preferences.compactMode = true;
      this.emit("preferences:updated", { userId, compactMode: true });
    }
  }

  /**
   * Calculate user engagement score
   */
  public calculateEngagementScore(userId: string): number {
    const stats = this.store.getMemoryStats(userId);

    let score = 0;

    // More episodes = higher engagement
    score += Math.min(stats.totalEpisodes / 100, 1) * 30;

    // More learned semantics = deeper usage
    score += Math.min(stats.totalSemantics / 20, 1) * 30;

    // More procedures = more workflows
    score += Math.min(stats.totalProcedures / 10, 1) * 40;

    return Math.round(score);
  }

  /**
   * Get personalization recommendations
   */
  public getRecommendations(userId: string): {
    layouts: string[];
    features: string[];
    workflows: string[];
    engagementScore: number;
  } {
    const stats = this.store.getMemoryStats(userId);

    return {
      layouts: ["list", this.getRecommendedLayout(userId)],
      features: this.getRecommendedFeatures(userId),
      workflows: stats.commonProcedures,
      engagementScore: this.calculateEngagementScore(userId),
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private generatePowerUserMutations(userId: string): MutationRequest[] {
    return [
      {
        description: "Enable advanced features for power user",
        suggestedMutation: {
          type: "ui-layout",
          targetId: "app-root",
          description: "Show advanced UI features and shortcuts",
        },
        reasoning: "User has high engagement and expertise",
        estimatedImpact: "Unlock advanced capabilities",
        requiresApproval: false,
      },
    ];
  }

  private generateWorkflowMutations(userId: string): MutationRequest[] {
    return [
      {
        description: "Optimize common workflows",
        suggestedMutation: {
          type: "workflow-transform",
          targetId: "workflow-engine",
          description: "Streamline frequently used workflows",
        },
        reasoning: "Detected repetitive workflow patterns",
        estimatedImpact: "Reduce steps in common workflows",
        requiresApproval: false,
      },
    ];
  }

  private generateToolPreferenceMutations(
    userId: string,
    preferredTools: string[]
  ): MutationRequest[] {
    return [
      {
        description: "Personalize tool visibility and defaults",
        suggestedMutation: {
          type: "ui-layout",
          targetId: "toolbar",
          description: `Prioritize: ${preferredTools.join(", ")}`,
        },
        reasoning: "User shows preference for specific tools",
        estimatedImpact: "Faster access to preferred tools",
        requiresApproval: false,
      },
    ];
  }
}
