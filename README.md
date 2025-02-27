# GolfCompete

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
