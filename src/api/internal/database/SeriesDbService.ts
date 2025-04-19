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
} from '@/api/base';
import { Series, SeriesParticipant, SeriesRole } from '@/types/competition/series/types';

/**
 * Database service specifically for Series-related operations.
 */
export class SeriesDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'SeriesDbService initialized');
  }

  // Series Core Operations
  async createSeriesAndAddAdmin(series: Partial<Series>, adminUserId: string): Promise<ServiceResponse<Series>> {
    try {
      const { data: createdSeries, error } = await this.client.rpc('create_series_and_add_admin', {
        series_data: series,
        admin_user_id: adminUserId
      });

      if (error) throw this.ensureDatabaseError(error, 'Failed to create series and add admin');
      return createSuccessResponse(createdSeries);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to create series and add admin', { error });
      return this.handleDatabaseError(error, 'Failed to create series and add admin');
    }
  }

  async getSeriesById(id: string): Promise<ServiceResponse<Series>> {
    return this.fetchById<Series>('series', id);
  }

  async updateSeries(id: string, data: Partial<Series>): Promise<ServiceResponse<Series>> {
    return this.updateRecord<Series>('series', id, data);
  }

  async deleteSeries(id: string): Promise<ServiceResponse<null>> {
    // Warning: Ensure related data is handled before deletion
    return this.deleteRecord('series', id);
  }

  async fetchSeries(params: QueryParams = {}): Promise<PaginatedResponse<Series>> {
    return this.fetchRecords<Series>('series', params);
  }

  // Participant Operations
  async addParticipant(seriesId: string, userId: string, role: SeriesRole = 'player'): Promise<ServiceResponse<SeriesParticipant>> {
    try {
      const participant: Partial<SeriesParticipant> = {
        series_id: seriesId,
        user_id: userId,
        role,
        status: 'pending'
      };

      return this.insertRecord<SeriesParticipant>('series_participants', participant);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to add participant', { error, seriesId, userId });
      return this.handleDatabaseError(error, 'Failed to add participant');
    }
  }

  async updateParticipant(id: string, data: Partial<SeriesParticipant>): Promise<ServiceResponse<SeriesParticipant>> {
    return this.updateRecord<SeriesParticipant>('series_participants', id, data);
  }

  async removeParticipant(id: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('series_participants', id);
  }

  async getSeriesParticipants(seriesId: string): Promise<ServiceResponse<SeriesParticipant[]>> {
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select('*, user:user_id(*)')
        .eq('series_id', seriesId);

      if (error) throw this.ensureDatabaseError(error, 'Failed to get series participants');
      return createSuccessResponse(data);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get series participants', { error, seriesId });
      return this.handleDatabaseError(error, 'Failed to get series participants');
    }
  }

  async getUserParticipations(userId: string): Promise<ServiceResponse<SeriesParticipant[]>> {
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select('*, series:series_id(*)')
        .eq('user_id', userId);

      if (error) throw this.ensureDatabaseError(error, 'Failed to get user participations');
      return createSuccessResponse(data);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get user participations', { error, userId });
      return this.handleDatabaseError(error, 'Failed to get user participations');
    }
  }

  async getUserRole(seriesId: string, userId: string): Promise<ServiceResponse<SeriesRole | null>> {
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select('role')
        .eq('series_id', seriesId)
        .eq('user_id', userId)
        .single();

      if (error) throw this.ensureDatabaseError(error, 'Failed to get user role');
      return createSuccessResponse(data?.role || null);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get user role', { error, seriesId, userId });
      return this.handleDatabaseError(error, 'Failed to get user role');
    }
  }

  async getUserInvitations(userId: string): Promise<ServiceResponse<SeriesParticipant[]>> {
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select('*, series:series_id(*)')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw this.ensureDatabaseError(error, 'Failed to get user invitations');
      return createSuccessResponse(data);
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to get user invitations', { error, userId });
      return this.handleDatabaseError(error, 'Failed to get user invitations');
    }
  }
} 