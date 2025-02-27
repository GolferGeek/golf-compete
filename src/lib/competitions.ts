import { db } from '@/db';
import { competitions, competitionParticipants, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { Competition, User } from '@/types/golf';

/**
 * Get all competitions
 */
export async function getAllCompetitions(): Promise<Competition[]> {
  const result = await db.select().from(competitions);
  
  return result.map(comp => ({
    id: comp.id,
    name: comp.name,
    type: comp.type as 'series' | 'event' | 'daily',
    startDate: new Date(comp.startDate),
    endDate: new Date(comp.endDate),
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
  const result = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const comp = result[0];
  
  // Get participants
  const participantsResult = await db
    .select({
      user: users,
    })
    .from(competitionParticipants)
    .innerJoin(users, eq(competitionParticipants.userId, users.id))
    .where(eq(competitionParticipants.competitionId, id));
  
  const participants: User[] = participantsResult.map(row => ({
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    handicap: row.user.handicap || undefined,
    profileImage: row.user.profileImage || undefined,
    memberSince: new Date(row.user.memberSince),
  }));
  
  return {
    id: comp.id,
    name: comp.name,
    type: comp.type as 'series' | 'event' | 'daily',
    startDate: new Date(comp.startDate),
    endDate: new Date(comp.endDate),
    description: comp.description,
    status: comp.status as 'upcoming' | 'active' | 'completed',
    format: comp.format,
    prizes: comp.prizes ? JSON.parse(comp.prizes) : undefined,
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
): Promise<Competition> {
  const [result] = await db.insert(competitions).values({
    name,
    type,
    startDate, // Pass the Date object directly
    endDate, // Pass the Date object directly
    description,
    status: startDate > new Date() ? 'upcoming' : 'active',
    format,
    prizes: prizes ? JSON.stringify(prizes) : null,
  }).returning();
  
  return {
    id: result.id,
    name: result.name,
    type: result.type as 'series' | 'event' | 'daily',
    startDate: new Date(result.startDate),
    endDate: new Date(result.endDate),
    description: result.description,
    status: result.status as 'upcoming' | 'active' | 'completed',
    format: result.format,
    prizes: result.prizes ? JSON.parse(result.prizes) : undefined,
    participants: [],
  };
}

/**
 * Add a user to a competition
 */
export async function addUserToCompetition(competitionId: string, userId: string): Promise<void> {
  await db.insert(competitionParticipants).values({
    competitionId,
    userId,
  });
}

/**
 * Get active competitions
 */
export async function getActiveCompetitions(): Promise<Competition[]> {
  const now = new Date().toISOString();
  
  const result = await db
    .select()
    .from(competitions)
    .where(
      and(
        eq(competitions.status, 'active'),
        sql`${competitions.startDate} <= ${now}`,
        sql`${competitions.endDate} >= ${now}`
      )
    );
  
  return result.map(comp => ({
    id: comp.id,
    name: comp.name,
    type: comp.type as 'series' | 'event' | 'daily',
    startDate: new Date(comp.startDate),
    endDate: new Date(comp.endDate),
    description: comp.description,
    status: comp.status as 'upcoming' | 'active' | 'completed',
    format: comp.format,
    prizes: comp.prizes ? JSON.parse(comp.prizes) : undefined,
    participants: [], // We'll need to fetch these separately
  }));
} 