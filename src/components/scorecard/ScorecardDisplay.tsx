'use client';

import { useState } from 'react';
import { 
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  course_id: string;
  course_name: string;
}

interface Round {
  id: string;
  player_name: string;
  status: string;
  total_score: number | null;
  total_to_par: number | null;
}

interface HoleScore {
  id: string;
  round_id: string;
  hole_number: number;
  par: number;
  strokes: number | null;
}

interface ScorecardDisplayProps {
  event: Event;
  holes: number[];
  rounds: Round[];
  holeScores: HoleScore[];
}

type ViewType = 'front9' | 'back9' | 'all';

export function ScorecardDisplay({ event, holes, rounds, holeScores }: ScorecardDisplayProps) {
  const [view, setView] = useState<ViewType>('all');

  const handleViewChange = (_event: React.SyntheticEvent, newValue: ViewType) => {
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {event.name} - Scorecard
        </Typography>
        <Box>
          <IconButton onClick={() => window.location.reload()} title="Refresh scores">
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
  );
} 