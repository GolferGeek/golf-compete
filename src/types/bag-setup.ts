export interface BagSetup {
  id: string;
  user_id: string;
  setup_name: string;
  description?: string;
  current_handicap?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBagSetupRequest {
  setup_name: string;
  description?: string;
  current_handicap?: number;
  is_default?: boolean;
}

export interface UpdateBagSetupRequest {
  setup_name?: string;
  description?: string;
  current_handicap?: number;
  is_default?: boolean;
} 