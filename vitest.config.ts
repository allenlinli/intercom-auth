import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      INTERCOM_CLIENT_ID: "test-client-id",
      INTERCOM_CLIENT_SECRET: "test-client-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
