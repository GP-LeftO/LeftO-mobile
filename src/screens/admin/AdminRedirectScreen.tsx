import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isRTL } from '../../i18n';
import { Colors } from '../../theme';

const ADMIN_URL = 'https://lefto-admin.vercel.app';

interface Props {
  onLogout: () => void;
}

export default function AdminRedirectScreen({ onLogout }: Props) {
  const rtl = isRTL();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🖥️</Text>

        <Text style={styles.title}>
          {rtl ? 'أنت مدير المنصة' : 'You are a platform admin'}
        </Text>

        <Text style={styles.body}>
          {rtl
            ? 'لوحة إدارة LeftO متاحة عبر المتصفح فقط.\nافتح الرابط التالي على حاسوبك:'
            : 'The LeftO admin panel is available via browser only.\nOpen the following link on your computer:'}
        </Text>

        <TouchableOpacity
          style={styles.urlBox}
          onPress={() => Linking.openURL(ADMIN_URL)}>
          <Text style={styles.urlText}>{ADMIN_URL}</Text>
          <Text style={styles.urlHint}>
            {rtl ? '← اضغط للفتح في المتصفح' : 'Tap to open in browser →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>
            {rtl ? 'تسجيل الخروج' : 'Log out'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 20,
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 22, fontWeight: '800', color: Colors.grayDark,
    textAlign: 'center',
  },
  body: {
    fontSize: 15, color: Colors.grayMedium,
    textAlign: 'center', lineHeight: 24,
  },
  urlBox: {
    backgroundColor: '#F0FDF4', borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.greenMain,
    paddingHorizontal: 24, paddingVertical: 16,
    alignItems: 'center', gap: 6,
  },
  urlText: {
    fontSize: 16, fontWeight: '700', color: Colors.greenMain,
    textDecorationLine: 'underline',
  },
  urlHint: { fontSize: 12, color: Colors.grayMedium },
  logoutBtn: {
    marginTop: 8, paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.grayMedium },
});
