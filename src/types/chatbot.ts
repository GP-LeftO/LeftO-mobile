export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface ChatbotRequest {
  message: string;
  lat?: number;
  lng?: number;
}

export interface ChatbotResponse {
  reply: string;
}
