import { type PaginatedResponse } from '@/api/base';
import { ApiResponse, ApiError } from '@/types/api';

/**
 * Standardized handler for API responses.
 * Checks for network errors and application errors in the JSON body.
 * @param response The raw Fetch API response.
 * @returns The data payload on success.
 * @throws An error with the message from the API or HTTP status on failure.
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
    }
    return response.json();
}

/**
 * Builds a query string from a parameters object.
 * @param params Key-value pairs for query parameters.
 * @returns A URL-encoded query string (without leading '?').
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            queryParams.append(key, String(value));
        }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

export function handleApiError(error: any): ApiResponse<any> {
    console.error('API Error:', error);
    return {
        error: {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            status: 500
        }
    };
} 