import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get user ID from auth headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }
    
    // Get command data from request
    const { command, contextData } = await request.json();
    
    if (!command || !command.commandType) {
      return NextResponse.json(
        { error: 'Valid command is required' },
        { status: 400 }
      );
    }
    
    // Process different command types
    let result;
    
    switch (command.commandType) {
      case 'start_round':
        result = await handleStartRound(command, userId);
        break;
        
      case 'record_score':
        result = await handleRecordScore(command, userId, contextData);
        break;
        
      case 'add_note':
        result = await handleAddNote(command, userId, contextData);
        break;
        
      case 'ask_question':
        // For ask_question, we just return the response from the AI
        result = { 
          success: true, 
          message: command.response || 'I hope that helps!',
        };
        break;
        
      default:
        result = { 
          success: false, 
          message: 'Unknown command type',
        };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Process a start_round command
 */
async function handleStartRound(
  command: any,
  userId: string
) {
  try {
    const parameters = command.parameters;
    let courseName = parameters.courseName;
    let courseId = parameters.courseId;
    
    // Find course by name if courseId not provided
    if (!courseId && courseName) {
      const { data: courses, error } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .ilike('name', `%${courseName}%`)
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (courses && courses.length > 0) {
        courseId = courses[0].id;
        courseName = courses[0].name;
      } else {
        throw new Error(`Course "${courseName}" not found`);
      }
    }
    
    // Validate course
    if (!courseId) {
      throw new Error('Please specify a valid course name');
    }
    
    // Get default tee set for the course
    const { data: teeSets, error: teeSetError } = await supabaseAdmin
      .from('tee_sets')
      .select('id, name')
      .eq('course_id', courseId)
      .limit(1);
    
    if (teeSetError) {
      throw teeSetError;
    }
    
    if (!teeSets || teeSets.length === 0) {
      throw new Error('No tee sets found for this course');
    }
    
    const teeSetId = teeSets[0].id;
    
    // Get default bag for the user
    const { data: bags, error: bagError } = await supabaseAdmin
      .from('bags')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1);
    
    if (bagError) {
      throw bagError;
    }
    
    if (!bags || bags.length === 0) {
      throw new Error('You need to set up a golf bag before starting a round');
    }
    
    const bagId = bags[0].id;
    
    // Get date from command or use today
    const roundDate = parameters.date ? new Date(parameters.date) : new Date();
    
    // Create a new round
    const { data: round, error: roundError } = await supabaseAdmin
      .from('rounds')
      .insert({
        profile_id: userId,
        course_id: courseId,
        tee_set_id: teeSetId,
        bag_id: bagId,
        date_played: roundDate.toISOString(),
        weather_conditions: [],
        course_conditions: [],
        notes: parameters.notes || null,
      })
      .select()
      .single();
    
    if (roundError) {
      throw roundError;
    }
    
    return {
      success: true,
      message: `Started a new round at ${courseName}. Good luck!`,
      data: { roundId: round.id }
    };
  } catch (error) {
    console.error('Error handling start round command:', error);
    return {
      success: false,
      message: 'I had trouble starting a new round. Please try again.',
    };
  }
}

/**
 * Process a record_score command
 */
async function handleRecordScore(
  command: any,
  userId: string,
  contextData?: Record<string, any>
) {
  try {
    const { parameters } = command;
    
    // Check for required parameters
    if (!parameters.score) {
      return {
        success: false,
        message: 'Please specify a score.',
      };
    }
    
    // Need round ID from context or parameters
    const roundId = contextData?.roundId || parameters.roundId;
    if (!roundId) {
      return {
        success: false,
        message: 'Please specify which round you want to record a score for.',
      };
    }
    
    // Verify round exists and belongs to user
    const { data: round, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('id, course_id')
      .eq('id', roundId)
      .eq('user_id', userId)
      .single();
    
    if (roundError || !round) {
      return {
        success: false,
        message: 'I couldn\'t find that round in your history.',
      };
    }
    
    // Get hole number from context, parameters, or default to 1
    const holeNumber = 
      contextData?.holeNumber || 
      parameters.holeNumber || 
      parameters.hole || 
      1;
    
    // Get details for this hole
    const { data: holeData, error: holeError } = await supabaseAdmin
      .from('holes')
      .select('par')
      .eq('course_id', round.course_id)
      .eq('hole_number', holeNumber)
      .single();
    
    if (holeError) {
      // Create a default par if hole doesn't exist
      const defaultPar = 4;
      
      // Record the score
      const { error: scoreError } = await supabaseAdmin
        .from('hole_scores')
        .insert({
          round_id: roundId,
          hole_number: holeNumber,
          score: parameters.score,
          par: defaultPar,
          fairway_hit: parameters.fairwayHit || null,
          green_in_regulation: parameters.gir || null,
          putts: parameters.putts || null,
          penalty_strokes: parameters.penalties || null,
        });
      
      if (scoreError) {
        throw scoreError;
      }
    } else {
      // Record the score with actual par
      const { error: scoreError } = await supabaseAdmin
        .from('hole_scores')
        .insert({
          round_id: roundId,
          hole_number: holeNumber,
          score: parameters.score,
          par: holeData.par,
          fairway_hit: parameters.fairwayHit || null,
          green_in_regulation: parameters.gir || null,
          putts: parameters.putts || null,
          penalty_strokes: parameters.penalties || null,
        });
      
      if (scoreError) {
        throw scoreError;
      }
    }
    
    // Update the total score on the round
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from('hole_scores')
      .select('score')
      .eq('round_id', roundId);
    
    if (!scoresError && scores) {
      const totalScore = scores.reduce((sum, hole) => sum + hole.score, 0);
      
      await supabaseAdmin
        .from('rounds')
        .update({ total_score: totalScore })
        .eq('id', roundId);
    }
    
    return {
      success: true,
      message: `Recorded a ${parameters.score} on hole ${holeNumber}.`,
      data: { holeNumber, score: parameters.score }
    };
  } catch (error) {
    console.error('Error handling record score command:', error);
    return {
      success: false,
      message: 'I had trouble recording your score. Please try again.',
    };
  }
}

/**
 * Process an add_note command
 */
async function handleAddNote(
  command: any,
  userId: string,
  contextData?: Record<string, any>
) {
  try {
    const { parameters } = command;
    
    // Need note content
    if (!parameters.note && !parameters.content) {
      return {
        success: false,
        message: 'Please provide some note content.',
      };
    }
    
    // Need round ID from context or parameters
    const roundId = contextData?.roundId || parameters.roundId;
    if (!roundId) {
      return {
        success: false,
        message: 'Please specify which round you want to add a note to.',
      };
    }
    
    // Verify round exists and belongs to user
    const { data: round, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('id')
      .eq('id', roundId)
      .eq('user_id', userId)
      .single();
    
    if (roundError || !round) {
      return {
        success: false,
        message: 'I couldn\'t find that round in your history.',
      };
    }
    
    // Get hole number from context or parameters
    const holeNumber = contextData?.holeNumber || parameters.holeNumber || parameters.hole || null;
    
    // Add the note
    const { error: noteError } = await supabaseAdmin
      .from('round_notes')
      .insert({
        user_id: userId,
        round_id: roundId,
        note_text: parameters.note || parameters.content,
        hole_number: holeNumber,
        note_category: parameters.category || null,
      });
    
    if (noteError) {
      throw noteError;
    }
    
    return {
      success: true,
      message: 'Your note has been saved.',
      data: { noteText: parameters.note || parameters.content }
    };
  } catch (error) {
    console.error('Error handling add note command:', error);
    return {
      success: false,
      message: 'I had trouble saving your note. Please try again.',
    };
  }
} 