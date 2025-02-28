# GolfCompete

[![Golf Compete CI](https://github.com/golfergeek/golf-compete/actions/workflows/ci.yml/badge.svg)](https://github.com/golfergeek/golf-compete/actions/workflows/ci.yml)

A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.

## Features

- **Competition Management**: FedEx Cup-style season-long competitions with points tracking, standalone events, and real-time scorecards.
- **Performance Tracking**: Multiple bag configurations with separate handicap tracking, course-specific analytics, and comprehensive scoring history.
- **Improvement Framework**: Structured practice planning based on identified weaknesses, pre/post routines, and issue logging.
- **Professional Coaching**: Direct connection to golf professionals with micro-consultation system and personalized feedback.
- **Course Integration**: Detailed course database with comprehensive information and course-hosted daily competitions.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Material UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL installed locally

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/golf-compete.git
cd golf-compete
```

2. **Install dependencies**

```bash
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```
# Database URLs
DATABASE_URL=postgres://postgres:postgres@localhost:5432/golfcompete

# Supabase Configuration
# Server-side variables (not exposed to the browser)
SUPABASE_URL=your_supabase_url_here
SUPABASE_API_KEY=your_supabase_service_role_key_here

# Client-side variables (exposed to the browser)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Next.js environment
NODE_ENV=development
```

4. **Set up the local database**

Make sure PostgreSQL is installed and running on your machine. Then run:

```bash
# Install PostgreSQL if needed (macOS)
brew install postgresql
brew services start postgresql

# Set up the database and run migrations
yarn db:setup
```

5. **Start the development server**

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Management

- **Generate migrations**: `yarn db:generate`
- **Apply migrations**: `yarn db:migrate`
- **View database with Drizzle Studio**: `yarn db:studio`

## Supabase Integration

This project uses Supabase for authentication and data storage. We use two different Supabase clients:

1. **Server-side client** (`supabaseAdmin`): Uses the service role key with full database access. Only used in server-side code.
2. **Client-side client** (`supabaseClient`): Uses the anon/public key with restricted permissions. Safe to use in browser code.

### Environment Variables

- `SUPABASE_URL` and `SUPABASE_API_KEY`: Server-side variables, not exposed to the browser
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-side variables, safe to expose to the browser

## Project Structure

- `/src/app`: Next.js app router pages and layouts
- `/src/components`: React components
  - `/ui`: Material UI components
  - `/layout`: Layout components like Navbar and Footer
- `/src/db`: Database configuration and schema
- `/src/lib`: Utility functions and business logic
- `/src/types`: TypeScript type definitions
- `/e2e`: End-to-end tests with Playwright

## End-to-End Testing

This project uses Playwright for end-to-end testing. The tests are located in the `/e2e` directory.

### Running E2E Tests

```bash
# Run all E2E tests
yarn test:e2e

# Run E2E tests with UI mode
yarn test:e2e:ui

# Run E2E tests in debug mode
yarn test:e2e:debug

# View the HTML report of the last test run
yarn test:e2e:report
```

### Test Structure

- `home.spec.ts`: Tests for the homepage functionality
- `about.spec.ts`: Tests for the about page functionality
- `responsive.spec.ts`: Tests for responsive design across different device sizes

### CI Integration

E2E tests are automatically run on GitHub Actions for all pull requests and pushes to the main branch. The workflow includes:

1. **Linting**: Checks code quality and style
2. **E2E Testing**: Runs Playwright tests across multiple browsers
3. **Artifact Upload**: Test reports are uploaded as artifacts and can be viewed in the GitHub Actions tab

The CI configuration is defined in `.github/workflows/ci.yml`. You can view the status of CI runs in the GitHub Actions tab of the repository.

#### Running Tests Locally Before Pushing

While CI will catch issues automatically, it's good practice to run tests locally before pushing:

```bash
# Run linting
yarn lint

# Run E2E tests
yarn test:e2e
```

This helps catch issues early and reduces the number of failed CI builds.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
