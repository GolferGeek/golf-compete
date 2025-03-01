# Authentication Setup Guide

This document provides instructions for setting up the authentication system for the Golf Compete application.

## Prerequisites

- Supabase account and project
- Google Cloud Platform account (for OAuth)
- Node.js and npm/yarn installed

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup

### 1. Database Setup

Run the SQL migration to create the profiles table:

```bash
npx supabase migration up
```

Or manually execute the SQL in `supabase/migrations/20230701000000_create_profiles_table.sql` in the Supabase SQL editor.

### 2. Authentication Settings

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Configure the following settings:
   - Site URL: Your production URL (e.g., https://golf-compete.com)
   - Redirect URLs: Add your local and production URLs (e.g., http://localhost:3000/auth/callback, https://golf-compete.com/auth/callback)

### 3. Email Authentication

1. Go to Authentication > Providers
2. Ensure Email provider is enabled
3. Configure email templates if desired

### 4. Google OAuth Setup

1. Create a project in Google Cloud Console
2. Set up OAuth consent screen
3. Create OAuth credentials (Web application)
4. Add authorized JavaScript origins:
   - http://localhost:3000
   - https://your-production-domain.com
5. Add authorized redirect URIs:
   - http://localhost:3000/auth/callback
   - https://your-project.supabase.co/auth/v1/callback
   - https://your-production-domain.com/auth/callback
6. Copy the Client ID and Client Secret
7. In Supabase, go to Authentication > Providers
8. Enable Google provider and paste your Client ID and Client Secret

## Application Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### 2. File Structure

The authentication system consists of the following files:

- `src/lib/supabase.ts` - Supabase client and auth functions
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/components/auth/ProtectedRoute.tsx` - Protected route component
- Auth pages:
  - `src/app/auth/login/page.tsx`
  - `src/app/auth/signup/page.tsx`
  - `src/app/auth/callback/page.tsx`
  - `src/app/auth/forgot-password/page.tsx`
  - `src/app/auth/reset-password/page.tsx`
  - `src/app/onboarding/page.tsx`
  - `src/app/profile/page.tsx`
  - `src/app/dashboard/page.tsx`

### 3. Wrap Your Application

Ensure your root layout (`src/app/layout.tsx`) is wrapped with the `AuthProvider`:

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Your app content */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Protect Routes

Use the `ProtectedRoute` component to protect routes that require authentication:

```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SecurePage() {
  return (
    <ProtectedRoute>
      {/* Your secure content */}
    </ProtectedRoute>
  );
}
```

## Testing Authentication

1. Start your development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Test the authentication flow:
   - Visit `/auth/signup` to create a new account
   - Complete the onboarding process
   - Sign out and sign back in via `/auth/login`
   - Test Google OAuth sign-in
   - Test password reset flow

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URIs in Google Cloud Console match those in Supabase and your application.

2. **CORS Issues**: Check that your site URL and redirect URLs are properly configured in Supabase.

3. **RLS Errors**: Verify that Row Level Security policies are correctly set up for the profiles table.

4. **Token Expiration**: Implement proper token refresh handling in your application.

## Security Considerations

- Always use HTTPS in production
- Implement proper error handling for authentication failures
- Consider adding rate limiting for login attempts
- Regularly audit your authentication logs
- Keep your Supabase and Google Cloud credentials secure 