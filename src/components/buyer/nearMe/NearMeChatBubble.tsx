import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import StoreCardResult from './StoreCardResult';
import type { NearMeMessage, NearMeListing } from '../../../types/nearMe';
import type { StoreDetailsParams } from '../../../types';

const ORANGE = '#FF6B35';
const DARK_CARD = '#1E2A3A';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NearMeChatBubbleProps {
  message: NearMeMessage;
  onListingPress: (params: StoreDetailsParams) => void;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function NearMeChatBubble({ message, onListingPress }: NearMeChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasListings = !isUser && message.listings && message.listings.length > 0;

  if (isUser) {
    return (
      <View style={styles.rowUser}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
          <Text style={styles.timestampUser}>{formatTime(message.timestamp)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowAi}>
      {/* AI avatar */}
      <View style={styles.aiAvatar}>
        <Text style={styles.avatarEmoji}>📍</Text>
      </View>

      {/* AI content */}
      <View style={styles.aiContentWrap}>
        {/* Text bubble */}
        {message.text ? (
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{message.text}</Text>
            <Text style={styles.timestampAi}>{formatTime(message.timestamp)}</Text>
          </View>
        ) : null}

        {/* Store cards — horizontal scroll */}
        {hasListings && (
          <FlatList
            data={message.listings as NearMeListing[]}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            renderItem={({ item }) => (
              <StoreCardResult listing={item} onPress={onListingPress} />
            )}
          />
        )}
      </View>
    </View>
  );
}

// Typing indicator variant
export function NearMeTypingBubble() {
  return (
    <View style={styles.rowAi}>
      <View style={styles.aiAvatar}>
        <Text style={styles.avatarEmoji}>📍</Text>
      </View>
      <View style={[styles.aiBubble, styles.typingBubble]}>
        <Text style={styles.typingText}>جاري البحث...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── User message
  rowUser: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  userBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    backgroundColor: ORANGE,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 22,
    fontWeight: '500',
  },
  timestampUser: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    marginTop: 4,
  },

  // ── AI message
  rowAi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 16,
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  aiContentWrap: {
    flex: 1,
    gap: 10,
  },
  aiBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    backgroundColor: DARK_CARD,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    lineHeight: 22,
  },
  timestampAi: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'left',
    marginTop: 4,
  },

  // ── Cards
  cardsContainer: {
    paddingRight: 16,
  },
  cardGap: {
    width: 10,
  },

  // ── Typing
  typingBubble: {
    paddingVertical: 14,
  },
  typingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
});
