import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';
import { useChatbot, CHIPS, isArabicText } from '../../../hooks/buyer/support/useChatbot';
import type { ChatMessage } from '../../../types/chatbot';

interface ChatbotScreenProps {
  onBack?: () => void;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingBubble() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const CYCLE = 1500;
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(CYCLE - (i * 300) - 600),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Text style={styles.botAvatarEmoji}>🤖</Text>
      </View>
      <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const arabic = isArabicText(message.text);

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarEmoji}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.userBubbleText : styles.botBubbleText,
            arabic && { textAlign: 'right', writingDirection: 'rtl' },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const TYPING_PLACEHOLDER: ChatMessage = {
  id: '__typing__',
  role: 'bot',
  text: '',
  timestamp: new Date(),
};

export default function ChatbotScreen({ onBack }: ChatbotScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const listRef = useRef<FlatList>(null);

  const { messages, inputText, isLoading, chipsVisible, setInputText, sendMessage, handleChipTap } = useChatbot();

  const isSendDisabled = inputText.trim() === '' || isLoading;

  const displayData = useMemo(() => {
    const withTyping = isLoading ? [...messages, TYPING_PLACEHOLDER] : messages;
    return [...withTyping].reverse();
  }, [messages, isLoading]);

  useEffect(() => {
    if (displayData.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [displayData.length]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.id === '__typing__') return <TypingBubble />;
    return <MessageBubble message={item} />;
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, rtl && { transform: [{ scaleX: -1 }] }]}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>LeftO Bot</Text>
            <Text style={styles.headerSubtitle}>{rtl ? 'مساعدك الذكي' : 'Your AI assistant'}</Text>
          </View>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={displayData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Suggested chips ── */}
      {chipsVisible && (
        <View style={[styles.chipsRow, rtl && { flexDirection: 'row-reverse' }]}>
          {CHIPS.map(chip => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => handleChipTap(chip)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.input, rtl && { textAlign: 'right' }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={rtl ? 'اكتب رسالتك...' : 'Type a message...'}
          placeholderTextColor={Colors.grayMedium}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(inputText)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, isSendDisabled && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={isSendDisabled}
          activeOpacity={0.75}
        >
          <Feather name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primaryOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 14,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  listContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 12 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botAvatarEmoji: { fontSize: 16 },

  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: Colors.primaryOrange, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#E8F5E9', borderBottomLeftRadius: 4 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 14 },

  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: Colors.white },
  botBubbleText: { color: '#2E7D32' },

  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.grayMedium },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primaryOrange + '40',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.primaryOrange },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.grayLight,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.grayDark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: Colors.grayMedium },
});
