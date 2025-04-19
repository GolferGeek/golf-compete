export interface Bag {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  handicap: number | null;
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