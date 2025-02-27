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
};

module.exports = nextConfig; 