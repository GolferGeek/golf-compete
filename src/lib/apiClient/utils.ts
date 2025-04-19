import { type PaginatedResponse } from '@/api/base';

/**
 * Standardized handler for API responses.
 * Checks for network errors and application errors in the JSON body.
 * @param response The raw Fetch API response.
 * @returns The data payload on success.
 * @throws An error with the message from the API or HTTP status on failure.
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
    let result: any;
    try {
        result = await response.json();
    } catch (e) {
        // Handle cases where response is not JSON (e.g., HTML error page)
        if (response.ok) {
             // Unexpected non-JSON success response? Unlikely but possible.
             console.warn('API response was OK but not valid JSON.');
             // Depending on T, might need to return something else or re-throw
             return {} as T; // Return empty object or handle differently
        } else {
            // Throw error based on HTTP status if JSON parsing fails
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
    }
    
    // Check for standard { status: 'error', error: { ... } } structure
    if (!response.ok || result.status === 'error') {
        const errorMessage = result.error?.message 
            || (typeof result.error === 'string' ? result.error : null) 
            || `HTTP error ${response.status}`;
        console.error('API Client Error:', result.error || errorMessage);
        throw new Error(errorMessage);
        // TODO: Consider custom error classes (ApiClientError) with code/details
    }
    
    // Check if the expected 'data' property exists for success
    if (result.status === 'success' && typeof result.data !== 'undefined') {
        return result.data as T;
    } else if (response.ok && typeof result.data === 'undefined' && typeof result.metadata !== 'undefined') {
        // Handle PaginatedResponse structure which has metadata alongside data
        // The API returns the whole PaginatedResponse structure inside 'data' field
        // Let's refine this based on actual API output for lists
        // Assuming the API returns { status: 'success', data: { data: [], metadata: {...} } }
        // OR { status: 'success', data: [], metadata: {...} } - needs consistency
        
        // Let's assume for now the API wrapper returns the *entire* PaginatedResponse object
        // as the `data` field for list endpoints handled by createSuccessApiResponse(paginatedResponse)
        return result.data as T; // If T is PaginatedResponse<U>, this works
    } else {
        // Handle unexpected success response format
        console.warn('API Client: Unexpected success response format', result);
        // Returning the raw result might be better than throwing here?
        // Or throw a specific format error.
        throw new Error('Unexpected API response format on success.');
    }
}

/**
 * Builds a query string from a parameters object.
 * @param params Key-value pairs for query parameters.
 * @returns A URL-encoded query string (without leading '?').
 */
export function buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            // Handle array values if needed (e.g., for IN clauses, though typically done in body)
            if (Array.isArray(value)) {
                value.forEach(v => query.append(key, String(v)));
            } else {
                query.append(key, String(value));
            }
        }
    }
    return query.toString();
} 