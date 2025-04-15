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

// Define interfaces for Series resources
// (Could be imported from a shared types file)
interface Series {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface SeriesParticipant {
  id: string;
  user_id: string;
  series_id: string;
  role: 'admin' | 'participant';
  status: 'invited' | 'confirmed' | 'withdrawn';
  joined_at: string;
}

/**
 * Database service specifically for Series-related operations.
 */
class SeriesDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'SeriesDbService initialized');
  }

  // --- Series Specific Methods --- 

  public async createSeries(seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Series>> {
    return this.insertRecord<Series>('series', seriesData);
  }

  public async getSeriesById(seriesId: string): Promise<ServiceResponse<Series>> {
    return this.fetchById<Series>('series', seriesId);
  }

  // Using Omit without Partial as potential workaround for previous type issues
  public async updateSeries(seriesId: string, updateData: Omit<Series, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Series>> {
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

  // Using Omit without Partial
  public async updateSeriesParticipant(participantId: string, updateData: Omit<SeriesParticipant, 'id' | 'user_id' | 'series_id' | 'joined_at'>): Promise<ServiceResponse<SeriesParticipant>> {
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
}

export default SeriesDbService; 