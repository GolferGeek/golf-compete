import { type AuthProfile } from '@/services/internal/AuthService';
import { handleApiResponse } from './utils';

// Define interfaces for payload/response types if needed
interface LoginCredentials { email: string; password: string; }
interface LoginResponse { userId: string; }
interface RegisterCredentials extends LoginCredentials { /* Add optional profile fields */ }
interface RegisterResponse { userId: string; message: string; }
interface SessionResponse {
    user: any | null; // Replace 'any' with Supabase User type if available client-side
    session: any | null; // Replace 'any' with Supabase Session type
    profile: AuthProfile | null;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return handleApiResponse<LoginResponse>(response);
}

export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
     const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    // 201 Created status
    return handleApiResponse<RegisterResponse>(response);
}

export async function logout(): Promise<{ message: string }> {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    return handleApiResponse<{ message: string }>(response);
}

export async function getSession(): Promise<SessionResponse | null> {
    const response = await fetch('/api/auth/session');
    // This endpoint returns null data on success if no session
    const result = await response.json();
    if (!response.ok || result.status === 'error') {
         const errorMessage = result.error?.message || `HTTP error ${response.status}`;
         console.error('API Client Error getting session:', result.error || errorMessage);
         throw new Error(errorMessage);
    }
    return result.data as SessionResponse | null;
}

export async function resetPassword(email: string): Promise<{ message: string }> {
    const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return handleApiResponse<{ message: string }>(response);
}

export async function updatePassword(password: string): Promise<{ message: string }> {
    const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    return handleApiResponse<{ message: string }>(response);
}

// OAuth methods
export async function initiateOAuthSignIn(provider: string): Promise<void> {
    try {
        // Ensure we're using the current domain for the callback
        const origin = window.location.origin;
        const callbackUrl = `${origin}/api/auth/callback`;
        
        console.log(`Initiating OAuth sign-in with ${provider}`, {
            origin,
            callbackUrl,
            fullUrl: `${origin}/api/auth/generate-oauth-url`
        });
        
        // Generate the OAuth URL through our secure API
        const response = await fetch(`${origin}/api/auth/generate-oauth-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                // Use the callback route in our API with current origin
                redirectTo: callbackUrl
            })
        });
        
        const result = await handleApiResponse<{ url: string }>(response);
        
        if (!result.url) {
            console.error('No OAuth URL returned from API');
            throw new Error('Failed to generate authentication URL');
        }
        
        console.log(`Redirecting to OAuth URL: ${result.url}`);
        
        // Redirect the browser to the OAuth provider
        window.location.href = result.url;
    } catch (error) {
        console.error('OAuth sign-in error:', error);
        throw error;
    }
}

// Google specific helper for convenience
export async function signInWithGoogle(): Promise<void> {
    try {
        // Get the origin for proper redirect URL formation
        const origin = window.location.origin;
        
        console.log('Starting Google sign-in from origin:', origin);
        
        // Clear any existing auth state
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase.auth.token');
        
        // Use the dedicated Google auth endpoint
        console.log('Redirecting to Google auth endpoint');
        
        // Directly go to the Google auth endpoint
        window.location.href = `${origin}/api/auth/google`;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
}

// Add resetPassword, updatePassword, oauth methods... 