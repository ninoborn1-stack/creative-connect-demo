import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Portfolio- und Projektdatei-Uploads laufen über Server Actions
    serverActions: { bodySizeLimit: "8mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
