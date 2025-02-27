#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run commands and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout || error.message);
    throw error;
  }
}

// Log environment information
console.log(`Node version: ${process.version}`);
console.log(`NPM version: ${runCommand('npm --version').trim()}`);
console.log(`Current directory: ${process.cwd()}`);

// Install dependencies
console.log('Installing dependencies...');
runCommand('npm install');

// Install Tailwind CSS v3 and related packages
console.log('Installing Tailwind CSS and related packages...');
runCommand('npm install --save-dev tailwindcss@3.3.0 postcss autoprefixer');

// Verify installed packages
console.log('Verifying installed packages...');
runCommand('npm list --depth=0 tailwindcss postcss autoprefixer');

// Check if postcss.config.mjs exists, if not create it
if (!fs.existsSync('postcss.config.mjs')) {
  console.log('Creating postcss.config.mjs...');
  fs.writeFileSync('postcss.config.mjs', `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
  `.trim());
}

// Check if tailwind.config.js exists, if not create it
if (!fs.existsSync('tailwind.config.js')) {
  console.log('Creating tailwind.config.js...');
  fs.writeFileSync('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
  `.trim());
}

// Run the build
console.log('Running the build...');
try {
  runCommand('NODE_ENV=production npm run build');
} catch (error) {
  console.error('Build failed. Exiting with error code 1.');
  process.exit(1);
}

console.log('Build completed successfully!'); 