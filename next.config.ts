import type { NextConfig } from "next";

// Reine Marketing-Seite: statischer Export nach out/ (GitHub Pages oder Cloudflare Pages).
// PAGES_BASE_PATH nur setzen, wenn die Seite in einem Unterordner liegt (z. B. GitHub Pages: /creative-connect-demo).
// Beim Umzug auf eine eigene Domain: PAGES_BASE_PATH leer lassen und SITE_URL auf die Domain setzen – sonst nichts ändern.
const basePath = (process.env.PAGES_BASE_PATH ?? process.env.BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  experimental: { globalNotFound: true }, // zweisprachige 404 außerhalb von [lang] (src/app/global-not-found.tsx) // Bilder werden vorab als AVIF/WebP erzeugt (scripts/images.mjs)
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
