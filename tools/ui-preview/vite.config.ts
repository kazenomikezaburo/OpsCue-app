import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root, envDir: false, publicDir: false, cacheDir: ".vite-cache",
  css: { postcss: { plugins: [] } },
  server: {
    host: "127.0.0.1", port: 5178, strictPort: true,
    cors: false, allowedHosts: ["127.0.0.1"],
    fs: { strict: true, allow: [root] }
  },
  preview: { host: "127.0.0.1", port: 5178, strictPort: true },
  build: {
    outDir: "dist", emptyOutDir: true,
    modulePreload: { polyfill: false },
    manifest: true, sourcemap: false
  },
  esbuild: { jsx: "automatic" }
});
