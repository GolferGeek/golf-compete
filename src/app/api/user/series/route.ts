import { type NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { createClient } from '@/lib/supabase/server'; // Need this
import SeriesDbService from '@/api/internal/database/SeriesDbService'; // Import the new SeriesDbService
import { keysToCamelCase } from '@/api/base'; // Import utility if needed for consistency

// Define the expected shape of the joined data
// Adapt this based on your actual table columns and desired output
interface UserSeriesData {
  // From series_participants
  participantId: string;
  userId: string; // Redundant if only fetching for auth user, but useful for join key
  seriesId: string;
  role: string;
  participantStatus: string;
  joinedAt: string;
  // From series
  seriesName: string;
  seriesDescription?: string;
  seriesStartDate: string;
  seriesEndDate: string;
  seriesStatus: string;
  seriesCreatedBy?: string;
}

/**
 * @swagger
 * /api/user/series:
 *   get:
 *     summary: Retrieve series the authenticated user is participating in
 *     description: Fetches a list of series joined by the currently logged-in user.
 *     tags:
 *       - User
 *       - Series
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's series participations.
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
 *                     $ref: '#/components/schemas/UserSeriesData' # Define this schema based on UserSeriesData interface
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
const getUserSeriesHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const { user } = auth;
  
  // Create client and instantiate the specific SeriesDbService
  const supabase = await createClient();
  const seriesDbService = new SeriesDbService(supabase);

  try {
    // Call the method from SeriesDbService
    const seriesResponse = await seriesDbService.fetchUserSeriesParticipations(user.id);

    if (seriesResponse.error) {
      // Let withAuth handle ServiceError instances
      throw seriesResponse.error;
    }

    // Data is already flattened and potentially camelCased by the service method
    return createSuccessApiResponse(seriesResponse.data || []);

  } catch (error) {
    // Log specific errors here if needed
    console.error('[API /user/series] Failed to fetch user series:', error);
    // Allow withAuth to handle the error response formatting
    throw error; 
  }
};

export const GET = withAuth(getUserSeriesHandler); 