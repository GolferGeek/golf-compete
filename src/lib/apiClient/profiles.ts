import { type AuthProfile } from '@/api/internal/auth/AuthService';
import { handleApiResponse, handleApiError, buildQueryString } from './utils';
import { ApiResponse } from '@/types/api';
import { ProfileMetadata, ProfileApiResponse, ProfilesApiResponse, ProfilesWithEmailApiResponse, ProfileWithEmail } from '@/types/profile';

export interface QuickNote {
  id: string;
  note: string;
  category: string;
  created_at: string;
}

/**
 * Get all profiles
 */
export async function getAllProfiles(): Promise<ProfilesApiResponse> {
  const response = await fetch('/api/profiles', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<ProfilesApiResponse>(response);
}

/**
 * Get a profile by ID
 */
export async function getProfileById(profileId: string): Promise<ProfileApiResponse> {
  const response = await fetch(`/api/profiles/${profileId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<ProfileApiResponse>(response);
}

/**
 * Update a profile
 */
export async function updateProfile(profileId: string, data: Partial<AuthProfile>): Promise<ProfileApiResponse> {
  const response = await fetch(`/api/profiles/${profileId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleApiResponse<ProfileApiResponse>(response);
}

/**
 * Get profiles with email information
 */
export async function getProfilesWithEmail(): Promise<ProfilesWithEmailApiResponse> {
  const response = await fetch('/api/profiles/with-email', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<ProfilesWithEmailApiResponse>(response);
}

/**
 * Get profiles not in a specific series
 */
export async function getProfilesNotInSeries(seriesId: string): Promise<ProfilesWithEmailApiResponse> {
  const response = await fetch(`/api/profiles/not-in-series/${seriesId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<ProfilesWithEmailApiResponse>(response);
}

export const getProfileMetadata = async (profileId: string): Promise<ApiResponse<ProfileMetadata>> => {
  try {
    const response = await fetch(`/api/profiles/${profileId}/metadata`, {
      method: 'GET',
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateProfileMetadata = async (profileId: string, metadata: Partial<ProfileMetadata>): Promise<ApiResponse<ProfileMetadata>> => {
  try {
    const response = await fetch(`/api/profiles/${profileId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update quick notes in profile metadata
 */
export async function updateQuickNotes(
  profileId: string,
  notes: QuickNote[]
): Promise<ApiResponse<ProfileMetadata>> {
  return updateProfileMetadata(profileId, { quick_notes: notes });
} 