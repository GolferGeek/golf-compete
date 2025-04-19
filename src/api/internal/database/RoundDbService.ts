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
import { type Round, type Score } from '@/types/database'; // Import shared types

/**
 * Database service specifically for Round and Score related operations.
 */
class RoundDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'RoundDbService initialized');
  }

  // --- Round Specific Methods --- 

  public async createRound(roundData: Omit<Round, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Round>> {
    return this.insertRecord<Round>('rounds', roundData);
  }

  public async getRoundById(roundId: string): Promise<ServiceResponse<Round>> {
    return this.fetchById<Round>('rounds', roundId);
  }

  /**
   * Updates an existing round.
   */
  public async updateRound(roundId: string, updateData: Partial<Omit<Round, 'id' | 'event_id' | 'user_id' | 'course_tee_id' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<Round>> {
    // Note: We Omit fields that shouldn't be changed via update (like user_id, event_id, course_tee_id)
    return this.updateRecord<Round>('rounds', roundId, updateData);
  }

  /**
   * Deletes a round and its associated scores via RPC.
   */
  public async deleteRound(roundId: string): Promise<ServiceResponse<null>> {
    try {
        this.log(LogLevel.WARN, `Deleting round ${roundId} and its scores via RPC.`);
        
        // Call the PostgreSQL function
        const { error } = await this.client.rpc('delete_round_and_scores', { 
            p_round_id: roundId 
        });

        if (error) {
            // Handle potential RPC errors (permissions, function not found, SQL errors)
            // The function raises an exception if round not found, which should be caught here.
            console.error('RPC delete_round_and_scores Error:', error);
            // Check if the error message indicates not found
            if (error.message?.includes('not found')) {
                throw new DatabaseError(error.message, ErrorCodes.DB_NOT_FOUND, new Error(JSON.stringify(error)));
            }
            throw new DatabaseError(error.message, 'DB_RPC_ERROR', new Error(JSON.stringify(error)));
        }

        // RPC returns void, so success is indicated by no error
        return createSuccessResponse(null);

    } catch (error) {
        // Ensure error is DatabaseError before returning
        return this.handleDatabaseError(error, `Failed to delete round ${roundId} via RPC`);
    }
  }
  
  public async fetchRounds(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Round>> {
    return this.fetchRecords<Round>('rounds', params, options);
  }

  // --- Score Specific Methods --- 

  public async addScore(scoreData: Omit<Score, 'id'>): Promise<ServiceResponse<Score>> {
    return this.insertRecord<Score>('scores', scoreData);
  }

  /**
   * Updates a score entry.
   */
  public async updateScore(scoreId: string, updateData: Partial<Omit<Score, 'id' | 'round_id' | 'hole_number'>>): Promise<ServiceResponse<Score>> {
    return this.updateRecord<Score>('scores', scoreId, updateData);
  }

  public async removeScore(scoreId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('scores', scoreId);
  }

  public async getRoundWithScores(roundId: string): Promise<ServiceResponse<Round & { scores: Score[] }>> {
    try {
      const { data, error } = await this.client
        .from('rounds')
        .select(`*,
                 scores (*)
               `)
        .eq('id', roundId)
        .single();

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      if (data?.scores) {
        data.scores.sort((a: Score, b: Score) => a.hole_number - b.hole_number);
      }

      return createSuccessResponse(keysToCamelCase(data) as Round & { scores: Score[] });
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch round ${roundId} with scores`);
    }
  }
}

export default RoundDbService; 