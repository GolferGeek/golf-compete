import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { 
  BaseService, 
  LogLevel,
  ServiceConfig,
  ServiceResponse,
  AuthError,
  ErrorCodes,
  createSuccessResponse,
  createErrorResponse
} from '../../base';

// Define AuthProfile type directly
export interface AuthProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  handicap: number | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  multiple_clubs_sets: boolean | null;
}

export interface AuthUser {
  user: User | null;
  profile: AuthProfile | null;
  session: Session | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface ResetPasswordParams {
  email: string;
  redirectTo?: string;
}

export interface UpdatePasswordParams {
  password: string;
}

export interface OAuthProvider {
  provider: 'google' | 'facebook' | 'twitter' | 'github';
  redirectTo?: string;
  scopes?: string;
}

export interface SessionResponse extends ServiceResponse<{
  session: Session | null;
  user: User | null;
}> {}

export interface ProfileResponse extends ServiceResponse<AuthProfile> {}

export interface AuthResponse extends ServiceResponse<AuthUser> {}

/**
 * Auth Service for handling all authentication-related functionality
 */
class AuthService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'AuthService initialized');
  }

  /**
   * Get the current session
   */
  public async getSession(): Promise<SessionResponse> {
    try {
      // First get the user data securely
      const { data: userData, error: userError } = await this.client.auth.getUser();
      
      if (userError) {
        // Handle common "Missing auth session" error more gracefully
        if (userError.message.includes('missing') || userError.message.includes('session')) {
          console.warn('Auth session missing or invalid. Returning null session.');
          return createSuccessResponse({ session: null, user: null });
        }
        
        throw new AuthError(
          userError.message,
          ErrorCodes.AUTH_USER_NOT_FOUND,
          userError
        );
      }
      
      // Then get the session data
      const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
      
      if (sessionError) {
        // Handle common session errors more gracefully
        if (sessionError.message.includes('missing') || sessionError.message.includes('session') || 
            sessionError.message.includes('expired')) {
          console.warn('Session missing, invalid or expired. Returning null session.');
          return createSuccessResponse({ session: null, user: userData.user });
        }
        
        throw new AuthError(
          sessionError.message,
          ErrorCodes.AUTH_SESSION_EXPIRED,
          sessionError
        );
      }
      
      // Return the authenticated user and session
      return createSuccessResponse({
        session: sessionData.session,
        user: userData.user
      });
    } catch (error) {
      return this.handleAuthError(error, 'Failed to get session');
    }
  }

  /**
   * Get the current user
   */
  public async getCurrentUser(): Promise<ServiceResponse<User | null>> {
    try {
      const { data, error } = await this.client.auth.getUser();
      
      if (error) {
        // Handle common "Missing auth session" error more gracefully
        if (error.message.includes('missing') || error.message.includes('session')) {
          console.warn('Auth session missing or invalid. Returning null user.');
          return createSuccessResponse(null);
        }
        
        throw new AuthError(
          error.message,
          ErrorCodes.AUTH_USER_NOT_FOUND,
          error
        );
      }
      
      return createSuccessResponse(data.user);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to get current user');
    }
  }

  /**
   * Sign in with email and password
   */
  public async signInWithEmail(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;
      
      // Validate input
      if (!email || !password) {
        throw new AuthError('Email and password are required', ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }
      
      // Sign in with Supabase
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new AuthError(
          error.message,
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          error
        );
      }
      
      // Get user profile
      const profile = await this.getUserProfile(data.user?.id);
      
      return createSuccessResponse({
        user: data.user,
        session: data.session,
        profile: profile.data
      });
    } catch (error) {
      return this.handleAuthError(error, 'Failed to sign in with email');
    }
  }

  /**
   * Sign up with email and password
   */
  public async signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { email, password, first_name, last_name, username } = credentials;
      
      // Validate input
      if (!email || !password) {
        throw new AuthError('Email and password are required', ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }
      
      // Sign up with Supabase
      const { data, error } = await this.withRetry(() => this.client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window?.location?.origin || ''}/auth/callback`
        }
      }));
      
      if (error) {
        throw new AuthError(
          error.message,
          ErrorCodes.AUTH_EMAIL_IN_USE,
          error
        );
      }
      
      // Create user profile if registration was successful and returned a user
      if (data.user && !data.user.identities?.some(i => i.provider === 'email')) {
        // This means the email is already registered
        throw new AuthError('Email already in use', ErrorCodes.AUTH_EMAIL_IN_USE);
      }
      
      let profile: AuthProfile | null = null;
      
      if (data.user) {
        // Create profile
        const profileData: Partial<AuthProfile> = {
          id: data.user.id,
          first_name,
          last_name,
          username,
          created_at: new Date().toISOString()
        };
        
        await this.createUserProfile(profileData);
        
        // Get the newly created profile
        const profileResponse = await this.getUserProfile(data.user.id);
        profile = profileResponse.data;
      }
      
      return createSuccessResponse({
        user: data.user,
        session: data.session,
        profile
      });
    } catch (error) {
      return this.handleAuthError(error, 'Failed to sign up with email');
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<ServiceResponse<null>> {
    try {
      const { error } = await this.client.auth.signOut();
      
      if (error) {
        throw new AuthError(error.message, 'auth/sign-out-error', error);
      }
      
      return createSuccessResponse(null);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to sign out');
    }
  }

  /**
   * Reset password with email
   */
  public async resetPassword(params: ResetPasswordParams): Promise<ServiceResponse<null>> {
    try {
      const { email, redirectTo } = params;
      
      // Validate input
      if (!email) {
        throw new AuthError('Email is required', ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }
      
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${window?.location?.origin || ''}/auth/reset-password`
      });
      
      if (error) {
        throw new AuthError(error.message, ErrorCodes.AUTH_USER_NOT_FOUND, error);
      }
      
      return createSuccessResponse(null);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to reset password');
    }
  }

  /**
   * Update password
   */
  public async updatePassword(params: UpdatePasswordParams): Promise<ServiceResponse<User | null>> {
    try {
      const { password } = params;
      
      // Validate input
      if (!password) {
        throw new AuthError('Password is required', ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }
      
      const { data, error } = await this.client.auth.updateUser({
        password
      });
      
      if (error) {
        throw new AuthError(error.message, ErrorCodes.AUTH_WEAK_PASSWORD, error);
      }
      
      return createSuccessResponse(data.user);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to update password');
    }
  }

  /**
   * Sign in with OAuth provider
   */
  public async signInWithOAuth(params: OAuthProvider): Promise<ServiceResponse<{ url: string } | null>> {
    try {
      const { provider, redirectTo, scopes } = params;
      
      console.log(`[AuthService] Starting OAuth sign-in for ${provider}`);
      console.log(`[AuthService] Original redirect URL: ${redirectTo}`);
      
      // Ensure we're using localhost in development
      let finalRedirectTo = redirectTo;
      if (process.env.NODE_ENV === 'development') {
        // Force localhost URL
        if (finalRedirectTo?.includes('golfcompete.com') || finalRedirectTo?.includes('golfcompete.app')) {
          finalRedirectTo = finalRedirectTo.replace(
            /(https?:\/\/)?(www\.)?(golfcompete\.com|golfcompete\.app)/g, 
            'http://localhost:3000'
          );
          console.log(`[AuthService] Forced redirect URL to: ${finalRedirectTo}`);
        }
      }
      
      // Construct query params to prevent unwanted redirects
      const queryParams: Record<string, string> = {
        prompt: 'select_account', // Always prompt for account selection
        access_type: 'offline'
      };
      
      // In development, add additional parameters to prevent domain switching
      if (process.env.NODE_ENV === 'development') {
        // Add timestamp to prevent caching issues
        queryParams.ts = Date.now().toString();
        // Add development flag to help track origin
        queryParams.env = 'development';
      }
      
      console.log(`[AuthService] Final redirect URL: ${finalRedirectTo}`);
      console.log(`[AuthService] Using query params:`, queryParams);
      
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: finalRedirectTo || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          scopes,
          queryParams,
          skipBrowserRedirect: false
        }
      });
      
      console.log(`[AuthService] OAuth response:`, {
        success: !error,
        errorMessage: error?.message,
        hasData: !!data,
        hasUrl: !!data?.url,
      });
      
      if (error) {
        console.error(`[AuthService] OAuth error for ${provider}:`, error);
        throw new AuthError(
          error.message,
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          error
        );
      }
      
      // Add a local development warning parameter to the URL in development
      let finalUrl = data.url;
      if (process.env.NODE_ENV === 'development' && finalUrl) {
        // Parse the URL
        const url = new URL(finalUrl);
        // Add a development flag parameter
        url.searchParams.append('dev_mode', 'true');
        // Convert back to string
        finalUrl = url.toString();
        console.log(`[AuthService] Modified OAuth URL with dev flag: ${finalUrl}`);
      }
      
      // Return the OAuth URL that was generated
      return createSuccessResponse({ url: finalUrl });
    } catch (error) {
      console.error(`[AuthService] Failed to sign in with OAuth:`, error);
      return this.handleAuthError(error, 'Failed to sign in with OAuth');
    }
  }

  /**
   * Get user profile by id
   */
  public async getUserProfile(userId?: string): Promise<ProfileResponse> {
    try {
      if (!userId) {
        const userResponse = await this.getCurrentUser();
        userId = userResponse.data?.id;
        
        if (!userId) {
          throw new AuthError('User not authenticated', ErrorCodes.AUTH_USER_NOT_FOUND);
        }
      }
      
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw new AuthError(
          error.message,
          ErrorCodes.DB_NOT_FOUND,
          error
        );
      }
      
      return createSuccessResponse(data as AuthProfile);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to get user profile');
    }
  }

  /**
   * Create user profile
   */
  private async createUserProfile(profile: Partial<AuthProfile>): Promise<ProfileResponse> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .insert(profile)
        .select('*')
        .single();
      
      if (error) {
        throw new AuthError(
          error.message,
          ErrorCodes.DB_CONSTRAINT_VIOLATION,
          error
        );
      }
      
      return createSuccessResponse(data as AuthProfile);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to create user profile');
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(userId: string, profile: Partial<AuthProfile>): Promise<ProfileResponse> {
    try {
      // Ensure we're not trying to update the ID
      delete profile.id;
      
      const { data, error } = await this.client
        .from('profiles')
        .update(profile)
        .eq('id', userId)
        .select('*')
        .single();
      
      if (error) {
        throw new AuthError(
          error.message,
          ErrorCodes.DB_CONSTRAINT_VIOLATION,
          error
        );
      }
      
      return createSuccessResponse(data as AuthProfile);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to update user profile');
    }
  }

  /**
   * Check if user is admin
   */
  public async isUserAdmin(userId?: string): Promise<ServiceResponse<boolean>> {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      if (userProfile.error) {
        throw userProfile.error;
      }
      
      return createSuccessResponse(!!userProfile.data?.is_admin);
    } catch (error) {
      return this.handleAuthError(error, 'Failed to check user admin status');
    }
  }

  /**
   * Handle auth-specific errors
   */
  private handleAuthError<T>(error: any, message: string): ServiceResponse<T> {
    this.log(LogLevel.ERROR, message, { error });
    
    // Convert to AuthError if it's not already
    const authError = error instanceof AuthError
      ? error
      : new AuthError(
          error.message || message,
          error.code || ErrorCodes.AUTH_INVALID_CREDENTIALS,
          error
        );
    
    return createErrorResponse<T>(authError);
  }
}

export default AuthService; 