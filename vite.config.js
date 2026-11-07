import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev only: proxy the TalkMotion 2.0 API (server/api, `uvicorn app.main:app`) so the app
  // can call relative /api/v1 and /ws URLs. Production sets VITE_API_BASE_URL instead.
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8000";

  return {
    // Fast Refresh needs a browser preamble; vitest renders without one.
    plugins: [react({ fastRefresh: !process.env.VITEST })],
    server: {
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/ws": { target: apiTarget.replace(/^http/, "ws"), ws: true, changeOrigin: true },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.js",
      include: ["src/**/*.test.{js,jsx}"],
    },
    //  build: {
    //    rollupOptions: {
    //      output: {
    //        manualChunks(id) {
    //          if (id.includes("node_modules")) {
    //            return id
    //              .toString()
    //              .split("node_modules/")[1]
    //              .split("/")[0]
    //              .toString();
    //          }
    //        },
    //      },
    //    },
    //  },
  };
});
