#!/bin/bash

# Exit on error
set -e

echo "Starting Netlify build process..."

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

# Run the build
echo "Building the application..."
NODE_ENV=production npm run build

echo "Build completed successfully!" 