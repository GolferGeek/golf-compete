import { SupabaseClient } from '@supabase/supabase-js';
import { 
    BaseService, 
    LogLevel,
    ServiceResponse,
    DatabaseError,
    ErrorCodes,
    PaginatedResponse,
    QueryParams,
    TableOptions,
    createSuccessResponse,
    keysToCamelCase
} from '../base'; 
import { type UserNote } from '@/types/database'; // Import shared type

/**
 * Database service specifically for UserNote related operations.
 */
class NoteDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'NoteDbService initialized');
  }

  /**
   * Creates a new note.
   */
  public async createNote(noteData: Omit<UserNote, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<UserNote>> {
    // Ensure user_id is present
    if (!noteData.user_id) {
        return this.handleDatabaseError(new Error('user_id is required to create a note'), 'Note creation failed');
    }
    return this.insertRecord<UserNote>('user_notes', noteData); // Assuming table name is user_notes
  }

  /**
   * Gets a note by its ID.
   * Ensure RLS allows fetching only user's own notes or based on permissions.
   */
  public async getNoteById(noteId: string): Promise<ServiceResponse<UserNote>> {
    return this.fetchById<UserNote>('user_notes', noteId);
  }

  /**
   * Updates an existing note.
   * Ensure RLS prevents updating notes of other users.
   */
  public async updateNote(noteId: string, updateData: Partial<Omit<UserNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<UserNote>> {
    return this.updateRecord<UserNote>('user_notes', noteId, updateData);
  }

  /**
   * Deletes a note by its ID.
   * Ensure RLS prevents deleting notes of other users.
   */
  public async deleteNote(noteId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('user_notes', noteId);
  }

  /**
   * Fetches notes with specific filters (e.g., by user_id, resource_id).
   */
  public async fetchNotes(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<UserNote>> {
    // Ensure filters include user_id for security unless intended otherwise
    if (!params.filters?.user_id && !params.filters?.id) { // Allow fetching by specific ID
        console.warn('Fetching notes without user_id filter. Ensure RLS is effective.');
        // Depending on policy, might want to throw error here if user_id is always required for list fetches
    }
    return this.fetchRecords<UserNote>('user_notes', params, options);
  }

}

export default NoteDbService; 