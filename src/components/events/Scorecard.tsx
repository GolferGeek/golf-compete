import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  IconButton, 
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  TableContainer,
  Tabs,
  Tab
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { supabaseClient as supabase } from '@/lib/auth';
import { CoursesApiClient } from '@/lib/apiClient/courses';

interface Round {
  id: string;
  total_score: number | null;
  total_putts: number | null;
  fairways_hit: number | null;
  greens_in_regulation: number | null;
  player_name: string;
}

interface HoleInfo {
  hole_number: number;
  par: number;
  handicap_index: number;
}

interface ScorecardProps {
  rounds: Round[];
}

export default function Scorecard({ rounds }: ScorecardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTab, setCurrentTab] = useState(0); // 0 = front nine, 1 = back nine
  
  const [editingRound, setEditingRound] = useState<string | null>(null);
  const [holeScores, setHoleScores] = useState<Record<string, Record<number, number | null>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [courseInfo, setCourseInfo] = useState<{
    courseName: string;
    courseId: string;
    holes: HoleInfo[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch hole scores and course info when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (rounds.length === 0) return;
      
      try {
        setLoading(true);
        
        // First, get the course ID from the first round
        const firstRoundId = rounds[0].id;
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .select('course_id')
          .eq('id', firstRoundId)
          .single();
          
        if (roundError) throw roundError;
        if (!roundData?.course_id) throw new Error('No course ID found for round');
        
        const courseId = roundData.course_id;
        
        // Get course name using API client
        const courseResponse = await CoursesApiClient.getCourseById(courseId);
        
        if (!courseResponse.success || !courseResponse.data) {
          throw new Error(`Failed to load course: ${courseResponse.error?.message || 'Unknown error'}`);
        }
        
        const courseData = courseResponse.data;
        
        // Get holes for the course using API client
        const holesResponse = await CoursesApiClient.getCourseHoles(courseId);
        
        if (!holesResponse.success) {
          throw new Error(`Failed to load holes: ${holesResponse.error?.message || 'Unknown error'}`);
        }
        
        const holesData = holesResponse.data?.holes.map(hole => ({
          hole_number: hole.holeNumber,
          par: hole.par,
          handicap_index: hole.handicapIndex
        }));

        // If we don't have hole data, create default holes
        const holes = holesData?.length 
          ? holesData 
          : Array.from({ length: 18 }, (_, i) => ({
              hole_number: i + 1,
              par: 4,
              handicap_index: i + 1
            }));
        
        setCourseInfo({
          courseName: courseData.name || 'Unknown Course',
          courseId,
          holes: holes
        });
        
        // Get hole scores for all rounds
        const scoresPromises = rounds.map(async (round) => {
          const { data: scoreData, error: scoreError } = await supabase
            .from('hole_scores')
            .select('hole_number, strokes')
            .eq('round_id', round.id)
            .order('hole_number');
            
          if (scoreError) throw scoreError;
          
          // Convert to a map of hole number -> strokes
          const holeScoreMap: Record<number, number | null> = {};
          scoreData?.forEach(score => {
            holeScoreMap[score.hole_number] = score.strokes;
          });
          
          return { roundId: round.id, scores: holeScoreMap };
        });
        
        const scoresResults = await Promise.all(scoresPromises);
        
        // Build the hole scores state
        const newHoleScores: Record<string, Record<number, number | null>> = {};
        scoresResults.forEach(result => {
          newHoleScores[result.roundId] = result.scores;
        });
        
        setHoleScores(newHoleScores);
      } catch (err) {
        console.error('Error fetching scorecard data:', err);
        setError('Failed to load scorecard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [rounds]);

  const handleEditRound = (roundId: string) => {
    setEditingRound(roundId);
  };
  
  const handleCancelEdit = () => {
    setEditingRound(null);
  };

  const handleScoreChange = (roundId: string, holeNumber: number, value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    setHoleScores(prev => ({
      ...prev,
      [roundId]: {
        ...prev[roundId],
        [holeNumber]: numValue
      }
    }));
  };

  const handleSaveScore = async (roundId: string, holeNumber: number) => {
    try {
      setSaving(true);
      const score = holeScores[roundId]?.[holeNumber];
      
      if (score === undefined) return; // Nothing to save
      
      // Check if we already have a score for this hole
      const { data: existingScore, error: fetchError } = await supabase
        .from('hole_scores')
        .select('id')
        .eq('round_id', roundId)
        .eq('hole_number', holeNumber)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }
      
      if (existingScore) {
        // Update existing score
        const { error } = await supabase
          .from('hole_scores')
          .update({ strokes: score })
          .eq('id', existingScore.id);
          
        if (error) throw error;
      } else if (score !== null) {
        // Insert new score
        const { error } = await supabase
          .from('hole_scores')
          .insert({
            round_id: roundId,
            hole_number: holeNumber,
            strokes: score,
            green_in_regulation: false, // Default values
            putts: 2 // Default value
          });
          
        if (error) throw error;
      }
      
      // After saving, recalculate totals will happen automatically via DB trigger
    } catch (err) {
      console.error('Error saving score:', err);
      setError('Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  const calculateFrontNineTotal = (roundId: string) => {
    if (!holeScores[roundId]) return null;
    
    let total = 0;
    let validScores = 0;
    for (let i = 1; i <= 9; i++) {
      if (holeScores[roundId][i] !== undefined && holeScores[roundId][i] !== null) {
        total += holeScores[roundId][i] || 0;
        validScores++;
      }
    }
    return validScores > 0 ? total : null;
  };
  
  const calculateBackNineTotal = (roundId: string) => {
    if (!holeScores[roundId]) return null;
    
    let total = 0;
    let validScores = 0;
    for (let i = 10; i <= 18; i++) {
      if (holeScores[roundId][i] !== undefined && holeScores[roundId][i] !== null) {
        total += holeScores[roundId][i] || 0;
        validScores++;
      }
    }
    return validScores > 0 ? total : null;
  };
  
  const calculateTotal = (roundId: string) => {
    const frontNine = calculateFrontNineTotal(roundId);
    const backNine = calculateBackNineTotal(roundId);
    
    if (frontNine === null && backNine === null) return null;
    return (frontNine || 0) + (backNine || 0);
  };
  
  const calculateParTotal = (start: number, end: number) => {
    if (!courseInfo?.holes) return 36; // Default
    
    let total = 0;
    for (let i = start; i <= end; i++) {
      const hole = courseInfo.holes.find(h => h.hole_number === i);
      total += hole?.par || 4;
    }
    return total;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (rounds.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No rounds found for this event.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading scorecard...</Typography>
      </Box>
    );
  }

  // Create the hole range based on the current tab
  const holeStart = currentTab === 0 ? 1 : 10;
  const holeEnd = currentTab === 0 ? 9 : 18;
  const holeRange = Array.from(
    { length: holeEnd - holeStart + 1 }, 
    (_, i) => i + holeStart
  );

  return (
    <Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Typography variant="h5" gutterBottom align="center">
        {courseInfo?.courseName || 'Scorecard'}
      </Typography>
      
      {isMobile && (
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ mb: 2 }}
        >
          <Tab label="Front 9" />
          <Tab label="Back 9" />
        </Tabs>
      )}
      
      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Hole</TableCell>
              {holeRange.map(hole => (
                <TableCell key={hole} align="center" sx={{ fontWeight: 'bold' }}>
                  {hole}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {currentTab === 0 ? 'Out' : 'In'}
              </TableCell>
              {!isMobile && (
                <>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {currentTab === 0 ? 'In' : 'Out'}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Total
                  </TableCell>
                </>
              )}
            </TableRow>
            
            {/* Handicap Row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Handicap</TableCell>
              {holeRange.map(hole => {
                const holeInfo = courseInfo?.holes.find(h => h.hole_number === hole);
                return (
                  <TableCell key={`hdcp-${hole}`} align="center">
                    {holeInfo?.handicap_index || '-'}
                  </TableCell>
                );
              })}
              <TableCell align="center">-</TableCell>
              {!isMobile && (
                <>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="center">-</TableCell>
                </>
              )}
            </TableRow>
            
            {/* Par Row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Par</TableCell>
              {holeRange.map(hole => {
                const holeInfo = courseInfo?.holes.find(h => h.hole_number === hole);
                return (
                  <TableCell key={`par-${hole}`} align="center">
                    {holeInfo?.par || 4}
                  </TableCell>
                );
              })}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {calculateParTotal(holeStart, holeEnd)}
              </TableCell>
              {!isMobile && (
                <>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateParTotal(currentTab === 0 ? 10 : 1, currentTab === 0 ? 18 : 9)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateParTotal(1, 18)}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {rounds.map(round => (
              <TableRow 
                key={round.id}
                sx={{ 
                  '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                  backgroundColor: editingRound === round.id ? 'rgba(144, 202, 249, 0.1)' : 'inherit'
                }}
              >
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between' 
                  }}
                >
                  <Box component="span" sx={{ mr: 1 }}>
                    {round.player_name || 'Player'}
                  </Box>
                  <Tooltip title={editingRound === round.id ? "Save All" : "Edit Scores"}>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        if (editingRound === round.id) {
                          // Save all edited scores
                          const scores = holeScores[round.id] || {};
                          Object.entries(scores).forEach(([hole, score]) => {
                            if (score !== null) {
                              handleSaveScore(round.id, parseInt(hole));
                            }
                          });
                          setEditingRound(null);
                        } else {
                          handleEditRound(round.id);
                        }
                      }}
                      color={editingRound === round.id ? "primary" : "default"}
                      disabled={saving}
                    >
                      {editingRound === round.id ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                
                {holeRange.map(hole => (
                  <TableCell key={`${round.id}-${hole}`} align="center">
                    {editingRound === round.id ? (
                      <TextField
                        type="number"
                        size="small"
                        value={holeScores[round.id]?.[hole] === null ? '' : holeScores[round.id]?.[hole] || ''}
                        onChange={(e) => handleScoreChange(round.id, hole, e.target.value)}
                        onBlur={() => handleSaveScore(round.id, hole)}
                        inputProps={{ 
                          min: 1, 
                          max: 20,
                          style: { 
                            textAlign: 'center',
                            padding: '4px',
                            width: '30px'
                          } 
                        }}
                        variant="standard"
                      />
                    ) : (
                      holeScores[round.id]?.[hole] || '-'
                    )}
                  </TableCell>
                ))}
                
                {/* Out/In Total */}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  {currentTab === 0 
                    ? calculateFrontNineTotal(round.id) || '-' 
                    : calculateBackNineTotal(round.id) || '-'}
                </TableCell>
                
                {/* Show In/Out and Total only on desktop */}
                {!isMobile && (
                  <>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {currentTab === 0 
                        ? calculateBackNineTotal(round.id) || '-' 
                        : calculateFrontNineTotal(round.id) || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {calculateTotal(round.id) || '-'}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Mobile view: Show total scores */}
      {isMobile && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="center">Out</TableCell>
                <TableCell align="center">In</TableCell>
                <TableCell align="center">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rounds.map(round => (
                <TableRow key={`summary-${round.id}`}>
                  <TableCell>{round.player_name || 'Player'}</TableCell>
                  <TableCell align="center">{calculateFrontNineTotal(round.id) || '-'}</TableCell>
                  <TableCell align="center">{calculateBackNineTotal(round.id) || '-'}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateTotal(round.id) || '-'}
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