import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { createClient } from '@/lib/supabase/server';
import DatabaseService from '@/services/internal/DatabaseService';

// Define the expected shape of the joined data
// Adapt this based on your actual table columns and desired output
interface UserEventData {
  // From event_participants
  participantId: string;
  userId: string;
  eventId: string;
  participantStatus: string;
  registrationDate: string;
  // From events
  eventName: string;
  eventDescription?: string;
  eventDate: string;
  eventStatus: string;
  courseId?: string;
  // Maybe add course name via another join?
  // Include participant-specific event fields if they exist on event_participants
  teeTime?: string; // Example from schema definition in dashboard
  startingHole?: number;
  groupNumber?: number;
  handicapIndex?: number;
}

/**
 * @swagger
 * /api/user/events:
 *   get:
 *     summary: Retrieve events the authenticated user is participating in
 *     description: Fetches a list of events joined by the currently logged-in user.
 *     tags:
 *       - User
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's event participations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserEventData' # Define this schema based on UserEventData interface
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getUserEventsHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const { user } = auth;
  
  // Await client creation and instantiate service
  const supabase = await createClient();
  const dbService = new DatabaseService(supabase);

  try {
    // Call the dedicated service method
    const eventsResponse = await dbService.fetchUserEventParticipations(user.id);

    if (eventsResponse.error) {
      throw eventsResponse.error;
    }

    return createSuccessApiResponse(eventsResponse.data || []);

  } catch (error) {
    console.error('[API /user/events] Failed to fetch user events:', error);
    throw error; 
  }
};

export const GET = withAuth(getUserEventsHandler); 