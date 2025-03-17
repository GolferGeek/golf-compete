# Golf AI Assistant - Phase 1 Implementation Plan

## Overview
This document outlines the first phase of implementing an AI golf assistant in the GolfCompete application. Phase 1 focuses on core voice functionality for round management while ensuring compliance with the Rules of Golf. 

## Goals
- Enable voice control for round management (starting rounds, scoring)
- Implement basic note-taking capability
- Ensure all features comply with Rules of Golf for regular play
- Create a foundation for future AI assistance features

## Timeline
Estimated timeline: **4-5 weeks**

## Milestones

### Milestone 1: Voice Interface Foundation (1-2 weeks)

#### Components to Build:

1. **Voice Recording Component**
   - Client-side component for recording audio
   - Microphone permission handling
   - Audio processing pipeline
   - Visual feedback during recording

2. **Speech Processing Service**
   - OpenAI Whisper integration for speech-to-text
   - Error handling and fallback mechanisms
   - Response generation pipeline

3. **AI Command Processor**
   - Natural language processing for golf commands
   - Command classification system
   - Parameter extraction from voice input

#### Technical Implementation:

```typescript
// Voice recording component (client-side)
'use client';
import { useState, useRef } from 'react';
import { Button, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

// Core recording functionality
// Permission handling
// Visual feedback
```

#### Database Updates:

```sql
-- Store user voice interactions
CREATE TABLE user_voice_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  interaction_type TEXT NOT NULL,
  voice_input TEXT,
  processed_command JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AI preferences
CREATE TABLE user_ai_preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  voice_enabled BOOLEAN DEFAULT TRUE,
  api_key_source TEXT DEFAULT 'app', -- 'app' or 'user'
  user_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Milestone 2: Round Management by Voice (1-2 weeks)

#### Components to Build:

1. **Voice Round Initialization**
   - Natural language processing for round creation
   - Course name matching system
   - Date and player recognition
   - Integration with existing round creation flow

2. **Voice Command UI Integration**
   - Add voice command button to relevant screens
   - Create voice command feedback component
   - Implement confirmation dialogs for commands

#### Technical Implementation:

```typescript
// Round command processor
export async function processRoundCommand(text: string, userId: string) {
  // Parse course name, date, players
  // Handle special requests (e.g., "Use my regular group")
  // Return structured data for round creation
}

// Round creation integration
export async function createRoundFromVoice(parsedCommand, userId) {
  // Validate course exists
  // Check for date/time validity
  // Create round using existing services
  // Return confirmation details
}
```

#### UI Integration:

- Add voice command button to round creation screen
- Implement voice round flow with confirmation
- Create success/error feedback components

### Milestone 3: Voice Scoring System (1-2 weeks)

#### Components to Build:

1. **Score Voice Recognition**
   - Natural language processing for various score formats
   - Hole number recognition
   - Player recognition for group play
   - Score validation and confirmation

2. **Score Entry Integration**
   - Link voice commands to scoring actions
   - Handle score corrections and changes
   - Provide visual confirmation of score entry

#### Technical Implementation:

```typescript
// Score command processor
export async function processScoreCommand(text: string, roundId: string, userId: string) {
  // Parse score value
  // Identify hole number (current, specific, or relative)
  // Handle player identification for group play
  // Return structured data for score entry
}

// Score entry integration
export async function recordScoreFromVoice(parsedCommand, roundId, userId) {
  // Validate hole exists for round
  // Verify score validity
  // Record using existing scoring service
  // Return confirmation details
}
```

#### UI Integration:

- Add voice command button to scoring screen
- Create score confirmation component
- Implement quick score entry flow

### Milestone 4: Voice Notes System (1 week)

#### Components to Build:

1. **Note Taking Interface**
   - Voice-to-note conversion
   - Note categorization (swing, course, etc.)
   - Hole and timestamp association
   - Note search and retrieval

2. **Notes Database** 
   - Store notes with round/hole context
   - Enable future analysis of patterns
   - Support retrieval for future rounds

#### Technical Implementation:

```typescript
// Note command processor
export async function processNoteCommand(text: string, roundId: string, userId: string) {
  // Extract note content
  // Identify context (hole, topic)
  // Return structured data for note creation
}

// Note creation integration
export async function createNoteFromVoice(parsedCommand, roundId, userId) {
  // Associate with correct hole if specified
  // Categorize note if possible
  // Store note with metadata
  // Return confirmation
}
```

#### Database Updates:

```sql
-- Store round notes
CREATE TABLE round_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  round_id UUID REFERENCES rounds(id),
  hole_number INTEGER,
  note_text TEXT NOT NULL,
  note_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration with Existing App

### UI Components

1. **AI Assistant Access**
   - Floating action button on applicable screens
   - Voice command icon in appropriate contexts
   - Assistant page for extended interactions

2. **Settings Integration**
   - Add AI assistant settings page
   - API key management (optional user key)
   - Voice preferences configuration

### OpenAI Integration

1. **API Setup**
   - Configure OpenAI API client
   - Implement API key management
   - Set up error handling and rate limiting

2. **Usage Optimization**
   - Implement efficient prompt engineering
   - Optimize token usage
   - Cache common responses

## Testing Strategy

1. **Voice Recognition Testing**
   - Test with various accents and speech patterns
   - Verify golf terminology recognition
   - Test in noisy environments

2. **Command Processing Testing**
   - Verify proper parsing of intent
   - Test edge cases for command parameters
   - Ensure appropriate error handling

3. **Integration Testing**
   - Verify round creation flow
   - Test score recording accuracy
   - Validate note taking functionality

## Technical Requirements

1. **Frontend Components:**
   - Voice recording component
   - Command feedback UI
   - Confirmation dialogs
   - Settings interface

2. **Backend Services:**
   - OpenAI integration service
   - Command processing service
   - Voice interaction storage
   - Context management service

3. **Database Updates:**
   - Voice interactions table
   - User AI preferences
   - Round notes table

4. **External Dependencies:**
   - OpenAI API (Whisper and GPT-4)
   - Browser audio recording APIs
   - (Optional) Web Speech API fallback

## Success Criteria

Phase 1 will be considered successful when users can:

1. Start a new round using voice commands
2. Record scores for holes using natural language
3. Take notes about their round using voice
4. Access these features through an intuitive UI
5. Configure basic settings for the AI assistant

## Next Steps

Upon completion of Phase 1, we will:

1. Gather user feedback on the voice functionality
2. Analyze voice command patterns for improvements
3. Begin planning detailed implementation of Phase 2
4. Address any performance or usability issues identified 