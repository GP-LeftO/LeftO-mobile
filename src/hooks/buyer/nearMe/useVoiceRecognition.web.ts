import { useState, useCallback, useRef, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "processing";

// Browser Web Speech API (Chrome/Edge/Safari). Replaces @react-native-voice on web.
const SR: (new () => SpeechRecognitionLike) | undefined =
  typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition as never) ??
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as never)
    : undefined;

export const VOICE_AVAILABLE = !!SR;

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void;
}

export function useVoiceRecognition({ onResult }: UseVoiceRecognitionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [partialResult, setPartialResult] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* noop */ } }, []);

  const start = useCallback(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.continuous = false;
    recRef.current = rec;

    rec.onstart = () => setVoiceState("listening");
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) setPartialResult(interim);
      if (finalText) {
        setPartialResult("");
        setVoiceState("idle");
        onResult(finalText);
      }
    };
    rec.onerror = () => { setVoiceState("idle"); setPartialResult(""); };
    rec.onend = () => setVoiceState((s) => (s === "listening" ? "idle" : s));

    try { rec.start(); } catch { setVoiceState("idle"); }
  }, [onResult]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const toggleListening = useCallback(() => {
    if (voiceState === "listening") stop();
    else if (voiceState === "idle") start();
  }, [voiceState, start, stop]);

  return { voiceState, partialResult, toggleListening };
}
