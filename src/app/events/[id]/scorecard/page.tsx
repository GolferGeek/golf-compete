'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { EventScorecardAuthGuard } from '@/components/auth/EventScorecardAuthGuard';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Player {
  id: string;
  name: string;
  profile_id: string;
  handicap: number | null;
}

interface Round {
  id: string;
  player_id: string;
  player_name: string;
  profile_id: string;
  date: string;
  status: string;
  total_score: number | null;
  total_to_par: number | null;
  net_score: number | null;
}

interface HoleScore {
  id: string;
  round_id: string;
  hole_number: number;
  par: number;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  penalty_strokes: number | null;
}

interface Event {
  id: string;
  name: string;
  course_id: string;
  start_date: string;
  end_date: string;
  course_name: string;
  courses: {
    name: string;
    city: string;
    state: string;
  } | null;
}

type ViewType = 'front9' | 'back9' | 'all';

export default function EventScorecardPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('all');
  const [holes, setHoles] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      loadEventData();
    }
  }, [user, params.id]);

  async function loadEventData() {
    try {
      setLoading(true);
      setError(null);

      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          course_id,
          start_date,
          end_date,
          courses:course_id (
            name,
            city,
            state
          )
        `)
        .eq('id', params.id)
        .single();

      if (eventError) throw new Error(`Error loading event: ${eventError.message}`);
      if (!eventData) throw new Error('Event not found');

      const courseData = Array.isArray(eventData.courses) 
        ? eventData.courses[0] as unknown as { name: string; city: string; state: string } 
        : (eventData.courses as unknown as { name: string; city: string; state: string } | null);

      const event: Event = {
        id: eventData.id,
        name: eventData.name,
        course_id: eventData.course_id,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        course_name: courseData?.name || 'Unknown Course',
        courses: courseData
      };

      setEvent(event);

      // Load course holes
      const { data: holesData, error: holesError } = await supabase
        .from('course_holes')
        .select(`
          hole_number,
          par
        `)
        .eq('course_id', event.course_id)
        .order('hole_number', { ascending: true });

      if (holesError) throw new Error(`Error loading holes: ${holesError.message}`);

      const holeNumbers = holesData.map(h => h.hole_number);
      setHoles(holeNumbers);

      // Load rounds for this event
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select(`
          id,
          profile_id,
          date_played,
          status,
          total_score,
          profiles:profile_id (
            name,
            first_name,
            last_name
          )
        `)
        .eq('event_id', params.id);

      if (roundsError) throw new Error(`Error loading rounds: ${roundsError.message}`);

      // Format rounds data
      const formattedRounds: Round[] = roundsData.map(r => {
        const profile = r.profiles as { name?: string; first_name?: string; last_name?: string } | null;
        return {
          id: r.id,
          player_id: r.profile_id,
          player_name: profile?.name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Player',
          profile_id: r.profile_id,
          date: r.date_played,
          status: r.status || 'in_progress',
          total_score: r.total_score,
          total_to_par: null,
          net_score: null
        };
      });

      setRounds(formattedRounds);

      // Load hole scores for all rounds
      if (formattedRounds.length > 0) {
        const roundIds = formattedRounds.map(r => r.id);
        const { data: scoresData, error: scoresError } = await supabase
          .from('hole_scores')
          .select(`
            id,
            round_id,
            hole_number,
            strokes,
            putts,
            fairway_hit,
            green_in_regulation,
            penalty_strokes,
            course_holes:hole_id (
              par
            )
          `)
          .in('round_id', roundIds);

        if (scoresError) throw new Error(`Error loading scores: ${scoresError.message}`);

        // Format hole scores
        const formattedScores: HoleScore[] = scoresData.map(s => {
          const courseHole = s.course_holes as unknown as { par: number } | null;
          return {
            id: s.id,
            round_id: s.round_id,
            hole_number: s.hole_number,
            par: courseHole?.par || 0,
            strokes: s.strokes,
            putts: s.putts,
            fairway_hit: s.fairway_hit,
            green_in_regulation: s.green_in_regulation,
            penalty_strokes: s.penalty_strokes
          };
        });

        setHoleScores(formattedScores);

        // Calculate total to par for each round
        const updatedRounds = formattedRounds.map(round => {
          const roundScores = formattedScores.filter(s => s.round_id === round.id);
          const totalPar = roundScores.reduce((sum, score) => sum + score.par, 0);
          const totalStrokes = roundScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
          
          return {
            ...round,
            total_to_par: totalStrokes > 0 ? totalStrokes - totalPar : null
          };
        });

        setRounds(updatedRounds);
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    loadEventData();
  };

  const handleViewChange = (event: React.SyntheticEvent, newValue: ViewType) => {
    setView(newValue);
  };

  const getHolesToDisplay = () => {
    if (view === 'front9') {
      return holes.filter(h => h <= 9);
    } else if (view === 'back9') {
      return holes.filter(h => h > 9);
    }
    return holes;
  };

  const formatScoreToPar = (score: number | null) => {
    if (score === null) return '-';
    return score === 0 ? 'E' : score > 0 ? `+${score}` : score.toString();
  };

  const getRoundStatus = (round: Round) => {
    switch (round.status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="primary" size="small" />;
      default:
        return <Chip label="Not Started" color="default" size="small" />;
    }
  };

  const content = (
    <Container maxWidth="xl">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : !event ? (
        <Alert severity="warning" sx={{ mt: 2 }}>Event not found</Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {event.name} - Scorecard
            </Typography>
            <Box>
              <IconButton onClick={handleRefresh} title="Refresh scores">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            {event.course_name}
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={view} onChange={handleViewChange}>
              <Tab label="All Holes" value="all" />
              <Tab label="Front 9" value="front9" />
              <Tab label="Back 9" value="back9" />
            </Tabs>
          </Box>

          {rounds.length === 0 ? (
            <Alert severity="info">No rounds have been started for this event.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    {getHolesToDisplay().map(holeNumber => (
                      <TableCell key={holeNumber} align="center">
                        {holeNumber}
                      </TableCell>
                    ))}
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">+/-</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Par</TableCell>
                    {getHolesToDisplay().map(holeNumber => {
                      const holeScore = holeScores.find(
                        score => score.hole_number === holeNumber
                      );
                      return (
                        <TableCell key={holeNumber} align="center">
                          {holeScore?.par || '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      {holeScores
                        .filter(score => 
                          getHolesToDisplay().includes(score.hole_number)
                        )
                        .reduce((sum, score) => sum + score.par, 0)}
                    </TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">-</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rounds.map(round => (
                    <TableRow key={round.id}>
                      <TableCell>{round.player_name}</TableCell>
                      {getHolesToDisplay().map(holeNumber => {
                        const holeScore = holeScores.find(
                          score => score.round_id === round.id && score.hole_number === holeNumber
                        );
                        return (
                          <TableCell 
                            key={holeNumber} 
                            align="center"
                            sx={{
                              bgcolor: holeScore?.strokes ? (
                                holeScore.strokes < holeScore.par ? '#e8f5e9' :
                                holeScore.strokes > holeScore.par ? '#ffebee' :
                                'inherit'
                              ) : 'inherit'
                            }}
                          >
                            {holeScore?.strokes || '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        {round.total_score || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {formatScoreToPar(round.total_to_par)}
                      </TableCell>
                      <TableCell align="center">
                        {getRoundStatus(round)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          component={Link}
                          href={`/rounds/${round.id}/edit`}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );

  return (
    <EventScorecardAuthGuard eventId={params.id}>
      {content}
    </EventScorecardAuthGuard>
  );
} 