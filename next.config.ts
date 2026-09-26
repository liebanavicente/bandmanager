import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tipografías que se incrustan en el PDF de los setlists (se leen del disco)
  outputFileTracingIncludes: {
    "/api/setlists/**": ["./src/lib/pdf/fonts/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
