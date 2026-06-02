import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useNearMe } from '../../../hooks/buyer/nearMe/useNearMe';
import { useVoiceRecognition } from '../../../hooks/buyer/nearMe/useVoiceRecognition';
import NearMeChatBubble, { NearMeTypingBubble } from '../../../components/buyer/nearMe/NearMeChatBubble';
import NearMeMicButton from '../../../components/buyer/nearMe/NearMeMicButton';
import type { NearMeCoords, NearMeMessage } from '../../../types/nearMe';
import type { StoreDetailsParams } from '../../../types';

const ORANGE = '#FF6B35';
const NAVY_START = '#1A1A2E';
const NAVY_MID = '#16213E';
const NAVY_END = '#0F3460';

const TYPING_PLACEHOLDER_ID = '__near_me_typing__';

const QUICK_CHIPS = [
  'بس حلويات 🍰',
  'الأرخص أولاً',
  'الأقرب مني',
  'وجبات 🍱',
];

interface NearMeScreenProps {
  coords: NearMeCoords;
  onBack: () => void;
  onListingPress: (params: StoreDetailsParams) => void;
}

export default function NearMeScreen({ coords, onBack, onListingPress }: NearMeScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isLoading,
    inputText,
    setInputText,
    sendNearMeQuery,
  } = useNearMe(coords);

  const handleVoiceResult = useCallback((text: string) => sendNearMeQuery(text), [sendNearMeQuery]);
  const { voiceState, partialResult, toggleListening } = useVoiceRecognition({
    onResult: handleVoiceResult,
  });

  const flatListRef = useRef<FlatList<NearMeMessage>>(null);
  const headerPinScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(headerPinScale, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(headerPinScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const isEmpty = messages.length === 0 && !isLoading;

  const displayMessages = useMemo<NearMeMessage[]>(() => {
    const withTyping: NearMeMessage[] = isLoading
      ? [...messages, { id: TYPING_PLACEHOLDER_ID, role: 'ai', text: '', timestamp: new Date() }]
      : messages;
    return [...withTyping].reverse();
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    sendNearMeQuery(trimmed);
  };

  const displayInputText = voiceState === 'listening' && partialResult ? partialResult : inputText;
  const isSendDisabled = !displayInputText.trim() || isLoading;

  const micLabel =
    voiceState === 'listening' ? 'جارٍ الاستماع... تحدث الآن' :
    voiceState === 'processing' ? 'جارٍ المعالجة...' :
    'اضغط وتحدث';

  return (
    <LinearGradient
      colors={[NAVY_START, NAVY_MID, NAVY_END]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={NAVY_START} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name="arrow-right" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Animated.Text style={[styles.headerPin, { transform: [{ scale: headerPinScale }] }]}>
              📍
            </Animated.Text>
            <Text style={styles.headerTitle}>اسألني الآن</Text>
          </View>

          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>مباشر</Text>
          </View>
        </View>

        {/* ── Empty / welcome state ── */}
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>اكتشف أقرب العروض إليك</Text>
            <Text style={styles.emptySub}>طعام، حلويات، مخبوزات وأكثر...</Text>

            {/* Large mic button */}
            <View style={styles.largeMicWrap}>
              <NearMeMicButton
                state={voiceState}
                onPress={toggleListening}
                large
              />
            </View>

            <Text style={[
              styles.micLabel,
              voiceState === 'listening' && styles.micLabelActive,
            ]}>
              {micLabel}
            </Text>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو اختر من هنا</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick chips */}
            <View style={styles.chipsRow}>
              {QUICK_CHIPS.map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => sendNearMeQuery(chip)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* ── Message list ── */
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            inverted
            renderItem={({ item }) =>
              item.id === TYPING_PLACEHOLDER_ID
                ? <NearMeTypingBubble />
                : <NearMeChatBubble message={item} onListingPress={onListingPress} />
            }
            contentContainerStyle={[styles.messageList, { paddingBottom: insets.bottom + 8 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            value={displayInputText}
            onChangeText={setInputText}
            placeholder="اكتب سؤالك..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={[styles.input, voiceState === 'listening' && styles.inputListening]}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading && voiceState === 'idle'}
          />

          <TouchableOpacity
            style={[styles.sendBtn, isSendDisabled && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={isSendDisabled}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <NearMeMicButton
            state={isLoading ? 'processing' : voiceState}
            onPress={toggleListening}
          />
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerPin: { fontSize: 22 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,53,0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ORANGE,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: ORANGE,
  },

  // ── Empty / welcome state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 16,
  },
  largeMicWrap: {
    marginVertical: 12,
  },
  micLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  micLabelActive: {
    color: ORANGE,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 4,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },

  // ── Messages
  messageList: {
    paddingTop: 12,
    paddingHorizontal: 0,
    flexGrow: 1,
  },

  // ── Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    textAlign: 'right',
  },
  inputListening: {
    borderColor: ORANGE,
    borderWidth: 1.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Quick chips (in empty state)
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  chipText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: '600',
  },
});
