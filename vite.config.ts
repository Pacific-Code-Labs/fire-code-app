import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/",
  server: {
    host: "127.0.0.1",
    port: 5174, // landing 5173 · app 5174 · admin 5175 (root reboot-server.sh)
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  // The landing (fire-safety-advisor) and the admin console (fire-code-admin) are separate
  // apps; this is only the signed-in product.
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
