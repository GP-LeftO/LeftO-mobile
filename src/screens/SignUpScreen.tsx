import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign Up Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: typography.sizes.lg,
    color: colors.gray.dark,
  },
});