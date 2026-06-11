import { isExpoGo } from './pushNotifications.service';

type _RecordingHandle = {
  stopAndUnloadAsync(): Promise<void>;
  getURI(): string | null | undefined;
};

export async function avRequestPermissions(): Promise<{ granted: boolean }> {
  if (isExpoGo) return { granted: false };
  try {
    const { Audio } = await import('expo-av');
    const result = await Audio.requestPermissionsAsync();
    return { granted: result.granted };
  } catch {
    return { granted: false };
  }
}

export async function avStartRecording(): Promise<unknown> {
  if (isExpoGo) return null;
  const { Audio } = await import('expo-av');
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  return recording;
}

export async function avStopRecording(recording: unknown): Promise<string | null> {
  if (isExpoGo || !recording) return null;
  try {
    const { Audio } = await import('expo-av');
    const rec = recording as _RecordingHandle;
    await rec.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return rec.getURI() ?? null;
  } catch {
    return null;
  }
}

export async function avPlaySound(uri: string): Promise<void> {
  if (isExpoGo) return;
  try {
    const { Audio } = await import('expo-av');
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch { }
}
