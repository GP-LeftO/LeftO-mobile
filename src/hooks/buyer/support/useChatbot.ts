import { useState, useCallback } from 'react';
import * as chatbotService from '../../../services/buyer/support/chatbotService';
import type { ChatMessage } from '../../../types/chatbot';

export const CHIPS = [
  'ايش في قريب مني؟',
  'كم وفرت؟',
  'كيف احجز؟',
  'في اكل نباتي؟',
];

export const isArabicText = (text: string): boolean => /[؀-ۿ]/.test(text);

const ERROR_TEXT = 'عذراً، حدث خطأ. حاول مرة ثانية 🙏';

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setChipsVisible(false);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage({ message: trimmed });
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'bot', text: response.reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'bot', text: ERROR_TEXT, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleChipTap = useCallback(
    (chipText: string) => sendMessage(chipText),
    [sendMessage],
  );

  return { messages, inputText, isLoading, chipsVisible, setInputText, sendMessage, handleChipTap };
}
