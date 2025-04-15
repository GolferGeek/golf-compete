import { SupabaseClient } from '@supabase/supabase-js';
import SeriesDbService from '../SeriesDbService';
import { BaseService, ErrorCodes, DatabaseError, ServiceError } from '../../base';
import { Series } from '@/types/database';

// More realistic mock for Supabase client chaining
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

const mockSupabaseClient = {
    from: mockFrom,
} as unknown as SupabaseClient;

const seriesDbService = new SeriesDbService(mockSupabaseClient);

// Test Suite
describe('SeriesDbService', () => {
    // Clear mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset specific mocks if needed, e.g., mockSingle.mockClear(); 
    });

    describe('getSeriesById', () => {
        const testSeriesId = 'test-series-uuid';
        const mockSeriesData: Series = {
            id: testSeriesId,
            name: 'Test Series',
            description: 'A test series',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            status: 'active',
            created_by: 'user-uuid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        it('should fetch a series by ID successfully', async () => {
            // Arrange
            mockSingle.mockResolvedValueOnce({ data: mockSeriesData, error: null });

            // Act
            const result = await seriesDbService.getSeriesById(testSeriesId);

            // Assert
            expect(mockFrom).toHaveBeenCalledWith('series');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', testSeriesId);
            expect(mockSingle).toHaveBeenCalledTimes(1);
            expect(result.status).toBe('success');
            expect(result.data).toEqual(mockSeriesData); // Can use direct equals now
            expect(result.error).toBeNull();
        });

        it('should return a DB_NOT_FOUND error if series is not found', async () => {
            // Arrange
            const notFoundError = { message: 'Row not found', code: 'PGRST116', details: '', hint: '' };
            mockSingle.mockResolvedValueOnce({ data: null, error: notFoundError });

            // Act
            const result = await seriesDbService.getSeriesById(testSeriesId);

            // Assert
            expect(result.status).toBe('error');
            expect(result.data).toBeNull();
            expect(result.error).toBeInstanceOf(DatabaseError);
            // Use type guard before accessing code
            if (result.error instanceof ServiceError) {
                expect(result.error.code).toBe(ErrorCodes.DB_NOT_FOUND);
            }
            expect(result.error?.message).toContain('Row not found');
        });

        it('should handle unexpected database errors', async () => {
            // Arrange
            const genericError = { message: 'Something went wrong', code: '50000', details: '', hint: '' };
            mockSingle.mockResolvedValueOnce({ data: null, error: genericError });

            // Act
            const result = await seriesDbService.getSeriesById(testSeriesId);

            // Assert
            expect(result.status).toBe('error');
            expect(result.data).toBeNull();
            expect(result.error).toBeInstanceOf(DatabaseError);
             // Use type guard
            if (result.error instanceof ServiceError) {
                expect(result.error.code).toBe(ErrorCodes.DB_NOT_FOUND); // Still maps to NOT_FOUND in this case
            }
            expect(result.error?.message).toContain('Failed to fetch record');
        });
    });

    // TODO: Add tests for other SeriesDbService methods (create, update, delete, participants, etc.)
}); 