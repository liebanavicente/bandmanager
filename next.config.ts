import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      // Recursos de marca alojados externamente (logo-hero)
      { protocol: "https", hostname: "n.uguu.se" },
    ],
  },
};

export default nextConfig;
