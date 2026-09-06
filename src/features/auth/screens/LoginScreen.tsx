import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BrandMark} from '../../../components/common/BrandMark';
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
              <Text style={styles.mascot}>👋</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>
              Senang melihatmu kembali. Yuk, lanjut kegiatan hari ini!
            </Text>

            <View style={styles.form}>
              <TextInput
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setValidation(current => ({...current, email: undefined}));
                  clearError();
                }}
                placeholder="Masukan Email Anda"
                placeholderTextColor="#90A79E"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Email"
                style={[styles.input, validation.email && styles.inputError]}
              />
              {validation.email ? (
                <Text style={styles.fieldError}>{validation.email}</Text>
              ) : null}

              <TextInput
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setValidation(current => ({...current, password: undefined}));
                  clearError();
                }}
                placeholder="Masukan Password"
                placeholderTextColor="#90A79E"
                secureTextEntry
                textContentType="password"
                accessibilityLabel="Password"
                style={[styles.input, validation.password && styles.inputError]}
              />
              {validation.password ? (
                <Text style={styles.fieldError}>{validation.password}</Text>
              ) : null}

              {authError ? <Text style={styles.authError}>{authError}</Text> : null}

              {!isSupabaseConfigured ? (
                <Text style={styles.configHint}>
                  Backend Supabase belum terhubung. UI siap, autentikasi akan aktif
                  setelah environment project diisi.
                </Text>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessibilityRole="button"
                style={({pressed}) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Atau dengan</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityState={{disabled: true}}
                style={styles.googleButton}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Login dengan akun Google</Text>
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
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {fontSize: 86},
  card: {
    flex: 1,
    marginTop: -34,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 38,
    paddingBottom: 44,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#52605B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  form: {marginTop: 30, gap: 10},
  input: {
    height: 51,
    borderWidth: 1.2,
    borderColor: '#85D9B5',
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    color: colors.text,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  inputError: {borderColor: colors.danger},
  fieldError: {color: colors.danger, fontSize: 12, marginLeft: 18, marginTop: -5},
  authError: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  configHint: {
    color: colors.textMuted,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 11,
    lineHeight: 16,
  },
  loginButton: {
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {color: '#FFFFFF', fontWeight: '800', fontSize: 15},
  buttonPressed: {opacity: 0.86},
  buttonDisabled: {opacity: 0.65},
  dividerRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16},
  divider: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#AEB7B4'},
  dividerText: {color: '#686F6D', fontSize: 12},
  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#B4BCB9',
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    opacity: 0.7,
  },
  googleIcon: {fontWeight: '900', color: '#4285F4', fontSize: 18},
  googleText: {fontSize: 14, color: '#171717'},
});
