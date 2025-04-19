import { ApiResponse } from '@/types/api';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

/**
 * Creates an API client with the specified configuration
 */
function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl || '';
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.defaultHeaders,
  };

  /**
   * Makes a request to the API
   */
  async function request<T>(
    method: string,
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = baseUrl + path;
    const headers = { ...defaultHeaders, ...options.headers };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: options.signal,
        credentials: 'include', // Include cookies for auth
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const responseData = isJson ? await response.json() : null;

      if (!response.ok) {
        return {
          error: {
            code: responseData?.code || 'API_ERROR',
            message: responseData?.message || 'An error occurred',
            status: response.status,
          },
        };
      }

      return { data: responseData };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          status: 0,
        },
      };
    }
  }

  return {
    /**
     * Make a GET request
     */
    get: <T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> =>
      request<T>('GET', path, undefined, options),

    /**
     * Make a POST request
     */
    post: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
      request<T>('POST', path, data, options),

    /**
     * Make a PUT request
     */
    put: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
      request<T>('PUT', path, data, options),

    /**
     * Make a PATCH request
     */
    patch: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
      request<T>('PATCH', path, data, options),

    /**
     * Make a DELETE request
     */
    delete: <T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> =>
      request<T>('DELETE', path, undefined, options),
  };
}

// Create and export a singleton instance
export const apiClient = createApiClient(); 