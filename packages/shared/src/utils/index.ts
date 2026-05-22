/**
 * MorphOS Shared Utilities
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Check if value is an object
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Create a deep clone
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as unknown as T;
  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Validate JSON schema
 */
export function validateSchema(
  data: unknown,
  schema: Record<string, unknown>
): boolean {
  // Simplified validation - in production use ajv or similar
  if (schema.type === "object" && typeof data !== "object") return false;
  if (schema.type === "string" && typeof data !== "string") return false;
  if (schema.type === "number" && typeof data !== "number") return false;
  if (schema.type === "array" && !Array.isArray(data)) return false;
  return true;
}

/**
 * Hash a string using simple algorithm
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      func(...args);
      lastRun = now;
    }
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 100, backoff = 2 } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Format milliseconds to human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Parse ISO timestamp safely
 */
export function parseTimestamp(timestamp: unknown): Date | null {
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    try {
      return new Date(timestamp);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Compare versions (semantic versioning)
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Wait for a condition to be true
 */
export async function waitUntil(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

/**
 * Extract dependencies from code string
 */
export function extractDependencies(code: string): string[] {
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
  const dependencies = new Set<string>();

  let match;
  while ((match = importRegex.exec(code))) {
    dependencies.add(match[1]);
  }
  while ((match = requireRegex.exec(code))) {
    dependencies.add(match[1]);
  }

  return Array.from(dependencies);
}

/**
 * Sanitize object for logging (remove sensitive data)
 */
export function sanitizeForLogging(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[circular]";
  if (!obj || typeof obj !== "object") return obj;

  const sensitiveKeys = [
    "password",
    "token",
    "apiKey",
    "secret",
    "authorization",
    "credentials",
  ];
  const sensitiveKeyRegex = new RegExp(sensitiveKeys.join("|"), "i");

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (sensitiveKeyRegex.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForLogging((obj as Record<string, unknown>)[key], depth + 1);
      }
    }
  }
  return sanitized;
}
