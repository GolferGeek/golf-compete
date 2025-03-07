import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Update event status to in_progress
    const { error } = await supabaseClient
      .from('events')
      .update({ status: 'in_progress' })
      .eq('id', eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting event:', error);
    return NextResponse.json(
      { error: 'Failed to start event' },
      { status: 500 }
    );
  }
} 