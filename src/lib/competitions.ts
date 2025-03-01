import { supabase } from './supabase';
import { Competition, User } from '../types/golf';

/**
 * Get all competitions
 */
export async function getAllCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase
    .from('competitions')
    .select('*');
  
  if (error) {
    console.error('Error fetching competitions:', error);
    return [];
  }
  
  return data.map(comp => ({
    id: comp.id,
    name: comp.name,
    type: comp.type as 'series' | 'event' | 'daily',
    startDate: new Date(comp.start_date),
    endDate: new Date(comp.end_date),
    description: comp.description,
    status: comp.status as 'upcoming' | 'active' | 'completed',
    format: comp.format,
    prizes: comp.prizes ? JSON.parse(comp.prizes) : undefined,
    participants: [], // We'll need to fetch these separately
  }));
}

/**
 * Get a competition by ID
 */
export async function getCompetitionById(id: string): Promise<Competition | null> {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching competition:', error);
    return null;
  }
  
  // Get participants - fetch profiles directly instead of through a join
  const { data: participantsData, error: participantsError } = await supabase
    .from('competition_participants')
    .select('user_id')
    .eq('competition_id', id);
  
  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    return null;
  }
  
  // Initialize empty participants array
  const participants: User[] = [];
  
  // If we have participants, fetch their profiles
  if (participantsData && participantsData.length > 0) {
    // Extract user IDs
    const userIds = participantsData.map(p => p.user_id);
    
    // Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else if (profilesData) {
      // Map profiles to User objects
      profilesData.forEach(profile => {
        participants.push({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          email: '', // Email is not stored in profiles table
          handicap: profile.handicap || undefined,
          profileImage: undefined, // Profile image is not stored in profiles table
          memberSince: new Date(profile.created_at),
        });
      });
    }
  }
  
  return {
    id: data.id,
    name: data.name,
    type: data.type as 'series' | 'event' | 'daily',
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    description: data.description,
    status: data.status as 'upcoming' | 'active' | 'completed',
    format: data.format,
    prizes: data.prizes ? JSON.parse(data.prizes) : undefined,
    participants,
  };
}

/**
 * Create a new competition
 */
export async function createCompetition(
  name: string,
  type: 'series' | 'event' | 'daily',
  startDate: Date,
  endDate: Date,
  description: string,
  format: string,
  prizes?: string[]
): Promise<Competition | null> {
  const { data, error } = await supabase
    .from('competitions')
    .insert({
      name,
      type,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      description,
      status: startDate > new Date() ? 'upcoming' : 'active',
      format,
      prizes: prizes ? JSON.stringify(prizes) : null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating competition:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    type: data.type as 'series' | 'event' | 'daily',
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    description: data.description,
    status: data.status as 'upcoming' | 'active' | 'completed',
    format: data.format,
    prizes: data.prizes ? JSON.parse(data.prizes) : undefined,
    participants: [],
  };
}

/**
 * Add a user to a competition
 */
export async function addUserToCompetition(competitionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('competition_participants')
    .insert({
      competition_id: competitionId,
      user_id: userId,
    });
  
  if (error) {
    console.error('Error adding user to competition:', error);
    return false;
  }
  
  return true;
}

/**
 * Get active competitions
 */
export async function getActiveCompetitions(): Promise<Competition[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', now)
    .gte('end_date', now);
  
  if (error) {
    console.error('Error fetching active competitions:', error);
    return [];
  }
  
  return data.map(comp => ({
    id: comp.id,
    name: comp.name,
    type: comp.type as 'series' | 'event' | 'daily',
    startDate: new Date(comp.start_date),
    endDate: new Date(comp.end_date),
    description: comp.description,
    status: comp.status as 'upcoming' | 'active' | 'completed',
    format: comp.format,
    prizes: comp.prizes ? JSON.parse(comp.prizes) : undefined,
    participants: [], // We'll need to fetch these separately
  }));
} 