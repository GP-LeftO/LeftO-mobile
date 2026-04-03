import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Logo from '../../assets/logo.svg';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
    ]).start(() => {
      navigation.navigate('Onboarding');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] }
      ]}>
        <Logo width={180} height={180} viewBox="0 0 552 631" />
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Good food, better price
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
    width: 200,
    height: 200,
    borderRadius: borderRadius.full,
    backgroundColor: '#F3F4F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tagline: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.orange.main,
    letterSpacing: 0.5,
  },
});