import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';
import { sponsorMeal } from '../../../services/buyer/karam.service';
import { getStripeHook } from '../../../services/shared/stripe.service';
import { isExpoGo } from '../../../services/shared/pushNotifications.service';

interface KaramCheckoutScreenProps {
  sellerId:    string;
  listingId:   string;
  sellerName:  string;
  onBack:      () => void;
  onSuccess:   () => void;
  onSponsored?: () => void;
}

export default function KaramCheckoutScreen({
  sellerId, listingId, sellerName, onBack, onSuccess, onSponsored,
}: KaramCheckoutScreenProps) {
  const rtl        = isRTL();
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 44 : insets.top;
  const [loading,    setLoading]    = useState(false);
  const [payMethod,  setPayMethod]  = useState<'cash' | 'card'>('cash');

  const { initPaymentSheet, presentPaymentSheet } = getStripeHook();

  const handlePay = async () => {
    setLoading(true);
    try {
      if (payMethod === 'cash') {
        await sponsorMeal(sellerId, listingId);
        onSponsored?.();
        onSuccess();
        return;
      }

      // Card payment — Expo Go guard
      if (isExpoGo) {
        Alert.alert(
          rtl ? 'تنبيه' : 'Notice',
          rtl
            ? 'الدفع بالبطاقة يتطلب تثبيت التطبيق الكامل (APK). استخدم خيار الكاش للتجربة.'
            : 'Card payment requires the full app (APK). Use cash for testing.'
        );
        return;
      }

      const res    = await sponsorMeal(sellerId, listingId);
      const result = res.data.data;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: `LeftO — كرم | ${result.sellerName || sellerName}`,
      });
      if (initError) {
        Alert.alert(rtl ? 'خطأ' : 'Error', initError.message);
        return;
      }

      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if ((payError as { code?: string }).code !== 'Canceled') {
          Alert.alert(
            rtl ? 'فشلت عملية الدفع' : 'Payment failed',
            rtl ? 'حاول مجدداً' : 'Please try again'
          );
        }
        return;
      }

      onSponsored?.();
      onSuccess();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        status === 400
          ? (rtl ? 'هذا البائع لا يشارك في برنامج كرم' : 'This seller is not in the Karam program')
          : (rtl ? 'تعذّر إتمام العملية' : 'Could not complete payment')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name={rtl ? 'arrow-right' : 'arrow-left'} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {rtl ? 'كرم — تبرع بوجبة' : 'Karam — Sponsor a Meal'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.iconLarge}>🤲</Text>
        <Text style={[styles.title, rtl && styles.textRight]}>
          {rtl ? 'تبرع بوجبة لمن يحتاج' : 'Sponsor a free meal'}
        </Text>
        <Text style={[styles.subtitle, rtl && styles.textRight]}>
          {rtl
            ? `ادعم وجبة مجانية من متجر ${sellerName} لشخص محتاج`
            : `Support a free meal from ${sellerName} for someone in need`}
        </Text>

        <View style={[styles.infoRow, rtl && styles.rowReverse]}>
          <Feather name="check-circle" size={16} color={Colors.greenMain} />
          <Text style={[styles.infoText, rtl && styles.textRight]}>
            {rtl ? 'يتيح لشخص ما استلام وجبة مجاناً' : 'Allows someone to claim a free meal'}
          </Text>
        </View>
        <View style={[styles.infoRow, rtl && styles.rowReverse]}>
          <Feather name="lock" size={16} color={Colors.greenMain} />
          <Text style={[styles.infoText, rtl && styles.textRight]}>
            {rtl ? 'دفع آمن' : 'Secure payment'}
          </Text>
        </View>
      </View>

      {/* Payment method selector */}
      <Text style={[styles.payMethodLabel, rtl && styles.textRight]}>
        {rtl ? 'طريقة الدفع' : 'Payment method'}
      </Text>
      <View style={[styles.payMethodRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.payMethodBtn, payMethod === 'cash' && styles.payMethodBtnActive]}
          onPress={() => setPayMethod('cash')}
          activeOpacity={0.8}
        >
          <Text style={[styles.payMethodBtnText, payMethod === 'cash' && styles.payMethodBtnTextActive]}>
            {rtl ? '💵 كاش' : '💵 Cash'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payMethodBtn, payMethod === 'card' && styles.payMethodBtnActive]}
          onPress={() => setPayMethod('card')}
          activeOpacity={0.8}
        >
          <Text style={[styles.payMethodBtnText, payMethod === 'card' && styles.payMethodBtnTextActive]}>
            {rtl ? '💳 بطاقة' : '💳 Card'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test card hint — only shown when card is selected */}
      {payMethod === 'card' && (
        <View style={[styles.testCardHint, rtl && styles.rowReverse]}>
          <Feather name="info" size={13} color={Colors.grayMedium} />
          <Text style={[styles.testCardHintText, rtl && styles.textRight]}>
            {rtl ? 'بطاقة الاختبار: 4242 4242 4242 4242' : 'Test card: 4242 4242 4242 4242'}
          </Text>
        </View>
      )}

      {/* Pay button */}
      <TouchableOpacity
        style={[styles.payBtn, loading && { opacity: 0.6 }]}
        onPress={handlePay}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.payBtnText}>
              {payMethod === 'cash'
                ? (rtl ? 'اكفل الآن 💚' : 'Sponsor Now 💚')
                : (rtl ? 'ادفع بالبطاقة 💳' : 'Pay by Card 💳')}
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelLink} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.cancelLinkText}>{rtl ? 'إلغاء' : 'Cancel'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.grayDark },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight:  { textAlign: 'right' },

  card: {
    margin: Spacing.xl,
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.greenMain,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconLarge: { fontSize: 52, lineHeight: 60 },
  title:     { fontSize: 20, fontWeight: '800', color: Colors.greenMain, textAlign: 'center' },
  subtitle:  { fontSize: 14, color: '#166534', lineHeight: 20, textAlign: 'center' },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  infoText:  { fontSize: 13, color: '#166534', flex: 1 },

  payMethodLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.grayMedium,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
  },
  payMethodRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  payMethodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: Colors.white, alignItems: 'center',
  },
  payMethodBtnActive: {
    borderColor: Colors.greenMain, backgroundColor: '#D1FAE5',
  },
  payMethodBtnText: { fontSize: 14, fontWeight: '600', color: Colors.grayMedium },
  payMethodBtnTextActive: { color: Colors.greenMain },

  testCardHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.grayLight, borderRadius: 10,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  testCardHintText: { fontSize: 12, color: Colors.grayMedium, flex: 1 },

  payBtn: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.greenMain,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },

  cancelLink: { alignItems: 'center', marginTop: Spacing.md },
  cancelLinkText: { fontSize: 14, color: Colors.grayMedium, fontWeight: '600' },
});
