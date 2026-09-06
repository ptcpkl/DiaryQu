import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {MainTabParamList} from '../../../app/navigation/types';
import {BrandMark} from '../../../components/common/BrandMark';
import {colors, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

type QuickMenu = {
  label: string;
  glyph: string;
  target?: keyof MainTabParamList;
};

const QUICK_MENU: QuickMenu[] = [
  {label: 'Agenda', glyph: '▦', target: 'Agenda'},
  {label: 'Rutinitas Hari Ini', glyph: '✓', target: 'Routines'},
  {label: 'Goresan', glyph: '✎'},
  {label: 'Keuangan', glyph: '▣', target: 'Finance'},
  {label: 'AssetQu', glyph: '▤', target: 'Finance'},
  {label: 'Kontribusi', glyph: '♥'},
];

function getGreeting(hour: number): string {
  if (hour < 11) {
    return 'Selamat pagi';
  }
  if (hour < 15) {
    return 'Selamat siang';
  }
  if (hour < 19) {
    return 'Selamat sore';
  }
  return 'Selamat malam';
}

export function HomeScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const family = useFamilyStore(state => state.family);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = useMemo(() => {
    const metadata = session?.user.user_metadata;
    if (metadata && typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
      return metadata.full_name.trim();
    }
    return session?.user.email?.split('@')[0] ?? 'Keluarga DiaryQu';
  }, [session]);

  const roleLabel = family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga';

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark compact />
          <View style={styles.identityRow}>
            <View style={styles.identityText}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userRole}>{roleLabel}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>
            {getGreeting(now.getHours())}, {displayName} 👋
          </Text>
          <View style={styles.greetingMetaRow}>
            <Text style={styles.greetingMeta}>▣ {formattedDate}</Text>
            <View style={styles.clockPill}>
              <Text style={styles.clockText}>◷ {formattedTime}</Text>
            </View>
          </View>
          <View style={styles.locationPill}>
            <Text style={styles.locationText}>⌖ Lokasi belum diaktifkan</Text>
          </View>
        </View>

        <View style={styles.adCard}>
          <Text style={styles.adIcon}>⚐</Text>
          <Text style={styles.adText}>Banner Iklan</Text>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
        </View>

        <View style={styles.quoteCard}>
          <View style={styles.quoteTitleRow}>
            <View style={styles.quoteBubble}>
              <Text style={styles.quoteBubbleText}>“</Text>
            </View>
            <Text style={styles.quoteTitle}>Inspirasi Hari Ini</Text>
          </View>
          <Text style={styles.quoteText}>
            “Sesungguhnya bersama kesulitan ada kemudahan.”
          </Text>
          <Text style={styles.quoteSource}>– QS. Al-Insyirah: 6</Text>
        </View>

        <SectionHeader title="Agenda Hari Ini & Esok" action="Lihat semua" onAction={() => navigation.navigate('Agenda')} />
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>▦</Text></View>
          <View style={styles.flexOne}>
            <Text style={styles.emptyTitle}>Belum ada agenda terdekat</Text>
            <Text style={styles.emptyCaption}>Agenda hari ini dan esok akan tampil di sini.</Text>
          </View>
        </View>

        <SectionHeader title="Statistik Keluarga" action="Hari ini" />
        <View style={styles.statsEmptyCard}>
          <Text style={styles.statsEmptyTitle}>{family?.name ?? 'Family Room DiaryQu'}</Text>
          <Text style={styles.statsEmptyText}>
            Progress anggota akan muncul setelah modul Rutinitas terhubung dengan database.
          </Text>
        </View>

        <Text style={styles.sectionTitleGreen}>Lihat Menu</Text>
        <View style={styles.quickGrid}>
          {QUICK_MENU.map(item => (
            <Pressable
              key={item.label}
              disabled={!item.target}
              onPress={() => item.target && navigation.navigate(item.target)}
              style={({pressed}) => [
                styles.quickCard,
                pressed && styles.quickCardPressed,
                !item.target && styles.quickCardDisabled,
              ]}>
              <View style={styles.quickIconCircle}>
                <Text style={styles.quickGlyph}>{item.glyph}</Text>
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.familyCard}>
          <View style={styles.familyIllustration}>
            <Text style={styles.familyIllustrationText}>☺</Text>
          </View>
          <View style={styles.familyBody}>
            <Text style={styles.familyTitle}>{family?.name ?? 'Family Room DiaryQu'}</Text>
            <View style={styles.familyCodePill}>
              <Text style={styles.familyCodeText}>
                Family Code: {family?.familyCode ?? '—'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

function SectionHeader({title, action, onAction}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable disabled={!onAction} onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.xl, paddingBottom: 120, gap: spacing.lg},
  flexOne: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  identityRow: {flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '58%'},
  identityText: {alignItems: 'flex-end', flexShrink: 1},
  userName: {fontSize: 15, fontWeight: '800', color: '#111111'},
  userRole: {fontSize: 12, color: '#4D5854', marginTop: 1},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: colors.primaryDark, fontWeight: '800', fontSize: 16},
  greetingCard: {
    backgroundColor: '#2CA67C',
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 11,
    overflow: 'hidden',
  },
  greetingTitle: {fontSize: 21, fontWeight: '800', color: '#FFFFFF'},
  greetingMetaRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  greetingMeta: {color: '#E7FFF5', fontSize: 11, flex: 1},
  clockPill: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.18)'},
  clockText: {color: '#FFFFFF', fontSize: 11, fontWeight: '600'},
  locationPill: {borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 9, alignItems: 'center'},
  locationText: {color: '#FFFFFF', fontSize: 12},
  adCard: {
    height: 94,
    borderRadius: radius.md,
    backgroundColor: colors.ad,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  adIcon: {fontSize: 20, opacity: 0.45},
  adText: {fontSize: 14, color: '#44505C', marginTop: 3},
  adBadge: {position: 'absolute', top: 8, right: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(21,32,51,0.08)'},
  adBadgeText: {fontSize: 10, color: '#4F5963'},
  quoteCard: {borderWidth: 1.2, borderColor: colors.primary, backgroundColor: '#ECFFF7', borderRadius: radius.lg, padding: spacing.xxl, gap: 10},
  quoteTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  quoteBubble: {width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  quoteBubbleText: {color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: -2},
  quoteTitle: {color: colors.primary, fontWeight: '800', fontSize: 16},
  quoteText: {color: colors.primaryDark, fontSize: 14, fontStyle: 'italic', lineHeight: 22},
  quoteSource: {color: colors.primaryDark, fontSize: 12, fontWeight: '600'},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4},
  sectionTitle: {fontSize: 16, fontWeight: '800', color: colors.text},
  sectionAction: {fontSize: 12, color: colors.primaryDark, fontWeight: '700'},
  emptyCard: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 2},
  emptyIcon: {width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center'},
  emptyIconText: {color: colors.primaryDark, fontSize: 22, fontWeight: '800'},
  emptyTitle: {fontSize: 14, color: colors.text, fontWeight: '700'},
  emptyCaption: {fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17},
  statsEmptyCard: {borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.xl, shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 2},
  statsEmptyTitle: {color: colors.primaryDark, fontWeight: '800', fontSize: 14},
  statsEmptyText: {color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5},
  sectionTitleGreen: {fontSize: 16, fontWeight: '800', color: '#25966E', marginTop: 4},
  quickGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12},
  quickCard: {width: '31.7%', minHeight: 112, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 10, shadowColor: colors.shadow, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 1},
  quickCardPressed: {transform: [{scale: 0.98}]},
  quickCardDisabled: {opacity: 0.72},
  quickIconCircle: {width: 42, height: 42, borderRadius: 21, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9},
  quickGlyph: {color: '#27A579', fontWeight: '900', fontSize: 20},
  quickLabel: {textAlign: 'center', color: colors.text, fontSize: 11, lineHeight: 15},
  familyCard: {height: 128, borderRadius: radius.md, backgroundColor: '#28A477', flexDirection: 'row', overflow: 'hidden', alignItems: 'flex-end', paddingHorizontal: 14},
  familyIllustration: {width: 104, height: 104, borderTopLeftRadius: 52, borderTopRightRadius: 52, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center'},
  familyIllustrationText: {fontSize: 58, color: '#FFFFFF'},
  familyBody: {flex: 1, paddingLeft: 10, paddingBottom: 22},
  familyTitle: {color: '#FFFFFF', fontSize: 15, fontWeight: '800'},
  familyCodePill: {marginTop: 10, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)'},
  familyCodeText: {color: '#FFFFFF', fontSize: 11, textAlign: 'center', fontWeight: '700'},
});
