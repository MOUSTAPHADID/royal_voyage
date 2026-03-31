import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ["__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".expo"],
    alias: {
      "@/": new URL("./", import.meta.url).pathname,
    },
  },
});
