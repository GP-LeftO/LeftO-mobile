import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { sendVoiceMessage } from '../../../services/buyer/support/chatbotService';

export type VoiceState = 'idle' | 'listening' | 'processing';

export const VOICE_AVAILABLE = true;

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void;
}

export function useVoiceRecognition({ onResult }: UseVoiceRecognitionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [partialResult] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startListening = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setVoiceState('listening');
    } catch {
      setVoiceState('idle');
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setVoiceState('processing');

      if (!uri) { setVoiceState('idle'); return; }

      const { transcript } = await sendVoiceMessage(uri);
      if (transcript) onResult(transcript);
    } catch {
      // reset silently — NearMeScreen handles the empty state
    } finally {
      setVoiceState('idle');
    }
  }, [onResult]);

  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle') startListening();
  }, [voiceState, startListening, stopListening]);

  return { voiceState, partialResult, toggleListening };
}
