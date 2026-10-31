import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route is content known at build time, so the whole site exports as static files.
  output: "export",
  // Set when the export is served from a subpath, e.g. a GitHub Pages project preview.
  basePath: process.env.BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
