import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';
import { useChatbot, isArabicText, CHIPS } from '../../../hooks/buyer/support/useChatbot';
import type { ChatMessage } from '../../../types/chatbot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPING_ID = '__typing__';
const TYPING_PLACEHOLDER: ChatMessage = {
  id: TYPING_ID,
  role: 'bot',
  text: '',
  timestamp: new Date(0),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Typing indicator bubble ──────────────────────────────────────────────────

function TypingBubble() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makeDotLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(Math.max(0, 900 - delay)),
        ]),
      );

    const anims = [
      makeDotLoop(dot1, 0),
      makeDotLoop(dot2, 300),
      makeDotLoop(dot3, 600),
    ];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.messageRow}>
      <View style={styles.botAvatar}>
        <Text style={styles.avatarEmoji}>🤖</Text>
      </View>
      <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
        <View style={styles.dotRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isArabic = isArabicText(message.text);

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.userBubbleText : styles.botBubbleText,
            {
              textAlign: isArabic ? 'right' : 'left',
              writingDirection: isArabic ? 'rtl' : 'ltr',
            },
          ]}
        >
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

interface ChatbotScreenProps {
  onBack?: () => void;
}

export default function ChatbotScreen({ onBack }: ChatbotScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();

  const {
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
    openRatingSheet,
    submitRating,
  } = useChatbot();

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const displayData = useMemo<ChatMessage[]>(() => {
    const withTyping = isLoading ? [...messages, TYPING_PLACEHOLDER] : messages;
    return [...withTyping].reverse();
  }, [messages, isLoading]);

  useEffect(() => {
    if (displayData.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [displayData.length]);

  const isSendDisabled = inputText.trim() === '' || isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryOrange} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, rtl && { transform: [{ scaleX: -1 }] }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>LeftO Bot</Text>

        <View style={[styles.headerSpacer, { alignItems: 'flex-end' }]}>
          {hasReceivedReply && !ratingSubmitted && (
            <TouchableOpacity onPress={openRatingSheet} activeOpacity={0.8} style={styles.rateBtn}>
              <Feather name="star" size={14} color={Colors.white} />
              <Text style={styles.rateBtnText}>قيّم</Text>
            </TouchableOpacity>
          )}
          {ratingSubmitted && (
            <Text style={styles.ratedText}>شكراً 😊</Text>
          )}
        </View>
      </View>

      {/* ── Suggested chips ── */}
      {chipsVisible && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => handleChipTap(chip)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Message list ── */}
      <FlatList
        ref={flatListRef}
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.id === TYPING_ID ? <TypingBubble /> : <MessageBubble message={item} />
        }
        inverted
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* ── Input bar ── */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) },
        ]}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتب رسالة..."
          placeholderTextColor="#9E9E9E"
          style={[
            styles.input,
            {
              textAlign:
                isArabicText(inputText) || inputText === '' ? 'right' : 'left',
            },
          ]}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(inputText)}
        />
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Feather name={isRecording ? "square" : "mic"} size={20} color={isRecording ? Colors.white : Colors.primaryOrange} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, isSendDisabled && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={isSendDisabled}
          activeOpacity={0.8}
        >
          <Feather name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      {/* ── Rating bottom sheet ── */}
      <Modal
        visible={ratingSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => submitRating(0)}
      >
        <TouchableOpacity
          style={ratingStyles.overlay}
          activeOpacity={1}
          onPress={() => submitRating(0)}
        />
        <View style={ratingStyles.sheet}>
          <Text style={ratingStyles.title}>قيّم تجربتك مع البوت 🤖</Text>
          <View style={ratingStyles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => submitRating(n)} activeOpacity={0.7} style={ratingStyles.starBtn}>
                <Text style={ratingStyles.starEmoji}>⭐</Text>
                <Text style={ratingStyles.starNum}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },

  // ── Chips
  chipsScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    flexGrow: 0,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  chipText: {
    color: Colors.primaryOrange,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Message list
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexGrow: 1,
  },

  // ── Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },

  // ── Bot avatar
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarEmoji: {
    fontSize: 16,
  },

  // ── Bubbles
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    backgroundColor: '#E8F5E9',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primaryOrange,
    borderBottomRightRadius: 4,
  },
  typingBubble: {
    paddingVertical: 14,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botBubbleText: {
    color: '#2E7D32',
  },
  userBubbleText: {
    color: Colors.white,
  },
  timestamp: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 4,
    textAlign: 'left',
  },
  timestampUser: {
    textAlign: 'right',
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // ── Typing dots
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  // ── Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.grayDark,
    backgroundColor: Colors.background,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },

  // ── Rate button in header
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  rateBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  ratedText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
});

const ratingStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, alignItems: 'center', gap: 20,
  },
  title: { fontSize: 17, fontWeight: '800', color: Colors.grayDark, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 12 },
  starBtn: { alignItems: 'center', gap: 4 },
  starEmoji: { fontSize: 28 },
  starNum: { fontSize: 12, color: Colors.grayMedium, fontWeight: '700' },
});
