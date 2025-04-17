import { type Series, type SeriesParticipant } from '@/types/database';
import { type PaginatedResponse } from '@/services/base'; // Need for list response type
import { handleApiResponse, buildQueryString } from './utils'; // Import helpers

// Interface for List Series parameters (matching API schema)
interface ListSeriesParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  status?: string;
  startDateAfter?: string;
  endDateBefore?: string;
  search?: string;
}

/**
 * Fetches a list of series with optional filters and pagination.
 */
export async function fetchSeriesList(params: ListSeriesParams = {}): Promise<PaginatedResponse<Series>> {
    const queryString = buildQueryString(params);
    const url = `/api/series${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    // Use handleApiResponse - assuming it correctly handles the PaginatedResponse structure now
    // If the API returns the PaginatedResponse directly in `data`, this works.
    // If API returns { data: [], metadata: ... }, handleApiResponse needs adjustment or specialized handler here.
    return handleApiResponse<PaginatedResponse<Series>>(response);
}

/**
 * Fetches a single series by its ID.
 */
export async function getSeriesById(seriesId: string, includeParticipants: boolean = false): Promise<Series & { participants?: SeriesParticipant[] }> {
    const queryString = includeParticipants ? buildQueryString({ include_participants: true }) : '';
    const url = `/api/series/${seriesId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleApiResponse<Series & { participants?: SeriesParticipant[] }>(response);
}

/**
 * Creates a new series.
 */
export async function createSeries(seriesData: Omit<Series, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Series> {
    const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesData),
    });
    return handleApiResponse<Series>(response);
}

/**
 * Updates an existing series.
 */
export async function updateSeries(seriesId: string, updateData: Partial<Omit<Series, 'id' | 'created_by' | 'created_at' | 'updated_at'> >): Promise<Series> {
     const response = await fetch(`/api/series/${seriesId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    return handleApiResponse<Series>(response);
}

/**
 * Deletes a series.
 */
export async function deleteSeries(seriesId: string): Promise<void> {
    const response = await fetch(`/api/series/${seriesId}`, {
        method: 'DELETE',
    });
    // DELETE returns 204 No Content on success, handle differently
    if (!response.ok) {
        // Try parsing error for details
        try {
            const result = await response.json();
            const errorMessage = result.error?.message || `HTTP error ${response.status}`;
            console.error('API Client Error deleting series:', result.error || errorMessage);
            throw new Error(errorMessage);
        } catch (parseError) {
            // If no JSON body, throw generic error
             throw new Error(`HTTP error ${response.status}`);
        }
    }
    // No data expected on successful delete
}

// --- Participant Methods --- 

/**
 * Fetches participants for a specific series.
 */
export async function getSeriesParticipants(seriesId: string): Promise<SeriesParticipant[]> {
    const response = await fetch(`/api/series/${seriesId}/participants`);
    return handleApiResponse<SeriesParticipant[]>(response);
}

/**
 * Adds a participant to a series.
 */
export async function addSeriesParticipant(seriesId: string, participantData: Omit<SeriesParticipant, 'id' | 'series_id' | 'joined_at'>): Promise<SeriesParticipant> {
    const response = await fetch(`/api/series/${seriesId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
    });
    return handleApiResponse<SeriesParticipant>(response);
}

/**
 * Updates a series participant.
 */
export async function updateSeriesParticipant(seriesId: string, participantId: string, updateData: Partial<Omit<SeriesParticipant, 'id' | 'user_id' | 'series_id' | 'joined_at'>>): Promise<SeriesParticipant> {
    const response = await fetch(`/api/series/${seriesId}/participants/${participantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    return handleApiResponse<SeriesParticipant>(response);
}

/**
 * Removes a participant from a series.
 */
export async function removeSeriesParticipant(seriesId: string, participantId: string): Promise<void> {
    const response = await fetch(`/api/series/${seriesId}/participants/${participantId}`, {
        method: 'DELETE',
    });
     // Handle 204 No Content
     if (!response.ok) {
        try {
            const result = await response.json();
            const errorMessage = result.error?.message || `HTTP error ${response.status}`;
            console.error('API Client Error removing participant:', result.error || errorMessage);
            throw new Error(errorMessage);
        } catch (parseError) {
             throw new Error(`HTTP error ${response.status}`);
        }
    }
} 