import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Allow larger uploads for images
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
