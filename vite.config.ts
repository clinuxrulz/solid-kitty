import { defineConfig } from 'vite';
import unocssPlugin from "unocss/vite";
import solidPlugin from 'vite-plugin-solid';
import mkcertPlugin from "vite-plugin-mkcert";

export default defineConfig({
  base: "",
  plugins: [
    unocssPlugin(),
    solidPlugin(),
    mkcertPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  publicDir: "public",
});
