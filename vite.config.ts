import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      router: {
        routesDirectory: "routes",
        generatedRouteTree: "routeTree.gen.ts",
        quoteStyle: "double",
        semicolons: true,
      },
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
