import { useEffect } from 'react';
import { useGolfAssistant } from '@/contexts/GolfAssistantContext';

/**
 * Hook to update the Golf Assistant context
 * Use this in pages where you want the AI assistant to be aware of the current context
 * 
 * @param contextData - The context data to pass to the assistant
 * @param dependencies - Dependencies array for the useEffect
 */
export function useAssistantContext(
  contextData: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  },
  dependencies: any[] = []
) {
  const { setContext, clearContext } = useGolfAssistant();
  
  useEffect(() => {
    // Update context when dependencies change
    setContext(contextData);
    
    // Clean up when component unmounts
    return () => {
      clearContext();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);
  
  return { setContext, clearContext };
} 