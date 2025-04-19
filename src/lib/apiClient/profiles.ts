import { type AuthProfile } from '@/services/internal/AuthService';
import { handleApiResponse, buildQueryString } from './utils';

export interface ProfileWithEmail extends AuthProfile {
  user_email?: string;
}

export interface ProfileApiResponse {
  success: boolean;
  data?: AuthProfile;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface ProfilesApiResponse {
  success: boolean;
  data?: {
    profiles: AuthProfile[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface ProfilesWithEmailApiResponse {
  success: boolean;
  data?: {
    profiles: ProfileWithEmail[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
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

export interface QuickNote {
  id: string;
  note: string;
  category: string;
  created_at: string;
}

export interface ProfileMetadata {
  quick_notes?: QuickNote[];
  [key: string]: any;
}

/**
 * Fetch profile metadata for a user
 */
export async function getProfileMetadata(userId: string): Promise<ProfileMetadata> {
  const response = await fetch(`/api/profiles/${userId}/metadata`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleApiResponse(response);
}

/**
 * Update profile metadata for a user
 */
export async function updateProfileMetadata(
  userId: string,
  metadata: Partial<ProfileMetadata>
): Promise<ProfileMetadata> {
  const response = await fetch(`/api/profiles/${userId}/metadata`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  return handleApiResponse(response);
}

/**
 * Update quick notes in profile metadata
 */
export async function updateQuickNotes(
  userId: string,
  notes: QuickNote[]
): Promise<ProfileMetadata> {
  return updateProfileMetadata(userId, { quick_notes: notes });
} 