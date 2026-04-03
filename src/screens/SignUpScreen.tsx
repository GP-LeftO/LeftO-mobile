import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../theme';

type Fields = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

type Errors = Partial<Fields>;

function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
  if (password.length < 5) return { level: 1, label: 'Weak', color: colors.error };
  if (password.length < 8) return { level: 2, label: 'Fair', color: '#F97316' };
  if (password.length < 12) return { level: 3, label: 'Good', color: '#EAB308' };
  return { level: 4, label: 'Strong', color: colors.success };
}

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [fields, setFields] = useState<Fields>({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = getPasswordStrength(fields.password);

  const updateField = (key: keyof Fields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
    if (key === 'name' && value.trim()) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!fields.name.trim()) newErrors.name = t('auth.errors.nameRequired');
    if (fields.phone.length < 10) newErrors.phone = t('auth.errors.phoneInvalid');
    if (!fields.email.includes('@')) newErrors.email = t('auth.errors.emailInvalid');
    if (fields.password.length < 8) newErrors.password = t('auth.errors.passwordShort');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      navigation.navigate('RoleSelection');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>{t('auth.signUp.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.signUp.subtitle')}</Text>

        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('auth.fields.name')}</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder={t('auth.placeholders.name')}
            placeholderTextColor={colors.gray.medium}
            value={fields.name}
            onChangeText={v => updateField('name', v)}
            keyboardType="default"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('auth.fields.phone')}</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder={t('auth.placeholders.phone')}
            placeholderTextColor={colors.gray.medium}
            value={fields.phone}
            onChangeText={v => updateField('phone', v)}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('auth.fields.email')}</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t('auth.placeholders.email')}
            placeholderTextColor={colors.gray.medium}
            value={fields.email}
            onChangeText={v => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('auth.fields.password')}</Text>
          <View style={[styles.input, styles.passwordRow, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.placeholders.password')}
              placeholderTextColor={colors.gray.medium}
              value={fields.password}
              onChangeText={v => updateField('password', v)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.toggleText}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password strength bar */}
          {fields.password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBg}>
                <View style={[
                  styles.strengthBarFill,
                  {
                    width: `${(passwordStrength.level / 4) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }
                ]} />
              </View>
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{t('auth.signUp.button')}</Text>
        </TouchableOpacity>

        {/* Sign In link */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            {t('auth.signUp.haveAccount')}{' '}
            <Text style={styles.linkHighlight}>{t('auth.signIn.title')}</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray.medium,
    marginBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray.light,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray.dark,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.gray.dark,
  },
  toggleText: {
    fontSize: 18,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  strengthLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    minWidth: 40,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.orange.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.gray.medium,
  },
  linkHighlight: {
    color: colors.orange.main,
    fontWeight: typography.weights.medium,
  },
});