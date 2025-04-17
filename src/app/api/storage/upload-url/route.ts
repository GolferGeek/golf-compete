import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import StorageService from '@/services/internal/StorageService';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/services/base';

// Schema for requesting an upload URL
const uploadUrlSchema = z.object({
  bucketName: z.string().min(1, { message: 'Bucket name is required' }),
  filePath: z.string().min(1, { message: 'File path is required' }), 
  // Add content type if needed for client-side upload headers
  // contentType: z.string().optional(), 
  upsert: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /api/storage/upload-url:
 *   post:
 *     summary: Get a signed URL for file upload
 *     description: Generates a pre-signed URL that allows the client to upload a file directly to storage.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bucketName, filePath]
 *             properties:
 *               bucketName: { type: string, example: "avatars" }
 *               filePath: { type: string, example: "user-uuid/profile.jpg" }
 *               upsert: { type: boolean, default: false }
 *     responses:
 *       200: { description: Signed URL generated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (e.g., path not allowed) }
 *       500: { description: Internal server error }
 */
const getUploadUrlHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, uploadUrlSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    const { bucketName, filePath, upsert } = validationResult;
    const userId = auth.user.id;

    // **Authorization Check:** VERY IMPORTANT!
    // Ensure the user is allowed to upload to this specific bucket/path.
    // Example: Allow user to upload only to their own folder within a bucket.
    // This logic needs to be implemented based on your rules.
    const allowedPathPrefix = `user-${userId}/`; // Example prefix
    if (!filePath.startsWith(allowedPathPrefix)) {
        // More specific checks might be needed based on bucket/resource type
        console.warn(`User ${userId} tried to upload to forbidden path: ${bucketName}/${filePath}`);
        return createErrorApiResponse('Forbidden: Invalid upload path', 'FORBIDDEN', 403);
    }
    // TODO: Add checks for allowed bucket names if necessary.

    const supabase = await createClient();
    const storageService = new StorageService(supabase);

    try {
        const response = await storageService.createSignedUploadUrl(
            bucketName, 
            filePath, 
            { upsert } // Pass only allowed options
        );

        if (response.error) throw response.error;
        
        // Return the signed URL, path, and token needed for upload
        return createSuccessApiResponse(response.data);

    } catch (error: any) {
        console.error(`[API /storage/upload-url POST] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 500); // Or map specific storage errors
        }
        return createErrorApiResponse('Failed to generate upload URL', 'UPLOAD_URL_ERROR', 500);
    }
};

export const POST = withAuth(getUploadUrlHandler); 