import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {
  AppStackParamList,
  MainTabParamList,
} from '../../../app/navigation/types';
import {BrandMark} from '../../../components/common/BrandMark';
import {
  AppCard,
  AppText,
  Avatar,
  Chip,
  IconBadge,
  SectionHeader,
} from '../../../components/ui';
import {
  colors,
  layout,
  radius,
  shadows,
  spacing,
} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {
  formatHomeDate,
  formatHomeTime,
  getHomeGreeting,
} from '../utils/homeDate';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

type QuickMenu = {
  label: string;
  helper: string;
  glyph: string;
  tone: 'green' | 'blue' | 'yellow' | 'pink';
  target?: keyof MainTabParamList;
  appTarget?: keyof AppStackParamList;
};

type AgendaPreview = {
  id: string;
  dayLabel: string;
  title: string;
  time: string;
  location: string;
  category: string;
};

type FamilyProgress = {
  id: string;
  name: string;
  score: number;
  target: number;
};

const QUICK_MENU: QuickMenu[] = [
  {label: 'Agenda', helper: 'Jadwal keluarga', glyph: '▦', tone: 'blue', target: 'Agenda'},
  {label: 'Rutinitas Hari Ini', helper: 'Cek tugas harian', glyph: '✓', tone: 'green', target: 'Routines'},
  {label: 'Goresan', helper: 'Catatan keluarga', glyph: '✎', tone: 'yellow', appTarget: 'Goresan'},
  {label: 'Keuangan', helper: 'UangQu', glyph: '▣', tone: 'green', target: 'Finance'},
  {label: 'AssetQu', helper: 'Aset keluarga', glyph: '▤', tone: 'blue', target: 'Finance'},
  {label: 'Kontribusi', helper: 'Berbagi kebaikan', glyph: '♥', tone: 'pink', appTarget: 'Contribution'},
];

const AGENDA_PREVIEW: AgendaPreview[] = [
  {id: 'agenda-1', dayLabel: 'Hari ini', title: "Kajian Ba'da Maghrib", time: '18.30 - 19.30', location: 'Masjid dekat rumah', category: 'Ibadah'},
  {id: 'agenda-2', dayLabel: 'Besok', title: 'Belanja kebutuhan mingguan', time: '09.00 - 10.30', location: 'Pasar / supermarket', category: 'Keluarga'},
];

const FAMILY_PROGRESS: FamilyProgress[] = [
  {id: 'member-head', name: 'Pak Dahlan', score: 8, target: 10},
  {id: 'member-mom', name: 'Ibu', score: 7, target: 10},
  {id: 'member-budi', name: 'Budi', score: 4, target: 10},
  {id: 'member-siti', name: 'Siti', score: 6, target: 10},
];

const toneBackground: Record<QuickMenu['tone'], string> = {
  green: colors.primarySoft,
  blue: colors.infoSoft,
  yellow: colors.warningSoft,
  pink: '#FDECF2',
};

const toneForeground: Record<QuickMenu['tone'], string> = {
  green: colors.primaryDark,
  blue: colors.info,
  yellow: colors.warningDark,
  pink: '#C84B78',
};

export function HomeScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const family = useFamilyStore(state => state.family);
  const [now, setNow] = useState(() => new Date());
  const {width} = useWindowDimensions();
  const appNavigation = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = useMemo(() => {
    const metadata = session?.user.user_metadata;
    if (metadata && typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
      return metadata.full_name.trim();
    }
    return session?.user.email?.split('@')[0] ?? 'Pak Dahlan';
  }, [session]);

  const firstName = displayName.split(/\s+/)[0] || displayName;
  const roleLabel = family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga';
  const useTwoColumnMenu = width < 365;

  const openQuickMenu = (item: QuickMenu) => {
    if (item.target) {
      navigation.navigate(item.target);
      return;
    }
    if (item.appTarget) {
      appNavigation?.navigate(item.appTarget);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka profil"
            onPress={() => appNavigation?.navigate('Profile')}
            style={({pressed}) => [styles.identityButton, pressed ? styles.pressed : undefined]}>
            <View style={styles.identityCopy}>
              <AppText variant="bodyStrong" numberOfLines={1} align="right">{displayName}</AppText>
              <AppText variant="micro" tone="muted" numberOfLines={1}>{roleLabel}</AppText>
            </View>
            <Avatar name={displayName} size="md" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <AppText variant="micro" tone="onPrimary" style={styles.heroKicker}>{getHomeGreeting(now.getHours())}</AppText>
              <AppText variant="heading" tone="onPrimary">Halo, {firstName}</AppText>
              <AppText variant="caption" tone="onPrimary" style={styles.heroSubtitle}>
                Semoga hari ini penuh berkah dan semua aktivitas keluarga berjalan lancar.
              </AppText>
            </View>
            <View style={styles.heroMonogram}>
              <AppText variant="title" tone="onPrimary">DQ</AppText>
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <AppText variant="micro" tone="onPrimary" style={styles.heroMetaIcon}>◷</AppText>
              <View>
                <AppText variant="micro" tone="onPrimary" style={styles.heroMetaLabel}>Waktu sekarang</AppText>
                <AppText variant="label" tone="onPrimary">{formatHomeTime(now)} WIB</AppText>
              </View>
            </View>
            <View style={styles.heroMetaDivider} />
            <View style={styles.heroMetaItem}>
              <AppText variant="micro" tone="onPrimary" style={styles.heroMetaIcon}>▦</AppText>
              <View style={styles.heroMetaDateCopy}>
                <AppText variant="micro" tone="onPrimary" style={styles.heroMetaLabel}>Hari ini</AppText>
                <AppText variant="label" tone="onPrimary" numberOfLines={1}>{formatHomeDate(now)}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.locationBar}>
            <AppText variant="caption" tone="onPrimary">⌖ Bekasi, Jawa Barat</AppText>
            <AppText variant="micro" tone="onPrimary" style={styles.locationStatus}>Lokasi demo</AppText>
          </View>
        </View>

        <View style={styles.adBanner} accessibilityLabel="Area iklan">
          <View style={styles.adIconBox}>
            <AppText variant="section" tone="secondary">▱</AppText>
          </View>
          <View style={styles.adCopy}>
            <AppText variant="bodyStrong" tone="secondary">Banner Iklan</AppText>
            <AppText variant="micro" tone="muted">Area monetisasi akan diaktifkan setelah integrasi Ads SDK.</AppText>
          </View>
          <Chip label="Ad" tone="neutral" />
        </View>

        <View style={styles.inspirationCard}>
          <View style={styles.inspirationHeader}>
            <IconBadge glyph="“" tone="primary" size="md" />
            <View style={styles.flexOne}>
              <AppText variant="section" tone="primary">Inspirasi Hari Ini</AppText>
              <AppText variant="micro" tone="muted">Pengingat kecil untuk keluarga</AppText>
            </View>
          </View>
          <AppText variant="body" tone="primary" style={styles.quoteText}>“Sesungguhnya bersama kesulitan ada kemudahan.”</AppText>
          <AppText variant="label" tone="primary">QS. Al-Insyirah: 6</AppText>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Agenda Hari Ini & Esok" subtitle="Dua jadwal terdekat keluarga" actionLabel="Lihat semua" onAction={() => navigation.navigate('Agenda')} />
          <View style={styles.agendaList}>{AGENDA_PREVIEW.map(item => <AgendaPreviewCard key={item.id} item={item} />)}</View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Statistik Keluarga" subtitle="Progress rutinitas hari ini" actionLabel="Rutinitas" onAction={() => navigation.navigate('Routines')} />
          <AppCard elevated padding="lg" style={styles.familyStatsCard}>
            <View style={styles.familyStatsHeader}>
              <View>
                <AppText variant="bodyStrong" tone="primary">{family?.name ?? 'Keluarga Pak Dahlan'}</AppText>
                <AppText variant="micro" tone="muted">4 anggota aktif</AppText>
              </View>
              <View style={styles.scoreBadge}>
                <AppText variant="label" tone="primary">25/40</AppText>
              </View>
            </View>
            <View style={styles.progressList}>{FAMILY_PROGRESS.map(member => <FamilyProgressRow key={member.id} member={member} />)}</View>
          </AppCard>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Lihat Menu" subtitle="Akses cepat fitur DiaryQu" />
          <View style={styles.quickGrid}>
            {QUICK_MENU.map(item => (
              <QuickMenuTile key={item.label} item={item} twoColumns={useTwoColumnMenu} onPress={() => openQuickMenu(item)} />
            ))}
          </View>
        </View>

        <View style={styles.familyRoomCard}>
          <View style={styles.familyRoomAccent} />
          <View style={styles.familyRoomIllustration}>
            <View style={styles.familyHead} />
            <View style={[styles.familyHead, styles.familyHeadSmall]} />
            <View style={styles.familyBodyShape} />
          </View>
          <View style={styles.familyRoomCopy}>
            <AppText variant="micro" tone="onPrimary" style={styles.familyRoomKicker}>FAMILY ROOM</AppText>
            <AppText variant="section" tone="onPrimary">{family?.name ?? 'Keluarga Pak Dahlan'}</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.familyRoomDescription}>Bagikan kode ini hanya kepada anggota keluarga yang ingin bergabung.</AppText>
            <View style={styles.familyCodePill}>
              <AppText variant="label" tone="onPrimary">Family Code: {family?.familyCode ?? 'DQ-7K4P9X'}</AppText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AgendaPreviewCard({item}: {item: AgendaPreview}) {
  return (
    <AppCard elevated padding="md" style={styles.agendaCard}>
      <View style={styles.agendaTopRow}>
        <View style={styles.agendaDayPill}><AppText variant="micro" tone="primary">{item.dayLabel}</AppText></View>
        <Chip label={item.category} tone="success" />
      </View>
      <AppText variant="bodyStrong" style={styles.agendaTitle}>{item.title}</AppText>
      <View style={styles.agendaMetaRow}>
        <AppText variant="caption" tone="muted">◷ {item.time}</AppText>
        <View style={styles.agendaMetaDot} />
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flexOne}>⌖ {item.location}</AppText>
      </View>
    </AppCard>
  );
}

function FamilyProgressRow({member}: {member: FamilyProgress}) {
  const progress = Math.min(100, Math.round((member.score / member.target) * 100));
  return (
    <View style={styles.progressRow}>
      <Avatar name={member.name} size="sm" bordered={false} />
      <View style={styles.progressCopy}>
        <View style={styles.progressLabelRow}>
          <AppText variant="caption">{member.name}</AppText>
          <AppText variant="micro" tone="muted">{member.score}/{member.target}</AppText>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${progress}%`}]} /></View>
      </View>
    </View>
  );
}

function QuickMenuTile({item, twoColumns, onPress}: {item: QuickMenu; twoColumns: boolean; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.label} onPress={onPress} style={({pressed}) => [styles.quickTile, twoColumns ? styles.quickTileTwoColumns : styles.quickTileThreeColumns, pressed ? styles.quickTilePressed : undefined]}>
      <View style={[styles.quickIcon, {backgroundColor: toneBackground[item.tone]}]}>
        <AppText variant="section" style={{color: toneForeground[item.tone]}}>{item.glyph}</AppText>
      </View>
      <AppText variant="label" align="center" numberOfLines={2}>{item.label}</AppText>
      <AppText variant="micro" tone="muted" align="center" numberOfLines={1}>{item.helper}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {paddingHorizontal: layout.screenPadding, paddingTop: spacing.lg, paddingBottom: 120, gap: spacing.xl},
  flexOne: {flex: 1},
  pressed: {opacity: 0.72},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48},
  identityButton: {maxWidth: '62%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, paddingLeft: spacing.sm},
  identityCopy: {alignItems: 'flex-end', flexShrink: 1},
  heroCard: {minHeight: 242, borderRadius: radius.xl, backgroundColor: colors.primaryStrong, padding: spacing.xl, overflow: 'hidden', ...shadows.md},
  heroOrbLarge: {position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', right: -56, top: -62},
  heroOrbSmall: {position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(255,255,255,0.07)', left: -28, bottom: -24},
  heroTopRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg},
  heroCopy: {flex: 1},
  heroKicker: {opacity: 0.82, marginBottom: spacing.xs},
  heroSubtitle: {opacity: 0.88, marginTop: spacing.sm, maxWidth: 270},
  heroMonogram: {width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center'},
  heroMetaRow: {marginTop: spacing.xl, minHeight: 48, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.11)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md},
  heroMetaItem: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  heroMetaDateCopy: {flex: 1},
  heroMetaIcon: {fontSize: 18, opacity: 0.92},
  heroMetaLabel: {opacity: 0.66},
  heroMetaDivider: {width: StyleSheet.hairlineWidth, height: 30, backgroundColor: 'rgba(255,255,255,0.28)', marginHorizontal: spacing.sm},
  locationBar: {marginTop: spacing.md, minHeight: 38, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md},
  locationStatus: {opacity: 0.68},
  adBanner: {minHeight: 82, borderRadius: radius.md, backgroundColor: colors.ad, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md},
  adIconBox: {width: 46, height: 46, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.54)', alignItems: 'center', justifyContent: 'center'},
  adCopy: {flex: 1, gap: spacing.xxs},
  inspirationCard: {borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primaryMuted, backgroundColor: '#ECFFF7', padding: spacing.xl, gap: spacing.md},
  inspirationHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  quoteText: {fontStyle: 'italic'},
  sectionBlock: {gap: spacing.md},
  agendaList: {gap: spacing.md},
  agendaCard: {gap: spacing.sm},
  agendaTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  agendaDayPill: {paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.primarySoft},
  agendaTitle: {marginTop: spacing.xxs},
  agendaMetaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  agendaMetaDot: {width: 3, height: 3, borderRadius: radius.pill, backgroundColor: colors.borderStrong},
  familyStatsCard: {gap: spacing.lg},
  familyStatsHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  scoreBadge: {minWidth: 58, height: 34, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm},
  progressList: {gap: spacing.md},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  progressCopy: {flex: 1, gap: spacing.xs},
  progressLabelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  progressTrack: {height: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary},
  quickGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md},
  quickTile: {minHeight: 128, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.md, gap: spacing.xs, ...shadows.sm},
  quickTileThreeColumns: {width: '31.5%'},
  quickTileTwoColumns: {width: '48.3%'},
  quickTilePressed: {opacity: 0.78, transform: [{scale: 0.98}]},
  quickIcon: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs},
  familyRoomCard: {minHeight: 154, borderRadius: radius.lg, backgroundColor: colors.primaryStrong, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingRight: spacing.lg, ...shadows.md},
  familyRoomAccent: {position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.06)', left: -74, bottom: -70},
  familyRoomIllustration: {width: 110, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.lg},
  familyHead: {width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', position: 'absolute', top: 40, left: 32},
  familyHeadSmall: {width: 22, height: 22, borderRadius: 11, left: 59, top: 48},
  familyBodyShape: {width: 66, height: 48, borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: 'rgba(255,255,255,0.22)'},
  familyRoomCopy: {flex: 1, paddingVertical: spacing.xl},
  familyRoomKicker: {opacity: 0.62, letterSpacing: 1.2},
  familyRoomDescription: {opacity: 0.82, marginTop: spacing.xs},
  familyCodePill: {marginTop: spacing.md, alignSelf: 'flex-start', minHeight: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)', backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', paddingHorizontal: spacing.md},
});
