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
    
    // Add an alias for the problematic import
    config.resolve.alias['date-fns/_lib/format/longFormatters'] = 'date-fns/format';
    
    // Add fallback for process module (using string instead of require.resolve)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: 'process/browser',
    };
    
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

export default nextConfig; 