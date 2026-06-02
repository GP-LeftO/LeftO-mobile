import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

const ORANGE = '#FF6B35';

export default function LocationPinLoader() {
  const pinY = useRef(new Animated.Value(-60)).current;
  const pinBounce = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: pin drops in
    Animated.sequence([
      Animated.spring(pinY, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      // Phase 2: bounce squish
      Animated.spring(pinBounce, {
        toValue: 0.85,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(pinBounce, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 3: ripple rings expand
      const makeRipple = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        );

      [
        makeRipple(ring1, 0),
        makeRipple(ring2, 400),
        makeRipple(ring3, 800),
      ].forEach(a => a.start());

      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const makeRingStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
  });

  return (
    <View style={styles.container}>
      {/* Ripple rings */}
      <View style={styles.ringsContainer}>
        <Animated.View style={[styles.ring, makeRingStyle(ring1)]} />
        <Animated.View style={[styles.ring, makeRingStyle(ring2)]} />
        <Animated.View style={[styles.ring, makeRingStyle(ring3)]} />
      </View>

      {/* Pin */}
      <Animated.View
        style={[
          styles.pinWrap,
          { transform: [{ translateY: pinY }, { scaleY: pinBounce }] },
        ]}
      >
        <View style={styles.pinHead}>
          <Text style={styles.pinEmoji}>📍</Text>
        </View>
        <View style={styles.pinTail} />
      </Animated.View>

      {/* Label */}
      <Animated.Text style={[styles.label, { opacity: textOpacity }]}>
        جارٍ تحديد موقعك...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  ringsContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: ORANGE,
  },
  pinWrap: {
    alignItems: 'center',
  },
  pinHead: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  pinEmoji: {
    fontSize: 28,
  },
  pinTail: {
    width: 3,
    height: 12,
    backgroundColor: ORANGE,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
