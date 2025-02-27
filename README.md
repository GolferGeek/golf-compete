# GolfCompete

A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.

## Features

- **Competition Management**: FedEx Cup-style season-long competitions with points tracking, standalone events, and real-time scorecards.
- **Performance Tracking**: Multiple bag configurations with separate handicap tracking, course-specific analytics, and comprehensive scoring history.
- **Improvement Framework**: Structured practice planning based on identified weaknesses, pre/post routines, and issue logging.
- **Professional Coaching**: Direct connection to golf professionals with micro-consultation system and personalized feedback.
- **Course Integration**: Detailed course database with comprehensive information and course-hosted daily competitions.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: (Coming soon)
- **Deployment**: (Coming soon)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL installed locally

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/golf-compete.git
cd golf-compete
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```
# Database URLs
DATABASE_URL=postgres://postgres:postgres@localhost:5432/golfcompete
SUPABASE_URL=your_supabase_url_here
SUPABASE_API_KEY=your_supabase_api_key_here

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
npm run db:setup
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Management

- **Generate migrations**: `npm run db:generate`
- **Apply migrations**: `npm run db:migrate`
- **View database with Drizzle Studio**: `npm run db:studio`

## Project Structure

- `/src/app`: Next.js app router pages and layouts
- `/src/components`: React components
  - `/ui`: Shadcn UI components
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
