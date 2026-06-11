import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing } from '../../theme';
import { isRTL } from '../../i18n';
import api from '../../services/shared/api';

interface QRScannerScreenProps {
  orderId:     string;
  orderTitle?: string;
  onBack:      () => void;
  onSuccess:   () => void;
}

export default function QRScannerScreen({ orderId, orderTitle, onBack, onSuccess }: QRScannerScreenProps) {
  const rtl        = isRTL();
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 44 : insets.top;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,   setScanning]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanError,  setScanError]  = useState<string | null>(null);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!scanning || submitting) return;
    setScanning(false);
    setSubmitting(true);
    setScanError(null);
    try {
      await api.post(`/api/orders/${orderId}/scan`, { token: data });
      onSuccess();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 400 ? (rtl ? 'رمز QR غير صالح أو منتهي' : 'Invalid or expired QR code')
        : status === 404 ? (rtl ? 'الطلب غير موجود' : 'Order not found')
        : (rtl ? 'تعذّر التحقق من الرمز' : 'Could not verify code');
      setScanError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [scanning, submitting, orderId, rtl, onSuccess]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding }]}>
        <ActivityIndicator color={Colors.primaryOrange} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={[styles.header, rtl && styles.rowReverse]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name={rtl ? 'arrow-right' : 'arrow-left'} size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{rtl ? 'مسح QR' : 'Scan QR'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.centered, { flex: 1, paddingHorizontal: Spacing.xxl }]}>
          <Feather name="camera-off" size={56} color={Colors.grayMedium} style={{ marginBottom: Spacing.lg }} />
          <Text style={[styles.permissionTitle, rtl && styles.textRight]}>
            {rtl ? 'يتطلب إذن الكاميرا' : 'Camera permission required'}
          </Text>
          <Text style={[styles.permissionSub, rtl && styles.textRight]}>
            {rtl
              ? 'نحتاج للوصول إلى الكاميرا لمسح رمز QR الخاص بالبائع'
              : 'We need camera access to scan the seller QR code'}
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.grantBtnText}>{rtl ? 'السماح بالوصول' : 'Grant Access'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name={rtl ? 'arrow-right' : 'arrow-left'} size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{rtl ? 'مسح رمز QR' : 'Scan QR Code'}</Text>
          {orderTitle && (
            <Text style={styles.headerSub} numberOfLines={1}>{orderTitle}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Instruction banner */}
      <View style={[styles.instructionBanner, rtl && styles.rowReverse]}>
        <Feather name="info" size={14} color="#166534" />
        <Text style={[styles.instructionText, rtl && styles.textRight]}>
          {rtl
            ? 'اطلب من البائع عرض رمز QR الخاص به، ثم وجّه الكاميرا نحوه'
            : 'Ask the seller to show their QR code, then point the camera at it'}
        </Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraWrap}>
        {scanning && !submitting && (
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}

        {/* Scan frame corners */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanFrame}>
            <View style={[styles.scanCorner, styles.scanCornerTL]} />
            <View style={[styles.scanCorner, styles.scanCornerTR]} />
            <View style={[styles.scanCorner, styles.scanCornerBL]} />
            <View style={[styles.scanCorner, styles.scanCornerBR]} />
          </View>
        </View>

        {/* Verifying overlay */}
        {submitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.submittingText}>
              {rtl ? 'جارٍ التحقق…' : 'Verifying…'}
            </Text>
          </View>
        )}
      </View>

      {/* Error panel */}
      {scanError && (
        <View style={styles.errorPanel}>
          <Feather name="x-circle" size={20} color="#ef4444" />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{scanError}</Text>
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => { setScanError(null); setScanning(true); }}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={14} color={Colors.white} />
            <Text style={styles.rescanBtnText}>{rtl ? 'مسح مرة أخرى' : 'Scan Again'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const SCAN_SIZE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centered:  { alignItems: 'center', justifyContent: 'center' },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight:  { textAlign: 'right' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  headerSub:   { fontSize: 12, color: '#9CA3AF' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  instructionBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: '#D1FAE5', borderRadius: 12,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  instructionText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 18 },

  cameraWrap: {
    flex: 1, position: 'relative',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#1C1C1C',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanFrame: {
    width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative',
  },
  scanCorner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: Colors.primaryOrange, borderWidth: 3,
  },
  scanCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  scanCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  scanCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  scanCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },

  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', gap: 12,
  },
  submittingText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  errorPanel: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    backgroundColor: '#fef2f2', borderRadius: 16, padding: Spacing.lg,
    alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#fecaca',
  },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', fontWeight: '600' },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryOrange, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  rescanBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  permissionTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  permissionSub: {
    fontSize: 14, color: '#9CA3AF', textAlign: 'center',
    lineHeight: 20, marginBottom: Spacing.xl,
  },
  grantBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  grantBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
