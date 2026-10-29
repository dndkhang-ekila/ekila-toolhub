import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['26.196.31.90'],
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return ["/forgot-password", "/reset-password"].map((source) => ({
      source,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
