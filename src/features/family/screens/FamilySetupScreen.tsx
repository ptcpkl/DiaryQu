import React, {useMemo, useState} from 'react';
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
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../store/familyStore';

type Mode = 'create' | 'join';

export function FamilySetupScreen() {
  const [mode, setMode] = useState<Mode>('create');
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');

  const session = useAuthStore(state => state.session);
  const signOut = useAuthStore(state => state.signOut);
  const createFamily = useFamilyStore(state => state.createFamily);
  const joinFamily = useFamilyStore(state => state.joinFamily);
  const isSubmitting = useFamilyStore(state => state.isSubmitting);
  const error = useFamilyStore(state => state.error);
  const clearError = useFamilyStore(state => state.clearError);
  const load = useFamilyStore(state => state.load);
  const status = useFamilyStore(state => state.status);

  const displayName = useMemo(() => {
    const fullName = session?.user.user_metadata?.full_name;
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }
    return session?.user.email?.split('@')[0] ?? 'Keluarga DiaryQu';
  }, [session]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    clearError();
  };

  const submit = async () => {
    if (mode === 'create') {
      await createFamily(familyName);
      return;
    }
    await joinFamily(familyCode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <BrandMark />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Family Room</Text>
            </View>
            <Text style={styles.heroTitle}>Bangun ruang keluarga Anda</Text>
            <Text style={styles.heroSubtitle}>
              Halo, {displayName}. Buat keluarga baru atau gabung menggunakan Family Code.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.segment}>
              <Pressable
                onPress={() => switchMode('create')}
                style={[styles.segmentButton, mode === 'create' && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === 'create' && styles.segmentTextActive]}>
                  Buat Keluarga
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('join')}
                style={[styles.segmentButton, mode === 'join' && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === 'join' && styles.segmentTextActive]}>
                  Gabung Keluarga
                </Text>
              </Pressable>
            </View>

            {mode === 'create' ? (
              <View style={styles.formBlock}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconGlyph}>⌂</Text>
                </View>
                <Text style={styles.formTitle}>Buat Family Room</Text>
                <Text style={styles.formDescription}>
                  Anda akan menjadi Kepala Keluarga dan mendapatkan Family Code untuk dibagikan.
                </Text>
                <Text style={styles.label}>Nama Keluarga</Text>
                <TextInput
                  value={familyName}
                  onChangeText={value => {
                    setFamilyName(value);
                    clearError();
                  }}
                  placeholder="Contoh: Keluarga Pak Dahlan"
                  placeholderTextColor="#A3ACA8"
                  maxLength={100}
                  editable={!isSubmitting}
                  style={styles.input}
                />
              </View>
            ) : (
              <View style={styles.formBlock}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconGlyph}>#</Text>
                </View>
                <Text style={styles.formTitle}>Gabung Family Room</Text>
                <Text style={styles.formDescription}>
                  Masukkan kode yang diberikan Kepala Keluarga. Contoh format: DQ-7A4F9C.
                </Text>
                <Text style={styles.label}>Family Code</Text>
                <TextInput
                  value={familyCode}
                  onChangeText={value => {
                    setFamilyCode(value.toUpperCase());
                    clearError();
                  }}
                  placeholder="DQ-XXXXXX"
                  placeholderTextColor="#A3ACA8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={9}
                  editable={!isSubmitting}
                  style={[styles.input, styles.codeInput]}
                />
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {status === 'error' ? (
                  <Pressable onPress={() => load()} disabled={isSubmitting}>
                    <Text style={styles.retryText}>Coba muat ulang</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={isSubmitting}
              style={({pressed}) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isSubmitting && styles.primaryButtonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'create' ? 'Buat Family Room' : 'Gabung Sekarang'}
                </Text>
              )}
            </Pressable>

            <View style={styles.securityNote}>
              <Text style={styles.securityGlyph}>✓</Text>
              <Text style={styles.securityText}>
                Role Kepala Keluarga dan Anggota diverifikasi langsung oleh database DiaryQu.
              </Text>
            </View>
          </View>

          <Pressable onPress={() => signOut()} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Keluar dari akun ini</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  content: {padding: spacing.xl, paddingBottom: 40},
  header: {alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xxl},
  heroBadge: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primarySoft,
  },
  heroBadgeText: {color: colors.primaryDark, fontWeight: '800', fontSize: 12},
  heroTitle: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    maxWidth: 330,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 7},
    elevation: 4,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: '#EAF0FF',
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {backgroundColor: '#FFFFFF'},
  segmentText: {color: '#6B7280', fontSize: 12, fontWeight: '700'},
  segmentTextActive: {color: colors.primaryDark},
  formBlock: {alignItems: 'stretch', paddingTop: spacing.xxl},
  iconCircle: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {color: colors.primaryDark, fontSize: 26, fontWeight: '900'},
  formTitle: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  formDescription: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  label: {marginTop: spacing.xxl, marginBottom: 8, color: colors.text, fontSize: 13, fontWeight: '800'},
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: '#BFD2C8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    backgroundColor: '#FCFDFC',
    fontSize: 14,
  },
  codeInput: {fontWeight: '800', letterSpacing: 1.5},
  errorBox: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {color: colors.danger, fontSize: 12, lineHeight: 18, fontWeight: '600'},
  retryText: {marginTop: 7, color: colors.danger, fontWeight: '900', fontSize: 12},
  primaryButton: {
    marginTop: spacing.xl,
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonPressed: {transform: [{scale: 0.99}]},
  primaryButtonDisabled: {opacity: 0.65},
  primaryButtonText: {color: '#FFFFFF', fontSize: 15, fontWeight: '900'},
  securityNote: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: 9,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#F2FBF7',
  },
  securityGlyph: {color: colors.primaryDark, fontWeight: '900'},
  securityText: {flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17},
  signOutButton: {alignSelf: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.xl},
  signOutText: {color: colors.textMuted, fontSize: 12, fontWeight: '700'},
});
