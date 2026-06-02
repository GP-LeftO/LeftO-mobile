import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

export type VoiceState = 'idle' | 'listening' | 'processing';

// NativeModules.Voice is null/stub in Expo Go — Voice requires expo run:android
const VOICE_AVAILABLE =
  !!NativeModules.Voice &&
  typeof NativeModules.Voice.startSpeech === 'function';

export { VOICE_AVAILABLE };

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void;
}

function safeDestroy() {
  try {
    Voice.destroy()
      .then(() => {
        // removeAllListeners internally sets props on NativeModules.Voice (null in Expo Go).
        // Wrap in try/catch so the .then() callback never throws an unhandled rejection.
        try { Voice.removeAllListeners(); } catch { /* noop */ }
      })
      .catch(() => { /* noop */ });
  } catch { /* noop */ }
}

export function useVoiceRecognition({ onResult }: UseVoiceRecognitionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [partialResult, setPartialResult] = useState('');

  useEffect(() => {
    if (!VOICE_AVAILABLE) return;

    try {
      Voice.onSpeechStart = () => setVoiceState('listening');
      Voice.onSpeechEnd = () => setVoiceState('processing');
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const text = e.value?.[0];
        if (text) {
          setPartialResult('');
          setVoiceState('idle');
          onResult(text);
        } else {
          setVoiceState('idle');
        }
      };
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        setPartialResult(e.value?.[0] ?? '');
      };
      Voice.onSpeechError = (_e: SpeechErrorEvent) => {
        setVoiceState('idle');
        setPartialResult('');
      };
    } catch {
      return;
    }

    return safeDestroy;
  }, [onResult]);

  const startListening = useCallback(async () => {
    if (!VOICE_AVAILABLE || voiceState !== 'idle') return;
    try {
      setPartialResult('');
      await Voice.start('ar-SA');
    } catch {
      setVoiceState('idle');
    }
  }, [voiceState]);

  const stopListening = useCallback(async () => {
    if (!VOICE_AVAILABLE) return;
    try {
      await Voice.stop();
    } catch {
      setVoiceState('idle');
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  return { voiceState, partialResult, toggleListening };
}
