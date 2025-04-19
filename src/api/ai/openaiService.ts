import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Type for AI interaction parameters
 */
export interface AIInteractionParams {
  userId: string;
  content: string;
  audioBlob?: Blob;
  interactionType: 'voice_command' | 'text_command' | 'note' | 'question';
  contextData?: Record<string, any>;
}

/**
 * Converts audio to text using OpenAI Whisper
 * @param audioBlob - Audio blob to transcribe
 * @returns Transcribed text
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
): Promise<{
  commandType: string;
  parameters: Record<string, any>;
  response: string;
}> {
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
      - commandType: The type of command
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

    return JSON.parse(responseContent);
  } catch (error) {
    console.error('Error processing golf command:', error);
    throw new Error('Failed to process command');
  }
}

/**
 * Main function to handle AI interactions
 * @param params - Interaction parameters
 * @returns Processed interaction with response
 */
export async function handleAIInteraction(
  params: AIInteractionParams
): Promise<{
  response: string;
  processedCommand?: Record<string, any>;
}> {
  try {
    // Get content from audio if provided
    let content = params.content;
    
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
    throw new Error('Failed to handle AI interaction');
  }
}

/**
 * Stores an interaction in the database
 * @param data - Interaction data
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
    await supabaseAdmin
      .from('user_voice_interactions')
      .insert({
        user_id: data.userId,
        interaction_type: data.interactionType,
        voice_input: data.voiceInput,
        processed_command: data.processedCommand,
        response: data.response,
        audio_url: data.audioUrl,
      });
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
export async function getUserAIPreferences(userId: string): Promise<{
  voiceEnabled: boolean;
  apiKeySource: string;
  userApiKey?: string;
  voiceType: string;
  speakingRate: number;
}> {
  try {
    // Check if preferences exist
    const { data, error } = await supabaseAdmin
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
        apiKeySource: data.api_key_source,
        userApiKey: data.user_api_key,
        voiceType: data.voice_type,
        speakingRate: data.speaking_rate,
      };
    } else {
      // Create default preferences
      const defaultPrefs = {
        voice_enabled: true,
        api_key_source: 'app',
        voice_type: 'alloy',
        speaking_rate: 1.0,
        user_id: userId,
      };

      await supabaseAdmin.from('user_ai_preferences').insert(defaultPrefs);

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
  preferences: {
    voiceEnabled?: boolean;
    apiKeySource?: string;
    userApiKey?: string;
    voiceType?: string;
    speakingRate?: number;
  }
): Promise<void> {
  try {
    const updates: Record<string, any> = {};
    
    if (preferences.voiceEnabled !== undefined) {
      updates.voice_enabled = preferences.voiceEnabled;
    }
    
    if (preferences.apiKeySource) {
      updates.api_key_source = preferences.apiKeySource;
    }
    
    if (preferences.userApiKey) {
      updates.user_api_key = preferences.userApiKey;
    }
    
    if (preferences.voiceType) {
      updates.voice_type = preferences.voiceType;
    }
    
    if (preferences.speakingRate !== undefined) {
      updates.speaking_rate = preferences.speakingRate;
    }
    
    updates.updated_at = new Date().toISOString();

    await supabaseAdmin
      .from('user_ai_preferences')
      .upsert({
        user_id: userId,
        ...updates,
      });
  } catch (error) {
    console.error('Error updating AI preferences:', error);
    throw new Error('Failed to update AI preferences');
  }
} 