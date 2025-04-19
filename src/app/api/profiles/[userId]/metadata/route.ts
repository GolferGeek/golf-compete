import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Type validation schemas
const QuickNoteSchema = z.object({
  id: z.string(),
  note: z.string(),
  category: z.string(),
  created_at: z.string(),
});

const ProfileMetadataSchema = z.object({
  quick_notes: z.array(QuickNoteSchema).optional(),
}).and(z.record(z.unknown())); // Allow additional metadata fields

// GET /api/profiles/[userId]/metadata
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', params.userId)
      .single();

    if (error) {
      console.error('Error fetching profile metadata:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile?.metadata || {} });
  } catch (err) {
    console.error('Error in GET metadata:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/profiles/[userId]/metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    
    // Validate the metadata structure if it contains quick_notes
    if (body.quick_notes) {
      const result = ProfileMetadataSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid metadata format', details: result.error },
          { status: 400 }
        );
      }
    }

    // Fetch current metadata first
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', params.userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current metadata:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current metadata' },
        { status: 500 }
      );
    }

    // Merge new metadata with existing metadata
    const currentMetadata = profile?.metadata || {};
    const updatedMetadata = { ...currentMetadata, ...body };

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ metadata: updatedMetadata })
      .eq('id', params.userId);

    if (updateError) {
      console.error('Error updating profile metadata:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedMetadata });
  } catch (err) {
    console.error('Error in PATCH metadata:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 