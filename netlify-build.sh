#!/bin/bash

# Exit on error and print commands as they're executed
set -ex

echo "Starting Netlify build process..."

# Print environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json for a fresh install
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install dependencies with verbose logging
echo "Installing dependencies..."
npm install --verbose

# Explicitly install tailwindcss v4 and related packages
echo "Explicitly installing tailwindcss v4 and related packages..."
npm install --save-dev tailwindcss@4.0.0-alpha.6 @tailwindcss/postcss autoprefixer

# List installed packages for debugging
echo "Listing installed packages..."
npm list --depth=0 tailwindcss @tailwindcss/postcss autoprefixer

# Check if the required files exist
echo "Checking for required files..."
if [ ! -f "postcss.config.mjs" ]; then
  echo "postcss.config.mjs is missing!"
  exit 1
fi

if [ ! -f "tailwind.config.js" ]; then
  echo "tailwind.config.js is missing!"
  exit 1
fi

echo "Content of postcss.config.mjs:"
cat postcss.config.mjs

echo "Content of tailwind.config.js:"
cat tailwind.config.js

# Run the build with detailed error output
echo "Building the application..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "Build completed successfully!" 