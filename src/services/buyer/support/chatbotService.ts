import api from '../../shared/api';
import type { ChatbotRequest, ChatbotResponse } from '../../../types/chatbot';

export async function sendMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  const res = await api.post('/api/chatbot/message', request);
  return (res.data?.data ?? res.data) as ChatbotResponse;
}
