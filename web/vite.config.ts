import { cpSync, existsSync } from "fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Copies the prebuilt Expo web export (Asistan patient app) over the Vite
 * output so the published site serves the real Asistan application.
 */
function copyPrebuiltAsistan(): Plugin {
  return {
    name: "copy-prebuilt-asistan",
    apply: "build",
    closeBundle() {
      const prebuilt = path.resolve(__dirname, "prebuilt");
      const dist = path.resolve(__dirname, "dist");
      if (existsSync(prebuilt)) {
        cpSync(prebuilt, dist, { recursive: true, force: true });
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), copyPrebuiltAsistan()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Expose both VITE_* (Vite default) and EXPO_PUBLIC_* (Rork's cross-platform
  // public-env convention, written by tools like getOrCreateAuthConfig).
  envPrefix: ["VITE_", "EXPO_PUBLIC_"],
}));
