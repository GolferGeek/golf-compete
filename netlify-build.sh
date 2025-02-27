#!/bin/bash

# Exit on error
set -e

echo "Starting Netlify build process..."

# Remove node_modules and package-lock.json for a fresh install
echo "Removing node_modules, package-lock.json, and yarn.lock..."
rm -rf node_modules package-lock.json yarn.lock

# Install dependencies with Yarn
echo "Installing dependencies with Yarn..."
yarn install --frozen-lockfile

# Explicitly install tailwindcss and related packages
echo "Explicitly installing tailwindcss and related packages..."
yarn add --dev tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.16 tailwindcss-animate@1.0.7

# List installed packages for debugging
echo "Listing installed packages..."
yarn list --depth=0 tailwindcss postcss autoprefixer tailwindcss-animate

# Run the build
echo "Building the application..."
NODE_ENV=production yarn build

echo "Build completed successfully!" 