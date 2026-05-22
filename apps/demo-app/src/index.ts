import {
  AdaptiveRuntime,
  PrimitiveRegistry,
  MutationEngine,
} from "@morphos/adaptive-runtime";
import {
  Primitive,
  Mutation,
  MutationRequest,
  RuntimeApplication,
} from "@morphos/shared";
import { PrimitiveBuilder } from "@morphos/primitive-sdk";
import { PersonalizationStore } from "@morphos/personalization-engine";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("🚀 MorphOS Demo Application");
  console.log("============================\n");

  // Initialize core components
  const registry = new PrimitiveRegistry();
  const runtime = new AdaptiveRuntime();
  const mutationEngine = new MutationEngine();
  const personalization = new PersonalizationStore();

  // ============================================================================
  // DEMO 1: Define and Register Primitives
  // ============================================================================

  console.log("📦 Demo 1: Defining and Registering Primitives");
  console.log("----------------------------------------------\n");

  const buttonPrimitive: Primitive = {
    id: "btn-click",
    appId: "demo-app",
    name: "Click Button",
    category: "ui",
    version: "1.0.0",
    description: "A clickable button primitive",
    inputs: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "Button label text",
      },
      {
        name: "onClick",
        type: "function",
        required: true,
        description: "Click handler callback",
      },
    ],
    outputs: [
      {
        name: "clicked",
        type: "boolean",
        description: "Indicates if button was clicked",
      },
    ],
    state: [
      {
        name: "isPressed",
        type: "boolean",
        initial: false,
      },
    ],
    events: [
      {
        name: "click",
        payload: { timestamp: "number", x: "number", y: "number" },
      },
    ],
    actions: [
      { name: "press", parameters: { duration: "number" } },
      { name: "release", parameters: {} },
    ],
    semantics: {
      intent: "user-interaction",
      userAction: true,
      accessibility: "interactive",
    },
  };

  const inputPrimitive: Primitive = {
    id: "text-input",
    appId: "demo-app",
    name: "Text Input",
    category: "ui",
    version: "1.0.0",
    description: "A text input field",
    inputs: [
      {
        name: "placeholder",
        type: "string",
        required: false,
        description: "Placeholder text",
      },
      {
        name: "onChange",
        type: "function",
        required: true,
        description: "Change handler",
      },
    ],
    outputs: [
      { name: "value", type: "string", description: "Current input value" },
    ],
    state: [
      { name: "value", type: "string", initial: "" },
      { name: "focused", type: "boolean", initial: false },
    ],
    events: [
      { name: "change", payload: { value: "string" } },
      { name: "focus", payload: {} },
      { name: "blur", payload: {} },
    ],
    actions: [
      { name: "focus", parameters: {} },
      { name: "clear", parameters: {} },
    ],
    semantics: {
      intent: "data-input",
      userAction: true,
      accessibility: "form-field",
    },
  };

  const formPrimitive: Primitive = {
    id: "form-container",
    appId: "demo-app",
    name: "Form Container",
    category: "layout",
    version: "1.0.0",
    description: "A form container for organizing inputs",
    inputs: [
      { name: "title", type: "string", required: false },
      { name: "onSubmit", type: "function", required: true },
    ],
    outputs: [{ name: "data", type: "object", description: "Form data" }],
    state: [
      { name: "fields", type: "object", initial: {} },
      { name: "isValid", type: "boolean", initial: true },
    ],
    events: [
      { name: "submit", payload: { data: "object" } },
      { name: "validate", payload: { errors: "array" } },
    ],
    actions: [
      { name: "submit", parameters: {} },
      { name: "reset", parameters: {} },
    ],
    semantics: {
      intent: "data-collection",
      userAction: true,
      accessibility: "form",
    },
  };

  // Register primitives
  registry.register(buttonPrimitive);
  registry.register(inputPrimitive);
  registry.register(formPrimitive);

  console.log("✅ Registered 3 primitives:");
  console.log(`   - ${buttonPrimitive.name} (${buttonPrimitive.id})`);
  console.log(`   - ${inputPrimitive.name} (${inputPrimitive.id})`);
  console.log(`   - ${formPrimitive.name} (${formPrimitive.id})`);
  console.log(`\nTotal primitives: ${registry.list().length}\n`);

  // ============================================================================
  // DEMO 2: Discover and Filter Primitives
  // ============================================================================

  console.log("🔍 Demo 2: Discovering and Filtering Primitives");
  console.log("-----------------------------------------------\n");

  const uiPrimitives = registry.list("demo-app").filter((p) => p.category === "ui");
  console.log(`Found ${uiPrimitives.length} UI primitives:`);
  uiPrimitives.forEach((p) => {
    console.log(`   - ${p.name}: ${p.description}`);
  });

  const searchResults = registry.search("input");
  console.log(`\nSearch results for "input": ${searchResults.length} primitive(s)`);
  searchResults.forEach((p) => {
    console.log(`   - ${p.name}`);
  });

  const categories = registry.getCategories();
  console.log(`\nAvailable categories: ${categories.join(", ")}\n`);

  // ============================================================================
  // DEMO 3: Runtime Application Registration
  // ============================================================================

  console.log("🎯 Demo 3: Runtime Application Registration");
  console.log("-------------------------------------------\n");

  const demoApp: RuntimeApplication = {
    id: "demo-app",
    name: "Demo Application",
    version: "1.0.0",
    description: "A demonstration application for MorphOS",
    state: {
      userName: "John Doe",
      formData: {
        email: "",
        name: "",
      },
      pageMetrics: {
        views: 0,
        interactions: 0,
      },
    },
    primitives: [
      {
        id: "btn-1",
        primitiveId: "btn-click",
        props: { label: "Submit" },
        state: { isPressed: false },
      },
      {
        id: "input-1",
        primitiveId: "text-input",
        props: { placeholder: "Enter your name" },
        state: { value: "", focused: false },
      },
    ],
    mutations: [],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      personalizationLevel: "medium",
    },
  };

  console.log(`Application registered: ${demoApp.name}`);
  console.log(`Version: ${demoApp.version}`);
  console.log(`Primitives: ${demoApp.primitives.length}`);
  console.log(`\nApplication State:`);
  console.log(`   - userName: ${demoApp.state.userName}`);
  console.log(`   - pageMetrics.views: ${demoApp.state.pageMetrics.views}`);
  console.log(`   - pageMetrics.interactions: ${demoApp.state.pageMetrics.interactions}\n`);

  // ============================================================================
  // DEMO 4: Personalization Memory
  // ============================================================================

  console.log("🧠 Demo 4: Personalization and Memory");
  console.log("-------------------------------------\n");

  const userId = "user-demo-123";
  await personalization.initializeUserMemory(userId);

  // Record episodic memory (specific events)
  await personalization.recordEpisode(userId, {
    timestamp: new Date().toISOString(),
    type: "form-submission",
    details: {
      formId: "demo-form",
      fields: ["name", "email"],
      duration: 45,
    },
  });

  // Record semantic memory (general knowledge)
  await personalization.recordSemantic(userId, {
    topic: "form-preferences",
    value: {
      preferredFormLayout: "vertical",
      preferredValidationMode: "real-time",
      preferredSubmitType: "button",
    },
  });

  // Record procedural memory (how-tos and skills)
  await personalization.recordProcedure(userId, {
    name: "fill-contact-form",
    steps: [
      { step: 1, action: "focus-name-field" },
      { step: 2, action: "type-name" },
      { step: 3, action: "focus-email-field" },
      { step: 4, action: "type-email" },
      { step: 5, action: "click-submit" },
    ],
  });

  console.log("✅ Recorded user memory:");
  console.log("   - Episodic: Form submission event");
  console.log("   - Semantic: Form preferences");
  console.log("   - Procedural: Contact form workflow\n");

  const stats = await personalization.getMemoryStats(userId);
  console.log(`Memory statistics:`);
  console.log(`   - Episodes: ${stats.episodeCount}`);
  console.log(`   - Semantic entries: ${stats.semanticCount}`);
  console.log(`   - Procedures: ${stats.procedureCount}\n`);

  // ============================================================================
  // DEMO 5: State Updates and Events
  // ============================================================================

  console.log("⚡ Demo 5: State Updates and Event Emission");
  console.log("-------------------------------------------\n");

  // Simulate state updates
  const updatedApp = { ...demoApp };
  updatedApp.state.pageMetrics.views += 1;
  updatedApp.state.pageMetrics.interactions += 3;
  updatedApp.primitives[1].state.value = "john@example.com";

  console.log("Updated application state:");
  console.log(`   - pageMetrics.views: ${updatedApp.state.pageMetrics.views}`);
  console.log(`   - pageMetrics.interactions: ${updatedApp.state.pageMetrics.interactions}`);
  console.log(`   - input-1 value: "${updatedApp.primitives[1].state.value}"\n`);

  // ============================================================================
  // DEMO 6: Mutation Suggestions
  // ============================================================================

  console.log("🔧 Demo 6: Mutation Suggestions");
  console.log("-------------------------------\n");

  const suggestedMutations: Mutation[] = [
    {
      id: "mut-1",
      type: "ui-optimization",
      appId: "demo-app",
      description: "Optimize form layout based on user behavior",
      target: "form-container",
      changes: {
        layout: "vertical",
        spacing: "compact",
        validation: "real-time",
      },
      confidence: 0.87,
      impact: "high",
      reversible: true,
      estimatedCost: 0.05,
    },
    {
      id: "mut-2",
      type: "performance",
      appId: "demo-app",
      description: "Add input field debouncing",
      target: "text-input",
      changes: {
        debounceDelay: 300,
        validateOnChange: false,
      },
      confidence: 0.92,
      impact: "medium",
      reversible: true,
      estimatedCost: 0.02,
    },
    {
      id: "mut-3",
      type: "accessibility",
      appId: "demo-app",
      description: "Add ARIA labels and semantic HTML",
      target: "form-container",
      changes: {
        ariaLabels: true,
        semanticMarkup: true,
      },
      confidence: 0.95,
      impact: "low",
      reversible: true,
      estimatedCost: 0.01,
    },
  ];

  console.log("Suggested mutations for optimization:");
  suggestedMutations.forEach((mut, idx) => {
    console.log(`\n${idx + 1}. ${mut.description}`);
    console.log(`   Type: ${mut.type}`);
    console.log(`   Confidence: ${(mut.confidence * 100).toFixed(0)}%`);
    console.log(`   Impact: ${mut.impact}`);
    console.log(`   Reversible: ${mut.reversible ? "Yes" : "No"}`);
  });
  console.log();

  // ============================================================================
  // DEMO 7: Application Lifecycle
  // ============================================================================

  console.log("🔄 Demo 7: Application Lifecycle");
  console.log("--------------------------------\n");

  const appLifecycle = {
    initialized: new Date().toISOString(),
    primitiveCount: demoApp.primitives.length,
    mutationCount: demoApp.mutations.length,
    personalizationLevel: demoApp.metadata.personalizationLevel,
    status: "running",
  };

  console.log("Application Lifecycle State:");
  console.log(`   - Status: ${appLifecycle.status}`);
  console.log(`   - Initialized: ${appLifecycle.initialized}`);
  console.log(`   - Primitives: ${appLifecycle.primitiveCount}`);
  console.log(`   - Mutations: ${appLifecycle.mutationCount}`);
  console.log(`   - Personalization: ${appLifecycle.personalizationLevel}\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("📊 Demo Summary");
  console.log("===============\n");

  const summary = {
    primitivesRegistered: registry.list().length,
    categoriesAvailable: categories.length,
    userMemoriesRecorded: 3,
    suggestedMutations: suggestedMutations.length,
    applicationState: appLifecycle,
  };

  console.log("✨ MorphOS Demo Completed Successfully!");
  console.log(`\nKey Metrics:`);
  console.log(`   - Primitives: ${summary.primitivesRegistered}`);
  console.log(`   - Categories: ${summary.categoriesAvailable}`);
  console.log(`   - User Memory Records: ${summary.userMemoriesRecorded}`);
  console.log(`   - Mutation Suggestions: ${summary.suggestedMutations.length}`);
  console.log(`\nDemonstrated Features:`);
  console.log(`   ✓ Primitive Definition and Registration`);
  console.log(`   ✓ Discovery and Filtering`);
  console.log(`   ✓ Runtime Application Management`);
  console.log(`   ✓ Personalization and Memory Systems`);
  console.log(`   ✓ State Management`);
  console.log(`   ✓ Intelligent Mutation Suggestions`);
  console.log(`   ✓ Application Lifecycle Management`);
  console.log();
}

main().catch((err) => {
  console.error("❌ Demo error:", err);
  process.exit(1);
});
