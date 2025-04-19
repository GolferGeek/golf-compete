/**
 * Base API client utilities
 */

// Base API response interface
export interface ApiResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Default fetch options with auth headers
 */
const defaultFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for auth
};

/**
 * Fetch wrapper for API calls
 * - Adds default headers
 * - Handles auth token
 * - Combines options
 */
export async function fetchFromApi(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const mergedOptions: RequestInit = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...options.headers,
    },
  };

  // When providing body in options, ensure content-type is set
  if (options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']) {
    mergedOptions.headers = {
      ...mergedOptions.headers,
      'Content-Type': 'application/json',
    };
  }

  try {
    const response = await fetch(url, mergedOptions);
    
    // If response is 401 Unauthorized, could trigger auth refresh here
    if (response.status === 401) {
      console.warn('Unauthorized API request. User may need to re-authenticate.');
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Build a query string from an object of parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v.toString()));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  return queryParams.toString();
} 