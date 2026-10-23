import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Portfolio- und Projektdatei-Uploads laufen über Server Actions
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }, { protocol: "https", hostname: "fastly.picsum.photos" }],
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
