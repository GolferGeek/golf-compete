import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: [],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
