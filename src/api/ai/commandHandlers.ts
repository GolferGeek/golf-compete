import { ProcessedCommand } from './aiService';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { CoursesApiClient } from '@/lib/apiClient/courses';
import { RoundsApiClient } from '@/lib/apiClient/rounds';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
    const { parameters } = command;
    let courseName = parameters.courseName;
    let courseId = parameters.courseId;
    
    // Find course by name if courseId not provided
    if (!courseId && courseName) {
      // Use API client instead of direct Supabase call
      const coursesResponse = await CoursesApiClient.getCourses({
        search: courseName,
        limit: 1
      });
      
      if (!coursesResponse.success || !coursesResponse.data?.courses.length) {
        return {
          success: false,
          message: `Course "${courseName}" not found.`
        };
      }
      
      courseId = coursesResponse.data.courses[0].id;
      courseName = coursesResponse.data.courses[0].name;
    }
    
    // Validate course
    if (!courseId) {
      return {
        success: false,
        message: 'Please specify a valid course name.'
      };
    }
    
    // Get default tee set for the course
    const teeSetsResponse = await CoursesApiClient.getCourseTees(courseId);
    
    if (!teeSetsResponse.success || !teeSetsResponse.data?.tees.length) {
      return {
        success: false,
        message: 'No tee sets found for this course.'
      };
    }
    
    const teeSetId = teeSetsResponse.data.tees[0].id;
    
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
    
    // Create a new round using API client
    const createRoundResponse = await RoundsApiClient.createRound({
      courseTeeId: teeSetId,
      roundDate: roundDate.toISOString(),
      status: 'active'
    });
    
    if (!createRoundResponse.success || !createRoundResponse.data) {
      throw new Error(createRoundResponse.error?.message || 'Failed to create round');
    }
    
    return {
      success: true,
      message: `Started a new round at ${courseName}. Good luck!`,
      data: { roundId: createRoundResponse.data.id }
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
    
    // Get details for this hole using API client
    const holesResponse = await CoursesApiClient.getCourseHoles(round.course_id);
    
    let holePar = 4; // Default par if hole not found
    
    if (holesResponse.success && holesResponse.data?.holes.length) {
      // Find the specific hole
      const hole = holesResponse.data.holes.find(h => h.holeNumber === Number(holeNumber));
      if (hole) {
        holePar = hole.par;
      }
    }
    
    // Record the score
    const { error: scoreError } = await supabase
      .from('hole_scores')
      .insert({
        round_id: roundId,
        hole_number: holeNumber,
        score: Number(parameters.score),
        par: holePar,
        fairway_hit: parameters.fairwayHit || null,
        green_in_regulation: parameters.gir || null,
        putts: parameters.putts || null,
        penalty_strokes: parameters.penalties || null,
      });
    
    if (scoreError) {
      throw scoreError;
    }
    
    return {
      success: true,
      message: `Recorded a score of ${parameters.score} on hole ${holeNumber}.`,
      data: { holeNumber: Number(holeNumber) }
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