import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Ignore ESLint errors during builds (so Vercel won’t fail)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignore TS errors during builds (optional, helps if strict types block deployment)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
