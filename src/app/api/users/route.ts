import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createProfile, type CreateProfileData } from '@/lib/profileService';

export async function GET(request: Request) {
  try {
    console.log('Starting users API request');
    
    // Log environment variables (safely)
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Environment check:', { hasUrl, hasServiceKey });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const cookieStore = await cookies();
    console.log('Creating Supabase client...');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll: () => {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: (cookies) => {
            cookies.forEach((cookie) => {
              cookieStore.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options
              });
            });
          },
        },
      }
    );

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '100');
    const searchTerm = searchParams.get('search') || '';

    console.log('Request params:', { page, perPage, searchTerm });

    console.log('Fetching profiles...');
    // Get profiles with role and active status
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${profiles?.length || 0} profiles`);

    console.log('Fetching auth users...');
    // Get auth users data
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: `Failed to fetch auth users: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData) {
      console.error('No auth data returned');
      return NextResponse.json(
        { error: 'No auth data returned from Supabase' },
        { status: 500 }
      );
    }

    const authUsers = authData.users || [];
    console.log(`Successfully fetched ${authUsers.length} auth users`);

    // Merge the data
    const users = authUsers.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id) || {
        id: authUser.id,
        first_name: '',
        last_name: '',
        is_active: true,
        created_at: authUser.created_at,
        updated_at: null
      };

      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: authUser.last_sign_in_at,
        profile
      };
    });

    // Filter by search term if provided
    const filteredUsers = searchTerm 
      ? users.filter(user => 
          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.profile.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.profile.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.profile.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : users;

    console.log(`Returning ${filteredUsers.length} users`);
    return NextResponse.json({
      users: filteredUsers,
      page,
      perPage,
      total: filteredUsers.length
    });
  } catch (error) {
    console.error('Error in users API:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, profile } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!profile?.username || !profile?.first_name || !profile?.last_name) {
      return NextResponse.json(
        { error: 'Username, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Create the user and profile
    const profileData: CreateProfileData = {
      email,
      password,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_admin: profile.is_admin,
      handicap: profile.handicap,
      multiple_clubs_sets: profile.multiple_clubs_sets
    };

    const user = await createProfile(profileData);

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
} 