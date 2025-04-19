// Define ApiResponse interface here if not imported from a shared module
export interface ApiResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

import { type Round, type Score } from '@/types/database';

/**
 * Data transfer object for Round entities
 */
export interface RoundDto {
  id: string;
  eventId: string;
  userId: string;
  courseTeeId: string;
  roundDate: string;
  status: string;
  handicapIndexUsed?: number;
  courseHandicap?: number;
  netScore?: number;
  grossScore?: number;
  createdAt: string;
  updatedAt: string;
  // Optional related data
  scores?: ScoreDto[];
  // Join data for UI
  course?: {
    id: string;
    name: string;
    tees?: {
      id: string;
      name: string;
    }[];
  };
}

/**
 * Data transfer object for Score entities
 */
export interface ScoreDto {
  id: string;
  roundId: string;
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

/**
 * Parameters for querying rounds
 */
export interface RoundsQueryParams {
  limit?: number;
  offset?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  userId?: string;
  eventId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  includeScores?: boolean;
}

/**
 * Payload for creating a new round
 */
export interface CreateRoundPayload {
  eventId?: string;
  courseTeeId: string;
  roundDate: string;
  status?: string;
  handicapIndexUsed?: number;
  courseHandicap?: number;
  // Optional scores array to create in the same request
  scores?: CreateScorePayload[];
}

/**
 * Payload for creating a new score
 */
export interface CreateScorePayload {
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

/**
 * Payload for updating an existing round
 */
export interface UpdateRoundPayload {
  eventId?: string;
  courseTeeId?: string;
  roundDate?: string;
  status?: string;
  handicapIndexUsed?: number;
  courseHandicap?: number;
  netScore?: number;
  grossScore?: number;
}

/**
 * Payload for updating an existing score
 */
export interface UpdateScorePayload {
  strokes?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

/**
 * Response containing an array of rounds
 */
export interface RoundsApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    rounds: RoundDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single round
 */
export interface RoundApiResponse extends ApiResponse {
  success: boolean;
  data?: RoundDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing an array of scores
 */
export interface ScoresApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    scores: ScoreDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single score
 */
export interface ScoreApiResponse extends ApiResponse {
  success: boolean;
  data?: ScoreDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Helper function to map database Round to RoundDto
 */
function mapRoundToDto(round: Round, scores?: Score[]): RoundDto {
  return {
    id: round.id,
    eventId: round.event_id,
    userId: round.user_id,
    courseTeeId: round.course_tee_id,
    roundDate: round.round_date,
    status: round.status,
    handicapIndexUsed: round.handicap_index_used,
    courseHandicap: round.course_handicap,
    netScore: round.net_score,
    grossScore: round.gross_score,
    createdAt: round.created_at,
    updatedAt: round.updated_at,
    scores: scores?.map(mapScoreToDto)
  };
}

/**
 * Helper function to map database Score to ScoreDto
 */
function mapScoreToDto(score: Score): ScoreDto {
  return {
    id: score.id,
    roundId: score.round_id,
    holeNumber: score.hole_number,
    strokes: score.strokes,
    putts: score.putts,
    fairwayHit: score.fairway_hit,
    greenInRegulation: score.green_in_regulation
  };
}

/**
 * API client for rounds operations
 */
export const RoundsApiClient = {
  /**
   * Fetch all rounds with optional filters and pagination
   */
  async getRounds(params: RoundsQueryParams = {}): Promise<RoundsApiResponse> {
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
      const endpoint = `/api/rounds${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch rounds:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch rounds',
            code: 'FETCH_ROUNDS_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          rounds: data.data || [],
          total: data.metadata?.total || 0
        }
      };
    } catch (error) {
      console.error('Error fetching rounds:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching rounds',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch a single round by ID
   */
  async getRoundById(roundId: string, includeScores: boolean = false): Promise<RoundApiResponse> {
    try {
      // Add includeScores parameter if needed
      const queryParams = new URLSearchParams();
      if (includeScores) {
        queryParams.append('include_scores', 'true');
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/api/rounds/${roundId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch round with ID ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch round with ID ${roundId}`,
            code: 'FETCH_ROUND_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error fetching round with ID ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the round',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new round
   */
  async createRound(payload: CreateRoundPayload): Promise<RoundApiResponse> {
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create round:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to create round',
            code: 'CREATE_ROUND_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error creating round:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the round',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing round
   */
  async updateRound(roundId: string, payload: UpdateRoundPayload): Promise<RoundApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update round with ID ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update round with ID ${roundId}`,
            code: 'UPDATE_ROUND_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error updating round with ID ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the round',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a round by ID
   */
  async deleteRound(roundId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete round with ID ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete round with ID ${roundId}`,
            code: 'DELETE_ROUND_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting round with ID ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the round',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch all scores for a round
   */
  async getRoundScores(roundId: string): Promise<ScoresApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}/scores`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch scores for round ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch scores for round ${roundId}`,
            code: 'FETCH_SCORES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          scores: data.data || [],
          total: data.metadata?.total || 0
        }
      };
    } catch (error) {
      console.error(`Error fetching scores for round ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching scores',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new score for a round
   */
  async createScore(roundId: string, payload: CreateScorePayload): Promise<ScoreApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to create score for round ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to create score for round ${roundId}`,
            code: 'CREATE_SCORE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error creating score for round ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the score',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing score
   */
  async updateScore(
    roundId: string, 
    scoreId: string, 
    payload: UpdateScorePayload
  ): Promise<ScoreApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}/scores/${scoreId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update score ${scoreId} for round ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update score ${scoreId}`,
            code: 'UPDATE_SCORE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error updating score ${scoreId} for round ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the score',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a score
   */
  async deleteScore(roundId: string, scoreId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}/scores/${scoreId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete score ${scoreId} for round ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete score ${scoreId}`,
            code: 'DELETE_SCORE_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting score ${scoreId} for round ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the score',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },
  
  /**
   * Create multiple scores for a round in one request
   */
  async createBulkScores(roundId: string, payloads: CreateScorePayload[]): Promise<ScoresApiResponse> {
    try {
      const response = await fetch(`/api/rounds/${roundId}/scores/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ scores: payloads })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to create bulk scores for round ${roundId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to create bulk scores',
            code: 'CREATE_BULK_SCORES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          scores: data.data || [],
          total: data.data?.length || 0
        }
      };
    } catch (error) {
      console.error(`Error creating bulk scores for round ${roundId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating bulk scores',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }
};

export default RoundsApiClient; 