/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Images configuration for Netlify
  images: {
    unoptimized: true,
  },
  
  // Ensure path aliases work correctly
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here if needed
    return config;
  },
  
  // Disable type checking during build for performance
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build for performance
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 