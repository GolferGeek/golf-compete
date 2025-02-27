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
console.log(`NPM version: ${runCommand('npm --version', true).trim()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Directory contents: ${runCommand('ls -la', true).trim()}`);

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('package.json not found. Exiting.');
  process.exit(1);
}

// Clean npm cache and node_modules to ensure a fresh install
console.log('Cleaning npm cache and node_modules...');
runCommand('npm cache clean --force', true);
if (fs.existsSync('node_modules')) {
  console.log('Removing node_modules directory...');
  if (process.platform === 'win32') {
    runCommand('rmdir /s /q node_modules', true);
  } else {
    runCommand('rm -rf node_modules', true);
  }
}

// Install dependencies with a clean slate
console.log('Installing dependencies...');
runCommand('npm install --no-fund --no-audit', true);

// Install Tailwind CSS v3 and related packages explicitly
console.log('Installing Tailwind CSS and related packages...');
runCommand('npm install --save-dev tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.16 tailwindcss-animate@1.0.7 --no-fund --no-audit', true);

// Remove incompatible packages
console.log('Removing incompatible packages...');
runCommand('npm uninstall @tailwindcss/postcss', true);

// Install additional required packages for Radix UI and other components
console.log('Installing additional required packages...');
runCommand('npm install @radix-ui/react-navigation-menu@1.1.4 class-variance-authority@0.7.0 clsx@2.0.0 lucide-react@0.294.0 tailwind-merge@1.14.0 --no-fund --no-audit', true);

// Verify installed packages
console.log('Verifying installed packages...');
runCommand('npm list --depth=0 tailwindcss postcss autoprefixer tailwindcss-animate @radix-ui/react-navigation-menu class-variance-authority clsx lucide-react tailwind-merge', true);

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

// Create Navbar component if it doesn't exist
if (!fs.existsSync('src/components/layout/Navbar.tsx')) {
  console.log('Creating Navbar.tsx...');
  fs.writeFileSync('src/components/layout/Navbar.tsx', `
"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          GolfCompete
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/about" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  About
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>Competitions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/competitions"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Competitions
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          View and join season-long tournaments and standalone events.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <Link href="/competitions/series" legacyBehavior passHref>
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Series</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          FedEx Cup-style season-long competitions
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/competitions/events" legacyBehavior passHref>
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Events</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Standalone events and tournaments
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/courses" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Courses
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
  `.trim());
}

// Create Footer component if it doesn't exist
if (!fs.existsSync('src/components/layout/Footer.tsx')) {
  console.log('Creating Footer.tsx...');
  fs.writeFileSync('src/components/layout/Footer.tsx', `
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">GolfCompete</h3>
            <p className="text-sm text-muted-foreground">
              The premier platform for organizing and participating in golf competitions.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Courses
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features/scoring" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Live Scoring
                </Link>
              </li>
              <li>
                <Link href="/features/leaderboards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link href="/features/stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/features/handicaps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Handicap Tracking
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GolfCompete. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
  `.trim());
}

// Create button component if it doesn't exist
if (!fs.existsSync('src/components/ui/button.tsx')) {
  console.log('Creating button.tsx...');
  fs.writeFileSync('src/components/ui/button.tsx', `
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
  `.trim());
}

// Create card component if it doesn't exist
if (!fs.existsSync('src/components/ui/card.tsx')) {
  console.log('Creating card.tsx...');
  fs.writeFileSync('src/components/ui/card.tsx', `
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
  `.trim());
}

// Create navigation-menu component if it doesn't exist
if (!fs.existsSync('src/components/ui/navigation-menu.tsx')) {
  console.log('Creating navigation-menu.tsx...');
  fs.writeFileSync('src/components/ui/navigation-menu.tsx', `
"use client"

import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
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

// Ensure Tailwind CSS is properly installed
console.log('Ensuring Tailwind CSS is properly installed...');
runCommand('npm list tailwindcss || npm install --save-dev tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.16 tailwindcss-animate@1.0.7 --no-fund --no-audit', true);

// Create layout.tsx if it doesn't exist
if (!fs.existsSync('src/app/layout.tsx')) {
  console.log('Creating layout.tsx...');
  fs.writeFileSync('src/app/layout.tsx', `
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GolfCompete - Elevate Your Golf Game",
  description: "A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
  `.trim());
}

// Create page.tsx if it doesn't exist
if (!fs.existsSync('src/app/page.tsx')) {
  console.log('Creating page.tsx...');
  fs.writeFileSync('src/app/page.tsx', `
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to GolfCompete</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Competitions</CardTitle>
            <CardDescription>Join season-long series or standalone events</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Compete against friends or join public tournaments with various formats including stroke play, match play, and more.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Browse Competitions</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Live Scoring</CardTitle>
            <CardDescription>Real-time leaderboards and scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Track scores hole-by-hole with our easy-to-use mobile interface. View live leaderboards during your round.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Try Live Scoring</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Track your performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Analyze your game with detailed statistics. Identify strengths and weaknesses to improve your handicap.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">View Statistics</Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to elevate your golf game?</h2>
        <Button size="lg" className="mr-4">Sign Up</Button>
        <Button size="lg" variant="outline">Learn More</Button>
      </div>
    </div>
  );
}
  `.trim());
}

// Run the build
console.log('Running the build...');
try {
  // Make sure NODE_ENV is set to production
  process.env.NODE_ENV = 'production';
  runCommand('npm run build');
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed. Exiting with error code 1.');
  process.exit(1);
} 