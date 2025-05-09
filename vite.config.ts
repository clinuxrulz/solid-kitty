import { defineConfig } from 'vite';
//import unocssPlugin from "unocss/vite";
import tailwindcss from "@tailwindcss/vite";
import solidPlugin from 'vite-plugin-solid';
import wasmPlugin from "vite-plugin-wasm";
import mkcertPlugin from "vite-plugin-mkcert";
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: "",
  plugins: [
    //unocssPlugin(),
    tailwindcss(),
    solidPlugin(),
    wasmPlugin(),
    // mkcertPlugin(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: false,
      include: [
        "./src/lib.ts",
        "./src/ecs/**/*.ts",
        "./src/TypeSchema.ts",
      ],
      outDir: "./types",
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ["typescript"],
      input: [
        "index.html",
        "src/lib.ts",
      ],
      output: {
        globals: {
          "typescript": "typescript",
        },
      },
      preserveEntrySignatures: "allow-extension",
    },
    assetsInlineLimit: (file) => {
      return !file.endsWith('.ts');
    },
  },
  publicDir: "public",
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
     environment: 'jsdom',
     deps: {
       optimizer: {
         web: {
           enabled: true,
           include: ['solid-js', 'solid-js/web', 'solid-js/store'],
         },
       },
       // inline: [/solid-js/],  // this still works but is deprecated
     },
  },
});
