import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessApiResponse } from '@/lib/api/utils';

// This route helps debug OAuth configuration issues
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get request info
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    
    // Environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      requestOrigin: origin,
      headers: {
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin')
      }
    };
    
    // Supabase client
    const supabase = await createClient();
    
    // Get auth config if possible
    let authSettings: any = null;
    try {
      const { data, error } = await supabase
        .from('auth_settings')
        .select('*')
        .limit(1);
        
      if (!error && data) {
        authSettings = data;
      }
    } catch (e) {
      console.log('Could not fetch auth settings:', e);
    }
    
    // Return all environment and request info for debugging
    return createSuccessApiResponse({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      auth: {
        settings: authSettings,
        redirectURLs: {
          api: `${origin}/api/auth/callback`,
          app: `${origin}/auth/callback`,
          configuredSite: process.env.NEXT_PUBLIC_SITE_URL ? 
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback` : null
        },
        isLocal: origin.includes('localhost'),
        isProd: origin.includes('golfcompete'),
      },
      suggestion: process.env.NODE_ENV === 'development' && !origin.includes('localhost') ?
        "You appear to be in development but not using localhost - check your redirects" : null
    });
  } catch (error: any) {
    console.error('Error in environment check:', error);
    return createSuccessApiResponse({
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
      }
    });
  }
} 