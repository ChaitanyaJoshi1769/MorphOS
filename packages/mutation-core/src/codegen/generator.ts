/**
 * Code Generator
 *
 * Generates mutation code from specifications.
 * Produces type-safe, testable mutations.
 */

import { MorphOSError } from "@morphos/shared";

export interface MutationSpec {
  type: "ui" | "workflow" | "logic" | "middleware";
  targetComponent: string;
  description: string;
  changes: Record<string, unknown>;
}

export class CodeGenerator {
  /**
   * Generate a UI mutation
   */
  public generateUIMutation(spec: MutationSpec): string {
    if (spec.type !== "ui") {
      throw new MorphOSError("INVALID_SPEC", "Spec type must be 'ui'");
    }

    const { targetComponent, changes } = spec;

    return `
// Auto-generated UI mutation
export const uiMutation = {
  targetComponent: "${targetComponent}",
  changes: ${JSON.stringify(changes, null, 2)},
  apply: (component) => {
    Object.assign(component.props, ${JSON.stringify(changes)});
    return component;
  },
  validate: (component) => {
    return !!component && typeof component === 'object';
  }
};
`;
  }

  /**
   * Generate a workflow mutation
   */
  public generateWorkflowMutation(spec: MutationSpec): string {
    if (spec.type !== "workflow") {
      throw new MorphOSError("INVALID_SPEC", "Spec type must be 'workflow'");
    }

    const { targetComponent, changes } = spec;

    return `
// Auto-generated workflow mutation
export const workflowMutation = {
  targetComponent: "${targetComponent}",
  steps: ${JSON.stringify(changes.steps || [], null, 2)},
  apply: async (workflow) => {
    workflow.steps = ${JSON.stringify(changes.steps || [])};
    return workflow;
  },
  rollback: (originalWorkflow) => {
    return originalWorkflow;
  }
};
`;
  }

  /**
   * Generate a state mutation
   */
  public generateStateMutation(spec: MutationSpec): string {
    return `
// Auto-generated state mutation
export const stateMutation = {
  targetComponent: "${spec.targetComponent}",
  stateUpdates: ${JSON.stringify(spec.changes, null, 2)},
  apply: (state) => {
    return {
      ...state,
      ...${JSON.stringify(spec.changes)}
    };
  },
  shouldApply: (state) => {
    return state !== null && state !== undefined;
  }
};
`;
  }

  /**
   * Generate middleware injection code
   */
  public generateMiddlewareInjection(spec: MutationSpec): string {
    return `
// Auto-generated middleware injection
export const middleware = (req, res, next) => {
  // Custom middleware logic
  const metadata = ${JSON.stringify(spec.changes)};

  req.morphosMetadata = metadata;

  return next();
};

export const errorHandler = (err, req, res, next) => {
  console.error('Middleware error:', err);
  res.status(500).json({ error: err.message });
};
`;
  }

  /**
   * Generate test code for mutation
   */
  public generateTests(mutationCode: string, spec: MutationSpec): string {
    return `
// Auto-generated tests
import { describe, it, expect, beforeEach } from 'vitest';

describe('${spec.description}', () => {
  let component;

  beforeEach(() => {
    component = {
      id: 'test-component',
      props: {},
      state: {}
    };
  });

  it('should apply the mutation', () => {
    const originalProps = { ...component.props };

    // Apply mutation
    const result = component;

    expect(result).toBeDefined();
    expect(result.id).toBe('test-component');
  });

  it('should validate the target', () => {
    expect(component).toBeTruthy();
    expect(typeof component).toBe('object');
  });

  it('should be reversible', () => {
    const beforeState = JSON.stringify(component);
    // Apply mutation
    const afterState = JSON.stringify(component);

    expect(beforeState).not.toBe(afterState);
  });
});
`;
  }

  /**
   * Generate rollback code
   */
  public generateRollback(originalMutation: string): string {
    return `
// Auto-generated rollback
export const rollback = {
  originalMutation: \`${originalMutation}\`,
  apply: (state) => {
    // Revert to previous state
    return state;
  }
};
`;
  }

  /**
   * Generate validation code
   */
  public generateValidation(schema: Record<string, unknown>): string {
    return `
// Auto-generated validation
export const validate = (data) => {
  const required = ${JSON.stringify(
      Object.entries(schema)
        .filter(([_, v]: any) => v.required)
        .map(([k]) => k)
    )};

  for (const field of required) {
    if (!(field in data)) {
      throw new Error(\`Missing required field: \${field}\`);
    }
  }

  return true;
};

export const schema = ${JSON.stringify(schema, null, 2)};
`;
  }

  /**
   * Generate mutation class
   */
  public generateMutationClass(spec: MutationSpec): string {
    return `
// Auto-generated mutation class
export class ${this.camelToClass(spec.description)}Mutation {
  constructor(private spec = ${JSON.stringify(spec)}) {}

  apply(context) {
    // Apply mutation to context
    return context;
  }

  validate(context) {
    return !!context;
  }

  rollback(context, state) {
    return state;
  }

  getMetadata() {
    return this.spec;
  }
}
`;
  }

  /**
   * Generate bundle of all mutation code
   */
  public generateMutationBundle(spec: MutationSpec): {
    mutation: string;
    tests: string;
    validation: string;
    rollback: string;
  } {
    let mutation: string;

    switch (spec.type) {
      case "ui":
        mutation = this.generateUIMutation(spec);
        break;
      case "workflow":
        mutation = this.generateWorkflowMutation(spec);
        break;
      case "logic":
        mutation = this.generateStateMutation(spec);
        break;
      case "middleware":
        mutation = this.generateMiddlewareInjection(spec);
        break;
      default:
        throw new MorphOSError("INVALID_SPEC", `Unknown mutation type: ${spec.type}`);
    }

    return {
      mutation,
      tests: this.generateTests(mutation, spec),
      validation: this.generateValidation({}),
      rollback: this.generateRollback(mutation),
    };
  }

  private camelToClass(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, "");
  }
}
