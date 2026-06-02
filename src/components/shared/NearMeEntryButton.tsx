import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NearMeCoords } from '../../types/nearMe';

const ORANGE = '#FF6B35';
const NAVY = '#1A1A2E';

interface NearMeEntryButtonProps {
  onPress: (coords: NearMeCoords) => void;
}

export default function NearMeEntryButton({ onPress }: NearMeEntryButtonProps) {
  const glow = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const requestAndNavigate = async () => {
    setLoading(true);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLoading(false);
        // Only show modal if we can still prompt; otherwise go straight to settings
        if (!canAskAgain) {
          Linking.openSettings();
        } else {
          setShowPermissionModal(true);
        }
        return;
      }

      // Try last-known position first (instant); fall back to fresh fix
      const cached = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
      if (cached) {
        setLoading(false);
        onPress({ latitude: cached.coords.latitude, longitude: cached.coords.longitude });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10_000,
      });
      setLoading(false);
      onPress({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e: unknown) {
      setLoading(false);
      const msg = (e as { message?: string })?.message ?? '';
      const isServicesOff = msg.toLowerCase().includes('location services') || msg.includes('disabled');
      Alert.alert(
        'خطأ في الموقع',
        isServicesOff
          ? 'خدمة الموقع معطّلة. فعّلها من إعدادات الجهاز وحاول مجدداً.'
          : 'تعذّر الحصول على موقعك. تأكد من تفعيل خدمة الموقع وحاول مجدداً.',
      );
    }
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: glow }] }}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonLoading]}
          onPress={requestAndNavigate}
          activeOpacity={0.88}
          disabled={loading}
        >
          <View style={styles.inner}>
            <Feather name="map-pin" size={20} color="#FFFFFF" />
            <Text style={styles.label}>
              {loading ? 'جارٍ تحديد موقعك...' : 'اسألني الآن 📍'}
            </Text>
            {!loading && (
              <View style={styles.arrow}>
                <Feather name="chevron-left" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Permission explanation modal */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Feather name="map-pin" size={32} color={ORANGE} />
            </View>
            <Text style={styles.modalTitle}>نحتاج موقعك</Text>
            <Text style={styles.modalBody}>
              لكي نجد أقرب العروض إليك، نحتاج الإذن للوصول إلى موقعك. افتح الإعدادات وفعّل الموقع لتطبيق LeftO.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowPermissionModal(false);
                Linking.openSettings();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>السماح بالوصول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPermissionModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>ليس الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: ORANGE,
    borderRadius: 20,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonLoading: {
    opacity: 0.8,
  },
  inner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    letterSpacing: 0.2,
  },
  arrow: {
    opacity: 0.7,
  },

  // ── Permission modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCancel: {
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
