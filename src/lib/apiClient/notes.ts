import { type UserNote } from '@/types/database';
import { type PaginatedResponse } from '@/services/base';
import { handleApiResponse, buildQueryString } from './utils';

interface ListNotesParams { /* Define params */ }

export async function fetchNotesList(params: ListNotesParams = {}): Promise<PaginatedResponse<UserNote>> {
    const queryString = buildQueryString(params);
    const response = await fetch(`/api/notes${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<PaginatedResponse<UserNote>>(response);
}

export async function getNoteById(noteId: string): Promise<UserNote> {
    const response = await fetch(`/api/notes/${noteId}`);
    return handleApiResponse<UserNote>(response);
}

// Add createNote, updateNote, deleteNote methods... 