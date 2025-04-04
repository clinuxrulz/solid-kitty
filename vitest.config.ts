import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    
    setupFiles: ['node_modules/@testing-library/jest-dom/vitest'],
  }
});
