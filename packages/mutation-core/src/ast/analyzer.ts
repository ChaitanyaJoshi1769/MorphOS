/**
 * AST Analyzer
 *
 * Analyzes code structure for safe mutation.
 * Builds dependency graphs and validates transformations.
 */

import { MorphOSError } from "@morphos/shared";

export interface ASTNode {
  type: string;
  value?: unknown;
  children?: ASTNode[];
  metadata?: Record<string, unknown>;
}

export interface CodeMetrics {
  complexity: number;
  dependencies: string[];
  exposedAPIs: string[];
  stateVariables: string[];
}

export class ASTAnalyzer {
  /**
   * Parse code into AST (simplified)
   */
  public parse(code: string): ASTNode {
    // Simplified AST parsing - in production, use @babel/parser or similar
    return {
      type: "Program",
      children: this.tokenize(code),
    };
  }

  /**
   * Extract imports from code
   */
  public extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(code))) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(code))) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract exports from code
   */
  public extractExports(code: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;

    let match;
    while ((match = exportRegex.exec(code))) {
      exports.push(match[1]);
    }

    return exports;
  }

  /**
   * Extract function definitions
   */
  public extractFunctions(code: string): Map<string, { start: number; end: number }> {
    const functions = new Map<string, { start: number; end: number }>();
    const funcRegex = /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;

    let match;
    while ((match = funcRegex.exec(code))) {
      const name = match[1] || match[2];
      const start = match.index;
      const end = code.indexOf(";", start) + 1 || code.length;
      functions.set(name, { start, end });
    }

    return functions;
  }

  /**
   * Extract state variables
   */
  public extractStateVariables(code: string): string[] {
    const variables: string[] = [];
    const varRegex = /(?:let|const|var)\s+(\w+)\s*=/g;

    let match;
    while ((match = varRegex.exec(code))) {
      variables.push(match[1]);
    }

    return variables;
  }

  /**
   * Calculate cyclomatic complexity
   */
  public calculateComplexity(code: string): number {
    let complexity = 1;
    const keywords = ["if", "else", "switch", "case", "while", "for", "catch", "&&", "||"];

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Check if code is safe to mutate
   */
  public validateSafety(code: string): { safe: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for unsafe patterns
    if (code.includes("eval(")) {
      issues.push("Code uses eval() - unsafe for mutation");
    }
    if (code.includes("Function(")) {
      issues.push("Code uses Function constructor - unsafe for mutation");
    }
    if (code.includes("dangerouslySetInnerHTML")) {
      issues.push("Code uses dangerouslySetInnerHTML - potential XSS risk");
    }
    if (code.includes("innerHTML")) {
      issues.push("Code uses innerHTML - consider safer alternatives");
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  /**
   * Analyze code metrics
   */
  public analyzeMetrics(code: string): CodeMetrics {
    return {
      complexity: this.calculateComplexity(code),
      dependencies: this.extractImports(code),
      exposedAPIs: this.extractExports(code),
      stateVariables: this.extractStateVariables(code),
    };
  }

  /**
   * Find function/variable by pattern
   */
  public findByPattern(code: string, pattern: string): { name: string; index: number }[] {
    const results: { name: string; index: number }[] = [];
    const regex = new RegExp(pattern, "g");

    let match;
    while ((match = regex.exec(code))) {
      results.push({
        name: match[0],
        index: match.index,
      });
    }

    return results;
  }

  /**
   * Extract semantic signature of code
   */
  public extractSignature(code: string): {
    inputs: string[];
    outputs: string[];
    sideEffects: string[];
  } {
    const inputs = this.extractFunctionParameters(code);
    const outputs = this.extractReturnStatements(code);
    const sideEffects = this.detectSideEffects(code);

    return {
      inputs,
      outputs,
      sideEffects,
    };
  }

  private tokenize(code: string): ASTNode[] {
    // Extremely simplified tokenization
    const statements = code.split(";").filter((s) => s.trim());
    return statements.map((stmt) => ({
      type: "Statement",
      value: stmt.trim(),
    }));
  }

  private extractFunctionParameters(code: string): string[] {
    const params: string[] = [];
    const paramRegex = /\(([^)]*)\)/;
    const match = code.match(paramRegex);
    if (match && match[1]) {
      return match[1]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
    }
    return params;
  }

  private extractReturnStatements(code: string): string[] {
    const returns: string[] = [];
    const returnRegex = /return\s+([^;]+)/g;

    let match;
    while ((match = returnRegex.exec(code))) {
      returns.push(match[1].trim());
    }

    return returns;
  }

  private detectSideEffects(code: string): string[] {
    const effects: string[] = [];

    // Check for common side effects
    if (code.match(/fetch\(|axios\.|\.post\(|\.put\(|\.delete\(/)) {
      effects.push("API call");
    }
    if (code.match(/localStorage|sessionStorage/)) {
      effects.push("Storage mutation");
    }
    if (code.match(/setTimeout|setInterval/)) {
      effects.push("Timer");
    }
    if (code.match(/addEventListener|removeEventListener/)) {
      effects.push("Event listener");
    }

    return effects;
  }
}
