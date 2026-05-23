import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      "@morphos/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@morphos/adaptive-runtime": path.resolve(
        __dirname,
        "./packages/adaptive-runtime/src"
      ),
      "@morphos/primitive-sdk": path.resolve(
        __dirname,
        "./packages/primitive-sdk/src"
      ),
      "@morphos/mutation-core": path.resolve(
        __dirname,
        "./packages/mutation-core/src"
      ),
      "@morphos/agent-core": path.resolve(__dirname, "./packages/agent-core/src"),
      "@morphos/personalization-engine": path.resolve(
        __dirname,
        "./packages/personalization-engine/src"
      ),
      "@morphos/enterprise-audit": path.resolve(
        __dirname,
        "./packages/enterprise-audit/src"
      ),
      "@morphos/self-optimizer": path.resolve(
        __dirname,
        "./packages/self-optimizer/src"
      ),
      "@morphos/cross-platform-runtime": path.resolve(
        __dirname,
        "./packages/cross-platform-runtime/src"
      ),
    },
  },
});
