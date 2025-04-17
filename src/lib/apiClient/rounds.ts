import { type Round, type Score } from '@/types/database';
import { type PaginatedResponse } from '@/services/base';
import { handleApiResponse, buildQueryString } from './utils';

interface ListRoundsParams { /* Define params */ }

export async function fetchRoundsList(params: ListRoundsParams = {}): Promise<PaginatedResponse<Round>> {
    const queryString = buildQueryString(params);
    const response = await fetch(`/api/rounds${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<PaginatedResponse<Round>>(response);
}

export async function getRoundById(roundId: string, includeScores: boolean = false): Promise<Round & { scores?: Score[] }> {
    const queryString = includeScores ? buildQueryString({ include_scores: true }) : '';
    const response = await fetch(`/api/rounds/${roundId}${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<Round & { scores?: Score[] }>(response);
}

// Add createRound, updateRound, deleteRound, score methods... 