import { defineConfig } from 'vite';

export default defineConfig({
  base: "",
  plugins: [
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ["typescript"],
      output: {
        globals: {
          "typescript": "typescript",
        },
      },
    },
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
});
