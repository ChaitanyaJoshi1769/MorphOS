import { Mutation, MutationRequest } from "@morphos/shared";

export const exampleMutations: Mutation[] = [
  // ============================================================================
  // UI Optimization Mutations
  // ============================================================================

  {
    id: "ui-form-to-modal",
    type: "ui-transformation",
    appId: "demo-app",
    description: "Transform form to modal dialog",
    target: "form-container",
    changes: {
      container: "modal",
      overlay: true,
      animation: "fadeIn",
      closeButton: true,
      backdropClose: true,
    },
    confidence: 0.88,
    impact: "medium",
    reversible: true,
    estimatedCost: 0.08,
  },

  {
    id: "ui-optimize-spacing",
    type: "ui-optimization",
    appId: "demo-app",
    description: "Optimize spacing for mobile devices",
    target: "form-container",
    changes: {
      padding: { mobile: "16px", desktop: "24px" },
      gap: { mobile: "12px", desktop: "16px" },
      fieldWidth: "100%",
    },
    confidence: 0.91,
    impact: "low",
    reversible: true,
    estimatedCost: 0.03,
  },

  {
    id: "ui-dark-mode",
    type: "theme-transformation",
    appId: "demo-app",
    description: "Add dark mode support",
    target: "app-root",
    changes: {
      theme: "dark",
      primaryColor: "#1f2937",
      backgroundColor: "#111827",
      textColor: "#f3f4f6",
      accentColor: "#3b82f6",
    },
    confidence: 0.85,
    impact: "medium",
    reversible: true,
    estimatedCost: 0.12,
  },

  // ============================================================================
  // Performance Mutations
  // ============================================================================

  {
    id: "perf-input-debounce",
    type: "performance",
    appId: "demo-app",
    description: "Add debouncing to text inputs",
    target: "text-input",
    changes: {
      debounceMs: 300,
      validateOnChange: false,
      validateOnBlur: true,
    },
    confidence: 0.93,
    impact: "high",
    reversible: true,
    estimatedCost: 0.02,
  },

  {
    id: "perf-lazy-load-forms",
    type: "performance",
    appId: "demo-app",
    description: "Lazy load form fields",
    target: "form-container",
    changes: {
      lazyLoadFields: true,
      loadThreshold: 0.5,
      preloadOnFocus: true,
    },
    confidence: 0.81,
    impact: "medium",
    reversible: true,
    estimatedCost: 0.15,
  },

  {
    id: "perf-memoize-components",
    type: "performance",
    appId: "demo-app",
    description: "Memoize component renders",
    target: "text-input",
    changes: {
      memoized: true,
      depCheck: ["value", "disabled"],
    },
    confidence: 0.89,
    impact: "low",
    reversible: true,
    estimatedCost: 0.04,
  },

  // ============================================================================
  // Accessibility Mutations
  // ============================================================================

  {
    id: "a11y-aria-labels",
    type: "accessibility",
    appId: "demo-app",
    description: "Add ARIA labels and roles",
    target: "form-container",
    changes: {
      ariaLabel: "Contact Form",
      role: "form",
      ariaDescribedBy: "form-help",
    },
    confidence: 0.97,
    impact: "low",
    reversible: true,
    estimatedCost: 0.01,
  },

  {
    id: "a11y-keyboard-nav",
    type: "accessibility",
    appId: "demo-app",
    description: "Add keyboard navigation support",
    target: "form-container",
    changes: {
      tabIndex: 0,
      keyboardShortcuts: {
        submit: "Enter",
        reset: "Escape",
        nextField: "Tab",
        previousField: "Shift+Tab",
      },
    },
    confidence: 0.92,
    impact: "low",
    reversible: true,
    estimatedCost: 0.06,
  },

  {
    id: "a11y-focus-indicator",
    type: "accessibility",
    appId: "demo-app",
    description: "Enhance focus indicators",
    target: "btn-click",
    changes: {
      focusStyle: "outline",
      focusColor: "#3b82f6",
      focusWidth: "2px",
      focusOffset: "2px",
    },
    confidence: 0.94,
    impact: "low",
    reversible: true,
    estimatedCost: 0.02,
  },

  // ============================================================================
  // Workflow Mutations
  // ============================================================================

  {
    id: "workflow-multi-step-form",
    type: "workflow-transformation",
    appId: "demo-app",
    description: "Convert form to multi-step wizard",
    target: "form-container",
    changes: {
      stepCount: 3,
      progressBar: true,
      steps: [
        { title: "Personal Info", fields: ["name", "email"] },
        { title: "Address", fields: ["street", "city", "zip"] },
        { title: "Preferences", fields: ["newsletter", "notifications"] },
      ],
    },
    confidence: 0.79,
    impact: "high",
    reversible: true,
    estimatedCost: 0.25,
  },

  {
    id: "workflow-auto-save",
    type: "workflow-enhancement",
    appId: "demo-app",
    description: "Add auto-save functionality",
    target: "form-container",
    changes: {
      autoSave: true,
      saveInterval: 10000,
      saveIndicator: true,
      conflictResolution: "user-prefers-latest",
    },
    confidence: 0.87,
    impact: "medium",
    reversible: true,
    estimatedCost: 0.1,
  },

  // ============================================================================
  // Behavioral Mutations
  // ============================================================================

  {
    id: "behavior-conditional-fields",
    type: "behavioral",
    appId: "demo-app",
    description: "Show/hide fields based on conditions",
    target: "form-container",
    changes: {
      conditionalFields: [
        {
          fieldName: "companyName",
          condition: "accountType === 'business'",
        },
        {
          fieldName: "department",
          condition: "companyName !== null && accountType === 'business'",
        },
      ],
    },
    confidence: 0.91,
    impact: "low",
    reversible: true,
    estimatedCost: 0.07,
  },

  {
    id: "behavior-smart-suggestions",
    type: "behavioral",
    appId: "demo-app",
    description: "Add smart field suggestions",
    target: "text-input",
    changes: {
      suggestions: true,
      suggestionMode: "real-time",
      minChars: 2,
      maxSuggestions: 5,
      suggestionSource: "history",
    },
    confidence: 0.84,
    impact: "medium",
    reversible: true,
    estimatedCost: 0.11,
  },

  // ============================================================================
  // Validation Mutations
  // ============================================================================

  {
    id: "validation-email",
    type: "validation",
    appId: "demo-app",
    description: "Add email field validation",
    target: "text-input[type=email]",
    changes: {
      validator: "email",
      errorMessage: "Please enter a valid email address",
      showError: true,
      validateTiming: "onChange",
    },
    confidence: 0.98,
    impact: "low",
    reversible: true,
    estimatedCost: 0.02,
  },

  {
    id: "validation-custom-rules",
    type: "validation",
    appId: "demo-app",
    description: "Add custom validation rules",
    target: "form-container",
    changes: {
      customRules: [
        { field: "password", rule: "minLength:8" },
        { field: "password", rule: "containsUppercase" },
        { field: "password", rule: "containsNumber" },
        { field: "confirmPassword", rule: "matches:password" },
      ],
    },
    confidence: 0.93,
    impact: "low",
    reversible: true,
    estimatedCost: 0.05,
  },
];

export const mutationRequests: MutationRequest[] = exampleMutations.map(
  (mutation, index) => ({
    id: `req-${mutation.id}`,
    mutationId: mutation.id,
    appId: mutation.appId,
    requestedAt: new Date(
      Date.now() - (index + 1) * 60000
    ).toISOString(),
    status: index === 0 ? "pending" : index === 1 ? "approved" : "rejected",
    priority: index % 2 === 0 ? "high" : "medium",
    reason:
      index === 0
        ? "User requested form optimization"
        : index === 1
          ? "Performance improvement"
          : "User declined this change",
    approvedBy: index === 1 ? "system-auto" : undefined,
    rejectedBy: index === 2 ? "user" : undefined,
  })
);
