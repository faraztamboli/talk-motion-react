import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build from the real path: C:\Users\faruk is a junction to D:\Users\faruk, and
// Vite fails ("fileName ... neither absolute nor relative paths") when its root
// and the resolved files are on different drives. Same fix as ../vite.config.js.
const root = fs.realpathSync.native(path.dirname(fileURLToPath(import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig({
  root,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
});
