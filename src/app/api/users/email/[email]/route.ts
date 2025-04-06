import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(
        { error: `Failed to fetch users: ${userError.message}` },
        { status: 500 }
      );
    }

    const user = userData.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json(
        { error: `Failed to delete user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Delete the user from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: `Failed to delete auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users/email/[email]:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 