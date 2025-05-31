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
import { type BagSetup } from '@/types/bag-setup';

/**
 * Database service specifically for BagSetup related operations.
 */
class BagSetupDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'BagSetupDbService initialized');
  }

  /**
   * Creates a new bag setup.
   */
  public async createBagSetup(bagSetupData: Omit<BagSetup, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<BagSetup>> {
    // Ensure user_id is present
    if (!bagSetupData.user_id) {
        return this.handleDatabaseError(new Error('user_id is required to create a bag setup'), 'Bag setup creation failed');
    }
    return this.insertRecord<BagSetup>('bag_setups', bagSetupData);
  }

  /**
   * Gets a bag setup by its ID.
   * Ensure RLS allows fetching only user's own bag setups.
   */
  public async getBagSetupById(bagSetupId: string): Promise<ServiceResponse<BagSetup>> {
    return this.fetchById<BagSetup>('bag_setups', bagSetupId);
  }

  /**
   * Updates an existing bag setup.
   * Ensure RLS prevents updating bag setups of other users.
   */
  public async updateBagSetup(bagSetupId: string, updateData: Partial<Omit<BagSetup, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<BagSetup>> {
    return this.updateRecord<BagSetup>('bag_setups', bagSetupId, updateData);
  }

  /**
   * Deletes a bag setup by its ID.
   * Ensure RLS prevents deleting bag setups of other users.
   */
  public async deleteBagSetup(bagSetupId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('bag_setups', bagSetupId);
  }

  /**
   * Fetches bag setups for a specific user.
   */
  public async fetchUserBagSetups(userId: string, params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<BagSetup>> {
    // Add user_id filter to ensure security
    const filteredParams: QueryParams = {
      ...params,
      filters: {
        ...params.filters,
        user_id: userId
      }
    };
    return this.fetchRecords<BagSetup>('bag_setups', filteredParams, options);
  }

  /**
   * Gets the default bag setup for a user.
   */
  public async getDefaultBagSetup(userId: string): Promise<ServiceResponse<BagSetup | null>> {
    try {
      const { data, error } = await this.client
        .from('bag_setups')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error) {
        this.log(LogLevel.ERROR, 'Error fetching default bag setup', { error });
        return this.handleDatabaseError(error, 'Failed to fetch default bag setup');
      }

      if (!data) {
        return createSuccessResponse(null); // No default bag setup found
      }

      const transformedData = keysToCamelCase(data) as BagSetup;
      return createSuccessResponse(transformedData);
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Unexpected error fetching default bag setup', { error });
      return this.handleDatabaseError(error, 'Failed to fetch default bag setup');
    }
  }

  /**
   * Sets a bag setup as the default for a user.
   * This will automatically unset any other default bag setups for the user.
   */
  public async setDefaultBagSetup(userId: string, bagSetupId: string): Promise<ServiceResponse<BagSetup>> {
    try {
      // First, unset all other defaults for this user
      const { error: unsetError } = await this.client
        .from('bag_setups')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', bagSetupId);

      if (unsetError) {
        this.log(LogLevel.ERROR, 'Error unsetting default bag setups', { unsetError });
        return this.handleDatabaseError(unsetError, 'Failed to unset default bag setups');
      }

      // Then set the specified bag setup as default
      return this.updateBagSetup(bagSetupId, { is_default: true });
    } catch (error: any) {
      this.log(LogLevel.ERROR, 'Unexpected error setting default bag setup', { error });
      return this.handleDatabaseError(error, 'Failed to set default bag setup');
    }
  }
}

export { BagSetupDbService }; 