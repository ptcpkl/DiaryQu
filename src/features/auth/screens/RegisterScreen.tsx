import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AuthStackParamList} from '../../../app/navigation/types';
import {BrandMark} from '../../../components/common/BrandMark';
import {AppButton, AppText, TextField} from '../../../components/ui';
import {colors, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../store/authStore';
import {
  validateRegister,
  type RegisterValidationResult,
} from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({navigation}: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState<RegisterValidationResult>({});

  const register = useAuthStore(state => state.register);
  const isSubmitting = useAuthStore(state => state.isSubmitting);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const handleSubmit = async () => {
    const nextValidation = validateRegister(
      fullName,
      email,
      password,
      confirmPassword,
    );
    setValidation(nextValidation);
    if (Object.keys(nextValidation).length > 0) return;

    const outcome = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });

    if (outcome === 'verification_required') {
      Alert.alert(
        'Cek email Anda',
        'Akun berhasil dibuat. Buka email verifikasi dari DiaryQu, lalu kembali untuk masuk.',
        [{text: 'Ke Login', onPress: () => navigation.navigate('Login')}],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <BrandMark light />
            <View style={styles.heroIcon}>
              <AppText variant="display" tone="onPrimary">⌂</AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="title" align="center">Buat Akun DiaryQu</AppText>
            <AppText variant="body" tone="secondary" align="center" style={styles.subtitle}>
              Daftar dulu, lalu buat atau bergabung ke Family Room keluarga Anda.
            </AppText>

            <View style={styles.form}>
              <TextField
                value={fullName}
                onChangeText={value => {
                  setFullName(value);
                  setValidation(current => ({...current, fullName: undefined}));
                  clearError();
                }}
                placeholder="Nama lengkap"
                textContentType="name"
                autoCapitalize="words"
                maxLength={80}
                accessibilityLabel="Nama lengkap"
                error={validation.fullName}
              />
              <TextField
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setValidation(current => ({...current, email: undefined}));
                  clearError();
                }}
                placeholder="Email"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email"
                error={validation.email}
              />
              <TextField
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setValidation(current => ({...current, password: undefined}));
                  clearError();
                }}
                placeholder="Password minimal 8 karakter"
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="Password"
                error={validation.password}
              />
              <TextField
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  setValidation(current => ({...current, confirmPassword: undefined}));
                  clearError();
                }}
                placeholder="Ulangi password"
                secureTextEntry
                textContentType="newPassword"
                accessibilityLabel="Konfirmasi password"
                error={validation.confirmPassword}
              />

              {authError ? (
                <AppText variant="bodySmall" tone="danger" align="center">
                  {authError}
                </AppText>
              ) : null}

              <AppButton
                label="Daftar"
                size="md"
                loading={isSubmitting}
                onPress={handleSubmit}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kembali ke login"
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}>
                <AppText variant="bodySmall" tone="secondary" align="center">
                  Sudah punya akun? <AppText variant="bodyStrong" tone="primary">Masuk</AppText>
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  safeArea: {flex: 1, backgroundColor: colors.primary},
  scrollContent: {flexGrow: 1, backgroundColor: colors.background},
  hero: {
    height: 260,
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 34,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 118,
    height: 118,
    borderRadius: radius.pill,
    marginTop: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    marginTop: -28,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 34,
    paddingBottom: 48,
  },
  subtitle: {marginTop: spacing.sm, paddingHorizontal: spacing.lg},
  form: {marginTop: spacing.xxl, gap: spacing.md},
  loginLink: {paddingVertical: spacing.md},
});
