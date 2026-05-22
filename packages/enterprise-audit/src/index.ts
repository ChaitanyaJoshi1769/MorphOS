export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  result: "success" | "failure";
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
  metadata: Record<string, unknown>;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  severity?: string;
  result?: string;
  limit?: number;
  offset?: number;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  type: "data-retention" | "access-control" | "encryption" | "audit";
  rules: ComplianceRule[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRule {
  condition: string;
  action: string;
  severity: string;
}

export interface AuditReport {
  generatedAt: string;
  period: { start: string; end: string };
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  failureRate: number;
  complianceScore: number;
  recommendations: string[];
}

export class AuditLogger {
  private entries: Map<string, AuditEntry> = new Map();
  private policies: Map<string, CompliancePolicy> = new Map();
  private retentionDays: number = 90;

  async log(entry: Omit<AuditEntry, "id">): Promise<AuditEntry> {
    const id = this.generateId();
    const auditEntry: AuditEntry = {
      ...entry,
      id,
    };

    this.entries.set(id, auditEntry);
    await this.checkCompliance(auditEntry);

    return auditEntry;
  }

  async getEntries(filter: AuditFilter): Promise<AuditEntry[]> {
    let results = Array.from(this.entries.values());

    if (filter.userId) {
      results = results.filter((e) => e.userId === filter.userId);
    }

    if (filter.action) {
      results = results.filter((e) =>
        e.action.toLowerCase().includes(filter.action!.toLowerCase())
      );
    }

    if (filter.resource) {
      results = results.filter((e) => e.resource === filter.resource);
    }

    if (filter.severity) {
      results = results.filter((e) => e.severity === filter.severity);
    }

    if (filter.result) {
      results = results.filter((e) => e.result === filter.result);
    }

    if (filter.startDate) {
      const start = new Date(filter.startDate).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() >= start);
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() <= end);
    }

    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const offset = filter.offset || 0;
    const limit = filter.limit || 50;

    return results.slice(offset, offset + limit);
  }

  async getEntry(id: string): Promise<AuditEntry | undefined> {
    return this.entries.get(id);
  }

  async deleteEntry(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async registerPolicy(policy: CompliancePolicy): Promise<void> {
    this.policies.set(policy.id, policy);
  }

  async getPolicy(id: string): Promise<CompliancePolicy | undefined> {
    return this.policies.get(id);
  }

  async getAllPolicies(): Promise<CompliancePolicy[]> {
    return Array.from(this.policies.values());
  }

  async generateReport(filter: AuditFilter): Promise<AuditReport> {
    const entries = await this.getEntries({
      ...filter,
      limit: 10000,
    });

    const eventsByAction: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    let failureCount = 0;

    entries.forEach((entry) => {
      eventsByAction[entry.action] = (eventsByAction[entry.action] || 0) + 1;
      eventsByResource[entry.resource] =
        (eventsByResource[entry.resource] || 0) + 1;
      eventsBySeverity[entry.severity] =
        (eventsBySeverity[entry.severity] || 0) + 1;

      if (entry.result === "failure") {
        failureCount += 1;
      }
    });

    const enabledPolicies = Array.from(this.policies.values()).filter(
      (p) => p.enabled
    );
    const complianceScore = this.calculateCompliance(entries, enabledPolicies);
    const recommendations = this.generateRecommendations(
      entries,
      complianceScore
    );

    return {
      generatedAt: new Date().toISOString(),
      period: {
        start: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: filter.endDate || new Date().toISOString(),
      },
      totalEvents: entries.length,
      eventsByAction,
      eventsByResource,
      eventsBySeverity,
      failureRate: entries.length > 0 ? failureCount / entries.length : 0,
      complianceScore,
      recommendations,
    };
  }

  async pruneOldEntries(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    let deletedCount = 0;

    this.entries.forEach((entry, id) => {
      if (new Date(entry.timestamp) < cutoffDate) {
        this.entries.delete(id);
        deletedCount += 1;
      }
    });

    return deletedCount;
  }

  setRetentionDays(days: number): void {
    this.retentionDays = days;
  }

  private async checkCompliance(entry: AuditEntry): Promise<void> {
    const enabledPolicies = Array.from(this.policies.values()).filter(
      (p) => p.enabled
    );

    for (const policy of enabledPolicies) {
      for (const rule of policy.rules) {
        if (this.evaluateRule(rule, entry)) {
          // Apply compliance action
          if (rule.action === "alert") {
            console.warn(
              `⚠️  Compliance alert (${policy.name}): ${rule.condition}`
            );
          } else if (rule.action === "block") {
            console.error(
              `❌ Compliance violation (${policy.name}): ${rule.condition}`
            );
          }
        }
      }
    }
  }

  private evaluateRule(rule: ComplianceRule, entry: AuditEntry): boolean {
    // Simple rule evaluation - can be extended with more complex logic
    if (rule.condition === "critical-action" && entry.severity === "critical") {
      return true;
    }
    if (
      rule.condition === "failed-access" &&
      entry.result === "failure" &&
      entry.action.includes("access")
    ) {
      return true;
    }
    if (
      rule.condition === "mass-deletion" &&
      entry.action === "delete" &&
      entry.severity === "critical"
    ) {
      return true;
    }
    return false;
  }

  private calculateCompliance(
    entries: AuditEntry[],
    policies: CompliancePolicy[]
  ): number {
    if (entries.length === 0) return 100;
    if (policies.length === 0) return 100;

    let violations = 0;

    entries.forEach((entry) => {
      policies.forEach((policy) => {
        policy.rules.forEach((rule) => {
          if (this.evaluateRule(rule, entry)) {
            violations += 1;
          }
        });
      });
    });

    return Math.max(0, 100 - (violations / entries.length) * 100);
  }

  private generateRecommendations(
    entries: AuditEntry[],
    complianceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (complianceScore < 80) {
      recommendations.push(
        "Review and strengthen access control policies to improve compliance score"
      );
    }

    const failureCount = entries.filter((e) => e.result === "failure").length;
    if (failureCount / entries.length > 0.1) {
      recommendations.push("High failure rate detected - investigate error patterns");
    }

    const criticalCount = entries.filter(
      (e) => e.severity === "critical"
    ).length;
    if (criticalCount > 10) {
      recommendations.push(
        "Multiple critical events recorded - conduct security review"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Compliance baseline met - continue monitoring");
    }

    return recommendations;
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

export class ComplianceEngine {
  private logger: AuditLogger;
  private policies: Map<string, CompliancePolicy> = new Map();

  constructor(logger: AuditLogger) {
    this.logger = logger;
  }

  async createPolicy(policy: CompliancePolicy): Promise<void> {
    this.policies.set(policy.id, policy);
    await this.logger.registerPolicy(policy);
  }

  async updatePolicy(id: string, updates: Partial<CompliancePolicy>): Promise<void> {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new Error(`Policy ${id} not found`);
    }

    const updated = { ...policy, ...updates, updatedAt: new Date().toISOString() };
    this.policies.set(id, updated);
    await this.logger.registerPolicy(updated);
  }

  async deletePolicy(id: string): Promise<void> {
    this.policies.delete(id);
  }

  async listPolicies(): Promise<CompliancePolicy[]> {
    return Array.from(this.policies.values());
  }

  async validateAction(
    action: string,
    resource: string,
    userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const activePolicies = Array.from(this.policies.values()).filter(
      (p) => p.enabled
    );

    for (const policy of activePolicies) {
      for (const rule of policy.rules) {
        if (action === "delete" && resource === "audit-entry") {
          return {
            allowed: false,
            reason: "Audit entries cannot be deleted due to compliance policy",
          };
        }
      }
    }

    return { allowed: true };
  }
}
