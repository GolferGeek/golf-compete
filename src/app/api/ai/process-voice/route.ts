import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

// Initialize OpenAI with the API key from environment variables
// This only runs on the server, keeping the API key secure
console.log('🔑 Server: Checking for OpenAI API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
console.log('🔑 Server: Checking for Supabase credentials:', {
  urlPresent: !!supabaseUrl,
  serviceKeyPresent: !!supabaseServiceKey,
});
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Check if debug mode is enabled (fallback to false if not specified)
function isVerboseLoggingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_AI_STEPS === 'true';
}

// Log AI steps with more details when verbose logging is enabled
function logAiStep(message: string, data?: any): void {
  console.log(`🤖 AI STEP: ${message}`, data || '');
  
  // Add additional detailed logging when verbose mode is enabled
  if (isVerboseLoggingEnabled()) {
    if (data && typeof data === 'object') {
      try {
        // Pretty print objects in dev mode for better readability
        const detailedData = process.env.NODE_ENV === 'development' 
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data);
          
        console.log(`🔍 VERBOSE AI STEP DETAILS:\n${detailedData}`);
      } catch (e) {
        console.log(`🔍 VERBOSE AI STEP DETAILS: [Could not stringify data]`);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  logAiStep('Received voice processing request');
  console.log('🤖 SERVER TRACE: Received voice processing request');
  try {
    // Get user ID from auth headers
    const userId = request.headers.get('x-user-id');
    logAiStep('User ID from headers', { userId });
    console.log('🤖 SERVER TRACE: User ID from headers:', userId);
    
    if (!userId) {
      console.log('❌ SERVER TRACE: Missing user ID');
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }
    
    // Get request body (can include either audio blob or text content)
    const formData = await request.formData();
    logAiStep('Received form data', { 
      hasAudio: formData.has('audio'),
      hasContent: formData.has('content'),
      hasContextData: formData.has('contextData')
    });
    
    // Parse contextData if provided
    let contextData: Record<string, any> = {};
    const contextDataStr = formData.get('contextData');
    if (contextDataStr && typeof contextDataStr === 'string') {
      try {
        contextData = JSON.parse(contextDataStr);
        logAiStep('Context data parsed', contextData);
      } catch (error) {
        console.error('❌ SERVER TRACE: Error parsing contextData:', error);
      }
    }
    
    // Extract content (text) or audio
    let content = formData.get('content');
    let audioBlob = formData.get('audio');
    
    // Validate that at least one of content or audio is provided
    if (!content && !audioBlob) {
      console.log('❌ SERVER TRACE: Missing content and audio');
      return NextResponse.json(
        { error: 'Either content or audio is required' },
        { status: 400 }
      );
    }
    
    // Process audio if provided (convert speech to text)
    if (audioBlob && !content) {
      logAiStep('Starting audio transcription');
      console.log('🤖 SERVER TRACE: Starting audio transcription');
      
      // Check if audioBlob is a valid audio blob
      if (!audioBlob || typeof audioBlob !== 'object') {
        console.log('❌ SERVER TRACE: Invalid audio format');
        return NextResponse.json(
          { error: 'Invalid audio format' },
          { status: 400 }
        );
      }
      
      try {
        // Create a buffer from the blob
        const buffer = Buffer.from(await audioBlob.arrayBuffer());
        
        // Create a temporary file with the audio data
        const tempFilePath = `/tmp/audio-${Date.now()}.webm`;
        await fs.writeFile(tempFilePath, buffer);
        logAiStep('Audio file saved temporarily', { path: tempFilePath, size: buffer.length });
        
        // Use OpenAI to transcribe the audio
        const transcription = await openai.audio.transcriptions.create({
          file: createReadStream(tempFilePath),
          model: "whisper-1",
        });
        
        // Clean up the temporary file
        await fs.unlink(tempFilePath);
        
        content = transcription.text;
        logAiStep('Audio transcription complete', { transcribed: content });
        console.log('🤖 SERVER TRACE: Audio transcription result:', content);
      } catch (error) {
        console.error('❌ SERVER TRACE: Error in audio transcription:', error);
        return NextResponse.json(
          { 
            error: 'Error transcribing audio',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }
    
    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.log('❌ SERVER TRACE: Empty or invalid content');
      return NextResponse.json(
        { error: 'Content cannot be empty' },
        { status: 400 }
      );
    }
    
    // Process the command
    logAiStep('Processing golf command', { content, hasContextData: !!Object.keys(contextData).length });
    console.log('🤖 SERVER TRACE: Processing golf command:', content);
    const processedCommand = await processGolfCommand(content, contextData);
    logAiStep('Command processed', { 
      commandType: processedCommand.commandType,
      hasParameters: !!Object.keys(processedCommand.parameters).length,
      response: processedCommand.response
    });
    
    // Store the interaction in the database
    await storeInteraction({
      userId,
      interactionType: 'voice_command',
      voiceInput: content,
      processedCommand,
      response: processedCommand.response,
    });
    
    // Execute specific command types on the server side if needed
    let result = { 
      success: true,
      response: processedCommand.response,
      processedCommand
    };
    
    if (processedCommand.commandType === 'start_round') {
      logAiStep('Handling start_round command');
      try {
        const startResult = await handleStartRoundCommand(userId, processedCommand.parameters, contextData);
        if (startResult) {
          // Update the processedCommand with the created round ID
          processedCommand.parameters.createdRoundId = startResult.roundId;
          
          // Add event information if the round is part of an event
          if (startResult.eventId) {
            processedCommand.parameters.eventId = startResult.eventId;
            result.response = `I've started a new round at ${startResult.courseName || 'the course'} for this event. I'll take you to the event scoring page now.`;
          } else {
            result.response = `I've started a new round at ${startResult.courseName || 'the course'}. I'll take you to the scoring page now.`;
          }
          
          result.processedCommand = processedCommand;
        }
      } catch (error) {
        console.error('❌ SERVER TRACE: Error in handleStartRoundCommand:', error);
        processedCommand.response = `Error starting round: ${error instanceof Error ? error.message : String(error)}`;
        result.response = processedCommand.response;
      }
    } else if (processedCommand.commandType === 'record_score') {
      logAiStep('Handling record_score command', processedCommand.parameters);
      try {
        await handleRecordScoreCommand(userId, processedCommand.parameters, contextData);
        result.response = `I've recorded your score of ${processedCommand.parameters.score} for hole ${processedCommand.parameters.holeNumber}.`;
      } catch (error) {
        console.error('❌ SERVER TRACE: Error in handleRecordScoreCommand:', error);
        result.response = `Error recording score: ${error instanceof Error ? error.message : String(error)}`;
        result.success = false;
      }
    } else if (processedCommand.commandType === 'add_note') {
      logAiStep('Handling add_note command', processedCommand.parameters);
      try {
        // Start the note saving process but don't await it
        // This makes note creation asynchronous so the user can continue immediately
        const noteContent = processedCommand.parameters.note || processedCommand.parameters.content;
        
        // Return an immediate response to the user
        result.response = `Got it. Adding your note: "${noteContent}".`;
        
        // Fire and forget - process the note in the background
        handleAddNoteCommand(userId, processedCommand.parameters, contextData)
          .then(noteResult => {
            console.log('🤖 SERVER TRACE: Note saved successfully in background', noteResult);
          })
          .catch(error => {
            console.error('❌ SERVER TRACE: Error saving note in background:', error);
          });
          
        // Note: We don't wait for the handleAddNoteCommand to complete
      } catch (error) {
        console.error('❌ SERVER TRACE: Error initiating note process:', error);
        result.response = `I'll make a note of that.`;
        result.success = false;
      }
    }
    
    logAiStep('Returning final response', { success: result.success, hasCommand: !!result.processedCommand });
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ SERVER TRACE: Unexpected error in voice processing:', error);
    return NextResponse.json(
      { 
        error: 'Error processing voice command',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handles the "start_round" command by creating a new round
 */
async function handleStartRoundCommand(userId: string, parameters: any, contextData?: any) {
  logAiStep('handleStartRoundCommand started', parameters);
  console.log('🤖 SERVER TRACE: handleStartRoundCommand started with parameters:', parameters);
  
  try {
    // Extract parameters
    const { courseName, courseId, date } = parameters;
    logAiStep('Parameters extracted', { courseName, courseId, date });
    
    // Validate parameters
    if (!courseName && !courseId) {
      logAiStep('Missing course information', { courseName, courseId });
      throw new Error('Course name or ID is required to start a round');
    }
    
    // If we have a course ID, verify it exists
    let validCourseId = courseId;
    if (courseId) {
      logAiStep('Verifying course ID', { courseId });
      const { data: courseData, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .eq('id', courseId)
        .single();
      
      if (courseError || !courseData) {
        logAiStep('Course ID verification failed', { error: courseError?.message });
        throw new Error('Could not find a course with that ID');
      }
      
      validCourseId = courseData.id;
      logAiStep('Course ID verified', { validCourseId, courseName: courseData.name });
    } 
    // If we have a course name but no ID, search for the course
    else if (courseName) {
      logAiStep('Searching for course by name', { courseName });
      const { data: courseData, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .ilike('name', `%${courseName}%`)
        .limit(1);
      
      if (courseError || !courseData || courseData.length === 0) {
        logAiStep('Course not found by name', { error: courseError?.message });
        throw new Error(`Could not find a course named "${courseName}"`);
      }
      
      validCourseId = courseData[0].id;
      logAiStep('Course found by name', { validCourseId, courseName: courseData[0].name });
    }
    
    // Create the round
    logAiStep('Creating new round', { courseId: validCourseId, userId });
    const { data: roundData, error: roundError } = await supabaseAdmin
      .from('rounds')
      .insert({
        profile_id: userId,
        course_id: validCourseId,
        date: date || new Date().toISOString().split('T')[0],
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (roundError || !roundData) {
      logAiStep('Error creating round', { error: roundError?.message });
      throw new Error('Error creating round: ' + (roundError?.message || 'Unknown error'));
    }
    
    logAiStep('Round created successfully', { roundId: roundData.id });
    
    // Check if the round is part of an event
    const eventId = contextData?.eventId;
    if (eventId) {
      logAiStep('Checking if round is part of an event');
      const { data: eventData, error: eventError } = await supabaseAdmin
        .from('events')
        .select('id, name')
        .eq('id', eventId)
        .single();
      
      if (eventError || !eventData) {
        logAiStep('Event verification failed', { error: eventError?.message });
        throw new Error('Could not find an event with that ID');
      }
      
      logAiStep('Event verified', { eventId, eventName: eventData.name });
      
      return {
        roundId: roundData.id,
        eventId,
        courseId: validCourseId,
        courseName: eventData.name
      };
    }
    
    return { roundId: roundData.id };
  } catch (error) {
    logAiStep('Error in handleStartRoundCommand', { error: error instanceof Error ? error.message : String(error) });
    console.error('❌ SERVER TRACE: Error in handleStartRoundCommand:', error);
    throw error;
  }
}

/**
 * Processes a golf-related command using OpenAI
 */
async function processGolfCommand(
  command: string, 
  contextData?: Record<string, any>
) {
  console.log('🤖 SERVER TRACE: processGolfCommand called with:', { command, contextData: JSON.stringify(contextData) });
  
  // Define system prompt for command processing
  const systemPrompt = `
    You are an AI assistant specialized in golf. Your task is to:
    1. Classify the user's voice command
    2. Extract relevant parameters
    3. Generate a brief, helpful response

    Command types:
    - start_round: Starting a new round of golf
    - record_score: Recording a score for a hole
    - add_note: Adding a note about play or conditions
    - ask_question: Answering a golf-related question

    Format your response as a JSON object with:
    - commandType: The type of command (one of the options above)
    - parameters: An object with relevant parameters like course name, score, hole number, etc.
    - response: A brief, friendly response to confirm the action or answer the question

    Keep responses concise and golf-appropriate.
    
    IMPORTANT: When returning a start_round command, use courseName (text) or courseId (UUID) in the parameters, not "course" or "course_id".
  `;

  // Contextualize the user prompt based on available data
  let userPrompt = command;
  if (contextData) {
    console.log('🤖 SERVER TRACE: Adding context to user prompt');
    if (contextData.roundId) {
      userPrompt += ` (Current round ID: ${contextData.roundId})`;
    }
    if (contextData.holeNumber) {
      userPrompt += ` (Current hole: ${contextData.holeNumber})`;
    }
    if (contextData.courseId) {
      userPrompt += ` (Current course ID: ${contextData.courseId})`;
    }
  }
  console.log('🤖 SERVER TRACE: Final user prompt:', userPrompt);

  try {
    // Call OpenAI API
    console.log('🤖 SERVER TRACE: Calling OpenAI API');
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`🤖 SERVER TRACE: OpenAI API response received in ${elapsed}ms`);

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      console.log('❌ SERVER TRACE: Empty response from OpenAI');
      throw new Error('Empty response from OpenAI');
    }

    console.log('🤖 SERVER TRACE: Raw OpenAI response:', responseContent);
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log('🤖 SERVER TRACE: Parsed successfully into JSON');
      return parsedResponse;
    } catch (parseError) {
      console.error('❌ SERVER TRACE: Error parsing JSON response:', parseError);
      console.error('❌ SERVER TRACE: Invalid JSON response:', responseContent);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('❌ SERVER TRACE: Error calling OpenAI API:', error);
    throw new Error('OpenAI API call failed: ' + String(error));
  }
}

/**
 * Stores an interaction in the database
 */
async function storeInteraction(data: {
  userId: string;
  interactionType: string;
  voiceInput: string;
  processedCommand: Record<string, any>;
  response: string;
  audioUrl?: string;
}) {
  console.log('🔊 Server: storeInteraction called with data for user:', data.userId);
  try {
    const { error } = await supabaseAdmin
      .from('user_voice_interactions')
      .insert({
        user_id: data.userId,
        interaction_type: data.interactionType,
        voice_input: data.voiceInput,
        processed_command: data.processedCommand,
        response: data.response,
        audio_url: data.audioUrl,
      });
      
    if (error) {
      console.error('❌ Server: Supabase error storing interaction:', error);
      throw error;
    }
    
    console.log('🔊 Server: Interaction stored successfully');
  } catch (error) {
    console.error('❌ Server: Error storing interaction:', error);
    // Continue even if storage fails
  }
}

/**
 * Handles recording a score for a specific hole in a round
 */
async function handleRecordScoreCommand(userId: string, parameters: any, contextData?: any) {
  console.log('🤖 SERVER TRACE: handleRecordScoreCommand started with parameters:', parameters);
  
  try {
    // Extract parameters
    const roundId = parameters.roundId || contextData?.roundId;
    const holeNumber = parameters.holeNumber || contextData?.holeNumber;
    const score = parameters.score;
    
    // Validate parameters
    if (!roundId) {
      console.log('❌ SERVER TRACE: No round ID provided for recording score');
      throw new Error('No round ID provided. Please specify which round to record the score for.');
    }
    
    if (!holeNumber) {
      console.log('❌ SERVER TRACE: No hole number provided for recording score');
      throw new Error('No hole number provided. Please specify which hole to record the score for.');
    }
    
    if (!score) {
      console.log('❌ SERVER TRACE: No score provided for recording');
      throw new Error('No score provided. Please specify the score for the hole.');
    }
    
    // Validate that the round belongs to the user
    console.log('🤖 SERVER TRACE: Verifying round belongs to user');
    const { data: roundData, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('id')
      .eq('id', roundId)
      .eq('profile_id', userId)
      .single();
    
    if (roundError || !roundData) {
      console.error('❌ SERVER TRACE: Round validation error:', roundError);
      throw new Error('Could not find a round with that ID for your account.');
    }
    
    // Check if a score already exists for this hole
    console.log('🤖 SERVER TRACE: Checking if score already exists for hole', holeNumber);
    const { data: existingScore, error: existingScoreError } = await supabaseAdmin
      .from('hole_scores')
      .select('id')
      .eq('round_id', roundId)
      .eq('hole_number', holeNumber)
      .single();
    
    // Calculate other score values if provided
    const putts = parameters.putts !== undefined ? parameters.putts : null;
    const fairwayHit = parameters.fairwayHit !== undefined ? parameters.fairwayHit : null;
    const greenInRegulation = parameters.gir !== undefined ? parameters.gir : false;
    const penaltyStrokes = parameters.penalties !== undefined ? parameters.penalties : 0;
    
    if (existingScore && !existingScoreError) {
      // Update existing score
      console.log('🤖 SERVER TRACE: Updating existing score for hole', holeNumber);
      const { error: updateError } = await supabaseAdmin
        .from('hole_scores')
        .update({
          strokes: score,
          putts,
          fairway_hit: fairwayHit,
          green_in_regulation: greenInRegulation,
          penalty_strokes: penaltyStrokes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScore.id);
      
      if (updateError) {
        console.error('❌ SERVER TRACE: Error updating score:', updateError);
        throw new Error('Error updating score: ' + updateError.message);
      }
    } else {
      // Insert new score
      console.log('🤖 SERVER TRACE: Creating new score for hole', holeNumber);
      const { error: insertError } = await supabaseAdmin
        .from('hole_scores')
        .insert({
          round_id: roundId,
          hole_number: holeNumber,
          strokes: score,
          putts,
          fairway_hit: fairwayHit,
          green_in_regulation: greenInRegulation,
          penalty_strokes: penaltyStrokes
        });
      
      if (insertError) {
        console.error('❌ SERVER TRACE: Error inserting score:', insertError);
        throw new Error('Error inserting score: ' + insertError.message);
      }
    }
    
    console.log('🤖 SERVER TRACE: Successfully saved score', score, 'for hole', holeNumber);
    return { success: true };
  } catch (error) {
    console.error('❌ SERVER TRACE: Error in handleRecordScoreCommand:', error);
    throw error;
  }
}

/**
 * Handles adding a note to the unified user_notes table
 */
async function handleAddNoteCommand(userId: string, parameters: any, contextData?: any) {
  console.log('🤖 SERVER TRACE: handleAddNoteCommand started with parameters:', parameters);
  logAiStep('handleAddNoteCommand context data', contextData);
  
  try {
    // Extract parameters
    const roundId = parameters.roundId || contextData?.roundId;
    const holeNumber = parameters.holeNumber || parameters.hole || contextData?.holeNumber;
    const note = parameters.note || parameters.content;
    const category = parameters.category || 'general';
    const tags = parameters.tags || [];
    
    logAiStep('Note parameters extracted', { 
      roundId, 
      holeNumber, 
      category, 
      noteLength: note?.length,
      tags
    });
    
    // Validate note content
    if (!note || typeof note !== 'string' || note.trim() === '') {
      console.log('❌ SERVER TRACE: Empty or invalid note');
      throw new Error('Note cannot be empty');
    }
    
    // Create a single note entry in the unified user_notes table
    console.log('🤖 SERVER TRACE: Creating note in user_notes table');
    const { data: noteData, error: insertError } = await supabaseAdmin
      .from('user_notes')
      .insert({
        profile_id: userId,
        note_text: note,
        category: category,
        round_id: roundId || null,
        hole_number: holeNumber || null,
        tags: Array.isArray(tags) ? tags : [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ SERVER TRACE: Error inserting note:', insertError);
      throw new Error('Error saving note: ' + insertError.message);
    }
    
    console.log('🤖 SERVER TRACE: Note saved successfully with ID:', noteData?.id);
    
    // Determine the note type based on what references it has
    let noteType = 'general';
    if (roundId && holeNumber) {
      noteType = 'hole';
    } else if (roundId) {
      noteType = 'round';
    }
    
    return { 
      success: true, 
      noteType, 
      noteId: noteData?.id,
      roundId,
      holeNumber
    };
  } catch (error) {
    console.error('❌ SERVER TRACE: Error in handleAddNoteCommand:', error);
    throw error;
  }
} 