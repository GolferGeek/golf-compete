export type ClubType = 'driver' | 'wood' | 'hybrid' | 'iron' | 'wedge' | 'putter';
export type CompetitionStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type CompetitionType = 'stroke_play' | 'match_play' | 'stableford' | 'scramble' | 'best_ball';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  handicap: number | null;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  model: string;
  type: ClubType;
  loft: number | null;
  shaft_flex: string | null;
  shaft_length: number | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bag {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BagClub {
  id: string;
  bag_id: string;
  club_id: string;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  par: number;
  holes: number;
  rating: number | null;
  slope: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseHole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap: number;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_participants: number | null;
  status: CompetitionStatus;
  type: CompetitionType;
  is_handicap_enabled: boolean;
  is_public: boolean;
  entry_fee: number;
  prize_pool: number;
  rules: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  competition_id: string;
  user_id: string;
  handicap: number | null;
  bag_id: string | null;
  status: string;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  participant_id: string;
  competition_id: string;
  round_number: number;
  hole_number: number;
  strokes: number;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  penalties: number;
  notes: string | null;
  recorded_by: string;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionInvitation {
  id: string;
  competition_id: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type DatabaseSchema = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      clubs: {
        Row: Club;
        Insert: Omit<Club, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Club, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      bags: {
        Row: Bag;
        Insert: Omit<Bag, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Bag, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      bag_clubs: {
        Row: BagClub;
        Insert: Omit<BagClub, 'id' | 'created_at'>;
        Update: Partial<Omit<BagClub, 'id' | 'created_at'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>;
      };
      course_holes: {
        Row: CourseHole;
        Insert: Omit<CourseHole, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CourseHole, 'id' | 'created_at' | 'updated_at'>>;
      };
      competitions: {
        Row: Competition;
        Insert: Omit<Competition, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Competition, 'id' | 'creator_id' | 'created_at' | 'updated_at'>>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Participant, 'id' | 'competition_id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      scores: {
        Row: Score;
        Insert: Omit<Score, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Score, 'id' | 'participant_id' | 'competition_id' | 'created_at' | 'updated_at'>>;
      };
      competition_invitations: {
        Row: CompetitionInvitation;
        Insert: Omit<CompetitionInvitation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CompetitionInvitation, 'id' | 'competition_id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}; 