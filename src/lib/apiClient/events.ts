import { type Event, type EventParticipant } from '@/types/database';
import { type PaginatedResponse } from '@/api/base';
import { handleApiResponse, buildQueryString } from './utils';

interface ListEventsParams { /* Define params */ }

export async function fetchEventsList(params: ListEventsParams = {}): Promise<PaginatedResponse<Event>> {
    const queryString = buildQueryString(params);
    const response = await fetch(`/api/events${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<PaginatedResponse<Event>>(response);
}

export async function getEventById(eventId: string, includeParticipants: boolean = false): Promise<Event & { participants?: EventParticipant[] }> {
    const queryString = includeParticipants ? buildQueryString({ include_participants: true }) : '';
    const response = await fetch(`/api/events/${eventId}${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<Event & { participants?: EventParticipant[] }>(response);
}

// Add createEvent, updateEvent, deleteEvent, participant methods... 