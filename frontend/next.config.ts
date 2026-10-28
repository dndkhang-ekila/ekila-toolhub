import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['26.196.31.90'],
  cacheComponents: true,
  partialPrefetching: true,
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