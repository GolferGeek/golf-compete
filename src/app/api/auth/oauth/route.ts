import { NextRequest } from 'next/server';
import { createErrorApiResponse } from '@/lib/api/utils';

// Define allowed providers
const ALLOWED_PROVIDERS = ['google', 'github', 'facebook'] as const;
type AllowedProvider = typeof ALLOWED_PROVIDERS[number];

// Function to check if a string is a valid provider
function isValidProvider(provider: string): provider is AllowedProvider {
  return ALLOWED_PROVIDERS.includes(provider as AllowedProvider);
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log('[API /auth/oauth] Starting OAuth flow');
    
    // Get provider from query parameter
    const provider = request.nextUrl.searchParams.get('provider');
    
    console.log('[API /auth/oauth] Provider from query:', provider);
    
    if (!provider) {
      console.error('[API /auth/oauth] Missing provider parameter');
      return createErrorApiResponse('Missing OAuth provider', 'MISSING_PROVIDER', 400);
    }
    
    // Check if it's a valid provider
    if (!isValidProvider(provider)) {
      console.error('[API /auth/oauth] Invalid provider:', provider);
      return createErrorApiResponse('Invalid OAuth provider', 'INVALID_PROVIDER', 400);
    }

    // Call the generate-oauth-url API endpoint to get the OAuth URL
    const oauthUrlEndpoint = `${request.nextUrl.origin}/api/auth/generate-oauth-url?provider=${provider}`;
    console.log(`[API /auth/oauth] Fetching OAuth URL from: ${oauthUrlEndpoint}`);
    
    const response = await fetch(oauthUrlEndpoint);
    const result = await response.json();
    
    if (!response.ok || !result.data?.url) {
      console.error(`[API /auth/oauth] Error fetching OAuth URL:`, result.error);
      return createErrorApiResponse(
        result.error?.message || 'Failed to generate OAuth URL',
        'OAUTH_URL_ERROR',
        500
      );
    }
    
    console.log(`[API /auth/oauth] Received URL: ${result.data.url}`);
    
    // Use 303 redirect for after a GET request
    return new Response(null, {
      status: 303,
      headers: {
        'Location': result.data.url
      }
    });
  } catch (error: any) {
    console.error(`[API /auth/oauth] Unexpected error:`, error);
    return createErrorApiResponse(
      error.message || `An unexpected error occurred during OAuth sign-in`,
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
}
