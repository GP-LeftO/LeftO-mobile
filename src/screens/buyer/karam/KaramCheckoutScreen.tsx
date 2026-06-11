import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';
import { sponsorMeal } from '../../../services/buyer/karam.service';
import { getStripeHook, isStripeAvailable } from '../../../services/shared/stripe.service';

interface KaramCheckoutScreenProps {
  sellerId:   string;
  listingId:  string;
  sellerName: string;
  onBack:     () => void;
  onSuccess:  () => void;
}

export default function KaramCheckoutScreen({
  sellerId, listingId, sellerName, onBack, onSuccess,
}: KaramCheckoutScreenProps) {
  const rtl        = isRTL();
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 44 : insets.top;
  const [loading,  setLoading]  = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = getStripeHook();

  const handlePay = async () => {
    setLoading(true);
    try {
      const res    = await sponsorMeal(sellerId, listingId);
      const result = res.data.data;

      const available = await isStripeAvailable();
      if (!available) {
        // Expo Go — no native Stripe module, simulate success
        onSuccess();
        return;
      }

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

      {/* Card */}
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
            {rtl ? 'دفع آمن عبر Stripe' : 'Secure payment via Stripe'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, loading && { opacity: 0.6 }]}
        onPress={handlePay}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.payBtnText}>{rtl ? 'تبرع الآن 💚' : 'Sponsor now 💚'}</Text>
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
