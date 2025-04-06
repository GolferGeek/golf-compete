import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Create a Supabase client with the service role key for admin operations
const serviceClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { seriesId, userIds } = await request.json();

    if (!seriesId || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Check if any of these users are already participants
    const { data: existingParticipants, error: existingError } = await serviceClient
      .from('series_participants')
      .select('user_id')
      .eq('series_id', seriesId)
      .in('user_id', userIds);

    if (existingError) {
      console.error('Error checking existing participants:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing participants' },
        { status: 500 }
      );
    }

    const existingUserIds = existingParticipants?.map(p => p.user_id) || [];
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'User is already a participant'
        }))
      });
    }

    const participantsToAdd = newUserIds.map(userId => ({
      series_id: seriesId,
      user_id: userId,
      status: 'invited',
      role: 'participant',
      joined_at: new Date().toISOString()
    }));

    const { data, error } = await serviceClient
      .from('series_participants')
      .insert(participantsToAdd)
      .select();

    if (error) {
      console.error('Error adding participants:', error);
      return NextResponse.json(
        { error: `Failed to add participants: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: data?.map(p => p.user_id) || [],
      failed: existingUserIds.map(id => ({
        userId: id,
        error: 'User is already a participant'
      }))
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 