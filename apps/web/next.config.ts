import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Playwright (127.0.0.1) to access dev resources during E2E.
  allowedDevOrigins: ["127.0.0.1"],
  // pnpm workspace root so Turbopack resolves the Next.js package correctly.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Godot web export will be served as static files from
  // public/godot (lazy-loaded, same-origin iframe). No config needed yet.
};

export default nextConfig;
