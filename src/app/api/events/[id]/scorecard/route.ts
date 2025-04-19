import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const eventId = params.id;
    if (!eventId) {
        return createErrorApiResponse('Event ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    try {
        // Load event details
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select(`
                id,
                name,
                course_id,
                start_date,
                end_date,
                courses:course_id (
                    name,
                    city,
                    state
                )
            `)
            .eq('id', eventId)
            .single();

        if (eventError) throw eventError;
        if (!eventData) {
            return createErrorApiResponse('Event not found', 'NOT_FOUND', 404);
        }

        // Load course holes
        const { data: holesData, error: holesError } = await supabase
            .from('course_holes')
            .select(`
                hole_number,
                par
            `)
            .eq('course_id', eventData.course_id)
            .order('hole_number', { ascending: true });

        if (holesError) throw holesError;

        // Load rounds for this event
        const { data: roundsData, error: roundsError } = await supabase
            .from('rounds')
            .select(`
                id,
                profile_id,
                date_played,
                status,
                total_score,
                profiles:profile_id (
                    name,
                    first_name,
                    last_name
                )
            `)
            .eq('event_id', eventId);

        if (roundsError) throw roundsError;

        // Load hole scores for all rounds
        const roundIds = roundsData.map(r => r.id);
        const { data: scoresData, error: scoresError } = await supabase
            .from('hole_scores')
            .select(`
                id,
                round_id,
                hole_number,
                par,
                strokes,
                putts,
                fairway_hit,
                green_in_regulation,
                penalty_strokes
            `)
            .in('round_id', roundIds);

        if (scoresError) throw scoresError;

        return createSuccessApiResponse({
            event: {
                ...eventData,
                course_name: eventData.courses?.name || 'Unknown Course',
            },
            holes: holesData,
            rounds: roundsData.map(r => ({
                id: r.id,
                player_id: r.profile_id,
                player_name: r.profiles?.name || `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim() || 'Unknown Player',
                profile_id: r.profile_id,
                date: r.date_played,
                status: r.status || 'in_progress',
                total_score: r.total_score,
                total_to_par: null, // Calculated on client
                net_score: null // Calculated on client
            })),
            holeScores: scoresData
        });

    } catch (error: any) {
        console.error(`[API /events/${eventId}/scorecard GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch scorecard data', 'FETCH_SCORECARD_ERROR', 500);
    }
} 