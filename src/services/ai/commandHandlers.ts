import { ProcessedCommand } from './aiService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Command handler interface
 */
export interface CommandHandlerResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Process a start_round command
 * @param command - The processed command
 * @param userId - The user ID
 * @returns Command handler result
 */
export async function handleStartRound(
  command: ProcessedCommand,
  userId: string
): Promise<CommandHandlerResult> {
  try {
    const parameters = command.parameters;
    let courseName = parameters.courseName;
    let courseId = parameters.courseId;
    
    // Find course by name if courseId not provided
    if (!courseId && courseName) {
      const { data: courses, error } = await supabase
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
        return {
          success: false,
          message: `Course "${courseName}" not found.`
        };
      }
    }
    
    // Validate course
    if (!courseId) {
      return {
        success: false,
        message: 'Please specify a valid course name.'
      };
    }
    
    // Get default tee set for the course
    const { data: teeSets, error: teeSetError } = await supabase
      .from('tee_sets')
      .select('id, name')
      .eq('course_id', courseId)
      .limit(1);
    
    if (teeSetError) {
      throw teeSetError;
    }
    
    if (!teeSets || teeSets.length === 0) {
      return {
        success: false,
        message: 'No tee sets found for this course.'
      };
    }
    
    const teeSetId = teeSets[0].id;
    
    // Get default bag for the user
    const { data: bags, error: bagError } = await supabase
      .from('bags')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1);
    
    if (bagError) {
      throw bagError;
    }
    
    if (!bags || bags.length === 0) {
      return {
        success: false,
        message: 'You need to set up a golf bag before starting a round.'
      };
    }
    
    const bagId = bags[0].id;
    
    // Parse date if provided, otherwise use current date
    const roundDate = parameters.date ? new Date(parameters.date) : new Date();
    
    // Create a new round
    const { data: round, error: roundError } = await supabase
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
 * @param command - The processed command
 * @param userId - The user ID
 * @param contextData - Additional context data
 * @returns Command handler result
 */
export async function handleRecordScore(
  command: ProcessedCommand,
  userId: string,
  contextData?: Record<string, any>
): Promise<CommandHandlerResult> {
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
    const { data: round, error: roundError } = await supabase
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
    const { data: holeData, error: holeError } = await supabase
      .from('holes')
      .select('par')
      .eq('course_id', round.course_id)
      .eq('hole_number', holeNumber)
      .single();
    
    if (holeError) {
      // Create a default par if hole doesn't exist
      const defaultPar = 4;
      
      // Record the score
      const { error: scoreError } = await supabase
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
      const { error: scoreError } = await supabase
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
    const { data: scores, error: scoresError } = await supabase
      .from('hole_scores')
      .select('score')
      .eq('round_id', roundId);
    
    if (!scoresError && scores) {
      const totalScore = scores.reduce((sum, hole) => sum + hole.score, 0);
      
      await supabase
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
 * @param command - The processed command
 * @param userId - The user ID
 * @param contextData - Additional context data
 * @returns Command handler result
 */
export async function handleAddNote(
  command: ProcessedCommand,
  userId: string,
  contextData?: Record<string, any>
): Promise<CommandHandlerResult> {
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
    const { data: round, error: roundError } = await supabase
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
    const { error: noteError } = await supabase
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

/**
 * Process any command by command type
 * @param command - The processed command
 * @param userId - The user ID
 * @param contextData - Additional context data
 * @returns Command handler result
 */
export async function processCommand(
  command: ProcessedCommand,
  userId: string,
  contextData?: Record<string, any>
): Promise<CommandHandlerResult> {
  switch (command.commandType) {
    case 'start_round':
      return handleStartRound(command, userId);
    case 'record_score':
      return handleRecordScore(command, userId, contextData);
    case 'add_note':
      return handleAddNote(command, userId, contextData);
    case 'ask_question':
      // For now, just return the response from the AI
      return {
        success: true,
        message: command.response,
      };
    default:
      return {
        success: false,
        message: 'I\'m not sure how to handle that request.',
      };
  }
} 