'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import FloatingGolfAssistant from '@/components/ai/FloatingGolfAssistant';

interface GolfAssistantContextType {
  contextData: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  };
  setContext: (contextData: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  }) => void;
  clearContext: () => void;
}

const GolfAssistantContext = createContext<GolfAssistantContextType>({
  contextData: {},
  setContext: () => {},
  clearContext: () => {},
});

interface GolfAssistantProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function GolfAssistantProvider({ 
  children,
  enabled = true
}: GolfAssistantProviderProps) {
  const [contextData, setContextData] = useState<{
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  }>({});

  const setContext = useCallback((data: typeof contextData) => {
    setContextData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const clearContext = useCallback(() => {
    setContextData({});
  }, []);

  return (
    <GolfAssistantContext.Provider value={{ contextData, setContext, clearContext }}>
      {children}
      {enabled && <FloatingGolfAssistant />}
    </GolfAssistantContext.Provider>
  );
}

export function useGolfAssistant() {
  const context = useContext(GolfAssistantContext);
  
  if (!context) {
    throw new Error('useGolfAssistant must be used within a GolfAssistantProvider');
  }
  
  return context;
} 