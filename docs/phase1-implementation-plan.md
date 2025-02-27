# Phase 1 Implementation Plan: Project Initialization & Core Setup

## Overview
This document outlines the detailed implementation plan for Phase 1 of the GolfCompete application. Phase 1 focuses on establishing the foundational structure and tools for the entire project.

## Timeline
- Estimated Duration: 2 weeks
- Start Date: [Insert Start Date]
- End Date: [Insert End Date]

## Tasks Breakdown

### 1. GitHub Repository Setup (1 day)
- [ ] Create a new GitHub repository named "golf-compete"
- [ ] Initialize with README.md containing:
  - Project description
  - Tech stack overview
  - Setup instructions
  - Contributing guidelines
- [ ] Add appropriate .gitignore file for Next.js projects
- [ ] Choose and add an open-source license (MIT recommended)
- [ ] Set up simple branch protection rules:
  - Protect `main` branch from force pushes
  - (Optional) Require pull request reviews for collaborators
- [ ] Set up issue templates for bug reports and feature requests

### 2. Next.js + Shadcn + Tailwind Setup (2 days)
- [ ] Initialize Next.js project with App Router:
  ```bash
  npx create-next-app@latest golf-compete --typescript --tailwind --eslint --app
  ```
- [ ] Configure Tailwind CSS:
  - Customize `tailwind.config.js` with project-specific colors and theme
  - Set up dark mode support
- [ ] Install and configure Shadcn UI:
  ```bash
  npx shadcn-ui@latest init
  ```
  - Configure component installation directory
  - Set up global CSS variables
- [ ] Install essential Shadcn UI components:
  - Button
  - Card
  - Dialog
  - Form components
  - Navigation components
- [ ] Set up project structure:
  - `/app` - App router pages
  - `/components` - Reusable UI components
  - `/lib` - Utility functions and shared code
  - `/styles` - Global styles
  - `/types` - TypeScript type definitions
  - `/public` - Static assets

### 3. Supabase Integration with Drizzle ORM (3-4 days)
- [ ] Create a new Supabase project
- [ ] Set up environment variables:
  - Create `.env.local` for local development
  - Add Supabase URL and anon key to environment variables
- [ ] Install Drizzle ORM and PostgreSQL adapter:
  ```bash
  npm install drizzle-orm pg
  npm install -D drizzle-kit @types/pg
  ```
- [ ] Set up Drizzle configuration:
  - Create `drizzle.config.ts` for migration configuration
  - Set up `schema` directory for database schema definitions
- [ ] Define initial database schema using Drizzle:
  - Create schema files for core entities (e.g., `schema/users.ts`)
  - Define relationships between tables
- [ ] Configure database client:
  - Create `lib/db.ts` for Drizzle client initialization with Supabase connection
- [ ] Set up migration workflow:
  - Add migration scripts to `package.json`
  - Create initial migration
  - Document migration process
- [ ] Configure Supabase Row Level Security (RLS) policies
- [ ] Create basic database utility functions:
  - Query helpers
  - Type-safe database operations
- [ ] Test database connection and operations from Next.js application

### 4. Infrastructure & Deployment Pipeline (2 days)
- [ ] Set up Netlify project:
  - Connect GitHub repository to Netlify
  - Configure environment variables in Netlify
  - Set up preview deployments for pull requests
  - Configure build settings and deploy commands
- [ ] Configure GitHub Actions for CI/CD:
  - Create `.github/workflows/ci.yml` for continuous integration
  - Set up linting, type checking, and testing in the CI pipeline
  - Configure automatic deployment to staging on successful builds
- [ ] Set up staging environment:
  - Create a separate Supabase project for staging
  - Configure environment variables for staging
  - Set up Netlify branch deploys for staging environment

### 4.1 Netlify-Specific Configuration for Next.js (1 day)
- [ ] Create `netlify.toml` configuration file:
  ```toml
  [build]
    command = "npm run build"
    publish = ".next"

  [[plugins]]
    package = "@netlify/plugin-nextjs"
  ```
- [ ] Install Netlify Next.js plugin:
  ```bash
  npm install -D @netlify/plugin-nextjs
  ```
- [ ] Configure Next.js for Netlify:
  - Update `next.config.js` if needed for Netlify compatibility
  - Set up proper image optimization configuration
- [ ] Set up Netlify Functions (if needed):
  - Create `netlify/functions` directory
  - Configure serverless functions for any backend needs
- [ ] Configure Netlify redirects and headers:
  - Set up proper caching strategies
  - Configure security headers
- [ ] Test deployment process:
  - Verify build process works correctly
  - Check that environment variables are properly accessed
  - Ensure all routes work as expected

### 5. E2E Testing Setup (1 day)
- [ ] Install and configure Playwright:
  ```bash
  npm init playwright@latest
  ```
- [ ] Set up basic test structure:
  - Create `tests` directory with initial test files
  - Configure test environment variables
- [ ] Implement a simple smoke test:
  - Test that the application loads correctly
  - Verify basic navigation works

### 6. Basic Boilerplate Pages & Navigation (3 days)
- [ ] Create main layout component:
  - Implement responsive layout with Navbar and Footer
  - Set up theme provider for dark/light mode
- [ ] Implement Navbar component:
  - Logo and brand name
  - Navigation links (Home, About, etc.)
  - Responsive mobile menu
- [ ] Implement Footer component:
  - Copyright information
  - Social media links
  - Additional navigation
- [ ] Create basic pages:
  - Home page with hero section and feature highlights
  - About page with project information
  - Contact page (optional)
- [ ] Implement basic routing and navigation

## Deliverables

### Code Deliverables
- [ ] GitHub repository with proper structure and branching strategy
- [ ] Next.js application with Tailwind CSS and Shadcn UI configured
- [ ] Supabase integration with Drizzle ORM and initial database schema
- [ ] CI/CD pipeline with GitHub Actions
- [ ] E2E testing framework with basic tests
- [ ] Basic application pages and navigation

### Documentation Deliverables
- [ ] README.md with project overview and setup instructions
- [ ] Environment setup documentation
- [ ] Database schema documentation with Drizzle schema definitions
- [ ] Migration process documentation
- [ ] Deployment process documentation

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage), Drizzle ORM
- **Deployment**: Netlify
- **Testing**: Playwright
- **CI/CD**: GitHub Actions

## Drizzle ORM Integration Benefits

Drizzle ORM has been selected for database interactions due to several key advantages:

1. **Type Safety**: Drizzle provides full TypeScript integration, ensuring type-safe database operations that align with our Next.js TypeScript setup.

2. **SQL-like Syntax**: The query builder uses syntax that closely resembles SQL, making it intuitive while providing ORM benefits.

3. **Schema Management**: Drizzle allows defining database schema in TypeScript, serving as both documentation and type definitions.

4. **Migration System**: Built-in migration tools help manage database schema changes throughout the project lifecycle.

5. **Performance**: Drizzle is lightweight with minimal overhead compared to other ORMs.

6. **PostgreSQL Compatibility**: Drizzle works exceptionally well with PostgreSQL (Supabase's underlying database).

7. **Developer Experience**: Provides excellent autocompletion and IntelliSense support in IDEs.

The combination of Supabase and Drizzle offers a powerful, type-safe approach to database management while maintaining the flexibility of SQL when needed.

### Sample Drizzle Schema Example

Below is a sample schema definition for a basic user profile table using Drizzle:

```typescript
// schema/users.ts
import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  handicap: integer('handicap'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Example query using Drizzle
// const allUsers = await db.select().from(users);
// const specificUser = await db.select().from(users).where(eq(users.id, userId));
```

This schema definition will be used to generate migrations and provide type safety throughout the application when interacting with the database.

## Getting Started
Once Phase 1 is complete, developers should be able to:
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the development server with `npm run dev`
5. Access the application at `http://localhost:3000`

### Deployment Process
To deploy the application to Netlify:
1. Push changes to the GitHub repository
2. Netlify will automatically detect changes and trigger a build
3. The build process will:
   - Install dependencies
   - Build the Next.js application
   - Deploy to Netlify's CDN
4. Once deployed, the application will be available at the configured Netlify domain

For manual deployments:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

## Next Steps
After completing Phase 1, the project will move to Phase 2: Authentication & User Profile, which will build upon the foundation established in this phase. 