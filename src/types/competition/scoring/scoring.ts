export interface Score {
  id: string;
  event_id: string;
  participant_id: string;
  hole_number: number;
  strokes: number;
  putts?: number;
  penalties?: number;
  created_at: string;
  updated_at: string;
}

export interface ScoringRules {
  id: string;
  event_id: string;
  scoring_type: 'gross' | 'net' | 'both';
  max_score_per_hole?: number;
  handicap_allowance: number; // percentage as decimal (e.g., 0.85 for 85%)
  created_at: string;
  updated_at: string;
}

export interface Leaderboard {
  event_id: string;
  participant_id: string;
  rank: number;
  total_gross: number;
  total_net?: number;
  thru: number; // number of holes completed
  status: 'active' | 'finished' | 'withdrawn' | 'disqualified';
  last_updated: string;
} 