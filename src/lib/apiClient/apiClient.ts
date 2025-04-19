import { ApiResponse } from '@/types/api';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.baseUrl + path;
    const headers = { ...this.defaultHeaders, ...options.headers };

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

  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(); 