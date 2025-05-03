import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from "vite-plugin-dts";
import wasmPlugin from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    wasmPlugin(),
  ],
  build: {
    target: "esnext",
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      formats: ['es'],
    },
  },
  worker: {
    format: "es",
  },
});
