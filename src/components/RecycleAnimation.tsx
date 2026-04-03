import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { colors } from '../theme';

export default function RecycleAnimation() {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scale in first
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Then rotate forever
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      {/* Outer circle */}
      <View style={styles.outerCircle}>
        {/* Rotating arrow ring */}
        <Animated.View style={[styles.arrowRing, { transform: [{ rotate }] }]}>
          {/* Arrow segments */}
          {[0, 120, 240].map((deg, i) => (
            <View
              key={i}
              style={[
                styles.arrowSegment,
                { transform: [{ rotate: `${deg}deg` }] },
              ]}
            >
              <View style={styles.arrowLine} />
              <View style={styles.arrowHead} />
            </View>
          ))}
        </Animated.View>

        {/* Center icon */}
        <View style={styles.centerCircle}>
          <View style={styles.foodIcon}>
            <View style={styles.bagBody} />
            <View style={styles.bagTop} />
            <View style={styles.heart} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
  },
  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.orange.light,
  },
  arrowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowSegment: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  arrowLine: {
    width: 4,
    height: 60,
    backgroundColor: colors.orange.main,
    borderRadius: 2,
    marginTop: 8,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.orange.main,
    marginTop: -2,
  },
  centerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagBody: {
    width: 36,
    height: 32,
    backgroundColor: colors.green.main,
    borderRadius: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bagTop: {
    width: 24,
    height: 10,
    backgroundColor: colors.green.dark,
    borderRadius: 4,
    marginBottom: 2,
  },
  heart: {
    position: 'absolute',
    width: 14,
    height: 12,
    backgroundColor: colors.orange.main,
    borderRadius: 6,
    top: 18,
  },
});