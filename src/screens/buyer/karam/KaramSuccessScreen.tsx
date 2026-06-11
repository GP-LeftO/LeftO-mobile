import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';

interface KaramSuccessScreenProps {
  sellerName: string;
  onDone:     () => void;
}

export default function KaramSuccessScreen({ sellerName, onDone }: KaramSuccessScreenProps) {
  const rtl    = isRTL();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}>
      <Text style={styles.emoji}>💚</Text>

      <Text style={[styles.title, rtl && styles.textRight]}>
        {rtl ? 'شكراً جزيلاً!' : 'Thank you!'}
      </Text>

      <Text style={[styles.subtitle, rtl && styles.textRight]}>
        {rtl
          ? `لقد دعمت وجبة مجانية من متجر ${sellerName}\nجزاك الله خيراً 🇵🇸`
          : `You funded a free meal from ${sellerName}\nMay you be rewarded 🇵🇸`}
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>🤲</Text>
        <Text style={[styles.badgeLabel, rtl && styles.textRight]}>
          {rtl ? 'كرم — برنامج إطعام المحتاجين' : 'Karam — Feeding those in need'}
        </Text>
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>{rtl ? 'عودة للرئيسية' : 'Back to Home'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xxl, gap: Spacing.lg,
  },
  emoji:     { fontSize: 80, lineHeight: 90 },
  title:     { fontSize: 28, fontWeight: '800', color: Colors.grayDark, textAlign: 'center' },
  subtitle:  { fontSize: 16, color: Colors.grayMedium, textAlign: 'center', lineHeight: 24 },
  textRight: { textAlign: 'right' },

  badge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.greenMain,
    alignSelf: 'stretch',
  },
  badgeIcon:  { fontSize: 32 },
  badgeLabel: { fontSize: 14, fontWeight: '700', color: Colors.greenMain, textAlign: 'center' },

  doneBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16,
    paddingVertical: 15,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});
