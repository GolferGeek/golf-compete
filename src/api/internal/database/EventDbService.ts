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
} from '../../base'; 
import { type Event, type EventParticipant } from '@/types/database'; // Import shared types

/**
 * Database service specifically for Event-related operations.
 */
class EventDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'EventDbService initialized');
  }

  // --- Event Specific Methods --- 

  public async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Event>> {
    return this.insertRecord<Event>('events', eventData);
  }

  public async getEventById(eventId: string): Promise<ServiceResponse<Event>> {
    return this.fetchById<Event>('events', eventId);
  }

  /**
   * Updates an existing event.
   */
  public async updateEvent(eventId: string, updateData: Partial<Omit<Event, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<Event>> {
    return this.updateRecord<Event>('events', eventId, updateData);
  }

  public async deleteEvent(eventId: string): Promise<ServiceResponse<null>> {
    this.log(LogLevel.WARN, `Deleting event ${eventId}. Ensure related data is handled.`);
    // TODO: Add transaction to delete participants/rounds first?
    return this.deleteRecord('events', eventId);
  }

  public async fetchEvents(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Event>> {
    return this.fetchRecords<Event>('events', params, options);
  }
  
  // --- Event Participant Specific Methods --- 

  public async addEventParticipant(participantData: Omit<EventParticipant, 'id' | 'registration_date'>): Promise<ServiceResponse<EventParticipant>> {
    return this.insertRecord<EventParticipant>('event_participants', participantData);
  }

  // Using Omit without Partial
  public async updateEventParticipant(participantId: string, updateData: Omit<EventParticipant, 'id' | 'user_id' | 'event_id' | 'registration_date'>): Promise<ServiceResponse<EventParticipant>> {
    return this.updateRecord<EventParticipant>('event_participants', participantId, updateData);
  }

  public async removeEventParticipant(participantId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('event_participants', participantId);
  }

  public async getEventWithParticipants(eventId: string): Promise<ServiceResponse<Event & { participants: EventParticipant[] }>> {
    try {
      const { data, error } = await this.client
        .from('events')
        .select(`*,
                 participants: event_participants (*)
               `)
        .eq('id', eventId)
        .single();

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      return createSuccessResponse(keysToCamelCase(data) as Event & { participants: EventParticipant[] });
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch event ${eventId} with participants`);
    }
  }

  public async fetchUserEventParticipations(userId: string): Promise<ServiceResponse<any[]>> { // Consider specific return type
    try {
      const { data, error } = await this.client
        .from('event_participants')
        .select(`
          participantId:id,
          userId:user_id,
          eventId:event_id,
          participantStatus:status,
          registrationDate:registration_date,
          teeTime:tee_time,
          startingHole:starting_hole,
          groupNumber:group_number,
          handicapIndex:handicap_index,
          event:events (
            eventName:name,
            eventDescription:description,
            eventDate:event_date,
            eventStatus:status,
            courseId:course_id
          )
        `)
        .eq('user_id', userId)
        .not('event', 'is', null);

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      const flattenedData = (data || []).map((item: any) => ({
          participantId: item.participantId,
          userId: item.userId,
          eventId: item.eventId,
          participantStatus: item.participantStatus,
          registrationDate: item.registrationDate,
          teeTime: item.teeTime,
          startingHole: item.startingHole,
          groupNumber: item.groupNumber,
          handicapIndex: item.handicapIndex,
          ...(item.event || {}),
      }));
      
      return createSuccessResponse(flattenedData);

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch event participations for user ${userId}`);
    }
  }

  /**
   * Gets the series ID for a given event ID, if it exists.
   */
  public async getEventSeriesId(eventId: string): Promise<ServiceResponse<{ series_id: string | null }>> {
    try {
      const { data, error } = await this.client
        .from('events')
        .select('series_id')
        .eq('id', eventId)
        .maybeSingle(); // Use maybeSingle as event might not exist

      if (error) {
        // Distinguish between not found and other errors if needed
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      return createSuccessResponse({ series_id: data?.series_id || null });

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch series_id for event ${eventId}`);
    }
  }
}

export default EventDbService; 