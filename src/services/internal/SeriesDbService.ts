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
} from '../base'; // Assuming structure src/services/base and src/services/internal
import { type Series, type SeriesParticipant } from '@/types/database'; // Import shared types

// Explicitly define the type for partial participant updates
type UpdateSeriesParticipantData = Partial<Omit<SeriesParticipant, 'id' | 'user_id' | 'series_id' | 'joined_at'>>;

/**
 * Database service specifically for Series-related operations.
 */
class SeriesDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'SeriesDbService initialized');
  }

  // --- Series Specific Methods --- 

  /**
   * Creates a new series and adds the creator as an admin participant via RPC.
   */
  public async createSeriesAndAddAdmin(seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<{ created_series_id: string }>> {
    try {
      // RPC requires exact parameter names as defined in the SQL function
      const params = {
        p_name: seriesData.name,
        p_description: seriesData.description,
        p_start_date: seriesData.start_date,
        p_end_date: seriesData.end_date,
        p_status: seriesData.status,
        p_created_by: seriesData.created_by,
      };
      
      // Call the PostgreSQL function
      const { data, error } = await this.client.rpc('create_series_and_add_admin', params);

      if (error) {
        // Handle potential RPC errors (permissions, function not found, SQL errors)
        console.error('RPC create_series_and_add_admin Error:', error);
        // Map to a DatabaseError or specific RPCError
        throw new DatabaseError(error.message, 'DB_RPC_ERROR', new Error(JSON.stringify(error)));
      }

      // Check if data is returned as expected (should be an array with one object)
      if (!data || !Array.isArray(data) || data.length === 0 || !data[0].created_series_id) {
          console.error('RPC create_series_and_add_admin: Unexpected response format', data);
          throw new DatabaseError('Failed to create series: Unexpected response from database function.', ErrorCodes.DB_QUERY_ERROR);
      }

      // Return the ID returned by the function
      return createSuccessResponse({ created_series_id: data[0].created_series_id });

    } catch (error) {
      return this.handleDatabaseError(error, 'Failed to create series via RPC');
    }
  }

  public async createSeries(seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Series>> {
    return this.insertRecord<Series>('series', seriesData);
  }

  public async getSeriesById(seriesId: string): Promise<ServiceResponse<Series>> {
    return this.fetchById<Series>('series', seriesId);
  }

  /**
   * Updates an existing series.
   */
  public async updateSeries(seriesId: string, updateData: Partial<Omit<Series, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<Series>> {
    return this.updateRecord<Series>('series', seriesId, updateData);
  }

  public async deleteSeries(seriesId: string): Promise<ServiceResponse<null>> {
    this.log(LogLevel.WARN, `Deleting series ${seriesId}. Ensure related data is handled.`);
    // TODO: Add transaction to delete participants first?
    return this.deleteRecord('series', seriesId);
  }

  public async fetchSeries(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Series>> {
    return this.fetchRecords<Series>('series', params, options);
  }

  // --- Series Participant Specific Methods --- 

  public async addSeriesParticipant(participantData: Omit<SeriesParticipant, 'id' | 'joined_at'>): Promise<ServiceResponse<SeriesParticipant>> {
    return this.insertRecord<SeriesParticipant>('series_participants', participantData);
  }

  /**
   * Updates a series participant's details (e.g., role, status).
   */
  // Use the explicitly defined type
  public async updateSeriesParticipant(participantId: string, updateData: UpdateSeriesParticipantData): Promise<ServiceResponse<SeriesParticipant>> {
    return this.updateRecord<SeriesParticipant>('series_participants', participantId, updateData);
  }

  public async removeSeriesParticipant(participantId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('series_participants', participantId);
  }

  public async getSeriesWithParticipants(seriesId: string): Promise<ServiceResponse<Series & { participants: SeriesParticipant[] }>> {
    try {
      const { data, error } = await this.client
        .from('series')
        .select(`*,
                 participants: series_participants (*)
               `)
        .eq('id', seriesId)
        .single();

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      return createSuccessResponse(keysToCamelCase(data) as Series & { participants: SeriesParticipant[] });
    } catch (error) {
      // Use handleDatabaseError from BaseService
      return this.handleDatabaseError(error, `Failed to fetch series ${seriesId} with participants`);
    }
  }

  public async fetchUserSeriesParticipations(userId: string): Promise<ServiceResponse<any[]>> { // Consider specific return type
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select(`
          participantId:id,
          userId:user_id,
          seriesId:series_id,
          role,
          participantStatus:status,
          joinedAt:joined_at,
          series:series_id (
            seriesName:name,
            seriesDescription:description,
            seriesStartDate:start_date,
            seriesEndDate:end_date,
            seriesStatus:status,
            seriesCreatedBy:created_by
          )
        `)
        .eq('user_id', userId)
        .not('series', 'is', null); 

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      const flattenedData = (data || []).map((item: any) => ({
          participantId: item.participantId,
          userId: item.userId,
          seriesId: item.seriesId,
          role: item.role,
          participantStatus: item.participantStatus,
          joinedAt: item.joinedAt,
          ...(item.series || {}),
      }));
      
      return createSuccessResponse(flattenedData);

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch series participations for user ${userId}`);
    }
  }

  public async getUserSeriesRole(userId: string, seriesId: string): Promise<ServiceResponse<{ role: string | null }>> {
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select('role')
        .eq('user_id', userId)
        .eq('series_id', seriesId)
        .maybeSingle(); // Use maybeSingle as user might not be participant

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      return createSuccessResponse({ role: data?.role || null });

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch user role for series ${seriesId}`);
    }
  }

  /**
   * Gets a specific series participant by their ID.
   */
  public async getSeriesParticipantById(participantId: string): Promise<ServiceResponse<SeriesParticipant>> {
    return this.fetchById<SeriesParticipant>('series_participants', participantId);
  }
}

export default SeriesDbService; 