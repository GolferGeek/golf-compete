import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { User } from '@/types/golf';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with full admin privileges
// Use this for operations that need elevated permissions
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY! // Service role key with admin privileges
);

// Client-side Supabase client with restricted permissions
// Safe to use in browser code, uses the anon/public key
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon key with limited permissions
);

/**
 * Authenticate a user by email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // In a real application, you would hash the password and compare with the stored hash
  // This is a simplified version for demonstration purposes
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const user = result[0];
  
  // In a real application, you would use a proper password comparison function
  // such as bcrypt.compare
  if (user.password !== password) {
    return null;
  }
  
  // Convert the database user to the User type
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handicap: user.handicap || undefined,
    profileImage: user.profileImage || undefined,
    memberSince: new Date(user.memberSince),
  };
}

/**
 * Create a new user
 */
export async function createUser(
  name: string, 
  email: string, 
  password: string
): Promise<User> {
  // In a real application, you would hash the password before storing
  const userId = crypto.randomUUID();
  const now = new Date();
  
  await db.insert(users).values({
    id: userId,
    name,
    email,
    password, // In a real app, this would be hashed
    memberSince: now,
  });
  
  return {
    id: userId,
    name,
    email,
    memberSince: now,
  };
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const user = result[0];
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handicap: user.handicap || undefined,
    profileImage: user.profileImage || undefined,
    memberSince: new Date(user.memberSince),
  };
} 