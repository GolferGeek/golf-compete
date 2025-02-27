#!/bin/bash

# Exit on error
set -e

echo "Starting Netlify build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the build
echo "Building the application..."
npm run build

echo "Build completed successfully!" 