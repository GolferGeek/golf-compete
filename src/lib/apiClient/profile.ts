import { type AuthProfile } from '@/api/internal/auth/AuthService'; // Import from AuthService
import { handleApiResponse } from './utils'; // Import helper

/**
 * Fetches the authenticated user's profile data.
 */
export async function fetchUserProfile(): Promise<AuthProfile> {
    const response = await fetch('/api/user/profile');
    return handleApiResponse<AuthProfile>(response);
}

/**
 * Updates the authenticated user's profile.
 * @param profileData - Partial profile data to update.
 */
export async function updateUserProfile(profileData: Partial<Omit<AuthProfile, 'id' | 'is_admin' | 'created_at' | 'updated_at'> >): Promise<AuthProfile> {
    const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
    });
    return handleApiResponse<AuthProfile>(response);
}

// Add other profile-related API client methods if needed 