import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ORANGE = '#FF6B35';

type MicState = 'idle' | 'listening' | 'processing';

interface NearMeMicButtonProps {
  state: MicState;
  onPress: () => void;
  large?: boolean;
}

export default function NearMeMicButton({ state, onPress, large = false }: NearMeMicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulse2Anim = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0)).current;

  const btnSize = large ? 96 : 64;
  const wrapSize = large ? 130 : 72;
  const iconSize = large ? 40 : 28;
  const ringSize = large ? 96 : 72;

  useEffect(() => {
    if (state === 'listening') {
      const ring1 = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.7, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.35, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      );
      const ring2 = Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(pulse2Anim, { toValue: 1.7, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse2Opacity, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse2Anim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse2Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      );
      ring1.start();
      ring2.start();
      return () => { ring1.stop(); ring2.stop(); };
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0);
      pulse2Anim.setValue(1);
      pulse2Opacity.setValue(0);
    }
  }, [state]);

  const isDisabled = state === 'processing';

  return (
    <View style={{ width: wrapSize, height: wrapSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            transform: [{ scale: pulse2Anim }],
            opacity: pulse2Opacity,
          },
        ]}
      />
      {/* Inner pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            transform: [{ scale: pulseAnim }],
            opacity: pulseOpacity,
          },
        ]}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
          state === 'listening' && styles.buttonListening,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {state === 'processing' ? (
          <ActivityIndicator color="#FFFFFF" size={large ? 'large' : 'small'} />
        ) : (
          <Feather name="mic" size={iconSize} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    backgroundColor: ORANGE,
  },
  button: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonListening: {
    backgroundColor: '#E85A25',
  },
});
