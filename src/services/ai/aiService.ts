import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Types for AI service
 */
export type VoiceCommandType = 'start_round' | 'record_score' | 'add_note' | 'ask_question';

export interface ProcessedCommand {
  commandType: VoiceCommandType;
  parameters: Record<string, any>;
  response: string;
}

export interface AIInteractionParams {
  userId: string;
  content?: string;
  audioBlob?: Blob;
  interactionType: 'voice_command' | 'text_command' | 'note' | 'question';
  contextData?: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  };
}

export interface AIPreferences {
  voiceEnabled: boolean;
  apiKeySource: 'app' | 'user';
  userApiKey?: string;
  voiceType: string;
  speakingRate: number;
}

/**
 * Main AI service functions
 */

/**
 * Handles an AI interaction (voice or text)
 * @param params - The parameters for the interaction
 * @returns The processed command and response
 */
export async function handleAIInteraction(
  params: AIInteractionParams
): Promise<{ response: string; processedCommand?: ProcessedCommand }> {
  try {
    // Get content from audio if provided, or use passed content
    let content = params.content || '';
    
    if (params.audioBlob && !content) {
      content = await transcribeAudio(params.audioBlob);
    }

    if (!content) {
      throw new Error('No content provided for AI interaction');
    }

    // Process the command
    const processedCommand = await processGolfCommand(content, params.contextData);

    // Store the interaction in Supabase
    await storeInteraction({
      userId: params.userId,
      interactionType: params.interactionType,
      voiceInput: content,
      processedCommand,
      response: processedCommand.response,
    });

    return {
      response: processedCommand.response,
      processedCommand,
    };
  } catch (error) {
    console.error('Error handling AI interaction:', error);
    return {
      response: 'Sorry, I had trouble processing that. Please try again.',
    };
  }
}

/**
 * Transcribes audio to text using OpenAI Whisper API
 * @param audioBlob - The audio to transcribe
 * @returns The transcribed text
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert blob to file
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    
    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Processes a golf-related command using OpenAI
 * @param command - The text command to process
 * @param contextData - Additional context for the command
 * @returns Processed command with parameters and response
 */
export async function processGolfCommand(
  command: string, 
  contextData?: Record<string, any>
): Promise<ProcessedCommand> {
  try {
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
    `;

    // Contextualize the user prompt based on available data
    let userPrompt = command;
    if (contextData) {
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(responseContent) as ProcessedCommand;
  } catch (error) {
    console.error('Error processing golf command:', error);
    return {
      commandType: 'ask_question',
      parameters: {},
      response: "I'm sorry, I couldn't process that command. Please try again."
    };
  }
}

/**
 * Storage and preference management functions
 */

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
}): Promise<void> {
  try {
    const { error } = await supabase
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
      console.error('Error storing interaction:', error);
    }
  } catch (error) {
    console.error('Error storing interaction:', error);
    // Continue even if storage fails
  }
}

/**
 * Gets or creates AI preferences for a user
 * @param userId - User ID
 * @returns User AI preferences
 */
export async function getUserAIPreferences(userId: string): Promise<AIPreferences> {
  try {
    // Check if preferences exist
    const { data, error } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return existing preferences or create default ones
    if (data) {
      return {
        voiceEnabled: data.voice_enabled,
        apiKeySource: data.api_key_source as 'app' | 'user',
        userApiKey: data.user_api_key,
        voiceType: data.voice_type,
        speakingRate: data.speaking_rate,
      };
    } else {
      // Create default preferences
      const defaultPrefs = {
        user_id: userId,
        voice_enabled: true,
        api_key_source: 'app' as const,
        voice_type: 'alloy',
        speaking_rate: 1.0,
      };

      const { error: insertError } = await supabase
        .from('user_ai_preferences')
        .insert(defaultPrefs);
        
      if (insertError) {
        console.error('Error creating default AI preferences:', insertError);
      }

      return {
        voiceEnabled: defaultPrefs.voice_enabled,
        apiKeySource: defaultPrefs.api_key_source,
        voiceType: defaultPrefs.voice_type,
        speakingRate: defaultPrefs.speaking_rate,
      };
    }
  } catch (error) {
    console.error('Error getting AI preferences:', error);
    // Return default preferences if fetching fails
    return {
      voiceEnabled: true,
      apiKeySource: 'app',
      voiceType: 'alloy',
      speakingRate: 1.0,
    };
  }
}

/**
 * Updates AI preferences for a user
 * @param userId - User ID
 * @param preferences - New preferences
 */
export async function updateUserAIPreferences(
  userId: string,
  preferences: Partial<AIPreferences>
): Promise<void> {
  try {
    const updates: Record<string, any> = { user_id: userId };
    
    if (preferences.voiceEnabled !== undefined) {
      updates.voice_enabled = preferences.voiceEnabled;
    }
    
    if (preferences.apiKeySource !== undefined) {
      updates.api_key_source = preferences.apiKeySource;
    }
    
    if (preferences.userApiKey !== undefined) {
      updates.user_api_key = preferences.userApiKey;
    }
    
    if (preferences.voiceType !== undefined) {
      updates.voice_type = preferences.voiceType;
    }
    
    if (preferences.speakingRate !== undefined) {
      updates.speaking_rate = preferences.speakingRate;
    }
    
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('user_ai_preferences')
      .upsert(updates);
      
    if (error) {
      console.error('Error updating AI preferences:', error);
      throw new Error('Failed to update AI preferences');
    }
  } catch (error) {
    console.error('Error updating AI preferences:', error);
    throw new Error('Failed to update AI preferences');
  }
}

/**
 * Creates a note for a round
 * @param userId - User ID
 * @param roundId - Round ID
 * @param noteText - Note text
 * @param holeNumber - Optional hole number
 * @param category - Optional note category
 */
export async function createRoundNote(
  userId: string,
  roundId: string,
  noteText: string,
  holeNumber?: number,
  category?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('round_notes')
      .insert({
        user_id: userId,
        round_id: roundId,
        note_text: noteText,
        hole_number: holeNumber,
        note_category: category,
      });
      
    if (error) {
      console.error('Error creating round note:', error);
      throw new Error('Failed to create round note');
    }
  } catch (error) {
    console.error('Error creating round note:', error);
    throw new Error('Failed to create round note');
  }
}

/**
 * Gets notes for a round
 * @param roundId - Round ID
 * @param holeNumber - Optional hole number to filter by
 * @returns Round notes
 */
export async function getRoundNotes(
  roundId: string,
  holeNumber?: number
): Promise<Array<{
  id: string;
  userId: string;
  noteText: string;
  holeNumber: number | null;
  category: string | null;
  createdAt: string;
}>> {
  try {
    let query = supabase
      .from('round_notes')
      .select('*')
      .eq('round_id', roundId);
      
    if (holeNumber !== undefined) {
      query = query.eq('hole_number', holeNumber);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data.map(note => ({
      id: note.id,
      userId: note.user_id,
      noteText: note.note_text,
      holeNumber: note.hole_number,
      category: note.note_category,
      createdAt: note.created_at,
    }));
  } catch (error) {
    console.error('Error getting round notes:', error);
    return [];
  }
} 