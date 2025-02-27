#!/bin/bash

# Exit on error and print commands as they're executed
set -ex

echo "Starting simplified Netlify build process..."

# Print environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Install critical packages explicitly
echo "Installing critical packages..."
npm install --save-dev tailwindcss@4.0.0-alpha.6 @tailwindcss/postcss autoprefixer

# Run the build
echo "Building the application..."
NODE_ENV=production npm run build

echo "Build completed successfully!" 