import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // Os arquivos compartilham o mesmo banco de teste (TRUNCATE entre testes): rodar em série.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
