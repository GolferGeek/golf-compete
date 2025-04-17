import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import AuthService from '@/services/internal/AuthService';

// Define allowed providers
const ALLOWED_PROVIDERS = ['google', 'github', 'facebook'] as const;
type AllowedProvider = typeof ALLOWED_PROVIDERS[number];

// Function to check if a string is a valid provider
function isValidProvider(provider: string): provider is AllowedProvider {
  return ALLOWED_PROVIDERS.includes(provider as AllowedProvider);
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log('[API /auth/generate-oauth-url] Starting OAuth URL generation');
    
    // Get provider from query parameter
    const provider = request.nextUrl.searchParams.get('provider');
    
    console.log('[API /auth/generate-oauth-url] Provider from query:', provider);
    
    if (!provider) {
      console.error('[API /auth/generate-oauth-url] Missing provider parameter');
      return createErrorApiResponse('Missing OAuth provider', 'MISSING_PROVIDER', 400);
    }
    
    // Check if it's a valid provider
    if (!isValidProvider(provider)) {
      console.error('[API /auth/generate-oauth-url] Invalid provider:', provider);
      return createErrorApiResponse('Invalid OAuth provider', 'INVALID_PROVIDER', 400);
    }

    // Use the current request origin for the callback
    const callbackUrl = `${request.nextUrl.origin}/api/auth/callback`;
    console.log(`[API /auth/generate-oauth-url] Using callback URL: ${callbackUrl}`);
    
    // Add timestamp to prevent caching issues
    const queryParams = {
      timestamp: Date.now().toString(),
      prompt: 'select_account',
      access_type: 'offline'
    };
    
    // Use AuthService to generate the OAuth URL
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    
    console.log(`[API /auth/generate-oauth-url] Generating OAuth URL through AuthService`);
    const { data, error } = await authService.signInWithOAuth({
      provider: provider as AllowedProvider,
      redirectTo: callbackUrl,
      scopes: 'email profile'
    });
    
    if (error || !data?.url) {
      console.error(`[API /auth/generate-oauth-url] Error generating OAuth URL:`, error);
      return createErrorApiResponse(
        error?.message || 'Failed to generate OAuth URL',
        'OAUTH_URL_ERROR',
        500
      );
    }
    
    console.log(`[API /auth/generate-oauth-url] Generated URL: ${data.url}`);
    
    // Return the URL in the response
    return createSuccessApiResponse({ url: data.url });
  } catch (error: any) {
    console.error(`[API /auth/generate-oauth-url] Unexpected error:`, error);
    return createErrorApiResponse(
      error.message || `An unexpected error occurred during OAuth URL generation`,
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 