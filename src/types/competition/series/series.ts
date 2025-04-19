import { SeriesEvent } from './series-event';
import { SeriesParticipant } from './series-participant';
import { SeriesStatus } from './series-status';

export interface Series {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  scoring_type: 'gross' | 'net' | 'both';
  created_at: string;
  created_by: string;
  updated_at: string;
  series_events?: SeriesEvent[];
  series_participants?: SeriesParticipant[];
} 