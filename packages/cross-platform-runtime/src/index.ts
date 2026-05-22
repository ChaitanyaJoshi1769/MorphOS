import { RuntimeApplication, Mutation } from "@morphos/shared";

export type Platform = "web" | "mobile" | "desktop" | "server" | "iot";

export interface PlatformCapabilities {
  platform: Platform;
  hasDOM: boolean;
  hasFileSystem: boolean;
  hasNativeAccess: boolean;
  maxMemory: number;
  supportsWorkers: boolean;
  supportsServiceWorkers: boolean;
  supportsOffline: boolean;
  hasGPU: boolean;
  nativeLanguages: string[];
}

export interface PlatformAdapter {
  platform: Platform;
  capabilities: PlatformCapabilities;
  initialize(): Promise<void>;
  run(app: RuntimeApplication): Promise<void>;
  stop(): Promise<void>;
  getState(): Record<string, unknown>;
  setState(state: Record<string, unknown>): Promise<void>;
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data?: unknown) => void): void;
  registerNativeModule(name: string, module: unknown): void;
  callNative(moduleName: string, methodName: string, args?: unknown[]): Promise<unknown>;
}

export class WebRuntimeAdapter implements PlatformAdapter {
  platform: Platform = "web";
  capabilities: PlatformCapabilities = {
    platform: "web",
    hasDOM: true,
    hasFileSystem: false,
    hasNativeAccess: false,
    maxMemory: 512,
    supportsWorkers: true,
    supportsServiceWorkers: true,
    supportsOffline: true,
    hasGPU: true,
    nativeLanguages: [],
  };

  private state: Record<string, unknown> = {};
  private eventListeners: Map<string, Set<Function>> = new Map();
  private nativeModules: Map<string, unknown> = new Map();
  private workers: Map<string, Worker> = new Map();

  async initialize(): Promise<void> {
    // Initialize service worker for offline support
    if (this.capabilities.supportsServiceWorkers && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
        console.log("✓ Service Worker registered");
      } catch (error) {
        console.warn("Service Worker registration failed:", error);
      }
    }
  }

  async run(app: RuntimeApplication): Promise<void> {
    this.state = app.state;
    console.log(`🚀 Running web application: ${app.name}`);
    console.log(`Version: ${app.version}`);
    console.log(`Primitives: ${app.primitives.length}`);
  }

  async stop(): Promise<void> {
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
    this.eventListeners.clear();
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    this.state = { ...state };
    this.emit("state-changed", this.state);
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((handler) => handler(data));
    }
  }

  on(event: string, handler: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  registerNativeModule(name: string, module: unknown): void {
    this.nativeModules.set(name, module);
  }

  async callNative(
    moduleName: string,
    methodName: string,
    args: unknown[] = []
  ): Promise<unknown> {
    const module = this.nativeModules.get(moduleName) as any;
    if (!module || typeof module[methodName] !== "function") {
      throw new Error(`Native module ${moduleName}.${methodName} not found`);
    }
    return module[methodName](...args);
  }

  spawnWorker(name: string, scriptUrl: string): void {
    const worker = new Worker(scriptUrl);
    this.workers.set(name, worker);
    console.log(`✓ Worker spawned: ${name}`);
  }

  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  postToWorker(name: string, message: unknown): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.postMessage(message);
    }
  }
}

export class MobileRuntimeAdapter implements PlatformAdapter {
  platform: Platform = "mobile";
  capabilities: PlatformCapabilities = {
    platform: "mobile",
    hasDOM: true,
    hasFileSystem: true,
    hasNativeAccess: true,
    maxMemory: 256,
    supportsWorkers: false,
    supportsServiceWorkers: false,
    supportsOffline: true,
    hasGPU: true,
    nativeLanguages: ["swift", "kotlin"],
  };

  private state: Record<string, unknown> = {};
  private eventListeners: Map<string, Set<Function>> = new Map();
  private nativeModules: Map<string, unknown> = new Map();

  async initialize(): Promise<void> {
    console.log("📱 Initializing mobile runtime adapter");
    // Mobile-specific initialization
    document.addEventListener("deviceready", () => {
      console.log("✓ Cordova ready");
    });
  }

  async run(app: RuntimeApplication): Promise<void> {
    this.state = app.state;
    console.log(`📱 Running mobile application: ${app.name}`);
  }

  async stop(): Promise<void> {
    this.eventListeners.clear();
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    this.state = { ...state };
    this.emit("state-changed", this.state);
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((handler) => handler(data));
    }
  }

  on(event: string, handler: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  registerNativeModule(name: string, module: unknown): void {
    this.nativeModules.set(name, module);
  }

  async callNative(
    moduleName: string,
    methodName: string,
    args: unknown[] = []
  ): Promise<unknown> {
    const module = this.nativeModules.get(moduleName) as any;
    if (!module || typeof module[methodName] !== "function") {
      throw new Error(`Native module ${moduleName}.${methodName} not found`);
    }
    return module[methodName](...args);
  }

  async accessCamera(): Promise<string> {
    return this.callNative("camera", "capture", []) as Promise<string>;
  }

  async accessLocation(): Promise<{ latitude: number; longitude: number }> {
    return this.callNative("geolocation", "getCurrentPosition", []) as Promise<{
      latitude: number;
      longitude: number;
    }>;
  }

  async accessStorage(filename: string): Promise<string> {
    return this.callNative("storage", "readFile", [filename]) as Promise<string>;
  }
}

export class DesktopRuntimeAdapter implements PlatformAdapter {
  platform: Platform = "desktop";
  capabilities: PlatformCapabilities = {
    platform: "desktop",
    hasDOM: true,
    hasFileSystem: true,
    hasNativeAccess: true,
    maxMemory: 2048,
    supportsWorkers: true,
    supportsServiceWorkers: false,
    supportsOffline: false,
    hasGPU: true,
    nativeLanguages: ["c++", "rust", "python"],
  };

  private state: Record<string, unknown> = {};
  private eventListeners: Map<string, Set<Function>> = new Map();
  private nativeModules: Map<string, unknown> = new Map();

  async initialize(): Promise<void> {
    console.log("🖥️  Initializing desktop runtime adapter");
  }

  async run(app: RuntimeApplication): Promise<void> {
    this.state = app.state;
    console.log(`🖥️  Running desktop application: ${app.name}`);
  }

  async stop(): Promise<void> {
    this.eventListeners.clear();
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    this.state = { ...state };
    this.emit("state-changed", this.state);
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((handler) => handler(data));
    }
  }

  on(event: string, handler: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  registerNativeModule(name: string, module: unknown): void {
    this.nativeModules.set(name, module);
  }

  async callNative(
    moduleName: string,
    methodName: string,
    args: unknown[] = []
  ): Promise<unknown> {
    const module = this.nativeModules.get(moduleName) as any;
    if (!module || typeof module[methodName] !== "function") {
      throw new Error(`Native module ${moduleName}.${methodName} not found`);
    }
    return module[methodName](...args);
  }
}

export class ServerRuntimeAdapter implements PlatformAdapter {
  platform: Platform = "server";
  capabilities: PlatformCapabilities = {
    platform: "server",
    hasDOM: false,
    hasFileSystem: true,
    hasNativeAccess: true,
    maxMemory: 8192,
    supportsWorkers: true,
    supportsServiceWorkers: false,
    supportsOffline: false,
    hasGPU: false,
    nativeLanguages: ["c++", "rust", "python", "java"],
  };

  private state: Record<string, unknown> = {};
  private eventListeners: Map<string, Set<Function>> = new Map();
  private nativeModules: Map<string, unknown> = new Map();

  async initialize(): Promise<void> {
    console.log("⚙️  Initializing server runtime adapter");
  }

  async run(app: RuntimeApplication): Promise<void> {
    this.state = app.state;
    console.log(`⚙️  Running server application: ${app.name}`);
  }

  async stop(): Promise<void> {
    this.eventListeners.clear();
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    this.state = { ...state };
    this.emit("state-changed", this.state);
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((handler) => handler(data));
    }
  }

  on(event: string, handler: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  registerNativeModule(name: string, module: unknown): void {
    this.nativeModules.set(name, module);
  }

  async callNative(
    moduleName: string,
    methodName: string,
    args: unknown[] = []
  ): Promise<unknown> {
    const module = this.nativeModules.get(moduleName) as any;
    if (!module || typeof module[methodName] !== "function") {
      throw new Error(`Native module ${moduleName}.${methodName} not found`);
    }
    return module[methodName](...args);
  }
}

export class CrossPlatformRuntime {
  private adapters: Map<Platform, PlatformAdapter> = new Map();
  private currentPlatform: Platform | null = null;
  private currentAdapter: PlatformAdapter | null = null;

  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platform, adapter);
    console.log(`✓ Registered ${adapter.platform} adapter`);
  }

  async setPlatform(platform: Platform): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Platform ${platform} adapter not registered`);
    }

    if (this.currentAdapter) {
      await this.currentAdapter.stop();
    }

    this.currentPlatform = platform;
    this.currentAdapter = adapter;
    await adapter.initialize();
    console.log(`✓ Platform set to ${platform}`);
  }

  async runApplication(app: RuntimeApplication): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error("No platform adapter initialized");
    }
    await this.currentAdapter.run(app);
  }

  async stopApplication(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.stop();
    }
  }

  getCapabilities(): PlatformCapabilities | null {
    return this.currentAdapter?.capabilities || null;
  }

  getCurrentPlatform(): Platform | null {
    return this.currentPlatform;
  }

  async applyMutation(mutation: Mutation): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error("No platform adapter initialized");
    }
    console.log(`Applying mutation ${mutation.id} on ${this.currentPlatform}`);
    // Implementation depends on mutation type and target platform
  }

  getSupportedPlatforms(): Platform[] {
    return Array.from(this.adapters.keys());
  }

  adaptMutationForPlatform(mutation: Mutation, platform: Platform): Mutation {
    const adapted = { ...mutation };

    if (platform === "mobile") {
      adapted.changes = {
        ...adapted.changes,
        responsive: true,
        touchOptimized: true,
        memoryOptimized: true,
      };
    } else if (platform === "server") {
      adapted.changes = {
        ...adapted.changes,
        concurrency: "high",
        caching: "aggressive",
        monitoring: "enabled",
      };
    } else if (platform === "desktop") {
      adapted.changes = {
        ...adapted.changes,
        nativeIntegration: true,
        fileSystemAccess: true,
      };
    }

    return adapted;
  }
}

export function createCrossPlatformRuntime(): CrossPlatformRuntime {
  const runtime = new CrossPlatformRuntime();

  runtime.registerAdapter(new WebRuntimeAdapter());
  runtime.registerAdapter(new MobileRuntimeAdapter());
  runtime.registerAdapter(new DesktopRuntimeAdapter());
  runtime.registerAdapter(new ServerRuntimeAdapter());

  return runtime;
}
