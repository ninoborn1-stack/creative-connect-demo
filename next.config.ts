import type { NextConfig } from "next";

// Reine Marketing-Seite: statischer Export nach out/ (GitHub Pages oder Cloudflare Pages).
// BASE_PATH nur setzen, wenn die Seite in einem Unterordner liegt (z. B. GitHub Pages: /creative-connect-demo).
const basePath = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true }, // Bilder werden vorab als AVIF/WebP erzeugt (scripts/images.mjs)
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: process.env.SITE_URL ?? "" },
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
