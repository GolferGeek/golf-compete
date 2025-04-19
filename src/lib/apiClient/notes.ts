// Define ApiResponse interface here instead of importing it
export interface ApiResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

import { type UserNote } from '@/types/database';

/**
 * Data transfer object for Note entities
 */
export interface NoteDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Fields for relationships
  relatedResourceId?: string;
  relatedResourceType?: string;
  // Fields for metadata storage
  metadata?: {
    tags?: string[];
    holeNumber?: number;
    [key: string]: any;
  };
}

/**
 * Parameters for querying notes
 */
export interface NotesQueryParams {
  userId?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  // Fields for filtering by relationships
  roundId?: string;
  category?: string | string[];
  search?: string;
}

/**
 * Payload for creating a new note
 */
export interface CreateNotePayload {
  title?: string;
  content: string;
  // Legacy compatibility
  note_text?: string;
  // Fields for relationships
  category?: string;
  round_id?: string;
  hole_number?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Payload for updating an existing note
 */
export interface UpdateNotePayload {
  title?: string;
  content?: string;
  // Legacy compatibility
  note_text?: string;
  // Fields for relationships
  category?: string;
  round_id?: string;
  hole_number?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Response containing an array of notes
 */
export interface NotesApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    notes: NoteDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single note
 */
export interface NoteApiResponse extends ApiResponse {
  success: boolean;
  data?: NoteDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response for delete operations
 */
export interface DeleteNotesResponse extends ApiResponse {
  success: boolean;
  data?: {
    deleted: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Convert database note to DTO
 */
function mapNoteToDto(note: UserNote): NoteDto {
  return {
    id: note.id,
    userId: note.user_id,
    content: note.content,
    title: '', // Default title if not provided
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    relatedResourceId: note.related_resource_id,
    relatedResourceType: note.related_resource_type
  };
}

/**
 * Helper function to handle fetch responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    console.error('API request failed:', errorData);
    throw new Error(errorData.message || `HTTP error ${response.status}`);
  }
  return await response.json();
}

/**
 * API client for notes operations
 */
export const NotesApiClient = {
  /**
   * Fetch all notes for the current user with optional filters
   */
  async getUserNotes(params: NotesQueryParams = {}): Promise<NotesApiResponse> {
    try {
      // Convert params to query string
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
      
      const queryString = queryParams.toString();
      const endpoint = `/api/notes${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch notes:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch notes',
            code: 'FETCH_NOTES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching notes',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch a single note by ID
   */
  async getNoteById(noteId: string): Promise<NoteApiResponse> {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch note with ID ${noteId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch note with ID ${noteId}`,
            code: 'FETCH_NOTE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.note
      };
    } catch (error) {
      console.error(`Error fetching note with ID ${noteId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the note',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new note
   */
  async createNote(payload: CreateNotePayload): Promise<NoteApiResponse> {
    try {
      // Handle legacy note_text field
      const transformedPayload = { ...payload };
      if (payload.note_text && !payload.content) {
        transformedPayload.content = payload.note_text;
      }
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(transformedPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create note:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to create note',
            code: 'CREATE_NOTE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.note
      };
    } catch (error) {
      console.error('Error creating note:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the note',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, payload: UpdateNotePayload): Promise<NoteApiResponse> {
    try {
      // Handle legacy note_text field
      const transformedPayload = { ...payload };
      if (payload.note_text && !payload.content) {
        transformedPayload.content = payload.note_text;
      }
      
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(transformedPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update note with ID ${noteId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update note with ID ${noteId}`,
            code: 'UPDATE_NOTE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.note
      };
    } catch (error) {
      console.error(`Error updating note with ID ${noteId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the note',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a note by ID
   */
  async deleteNote(noteId: string): Promise<DeleteNotesResponse> {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete note with ID ${noteId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete note with ID ${noteId}`,
            code: 'DELETE_NOTE_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true,
        data: {
          deleted: 1
        }
      };
    } catch (error) {
      console.error(`Error deleting note with ID ${noteId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the note',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete notes based on filter criteria
   */
  async deleteNotes(filters: Partial<NotesQueryParams>): Promise<DeleteNotesResponse> {
    try {
      // Convert filters to query string
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/api/notes${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete notes:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to delete notes',
            code: 'DELETE_NOTES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          deleted: data.count || 0
        }
      };
    } catch (error) {
      console.error('Error deleting notes:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting notes',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }
};

export default NotesApiClient; 