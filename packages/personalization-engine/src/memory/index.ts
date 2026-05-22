/**
 * Personalization Memory System
 *
 * Stores and retrieves user behavior patterns, preferences, and learned optimizations.
 * Foundation for adaptive software that learns from user interactions.
 */

import {
  PersonalizationMemory,
  PersonalizationEpisode,
  PersonalizationSemantic,
  PersonalizationProcedure,
  UserProfile,
  generateId,
  getCurrentTimestamp,
  deepClone,
} from "@morphos/shared";
import { EventEmitter } from "events";

export class PersonalizationStore extends EventEmitter {
  private memories: Map<string, PersonalizationMemory> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  /**
   * Initialize memory for a user
   */
  public initializeUserMemory(userId: string): PersonalizationMemory {
    if (!this.memories.has(userId)) {
      const memory: PersonalizationMemory = {
        userId,
        episodic: [],
        semantic: [],
        procedural: [],
        index: new Map(),
      };
      this.memories.set(userId, memory);
      this.emit("memory:initialized", { userId });
    }
    return this.memories.get(userId)!;
  }

  /**
   * Record an episodic memory (specific event)
   */
  public recordEpisode(userId: string, episode: Omit<PersonalizationEpisode, "timestamp">): void {
    const memory = this.initializeUserMemory(userId);

    const fullEpisode: PersonalizationEpisode = {
      ...episode,
      timestamp: getCurrentTimestamp(),
    };

    memory.episodic.push(fullEpisode);
    this.updateIndex(userId, episode.action, fullEpisode.timestamp);

    this.emit("episode:recorded", { userId, action: episode.action });
  }

  /**
   * Record a semantic memory (learned concept)
   */
  public recordSemantic(userId: string, semantic: Omit<PersonalizationSemantic, "frequency">): void {
    const memory = this.initializeUserMemory(userId);

    // Check if we already know this concept
    const existing = memory.semantic.find((s) => s.concept === semantic.concept);

    if (existing) {
      existing.frequency += 1;
    } else {
      memory.semantic.push({
        ...semantic,
        frequency: 1,
      });
    }

    this.updateIndex(userId, semantic.concept, getCurrentTimestamp());
    this.emit("semantic:recorded", { userId, concept: semantic.concept });
  }

  /**
   * Record a procedural memory (how to do something)
   */
  public recordProcedure(userId: string, procedure: PersonalizationProcedure): void {
    const memory = this.initializeUserMemory(userId);

    const existing = memory.procedural.find((p) => p.procedure === procedure.procedure);
    if (!existing) {
      memory.procedural.push(procedure);
      this.updateIndex(userId, procedure.procedure, getCurrentTimestamp());
      this.emit("procedure:recorded", { userId, procedure: procedure.procedure });
    }
  }

  /**
   * Retrieve relevant memories based on context
   */
  public retrieveRelevantMemories(
    userId: string,
    context: string,
    limit = 10
  ): {
    episodes: PersonalizationEpisode[];
    semantics: PersonalizationSemantic[];
    procedures: PersonalizationProcedure[];
  } {
    const memory = this.memories.get(userId);
    if (!memory) {
      return { episodes: [], semantics: [], procedures: [] };
    }

    const contextLower = context.toLowerCase();

    return {
      episodes: memory.episodic
        .filter((e) => e.action.toLowerCase().includes(contextLower))
        .slice(-limit),
      semantics: memory.semantic
        .filter((s) => s.concept.toLowerCase().includes(contextLower))
        .slice(-limit),
      procedures: memory.procedural
        .filter((p) => p.procedure.toLowerCase().includes(contextLower))
        .slice(-limit),
    };
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(userId: string): {
    totalEpisodes: number;
    totalSemantics: number;
    totalProcedures: number;
    topConcepts: string[];
    commonProcedures: string[];
  } {
    const memory = this.memories.get(userId);
    if (!memory) {
      return {
        totalEpisodes: 0,
        totalSemantics: 0,
        totalProcedures: 0,
        topConcepts: [],
        commonProcedures: [],
      };
    }

    const topConcepts = memory.semantic
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((s) => s.concept);

    const commonProcedures = memory.procedural
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map((p) => p.procedure);

    return {
      totalEpisodes: memory.episodic.length,
      totalSemantics: memory.semantic.length,
      totalProcedures: memory.procedural.length,
      topConcepts,
      commonProcedures,
    };
  }

  /**
   * Learn user profile from memory
   */
  public learnUserProfile(userId: string): UserProfile {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        email: "",
        name: "",
        behavior: {
          dailyActiveTime: 0,
          preferredTools: [],
          workflowPatterns: [],
          clickPatterns: [],
          searchQueries: [],
          commonTasks: [],
        },
        preferences: {
          theme: "auto",
          compactMode: false,
          defaultLayout: "list",
          enableAIAssistance: true,
          autoApplyMutations: false,
          notificationLevel: "important",
          privacyMode: "normal",
        },
        personalMutations: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };
    }

    // Update profile based on memory
    const stats = this.getMemoryStats(userId);
    profile.behavior.commonTasks = stats.commonProcedures.map((p) => ({
      task: p,
      frequency: 0,
      averageSteps: 0,
      preferredSequence: [],
    }));

    profile.behavior.preferredTools = stats.topConcepts;
    profile.updatedAt = getCurrentTimestamp();

    this.userProfiles.set(userId, profile);
    this.emit("profile:updated", { userId });

    return profile;
  }

  /**
   * Get user profile
   */
  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Clear old memories (retention policy)
   */
  public clearOldMemories(userId: string, daysToKeep = 90): number {
    const memory = this.memories.get(userId);
    if (!memory) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const episodesRemoved = memory.episodic.filter(
      (e) => new Date(e.timestamp) < cutoffDate
    ).length;

    memory.episodic = memory.episodic.filter(
      (e) => new Date(e.timestamp) >= cutoffDate
    );

    this.emit("memory:pruned", { userId, episodesRemoved });

    return episodesRemoved;
  }

  /**
   * Export user memory (for backup)
   */
  public exportMemory(userId: string): PersonalizationMemory | undefined {
    const memory = this.memories.get(userId);
    return memory ? deepClone(memory) : undefined;
  }

  /**
   * Import user memory
   */
  public importMemory(userId: string, memory: PersonalizationMemory): void {
    this.memories.set(userId, deepClone(memory));
    this.emit("memory:imported", { userId });
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private updateIndex(userId: string, key: string, timestamp: string): void {
    const memory = this.memories.get(userId);
    if (!memory) return;

    const keyLower = key.toLowerCase();
    if (!memory.index.has(keyLower)) {
      memory.index.set(keyLower, []);
    }

    const entries = memory.index.get(keyLower)!;
    entries.push(timestamp);

    // Keep index size manageable
    if (entries.length > 1000) {
      entries.shift();
    }
  }
}
