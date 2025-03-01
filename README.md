# Golf Compete

A modern web application for managing golf competitions, tracking scores, and connecting with other golfers.

## Features

- **User Authentication**: Secure login with email/password and Google OAuth
- **User Profiles**: Manage your golf profile, handicap, and equipment
- **Equipment Management**: Track your golf clubs and organize them into bags
- **Competition Management**: Create, join, and manage golf competitions
- **Scoring System**: Record and track scores with detailed statistics
- **Leaderboards**: Real-time competition standings and results
- **Social Features**: Connect with other golfers and share your achievements

## Tech Stack

- **Frontend**: Next.js, React, Material-UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Testing**: Playwright for E2E tests, Jest for unit tests
- **CI/CD**: GitHub Actions for continuous integration and deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Google Cloud Platform account (for OAuth)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/golf-compete.git
   cd golf-compete
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Run the SQL migrations to set up the database schema:
   ```bash
   npx supabase migration up
   ```

2. Or manually execute the SQL files in the Supabase SQL editor:
   - `supabase/migrations/20230701000000_create_profiles_table.sql`
   - `supabase/migrations/20230702000000_create_equipment_tables.sql`
   - `supabase/migrations/20230703000000_create_competition_tables.sql`

## Project Structure

```
golf-compete/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── contexts/            # React contexts (auth, etc.)
│   ├── lib/                 # Utility functions and libraries
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles
├── supabase/
│   └── migrations/          # Database migration files
├── tests/                   # Test files
│   ├── e2e/                 # End-to-end tests
│   └── unit/                # Unit tests
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── .env.example             # Example environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Documentation

- [Authentication Setup](./docs/auth-setup.md)
- [Phase 2 Implementation Plan](./phase-2-implementation-plan.md)

## Testing

Run end-to-end tests:
```bash
npm run test:e2e
# or
yarn test:e2e
```

Run unit tests:
```bash
npm run test
# or
yarn test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Material-UI](https://mui.com/)
- [Supabase](https://supabase.io/)
- [Playwright](https://playwright.dev/)
