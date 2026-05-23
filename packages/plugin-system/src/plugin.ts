import { Mutation, Primitive, RuntimeApplication } from "@morphos/shared";

/**
 * Plugin metadata and lifecycle information
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  capabilities: string[];
  minMorphOSVersion: string;
  maxMorphOSVersion?: string;
  dependencies: Record<string, string>;
  publishedAt: Date;
  lastUpdated: Date;
}

/**
 * Custom mutation type definition
 */
export interface CustomMutationType {
  type: string;
  displayName: string;
  description: string;
  category: "performance" | "ui" | "workflow" | "integration" | "custom";
  riskLevel: "low" | "medium" | "high";
  requiredCapabilities: string[];
  parameterSchema: Record<string, unknown>;
  examples: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, unknown>;
  allowedApps?: string[]; // Restrict plugin to specific apps
  requiresApproval?: boolean; // Require admin approval for mutations
  rateLimit?: {
    mutationsPerHour: number;
    maxConcurrent: number;
  };
}

/**
 * Plugin interface that custom plugins must implement
 */
export interface IPlugin {
  metadata: PluginMetadata;
  config: PluginConfig;

  /**
   * Initialize plugin
   */
  initialize(): Promise<void>;

  /**
   * Cleanup on disable
   */
  shutdown(): Promise<void>;

  /**
   * Validate mutation before application
   */
  validateMutation?(mutation: Mutation): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Custom mutation types provided by plugin
   */
  getMutationTypes?(): CustomMutationType[];

  /**
   * Generate mutations for optimization
   */
  suggestMutations?(app: RuntimeApplication): Promise<Mutation[]>;

  /**
   * Register custom primitives
   */
  getPrimitives?(): Primitive[];

  /**
   * Lifecycle hook: before mutation application
   */
  onBeforeMutation?(mutation: Mutation, app: RuntimeApplication): Promise<void>;

  /**
   * Lifecycle hook: after successful mutation
   */
  onAfterMutation?(mutation: Mutation, app: RuntimeApplication): Promise<void>;

  /**
   * Lifecycle hook: on mutation failure
   */
  onMutationFailure?(mutation: Mutation, error: Error): Promise<void>;

  /**
   * Get plugin-specific metrics
   */
  getMetrics?(): Promise<Record<string, unknown>>;

  /**
   * Health check endpoint
   */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Plugin lifecycle state
 */
export type PluginLifecycleState = "uninstalled" | "installed" | "enabled" | "disabled" | "error";

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  plugin: IPlugin;
  state: PluginLifecycleState;
  error?: Error;
  installTime: Date;
  lastModified: Date;
}

/**
 * Plugin Manager
 * Manages plugin lifecycle, validation, and execution
 */
export class PluginManager {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private mutationTypeRegistry: Map<string, CustomMutationType> = new Map();
  private customPrimitives: Map<string, Primitive> = new Map();

  /**
   * Register and install a plugin
   */
  async registerPlugin(plugin: IPlugin): Promise<{ success: boolean; message: string }> {
    // Validation
    const validation = this.validatePlugin(plugin);
    if (!validation.valid) {
      return { success: false, message: validation.errors.join(", ") };
    }

    // Check for duplicate
    if (this.plugins.has(plugin.metadata.id)) {
      return { success: false, message: "Plugin already registered" };
    }

    try {
      // Initialize plugin
      await plugin.initialize();

      // Register mutation types
      const mutationTypes = plugin.getMutationTypes?.() || [];
      for (const mutType of mutationTypes) {
        this.mutationTypeRegistry.set(`${plugin.metadata.id}:${mutType.type}`, mutType);
      }

      // Register primitives
      const primitives = plugin.getPrimitives?.() || [];
      for (const prim of primitives) {
        this.customPrimitives.set(prim.id, prim);
      }

      // Store plugin
      this.plugins.set(plugin.metadata.id, {
        plugin,
        state: plugin.config.enabled ? "enabled" : "disabled",
        installTime: new Date(),
        lastModified: new Date(),
      });

      return { success: true, message: `Plugin '${plugin.metadata.name}' registered successfully` };
    } catch (error) {
      const entry = this.plugins.get(plugin.metadata.id);
      if (entry) {
        entry.state = "error";
        entry.error = error as Error;
      }
      return {
        success: false,
        message: `Failed to register plugin: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<{ success: boolean; message: string }> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      return { success: false, message: "Plugin not found" };
    }

    try {
      await entry.plugin.shutdown();

      // Clean up mutation types and primitives
      for (const [key] of this.mutationTypeRegistry) {
        if (key.startsWith(`${pluginId}:`)) {
          this.mutationTypeRegistry.delete(key);
        }
      }

      this.plugins.delete(pluginId);
      return { success: true, message: `Plugin '${pluginId}' uninstalled` };
    } catch (error) {
      return { success: false, message: `Failed to uninstall plugin: ${(error as Error).message}` };
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<{ success: boolean; message: string }> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      return { success: false, message: "Plugin not found" };
    }

    try {
      entry.plugin.config.enabled = true;
      entry.state = "enabled";
      return { success: true, message: `Plugin '${pluginId}' enabled` };
    } catch (error) {
      return { success: false, message: `Failed to enable plugin: ${(error as Error).message}` };
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<{ success: boolean; message: string }> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      return { success: false, message: "Plugin not found" };
    }

    entry.plugin.config.enabled = false;
    entry.state = "disabled";
    return { success: true, message: `Plugin '${pluginId}' disabled` };
  }

  /**
   * Get all registered plugins
   */
  getPlugins(filterState?: PluginLifecycleState): IPlugin[] {
    const plugins: IPlugin[] = [];

    for (const entry of this.plugins.values()) {
      if (!filterState || entry.state === filterState) {
        plugins.push(entry.plugin);
      }
    }

    return plugins;
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): IPlugin[] {
    return this.getPlugins("enabled");
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  /**
   * Validate mutation against all plugins
   */
  async validateMutation(mutation: Mutation): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.validateMutation) {
        const result = await plugin.validateMutation(mutation);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get suggestions from all plugins
   */
  async suggestMutations(app: RuntimeApplication): Promise<Mutation[]> {
    const suggestions: Mutation[] = [];

    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.suggestMutations) {
        const pluginSuggestions = await plugin.suggestMutations(app);
        suggestions.push(...pluginSuggestions);
      }
    }

    return suggestions;
  }

  /**
   * Execute before-mutation hooks
   */
  async executeBeforeMutationHooks(
    mutation: Mutation,
    app: RuntimeApplication
  ): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onBeforeMutation) {
        await plugin.onBeforeMutation(mutation, app);
      }
    }
  }

  /**
   * Execute after-mutation hooks
   */
  async executeAfterMutationHooks(mutation: Mutation, app: RuntimeApplication): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onAfterMutation) {
        await plugin.onAfterMutation(mutation, app);
      }
    }
  }

  /**
   * Execute failure hooks
   */
  async executeFailureHooks(mutation: Mutation, error: Error): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onMutationFailure) {
        await plugin.onMutationFailure(mutation, error);
      }
    }
  }

  /**
   * Get custom mutation types from all plugins
   */
  getCustomMutationTypes(): CustomMutationType[] {
    return Array.from(this.mutationTypeRegistry.values());
  }

  /**
   * Get custom primitives from all plugins
   */
  getCustomPrimitives(): Primitive[] {
    return Array.from(this.customPrimitives.values());
  }

  /**
   * Health check all plugins
   */
  async healthCheckPlugins(): Promise<Record<string, { healthy: boolean; message?: string }>> {
    const results: Record<string, { healthy: boolean; message?: string }> = {};

    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.healthCheck) {
        results[plugin.metadata.id] = await plugin.healthCheck();
      }
    }

    return results;
  }

  /**
   * Get plugin metrics
   */
  async getPluginMetrics(): Promise<Record<string, Record<string, unknown>>> {
    const metrics: Record<string, Record<string, unknown>> = {};

    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.getMetrics) {
        metrics[plugin.metadata.id] = await plugin.getMetrics();
      }
    }

    return metrics;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: IPlugin): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!plugin.metadata || !plugin.metadata.id) {
      errors.push("Plugin must have metadata with id");
    }

    if (!plugin.metadata.name) {
      errors.push("Plugin must have name");
    }

    if (!plugin.metadata.version) {
      errors.push("Plugin must have version");
    }

    if (typeof plugin.initialize !== "function") {
      errors.push("Plugin must implement initialize()");
    }

    if (typeof plugin.shutdown !== "function") {
      errors.push("Plugin must implement shutdown()");
    }

    return { valid: errors.length === 0, errors };
  }
}
