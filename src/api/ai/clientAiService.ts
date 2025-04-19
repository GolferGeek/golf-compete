/**
 * Client-side AI service that uses the user's own OpenAI API key
 */
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
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
  userApiKey?: string;
}

export interface AIPreferences {
  voiceEnabled: boolean;
  apiKeySource: 'app' | 'user';
  userApiKey?: string;
  voiceType: string;
  speakingRate: number;
}

/**
 * Handles an AI interaction using either the user's API key or falling back to the server API
 */
export async function handleAIInteraction(
  params: AIInteractionParams
): Promise<{ response: string; processedCommand?: ProcessedCommand }> {
  try {
    // Try client-side processing if user has API key
    if (params.userApiKey) {
      return await processWithUserKey(params);
    } else {
      // Fall back to server API
      return await processWithServerAPI(params);
    }
  } catch (error) {
    console.error('Error handling AI interaction:', error);
    return {
      response: 'Sorry, I had trouble processing that. Please try again.',
    };
  }
}

/**
 * Processes the interaction using the user's OpenAI API key
 */
async function processWithUserKey(params: AIInteractionParams): Promise<{
  response: string;
  processedCommand?: ProcessedCommand;
}> {
  try {
    // Initialize OpenAI with user's API key
    const openai = new OpenAI({
      apiKey: params.userApiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    // Get content from audio if provided
    let content = params.content || '';
    
    if (params.audioBlob && !content) {
      // Convert blob to file
      const audioFile = new File([params.audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      });
      
      content = transcription.text;
    }

    if (!content) {
      throw new Error('No content provided for AI interaction');
    }

    // Process the command
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
      
      Also include the original_input: the user's original query in the parameters object.

      Keep responses concise and golf-appropriate.
    `;

    // Contextualize the user prompt
    let userPrompt = content;
    const contextData = params.contextData || {};
    
    if (contextData.roundId) {
      userPrompt += ` (Current round ID: ${contextData.roundId})`;
    }
    if (contextData.holeNumber) {
      userPrompt += ` (Current hole: ${contextData.holeNumber})`;
    }
    if (contextData.courseId) {
      userPrompt += ` (Current course ID: ${contextData.courseId})`;
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

    const processedCommand = JSON.parse(responseContent) as ProcessedCommand;
    
    // Store interaction in the database
    try {
      await supabase
        .from('user_voice_interactions')
        .insert({
          user_id: params.userId,
          interaction_type: params.interactionType,
          voice_input: content,
          processed_command: processedCommand,
          response: processedCommand.response,
        });
    } catch (storageError) {
      console.error('Error storing interaction:', storageError);
      // Continue even if storage fails
    }

    return {
      response: processedCommand.response,
      processedCommand,
    };
  } catch (error) {
    console.error('Error processing with user API key:', error);
    // Fall back to server API
    return processWithServerAPI(params);
  }
}

/**
 * Falls back to the server API if client-side processing fails or is unavailable
 */
async function processWithServerAPI(params: AIInteractionParams): Promise<{
  response: string;
  processedCommand?: ProcessedCommand;
}> {
  try {
    let audioBase64 = '';
    
    // Convert audio blob to base64 if present
    if (params.audioBlob) {
      audioBase64 = await blobToBase64(params.audioBlob);
    }
    
    // Call server API
    const response = await fetch('/api/ai/process-voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify({
        audioBase64,
        content: params.content,
        interactionType: params.interactionType,
        contextData: params.contextData,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling server API:', error);
    return {
      response: 'Sorry, I had trouble connecting to the server. Please try again later.',
    };
  }
}

/**
 * Converts a blob to a base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gets or creates AI preferences for a user
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