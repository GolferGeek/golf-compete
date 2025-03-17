/**
 * Utility functions for AI debugging
 */

// Simple emitter for debug events
type DebugEventListener = (message: string, data?: any) => void;
const listeners: DebugEventListener[] = [];

/**
 * Check if verbose AI debugging is enabled
 */
export function isVerboseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_AI_STEPS === 'true';
}

/**
 * Log a debug message if verbose mode is enabled
 */
export function logAiStep(message: string, data?: any): void {
  // Always log to console
  console.log(`🔍 AI STEP: ${message}`, data || '');
  
  // Only emit to listeners if verbose mode is enabled
  if (isVerboseEnabled()) {
    // Emit to all listeners
    listeners.forEach(listener => listener(message, data));
  }
}

/**
 * Subscribe to AI debug events
 * @returns Unsubscribe function
 */
export function subscribeToAiDebug(listener: DebugEventListener): () => void {
  listeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Format a debug message for display
 * Shows a simplified version of the data
 */
export function formatDebugMessage(message: string, data?: any): string {
  if (!data) return message;
  
  let dataString: string;
  
  try {
    if (typeof data === 'string') {
      dataString = data;
    } else if (data instanceof Blob) {
      dataString = `Blob (${data.size} bytes)`;
    } else if (data instanceof Error) {
      dataString = data.message;
    } else if (typeof data === 'object') {
      // Simplify objects for display
      const simplified = Object.entries(data)
        .filter(([key, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => {
          if (typeof value === 'object' && value !== null) {
            obj[key] = '[Object]';
          } else {
            obj[key] = value;
          }
          return obj;
        }, {} as Record<string, any>);
      
      dataString = JSON.stringify(simplified);
    } else {
      dataString = String(data);
    }
    
    // Limit the length
    if (dataString.length > 100) {
      dataString = dataString.substring(0, 97) + '...';
    }
    
    return `${message}: ${dataString}`;
  } catch (error) {
    return `${message} (data could not be formatted)`;
  }
} 