import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../../../context/AuthContext';
import * as chatbotService from '../../../services/buyer/support/chatbotService';
import { avRequestPermissions, avStartRecording, avStopRecording } from '../../../services/shared/av.service';
import { isExpoGo } from '../../../services/shared/pushNotifications.service';
import type { ChatMessage } from '../../../types/chatbot';

export const CHIPS = [
  'كيف أحجز وجبة؟',
  'كيف تعمل آلية الاستلام؟',
  'كيف أتبرع لجمعية؟',
  'ما هو برنامج الكرم؟',
  'كيف أتواصل مع المحل؟',
];

export const isArabicText = (text: string): boolean =>
  /[؀-ۿ]/.test(text);

const ERROR_TEXT = 'عذراً، حدث خطأ. حاول مرة ثانية 🙏';

export function useChatbot() {
  const { accessToken } = useAuthContext();
  const [messages,         setMessages]         = useState<ChatMessage[]>([]);
  const [inputText,        setInputText]        = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [chipsVisible,     setChipsVisible]     = useState(true);
  const [isRecording,      setIsRecording]      = useState(false);
  const [hasReceivedReply, setHasReceivedReply] = useState(false);
  const [ratingSheetOpen,  setRatingSheetOpen]  = useState(false);
  const [ratingSubmitted,  setRatingSubmitted]  = useState(false);
  const recordingRef = useRef<unknown>(null);

  const submitRating = useCallback(async (stars: number) => {
    try {
      await AsyncStorage.setItem('@lefto_chat_rating', JSON.stringify({ stars, ts: Date.now() }));
    } catch {}
    setRatingSheetOpen(false);
    setRatingSubmitted(true);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
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

      if (!accessToken) {
        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'bot', text: ERROR_TEXT, timestamp: new Date() },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await chatbotService.sendMessage({ message: trimmed });
        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'bot', text: response.reply, timestamp: new Date() },
        ]);
        setHasReceivedReply(true);
      } catch {
        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'bot', text: ERROR_TEXT, timestamp: new Date() },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, isLoading],
  );

  const handleChipTap = useCallback(
    (chipText: string) => {
      sendMessage(chipText);
    },
    [sendMessage],
  );

  const startRecording = useCallback(async () => {
    if (isExpoGo) {
      Alert.alert('', 'التسجيل الصوتي غير متاح في هذه البيئة');
      return;
    }
    try {
      const { granted } = await avRequestPermissions();
      if (!granted) {
        Alert.alert('', 'يرجى السماح بالوصول إلى الميكروفون');
        return;
      }
      const recording = await avStartRecording();
      if (!recording) return;
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert('', 'تعذّر بدء التسجيل');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    try {
      const uri = await avStopRecording(recordingRef.current);
      recordingRef.current = null;
      if (!uri) return;

      setIsLoading(true);
      setChipsVisible(false);
      try {
        const result = await chatbotService.sendVoiceMessage(uri);
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: result.transcript,
          timestamp: new Date(),
        };
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: result.reply,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg, botMsg]);
        setHasReceivedReply(true);
      } catch {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'bot', text: ERROR_TEXT, timestamp: new Date() },
        ]);
      } finally {
        setIsLoading(false);
      }
    } catch {
      recordingRef.current = null;
      Alert.alert('', 'لم يتم التعرف على الصوت، حاول مجدداً');
    }
  }, []);

  return {
    messages,
    inputText,
    isLoading,
    isRecording,
    chipsVisible,
    hasReceivedReply,
    ratingSheetOpen,
    ratingSubmitted,
    setInputText,
    sendMessage,
    handleChipTap,
    startRecording,
    stopRecording,
    openRatingSheet: () => setRatingSheetOpen(true),
    submitRating,
  };
}
