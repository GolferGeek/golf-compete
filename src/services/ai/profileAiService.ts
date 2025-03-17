/**
 * Client-side AI service that integrates with the user's profile for API key settings
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
}

// Simplified profile interface focused on AI-related fields
export interface ProfileAISettings {
  openai_api_key: string | null;
  use_own_openai_key: boolean;
  ai_assistant_enabled: boolean;
}

/**
 * Handles an AI interaction using profile-based settings
 */
export async function handleAIInteraction(
  params: AIInteractionParams
): Promise<{ response: string; processedCommand?: ProcessedCommand }> {
  console.log('🤖 TRACE: handleAIInteraction started with params:', {
    userId: params.userId,
    hasContent: !!params.content,
    hasAudioBlob: !!params.audioBlob,
    interactionType: params.interactionType,
    contextData: JSON.stringify(params.contextData)
  });
  
  try {
    // Get profile AI settings
    console.log('🤖 TRACE: Fetching profile AI settings for user:', params.userId);
    const profileSettings = await getProfileAISettings(params.userId);
    console.log('🤖 TRACE: Profile AI settings retrieved:', {
      hasApiKey: !!profileSettings.openai_api_key,
      useOwnKey: profileSettings.use_own_openai_key,
      aiEnabled: profileSettings.ai_assistant_enabled
    });
    
    // Check if AI assistant is enabled
    if (!profileSettings.ai_assistant_enabled) {
      console.log('🤖 TRACE: AI assistant is disabled in profile settings');
      return {
        response: 'The AI assistant is currently disabled in your profile settings.',
      };
    }
    
    // Try client-side processing if user has API key
    if (profileSettings.use_own_openai_key && profileSettings.openai_api_key) {
      console.log('🤖 TRACE: Using user provided OpenAI key');
      try {
        console.log('🤖 TRACE: Processing with user API key');
        return await processWithUserKey(params, profileSettings.openai_api_key);
      } catch (error) {
        console.error('❌ TRACE ERROR: Error processing with user API key:', error);
        console.log('🤖 TRACE: Falling back to server API');
        // Fall back to server API
      }
    }
    
    // Otherwise use server API
    console.log('🤖 TRACE: Using server API for processing');
    return await processWithServerAPI(params);
  } catch (error) {
    console.error('❌ TRACE ERROR: Error in handleAIInteraction:', error);
    return {
      response: 'Sorry, I had trouble processing that. Please try again.',
    };
  }
}

/**
 * Processes the interaction using the user's OpenAI API key
 */
async function processWithUserKey(
  params: AIInteractionParams, 
  apiKey: string
): Promise<{
  response: string;
  processedCommand?: ProcessedCommand;
}> {
  console.log('🤖 TRACE: processWithUserKey started');
  
  try {
    // Initialize OpenAI with user's API key
    console.log('🤖 TRACE: Initializing OpenAI client with user API key');
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    console.log('🤖 TRACE: OpenAI client initialized successfully');

    // Get content from audio if provided
    let content = params.content || '';
    
    if (params.audioBlob && !content) {
      // Convert blob to file
      console.log('🤖 TRACE: Converting audio blob to file for transcription');
      const audioFile = new File([params.audioBlob], 'audio.webm', { type: 'audio/webm' });
      console.log('🤖 TRACE: Audio file created, size:', audioFile.size);
      
      // Transcribe using OpenAI Whisper
      console.log('🤖 TRACE: Sending audio for transcription...');
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en',
        });
        
        content = transcription.text;
        console.log('🤖 TRACE: Audio transcription received:', content);
      } catch (error) {
        console.error('❌ TRACE ERROR: Error transcribing audio:', error);
        const errorDetails = error instanceof Error ? 
          { message: error.message, name: error.name, stack: error.stack } : 
          String(error);
        console.error('❌ TRACE ERROR DETAILS:', JSON.stringify(errorDetails));
        throw new Error('Failed to transcribe audio: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    if (!content) {
      console.error('❌ TRACE ERROR: No content provided for AI interaction');
      throw new Error('No content provided for AI interaction');
    }

    // Process the command
    console.log('🤖 TRACE: Processing command with content:', content);
    
    try {
      // Define system prompt
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
      console.log('🤖 TRACE: Creating chat completion with OpenAI API');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      // Parse the response
      console.log('🤖 TRACE: Received response from OpenAI');
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        console.error('❌ TRACE ERROR: Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }

      console.log('🤖 TRACE: Parsing JSON response');
      const processedCommand = JSON.parse(responseContent) as ProcessedCommand;
      console.log('🤖 TRACE: Processed command:', processedCommand);
      
      return {
        response: processedCommand.response,
        processedCommand,
      };
    } catch (error) {
      console.error('❌ TRACE ERROR: Error in OpenAI chat completion:', error);
      const errorDetails = error instanceof Error ? 
        { message: error.message, name: error.name, stack: error.stack } : 
        String(error);
      console.error('❌ TRACE ERROR DETAILS:', JSON.stringify(errorDetails));
      throw new Error('Failed to process with OpenAI: ' + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('❌ TRACE ERROR: Error in processWithUserKey:', error);
    throw error;
  }
}

/**
 * Falls back to the server API if client-side processing fails or is unavailable
 */
async function processWithServerAPI(params: AIInteractionParams): Promise<{
  response: string;
  processedCommand?: ProcessedCommand;
}> {
  console.log('🤖 TRACE: processWithServerAPI started');
  try {
    // Create FormData object for multipart/form-data submission
    console.log('🤖 TRACE: Creating FormData for server API call');
    const formData = new FormData();
    
    // Add audio blob if present
    if (params.audioBlob) {
      console.log('🤖 TRACE: Adding audio blob to FormData', { size: params.audioBlob.size });
      formData.append('audio', params.audioBlob, 'audio.webm');
    }
    
    // Add text content if present
    if (params.content) {
      console.log('🤖 TRACE: Adding content to FormData', { length: params.content.length });
      formData.append('content', params.content);
    }
    
    // Add context data if present
    if (params.contextData) {
      console.log('🤖 TRACE: Adding contextData to FormData');
      formData.append('contextData', JSON.stringify(params.contextData));
    }
    
    // Add interaction type
    formData.append('interactionType', params.interactionType);
    
    // Call server API
    console.log('🤖 TRACE: Calling server API endpoint /api/ai/process-voice with FormData');
    try {
      const response = await fetch('/api/ai/process-voice', {
        method: 'POST',
        headers: {
          // No need to set Content-Type, browser will set it with boundary for FormData
          'x-user-id': params.userId,
        },
        body: formData,
      });
      
      if (!response.ok) {
        console.error(`❌ TRACE ERROR: Server returned error status: ${response.status}`);
        const errorText = await response.text();
        console.error('❌ TRACE ERROR: Server response body:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      console.log('🤖 TRACE: Server response received, parsing JSON');
      try {
        const result = await response.json();
        console.log('🤖 TRACE: Parsed server response:', result);
        return result;
      } catch (jsonError) {
        console.error('❌ TRACE ERROR: Error parsing server response as JSON:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (fetchError) {
      console.error('❌ TRACE ERROR: Fetch error calling server API:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ TRACE ERROR: Error in processWithServerAPI:', error);
    return {
      response: 'Sorry, I had trouble connecting to the server. Please try again later.',
    };
  }
}

/**
 * Gets AI settings from the user's profile
 */
export async function getProfileAISettings(userId: string): Promise<ProfileAISettings> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('openai_api_key, use_own_openai_key, ai_assistant_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return {
      openai_api_key: data.openai_api_key,
      use_own_openai_key: data.use_own_openai_key,
      ai_assistant_enabled: data.ai_assistant_enabled,
    };
  } catch (error) {
    console.error('Error getting profile AI settings:', error);
    // Return default values if fetch fails
    return {
      openai_api_key: null,
      use_own_openai_key: false,
      ai_assistant_enabled: true,
    };
  }
}

/**
 * Updates AI settings in the user's profile
 */
export async function updateProfileAISettings(
  userId: string,
  settings: Partial<ProfileAISettings>
): Promise<void> {
  try {
    const updates: Record<string, any> = {};

    if (settings.openai_api_key !== undefined) {
      updates.openai_api_key = settings.openai_api_key;
    }

    if (settings.use_own_openai_key !== undefined) {
      updates.use_own_openai_key = settings.use_own_openai_key;
    }

    if (settings.ai_assistant_enabled !== undefined) {
      updates.ai_assistant_enabled = settings.ai_assistant_enabled;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating profile AI settings:', error);
    throw new Error('Failed to update AI settings');
  }
} 