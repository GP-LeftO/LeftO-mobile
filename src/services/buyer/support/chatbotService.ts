import api from '../../shared/api';
import type { ChatbotRequest, ChatbotResponse } from '../../../types/chatbot';

export async function sendMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  const res = await api.post('/api/chatbot/message', request);
  return (res.data?.data ?? res.data) as ChatbotResponse;
}

export interface VoiceResponse {
  transcript: string;
  reply: string;
}

export async function sendVoiceMessage(
  audioUri: string,
  lat?: number,
  lng?: number,
): Promise<VoiceResponse> {
  const formData = new FormData();
  formData.append('audio', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' } as any);
  if (lat != null) formData.append('lat', String(lat));
  if (lng != null) formData.append('lng', String(lng));
  const res = await api.post('/api/chatbot/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (res.data?.data ?? res.data) as VoiceResponse;
}
