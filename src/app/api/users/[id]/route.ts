import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting single user API request for ID:', params.id);
    
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

    console.log('Fetching user profile...');
    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: `Failed to fetch profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log('Fetching auth user...');
    // Get auth user data
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(
      params.id
    );

    if (authError) {
      console.error('Error fetching auth user:', authError);
      return NextResponse.json(
        { error: `Failed to fetch auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!user) {
      console.error('No auth user found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge the data
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: profile?.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      profile: profile || {
        id: user.id,
        first_name: '',
        last_name: '',
        is_active: true,
        created_at: user.created_at,
        updated_at: null
      }
    };

    console.log('Returning user data');
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting user update request for ID:', params.id);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const cookieStore = await cookies();
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

    const data = await request.json();
    console.log('Updating user profile with data:', data);

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        ...data,
        id: params.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: `Failed to update profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Get updated auth user data
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(
      params.id
    );

    if (authError) {
      console.error('Error fetching updated auth user:', authError);
      return NextResponse.json(
        { error: `Failed to fetch updated user: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!user) {
      console.error('No auth user found after update');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge and return the updated data
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: profile.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      profile
    };

    console.log('Returning updated user data');
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in user update API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // First delete the user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json(
        { error: `Failed to delete user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Then delete the user from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: `Failed to delete auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 