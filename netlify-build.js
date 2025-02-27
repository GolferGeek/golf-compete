#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run commands and log output
function runCommand(command, ignoreError = false) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout || error.message);
    if (!ignoreError) {
      throw error;
    }
    return '';
  }
}

// Log environment information
console.log(`Node version: ${process.version}`);
console.log(`Yarn version: ${runCommand('yarn --version', true).trim()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Directory contents: ${runCommand('ls -la', true).trim()}`);

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('package.json not found. Exiting.');
  process.exit(1);
}

// Clean node_modules to ensure a fresh install
console.log('Cleaning node_modules...');
if (fs.existsSync('node_modules')) {
  console.log('Removing node_modules directory...');
  if (process.platform === 'win32') {
    runCommand('rmdir /s /q node_modules', true);
  } else {
    runCommand('rm -rf node_modules', true);
  }
}

// Remove yarn.lock if it exists to ensure a clean install
if (fs.existsSync('yarn.lock')) {
  console.log('Removing yarn.lock file...');
  fs.unlinkSync('yarn.lock');
}

// Install dependencies with a clean slate
console.log('Installing dependencies...');
runCommand('yarn install --frozen-lockfile', true);

// Install Tailwind CSS v3 and related packages explicitly
console.log('Installing Tailwind CSS and related packages...');
runCommand('yarn add --dev tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.16 tailwindcss-animate@1.0.7', true);

// Remove incompatible packages
console.log('Removing incompatible packages...');
runCommand('yarn remove @tailwindcss/postcss', true);

// Install additional required packages for Radix UI and other components
console.log('Installing additional required packages...');
runCommand('yarn add @radix-ui/react-navigation-menu@1.1.4 class-variance-authority@0.7.0 clsx@2.0.0 lucide-react@0.294.0 tailwind-merge@1.14.0', true);

// Verify installed packages
console.log('Verifying installed packages...');
runCommand('yarn list --depth=0 tailwindcss postcss autoprefixer tailwindcss-animate @radix-ui/react-navigation-menu class-variance-authority clsx lucide-react tailwind-merge', true);

// Create necessary directories if they don't exist
const directories = [
  'src/components',
  'src/components/ui',
  'src/components/layout',
  'src/lib'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

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
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
  `.trim());
}

// Create or update globals.css to include ShadCN UI variables
if (!fs.existsSync('src/app/globals.css') || !fs.readFileSync('src/app/globals.css', 'utf8').includes('--primary')) {
  console.log('Creating or updating globals.css with ShadCN UI variables...');
  const globalsCssDir = path.dirname('src/app/globals.css');
  if (!fs.existsSync(globalsCssDir)) {
    fs.mkdirSync(globalsCssDir, { recursive: true });
  }
  fs.writeFileSync('src/app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
 
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
  `.trim());
}

// Create utils.ts if it doesn't exist
if (!fs.existsSync('src/lib/utils.ts')) {
  console.log('Creating utils.ts...');
  fs.writeFileSync('src/lib/utils.ts', `
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
  `.trim());
}

// Check if tsconfig.json exists, if not create it or ensure it has proper path aliases
if (fs.existsSync('tsconfig.json')) {
  console.log('Checking tsconfig.json for path aliases...');
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    // Ensure paths are configured correctly
    if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.paths || !tsconfig.compilerOptions.paths['@/*']) {
      console.log('Adding path aliases to tsconfig.json...');
      if (!tsconfig.compilerOptions) {
        tsconfig.compilerOptions = {};
      }
      if (!tsconfig.compilerOptions.paths) {
        tsconfig.compilerOptions.paths = {};
      }
      
      tsconfig.compilerOptions.paths = {
        ...tsconfig.compilerOptions.paths,
        '@/*': ['./src/*']
      };
      
      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
    }
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
  }
}

// Check if jsconfig.json exists, if not create it for path aliases
if (!fs.existsSync('jsconfig.json')) {
  console.log('Creating jsconfig.json for path aliases...');
  fs.writeFileSync('jsconfig.json', JSON.stringify({
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }, null, 2));
}

// Create a .env file with NODE_PATH if it doesn't exist
if (!fs.existsSync('.env.production.local')) {
  console.log('Creating .env.production.local with NODE_PATH...');
  fs.writeFileSync('.env.production.local', 'NODE_PATH=./src\n');
}

// Check if next.config.js exists, if not create it or ensure it has proper configuration
const nextConfigPath = fs.existsSync('next.config.js') ? 'next.config.js' : 
                      (fs.existsSync('next.config.ts') ? 'next.config.ts' : null);

if (nextConfigPath) {
  console.log(`Checking ${nextConfigPath} for proper configuration...`);
  try {
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Only modify if it doesn't already have transpilePackages
    if (!nextConfigContent.includes('transpilePackages')) {
      console.log(`Updating ${nextConfigPath} with transpilePackages...`);
      
      // Create a completely new config file instead of trying to modify the existing one
      if (nextConfigPath.endsWith('.ts')) {
        // For TypeScript config
        fs.writeFileSync(nextConfigPath, `
import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@radix-ui/react-navigation-menu', 'lucide-react'],
};

export default nextConfig;
        `.trim());
      } else {
        // For JavaScript config
        fs.writeFileSync(nextConfigPath, `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radix-ui/react-navigation-menu', 'lucide-react'],
};

module.exports = nextConfig;
        `.trim());
      }
      
      console.log(`${nextConfigPath} has been updated with proper configuration.`);
    } else {
      console.log(`${nextConfigPath} already has transpilePackages configuration.`);
    }
  } catch (error) {
    console.error(`Error updating ${nextConfigPath}:`, error);
    
    // If there's an error, create a new config file with a different name
    const newConfigPath = nextConfigPath.endsWith('.ts') ? 'next.config.new.ts' : 'next.config.new.js';
    console.log(`Creating ${newConfigPath} as a fallback...`);
    
    if (newConfigPath.endsWith('.ts')) {
      fs.writeFileSync(newConfigPath, `
import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@radix-ui/react-navigation-menu', 'lucide-react'],
};

export default nextConfig;
      `.trim());
    } else {
      fs.writeFileSync(newConfigPath, `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radix-ui/react-navigation-menu', 'lucide-react'],
};

module.exports = nextConfig;
      `.trim());
    }
    
    console.log(`Created ${newConfigPath}. Please rename it to ${nextConfigPath} after the build.`);
  }
} else {
  console.log('Creating next.config.js with proper configuration...');
  fs.writeFileSync('next.config.js', `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radix-ui/react-navigation-menu', 'lucide-react'],
};

module.exports = nextConfig;
  `.trim());
}

// Run the build
console.log('Running the build...');
runCommand('yarn build'); 