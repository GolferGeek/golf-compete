import { createClient } from '@/lib/supabase/client';

export interface HandicapDifferential {
  id: string;
  round_id: string;
  bag_id: string | null;
  score: number;
  course_rating: number;
  slope_rating: number;
  differential: number;
  round_date: string;
  playing_conditions_calculation?: number; // PCC adjustment
}

export interface HandicapIndex {
  id: string;
  user_id: string;
  bag_id: string | null;
  handicap_index: number;
  effective_date: string;
  calculation_method: 'WHS' | 'USGA';
  rounds_used: number;
  created_at: string;
}

export interface HandicapCalculationResult {
  handicap_index: number;
  differentials_used: HandicapDifferential[];
  total_rounds: number;
  calculation_method: 'WHS' | 'USGA';
  effective_date: string;
}

/**
 * Calculate handicap differential for a single round
 * Formula: (Score - Course Rating) × 113 / Slope Rating
 */
export function calculateHandicapDifferential(
  score: number,
  courseRating: number,
  slopeRating: number,
  pcc: number = 0 // Playing Conditions Calculation adjustment
): number {
  const differential = ((score - courseRating - pcc) * 113) / slopeRating;
  return Math.round(differential * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate handicap index using WHS (World Handicap System) rules
 * Uses the best 8 of the most recent 20 rounds
 */
export function calculateHandicapIndex(differentials: HandicapDifferential[]): HandicapCalculationResult {
  // Sort by date (most recent first)
  const sortedDifferentials = [...differentials].sort(
    (a, b) => new Date(b.round_date).getTime() - new Date(a.round_date).getTime()
  );

  // Take most recent 20 rounds
  const recentDifferentials = sortedDifferentials.slice(0, 20);
  
  // Determine number of rounds to use based on total rounds available
  let roundsToUse: number;
  const totalRounds = recentDifferentials.length;
  
  if (totalRounds >= 20) {
    roundsToUse = 8; // Best 8 of 20
  } else if (totalRounds >= 5) {
    roundsToUse = Math.floor(totalRounds * 0.4); // Approximately 40%
    roundsToUse = Math.max(1, roundsToUse); // At least 1
  } else if (totalRounds >= 3) {
    roundsToUse = 1; // Best 1 of 3-4
  } else {
    // Not enough rounds for official handicap
    return {
      handicap_index: 0,
      differentials_used: [],
      total_rounds: totalRounds,
      calculation_method: 'WHS',
      effective_date: new Date().toISOString(),
    };
  }

  // Sort by differential value and take the best (lowest) ones
  const bestDifferentials = recentDifferentials
    .sort((a, b) => a.differential - b.differential)
    .slice(0, roundsToUse);

  // Calculate average of best differentials
  const averageDifferential = bestDifferentials.reduce(
    (sum, diff) => sum + diff.differential, 
    0
  ) / bestDifferentials.length;

  // Apply handicap index calculation (average * 0.96 for WHS)
  const handicapIndex = Math.round(averageDifferential * 0.96 * 10) / 10;

  return {
    handicap_index: Math.max(0, handicapIndex), // Handicap can't be negative
    differentials_used: bestDifferentials,
    total_rounds: totalRounds,
    calculation_method: 'WHS',
    effective_date: new Date().toISOString(),
  };
}

/**
 * Fetch handicap differentials for a user, optionally filtered by bag
 */
export async function fetchHandicapDifferentials(
  userId: string,
  bagId?: string,
  limit: number = 20
): Promise<HandicapDifferential[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('rounds')
    .select(`
      id,
      total_score,
      round_date,
      bag_id,
      course_tees!inner (
        men_rating,
        men_slope
      )
    `)
    .eq('user_id', userId)
    .not('total_score', 'is', null)
    .not('course_tees.men_rating', 'is', null)
    .not('course_tees.men_slope', 'is', null)
    .order('round_date', { ascending: false })
    .limit(limit);

  if (bagId) {
    query = query.eq('bag_id', bagId);
  }

  const { data: rounds, error } = await query;

  if (error) {
    console.error('Error fetching rounds for handicap calculation:', error);
    throw error;
  }

  return rounds.map(round => ({
    id: `${round.id}-diff`,
    round_id: round.id,
    bag_id: round.bag_id,
    score: round.total_score,
    course_rating: round.course_tees.men_rating,
    slope_rating: round.course_tees.men_slope,
    differential: calculateHandicapDifferential(
      round.total_score,
      round.course_tees.men_rating,
      round.course_tees.men_slope
    ),
    round_date: round.round_date,
  }));
}

/**
 * Calculate and update handicap for a user (overall or by bag)
 */
export async function calculateAndUpdateHandicap(
  userId: string,
  bagId?: string
): Promise<HandicapCalculationResult> {
  try {
    // Fetch recent differentials
    const differentials = await fetchHandicapDifferentials(userId, bagId);
    
    // Calculate handicap index
    const result = calculateHandicapIndex(differentials);
    
    // Update the handicap in the appropriate place
    if (bagId) {
      // Update bag-specific handicap
      await updateBagHandicap(bagId, result.handicap_index);
    } else {
      // Update user's overall handicap in profile
      await updateUserHandicap(userId, result.handicap_index);
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating and updating handicap:', error);
    throw error;
  }
}

/**
 * Update handicap for a specific bag
 */
export async function updateBagHandicap(bagId: string, handicapIndex: number): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('bags')
    .update({ 
      handicap: handicapIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', bagId);

  if (error) {
    console.error('Error updating bag handicap:', error);
    throw error;
  }
}

/**
 * Update user's overall handicap in their profile
 */
export async function updateUserHandicap(userId: string, handicapIndex: number): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      handicap: handicapIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user handicap:', error);
    throw error;
  }
}

/**
 * Get handicap history for a user or bag
 */
export async function getHandicapHistory(
  userId: string,
  bagId?: string,
  limit: number = 50
): Promise<HandicapDifferential[]> {
  return await fetchHandicapDifferentials(userId, bagId, limit);
}

/**
 * Automatically update handicaps when a new round is completed
 */
export async function updateHandicapsAfterRound(
  userId: string,
  roundId: string,
  bagId?: string
): Promise<void> {
  try {
    // Update overall handicap
    await calculateAndUpdateHandicap(userId);
    
    // Update bag-specific handicap if applicable
    if (bagId) {
      await calculateAndUpdateHandicap(userId, bagId);
    }
    
    console.log(`Handicaps updated for user ${userId} after round ${roundId}`);
  } catch (error) {
    console.error('Error updating handicaps after round:', error);
    // Don't throw - handicap calculation failure shouldn't prevent round completion
  }
}

/**
 * Get current handicap for display purposes
 */
export async function getCurrentHandicap(
  userId: string,
  bagId?: string
): Promise<number | null> {
  const supabase = createClient();
  
  if (bagId) {
    // Get bag-specific handicap
    const { data: bag, error } = await supabase
      .from('bags')
      .select('handicap')
      .eq('id', bagId)
      .single();
      
    if (error || !bag) return null;
    return bag.handicap;
  } else {
    // Get user's overall handicap
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('handicap')
      .eq('id', userId)
      .single();
      
    if (error || !profile) return null;
    return profile.handicap;
  }
}

/**
 * Calculate expected score based on handicap and course difficulty
 */
export function calculateExpectedScore(
  handicapIndex: number,
  courseRating: number,
  slopeRating: number,
  par: number = 72
): number {
  // Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating - Par)
  const courseHandicap = Math.round(
    handicapIndex * (slopeRating / 113) + (courseRating - par)
  );
  
  return par + courseHandicap;
}

/**
 * Determine if a round qualifies for handicap calculation
 */
export function isRoundEligibleForHandicap(
  score: number,
  courseRating: number,
  slopeRating: number,
  par: number = 72
): boolean {
  // Basic validation
  if (!score || !courseRating || !slopeRating) return false;
  if (score < par - 10 || score > par + 50) return false; // Reasonable score range
  if (slopeRating < 55 || slopeRating > 155) return false; // Valid slope range
  if (courseRating < 60 || courseRating > 80) return false; // Reasonable rating range
  
  return true;
} 