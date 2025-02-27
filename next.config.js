/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // For Netlify deployment
  output: 'export',
  
  // Images configuration for static export
  images: {
    unoptimized: true,
  },
  
  // Ensure path aliases work correctly
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here if needed
    return config;
  },
};

module.exports = nextConfig; 