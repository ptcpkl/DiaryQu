import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BrandMark} from '../../../components/common/BrandMark';
import {AppButton, AppText, TextField} from '../../../components/ui';
import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {colors, radius, spacing} from '../../../constants/theme';
import {isSupabaseConfigured} from '../../../lib/supabase/client';
import {useAuthStore} from '../store/authStore';
import {validateLogin, type LoginValidationResult} from '../utils/validation';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<LoginValidationResult>({});
  const signIn = useAuthStore(state => state.signIn);
  const isSubmitting = useAuthStore(state => state.isSubmitting);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const handleSubmit = async () => {
    if (FRONTEND_DEMO_MODE) {
      setValidation({});
      clearError();
      await signIn({
        email: email.trim() || 'pak.dahlan@diaryqu.demo',
        password: password || 'demo-password',
      });
      return;
    }

    const nextValidation = validateLogin(email, password);
    setValidation(nextValidation);

    if (nextValidation.email || nextValidation.password) {
      return;
    }

    await signIn({email: email.trim(), password});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.hero}>
            <BrandMark light />
            <View style={styles.mascotWrap}>
              <AppText variant="display" tone="onPrimary" style={styles.mascot}>
                👋
              </AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="title" align="center">
              Selamat Datang
            </AppText>
            <AppText
              variant="body"
              tone="secondary"
              align="center"
              style={styles.subtitle}>
              Senang melihatmu kembali. Yuk, lanjut kegiatan hari ini!
            </AppText>

            <View style={styles.form}>
              <TextField
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setValidation(current => ({...current, email: undefined}));
                  clearError();
                }}
                placeholder="Masukan Email Anda"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
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
                placeholder="Masukan Password"
                secureTextEntry
                textContentType="password"
                accessibilityLabel="Password"
                error={validation.password}
              />

              {authError ? (
                <AppText variant="bodySmall" tone="danger" align="center">
                  {authError}
                </AppText>
              ) : null}

              {!FRONTEND_DEMO_MODE && !isSupabaseConfigured ? (
                <View style={styles.configHint}>
                  <AppText variant="micro" tone="muted">
                    Backend Supabase belum terhubung. UI siap, autentikasi akan aktif
                    setelah environment project diisi.
                  </AppText>
                </View>
              ) : null}

              <AppButton
                label="Log In"
                size="md"
                loading={isSubmitting}
                onPress={handleSubmit}
                style={styles.loginButton}
              />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <AppText variant="caption" tone="muted">
                  Atau dengan
                </AppText>
                <View style={styles.divider} />
              </View>

              <AppButton
                label="Login dengan akun Google"
                variant="outline"
                size="lg"
                disabled
                leftIcon={
                  <AppText variant="section" style={styles.googleIcon}>
                    G
                  </AppText>
                }
              />
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
    height: 355,
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 38,
    overflow: 'hidden',
  },
  mascotWrap: {
    width: 174,
    height: 174,
    marginTop: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {fontSize: 86, lineHeight: 96},
  card: {
    flex: 1,
    marginTop: -34,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 38,
    paddingBottom: 44,
  },
  subtitle: {marginTop: spacing.sm, paddingHorizontal: spacing.xl},
  form: {marginTop: 30, gap: spacing.md},
  configHint: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  loginButton: {marginTop: spacing.xs},
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  googleIcon: {fontWeight: '900', color: '#4285F4', fontSize: 18},
});
