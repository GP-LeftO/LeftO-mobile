const Voice = {
  onSpeechStart: null as any,
  onSpeechEnd: null as any,
  onSpeechResults: null as any,
  onSpeechError: null as any,
  onSpeechPartialResults: null as any,
  start: async (_locale?: string) => {},
  stop: async () => {},
  cancel: async () => {},
  destroy: async () => {},
  removeAllListeners: () => {},
  isAvailable: async () => false,
  isRecognizing: async () => false,
};

export default Voice;
