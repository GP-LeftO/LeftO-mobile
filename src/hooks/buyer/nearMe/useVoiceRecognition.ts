import { useState, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing';

// Voice recording requires a native build — not available in Expo Go.
export const VOICE_AVAILABLE = false;

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void;
}

export function useVoiceRecognition({ onResult: _onResult }: UseVoiceRecognitionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const toggleListening = useCallback(() => {
    setVoiceState(prev => (prev === 'idle' ? 'listening' : 'idle'));
  }, []);

  return { voiceState, partialResult: '', toggleListening };
}
