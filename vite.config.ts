import { defineConfig } from 'vite';
import unocssPlugin from "unocss/vite";
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  base: "",
  plugins: [
    unocssPlugin(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  publicDir: "public",
});
