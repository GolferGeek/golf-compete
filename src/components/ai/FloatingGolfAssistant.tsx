'use client';

import GolfAssistant from './GolfAssistant';
import { useGolfAssistant } from '@/contexts/GolfAssistantContext';

/**
 * Floating Golf Assistant that provides a global assistant throughout the app
 */
export default function FloatingGolfAssistant() {
  const { contextData } = useGolfAssistant();
  
  return (
    <GolfAssistant 
      contextData={contextData}
      floatingMode={true}
    />
  );
} 