import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  Chip,
  ScreenHeader,
} from '../../../components/ui';
import {colors, layout, radius, shadows, spacing} from '../../../constants/theme';
import {useFamilyStore} from '../../family/store/familyStore';
import {
  getForegroundPosition,
  requestForegroundLocationPermission,
} from '../services/nativeLocationService';
import {useTrackingStore} from '../store/trackingStore';
import type {LocationFreshness, TrackingMemberLocation} from '../types';
import {
  formatApproximateCoordinate,
  formatLocationAge,
  getLocationFreshness,
  mergeMembersWithLocations,
  relativeMapPosition,
} from '../utils/tracking';

const freshnessLabel: Record<LocationFreshness, string> = {
  live: 'Baru',
  recent: 'Terkini',
  stale: 'Lama',
  hidden: 'Privat',
};

const freshnessTone: Record<
  LocationFreshness,
  'success' | 'primary' | 'warning' | 'neutral'
> = {
  live: 'success',
  recent: 'primary',
  stale: 'warning',
  hidden: 'neutral',
};

export function TrackingScreen() {
  const family = useFamilyStore(state => state.family);
  const members = useTrackingStore(state => state.members);
  const locations = useTrackingStore(state => state.locations);
  const currentUserId = useTrackingStore(state => state.currentUserId);
  const isLoading = useTrackingStore(state => state.isLoading);
  const isUpdatingLocation = useTrackingStore(state => state.isUpdatingLocation);
  const error = useTrackingStore(state => state.error);
  const load = useTrackingStore(state => state.load);
  const shareCurrentLocation = useTrackingStore(state => state.shareCurrentLocation);
  const stopSharing = useTrackingStore(state => state.stopSharing);
  const subscribeFamily = useTrackingStore(state => state.subscribeFamily);
  const clearError = useTrackingStore(state => state.clearError);

  const familyId = family?.id ?? null;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!familyId) return;
    load(familyId).catch(() => undefined);
    const unsubscribe = subscribeFamily(familyId);
    return unsubscribe;
  }, [familyId, load, subscribeFamily]);

  const memberLocations = useMemo(
    () => mergeMembersWithLocations(members, locations),
    [members, locations],
  );

  useEffect(() => {
    if (selectedMemberId) return;
    const preferred =
      memberLocations.find(member => member.id === currentUserId) ?? memberLocations[0];
    if (preferred) setSelectedMemberId(preferred.id);
  }, [currentUserId, memberLocations, selectedMemberId]);

  const selectedMember = useMemo(
    () =>
      memberLocations.find(member => member.id === selectedMemberId) ??
      memberLocations[0] ??
      null,
    [memberLocations, selectedMemberId],
  );

  const myEntry = useMemo(
    () => memberLocations.find(member => member.id === currentUserId) ?? null,
    [currentUserId, memberLocations],
  );

  const visibleLocations = useMemo(
    () =>
      memberLocations.filter(
        member =>
          member.location?.sharingEnabled &&
          member.location.latitude !== null &&
          member.location.longitude !== null,
      ),
    [memberLocations],
  );

  const mapCenter = useMemo(() => {
    const selectedLocation = selectedMember?.location;
    if (
      selectedLocation?.sharingEnabled &&
      selectedLocation.latitude !== null &&
      selectedLocation.longitude !== null
    ) {
      return {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };
    }

    const first = visibleLocations[0]?.location;
    if (first && first.latitude !== null && first.longitude !== null) {
      return {latitude: first.latitude, longitude: first.longitude};
    }
    return null;
  }, [selectedMember, visibleLocations]);

  const handleShareLocation = async () => {
    if (!familyId) return;
    setActionError(null);
    try {
      const granted = await requestForegroundLocationPermission();
      if (!granted) {
        setActionError(
          'Izin lokasi tidak diberikan. DiaryQu hanya mengambil lokasi saat tombol ini ditekan.',
        );
        return;
      }
      const position = await getForegroundPosition();
      const ok = await shareCurrentLocation(familyId, position);
      if (ok && currentUserId) setSelectedMemberId(currentUserId);
    } catch (locationError) {
      const message =
        locationError instanceof Error
          ? locationError.message
          : String(locationError ?? '');
      if (message.includes('LOCATION_TIMEOUT')) {
        setActionError('Lokasi belum didapatkan. Pastikan GPS aktif lalu coba lagi.');
      } else if (message.includes('LOCATION_UNAVAILABLE')) {
        setActionError('Layanan lokasi belum tersedia. Aktifkan Location/GPS lalu coba lagi.');
      } else {
        setActionError('Lokasi belum dapat diambil dari perangkat. Silakan coba lagi.');
      }
    }
  };

  const confirmStopSharing = () => {
    if (!familyId) return;
    Alert.alert(
      'Hentikan berbagi lokasi?',
      'Koordinat terakhir Anda akan dikosongkan dan tidak lagi terlihat oleh anggota Family Room.',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hentikan',
          style: 'destructive',
          onPress: () => stopSharing(familyId).catch(() => undefined),
        },
      ],
    );
  };

  const openInOsm = async (member: TrackingMemberLocation) => {
    const latitude = member.location?.latitude;
    const longitude = member.location?.longitude;
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const mySharingEnabled = Boolean(myEntry?.location?.sharingEnabled);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Lokasi Keluarga"
          subtitle={family?.name ?? 'Family Room'}
          variant="primary"
          right={
            <View style={styles.headerIcon}>
              <AppText variant="title" tone="onPrimary">⌖</AppText>
            </View>
          }
        />

        <AppCard padding="lg" style={styles.privacyCard}>
          <View style={styles.privacyTop}>
            <View style={styles.privacyIcon}>
              <AppText variant="section" tone="primary">◎</AppText>
            </View>
            <View style={styles.flexOne}>
              <AppText variant="section">Berbagi lokasi dengan kendali penuh</AppText>
              <AppText variant="bodySmall" tone="muted">
                Lokasi hanya diambil ketika Anda menekan tombol perbarui. Tidak ada pelacakan background atau riwayat perjalanan.
              </AppText>
            </View>
          </View>

          <View style={styles.sharingStatusRow}>
            <View style={styles.flexOne}>
              <AppText variant="micro" tone="muted">STATUS LOKASI SAYA</AppText>
              <AppText variant="bodyStrong" tone={mySharingEnabled ? 'primary' : 'secondary'}>
                {mySharingEnabled ? 'Dibagikan ke Family Room' : 'Tidak dibagikan'}
              </AppText>
            </View>
            <Chip
              label={mySharingEnabled ? 'Aktif' : 'Privat'}
              tone={mySharingEnabled ? 'success' : 'neutral'}
              leadingDot
            />
          </View>

          <View style={styles.privacyActions}>
            <AppButton
              label={mySharingEnabled ? 'Perbarui Lokasi Saya' : 'Bagikan Lokasi Saya'}
              onPress={handleShareLocation}
              loading={isUpdatingLocation}
              size="md"
              style={styles.flexButton}
            />
            {mySharingEnabled ? (
              <AppButton
                label="Hentikan"
                variant="secondary"
                onPress={confirmStopSharing}
                disabled={isUpdatingLocation}
                fullWidth={false}
              />
            ) : null}
          </View>
        </AppCard>

        {actionError ? (
          <AppCard padding="md" style={styles.warningCard}>
            <AppText variant="bodyStrong" tone="warning">Lokasi perangkat belum tersedia</AppText>
            <AppText variant="caption" tone="muted">{actionError}</AppText>
          </AppCard>
        ) : null}

        {error ? (
          <AppCard padding="md" style={styles.errorCard}>
            <AppText variant="bodyStrong" tone="danger">Tracking belum dapat dimuat</AppText>
            <AppText variant="caption" tone="muted">{error}</AppText>
            <View style={styles.errorActions}>
              <AppButton
                label="Tutup"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={clearError}
              />
              {familyId ? (
                <AppButton
                  label="Coba lagi"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => load(familyId)}
                />
              ) : null}
            </View>
          </AppCard>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="section">Peta Keluarga</AppText>
            <AppText variant="caption" tone="muted">
              Posisi relatif anggota yang memilih berbagi lokasi.
            </AppText>
          </View>
          {familyId ? (
            <Pressable onPress={() => load(familyId)} hitSlop={8}>
              <AppText variant="label" tone="primary">Muat ulang</AppText>
            </Pressable>
          ) : null}
        </View>

        <AppCard padding="none" elevated style={styles.mapCard}>
          <View style={styles.mapCanvas}>
            <View style={[styles.gridLine, styles.gridLineH1]} />
            <View style={[styles.gridLine, styles.gridLineH2]} />
            <View style={[styles.gridLineVertical, styles.gridLineV1]} />
            <View style={[styles.gridLineVertical, styles.gridLineV2]} />
            <View style={styles.mapRoadOne} />
            <View style={styles.mapRoadTwo} />
            <View style={styles.mapPark} />
            <View style={styles.mapWater} />

            {mapCenter
              ? visibleLocations.map(member => {
                  const location = member.location;
                  if (!location || location.latitude === null || location.longitude === null) {
                    return null;
                  }
                  const position = relativeMapPosition(
                    location.latitude,
                    location.longitude,
                    mapCenter.latitude,
                    mapCenter.longitude,
                  );
                  const selected = member.id === selectedMember?.id;
                  const freshness = getLocationFreshness(location, now);
                  return (
                    <Pressable
                      key={member.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Pilih lokasi ${member.fullName}`}
                      onPress={() => setSelectedMemberId(member.id)}
                      style={[
                        styles.mapPinWrap,
                        {
                          left: `${position.leftPercent}%`,
                          top: `${position.topPercent}%`,
                        },
                      ]}>
                      <View style={[styles.mapPinPulse, selected ? styles.mapPinPulseSelected : undefined]} />
                      <View style={[styles.mapPin, selected ? styles.mapPinSelected : undefined]}>
                        <AppText variant="label" tone="onPrimary">
                          {member.fullName.slice(0, 1).toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.mapPinLabel}>
                        <AppText variant="micro" numberOfLines={1}>{member.fullName}</AppText>
                        <View
                          style={[
                            styles.freshDot,
                            freshness === 'live'
                              ? styles.freshDotLive
                              : freshness === 'recent'
                                ? styles.freshDotRecent
                                : styles.freshDotStale,
                          ]}
                        />
                      </View>
                    </Pressable>
                  );
                })
              : null}

            {isLoading && memberLocations.length === 0 ? (
              <View style={styles.mapEmptyOverlay}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="caption" tone="muted">Memuat lokasi keluarga...</AppText>
              </View>
            ) : visibleLocations.length === 0 ? (
              <View style={styles.mapEmptyOverlay}>
                <View style={styles.emptyPinIcon}>
                  <AppText variant="title" tone="primary">⌖</AppText>
                </View>
                <AppText variant="bodyStrong" align="center">Belum ada lokasi yang dibagikan</AppText>
                <AppText variant="caption" tone="muted" align="center">
                  Anggota akan muncul setelah memilih berbagi lokasi dari perangkat mereka.
                </AppText>
              </View>
            ) : null}

            <View style={styles.mapBadge}>
              <AppText variant="micro" tone="secondary">PRIVACY-FIRST MAP</AppText>
            </View>
          </View>
        </AppCard>

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="section">Anggota Keluarga</AppText>
            <AppText variant="caption" tone="muted">
              {visibleLocations.length} dari {memberLocations.length} anggota sedang berbagi.
            </AppText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberList}>
          {memberLocations.map(member => {
            const freshness = getLocationFreshness(member.location, now);
            const selected = member.id === selectedMember?.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedMemberId(member.id)}
                style={[
                  styles.memberCard,
                  selected ? styles.memberCardSelected : undefined,
                ]}>
                <Avatar name={member.fullName} size="md" bordered={selected} />
                <View style={styles.memberCardText}>
                  <AppText variant="label" numberOfLines={1}>{member.fullName}</AppText>
                  <AppText variant="micro" tone="muted" numberOfLines={1}>
                    {member.role === 'head' ? 'Kepala Keluarga' : 'Anggota'}
                  </AppText>
                </View>
                <Chip
                  label={freshnessLabel[freshness]}
                  tone={freshnessTone[freshness]}
                  leadingDot
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedMember ? (
          <MemberLocationDetail
            member={selectedMember}
            now={now}
            isCurrentUser={selectedMember.id === currentUserId}
            onOpenMap={() => openInOsm(selectedMember)}
          />
        ) : (
          <AppCard padding="lg" elevated style={styles.emptyDetailCard}>
            <AppText variant="section" align="center">Belum ada anggota</AppText>
            <AppText variant="caption" tone="muted" align="center">
              Anggota Family Room akan muncul di sini.
            </AppText>
          </AppCard>
        )}

        <AppCard padding="lg" style={styles.privacyInfoCard}>
          <AppText variant="bodyStrong">Cara kerja privasi Tracking</AppText>
          <View style={styles.privacyInfoList}>
            <PrivacyInfoRow number="1" text="Lokasi hanya diambil saat pengguna menekan tombol berbagi atau perbarui." />
            <PrivacyInfoRow number="2" text="DiaryQu menyimpan posisi terakhir saja, bukan riwayat perjalanan." />
            <PrivacyInfoRow number="3" text="Saat berbagi dihentikan, koordinat terakhir dikosongkan dari database." />
            <PrivacyInfoRow number="4" text="RLS hanya memperlihatkan lokasi aktif kepada anggota Family Room yang sama." />
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberLocationDetail({
  member,
  now,
  isCurrentUser,
  onOpenMap,
}: {
  member: TrackingMemberLocation;
  now: Date;
  isCurrentUser: boolean;
  onOpenMap: () => void;
}) {
  const location = member.location;
  const freshness = getLocationFreshness(location, now);
  const canOpenMap = Boolean(
    location?.sharingEnabled &&
      location.latitude !== null &&
      location.longitude !== null,
  );

  return (
    <AppCard padding="lg" elevated style={styles.detailCard}>
      <View style={styles.detailTop}>
        <Avatar name={member.fullName} size="lg" />
        <View style={styles.flexOne}>
          <View style={styles.detailNameRow}>
            <AppText variant="section">{member.fullName}</AppText>
            {isCurrentUser ? <Chip label="Saya" tone="primary" /> : null}
          </View>
          <AppText variant="caption" tone="muted">
            {member.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga'}
          </AppText>
        </View>
        <Chip
          label={freshnessLabel[freshness]}
          tone={freshnessTone[freshness]}
          leadingDot
        />
      </View>

      {canOpenMap && location ? (
        <>
          <View style={styles.detailMetrics}>
            <View style={styles.metricBox}>
              <AppText variant="micro" tone="muted">DIPERBARUI</AppText>
              <AppText variant="bodyStrong">{formatLocationAge(location, now)}</AppText>
            </View>
            <View style={styles.metricBox}>
              <AppText variant="micro" tone="muted">AKURASI</AppText>
              <AppText variant="bodyStrong">
                {location.accuracyMeters === null
                  ? 'Tidak diketahui'
                  : `± ${Math.round(location.accuracyMeters)} m`}
              </AppText>
            </View>
          </View>
          <View style={styles.coordinateRow}>
            <View style={styles.flexOne}>
              <AppText variant="micro" tone="muted">KOORDINAT PERKIRAAN</AppText>
              <AppText variant="caption" tone="secondary">
                {formatApproximateCoordinate(location.latitude)}, {' '}
                {formatApproximateCoordinate(location.longitude)}
              </AppText>
            </View>
            <AppButton
              label="Buka OSM"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={onOpenMap}
            />
          </View>
        </>
      ) : (
        <View style={styles.hiddenLocationBox}>
          <AppText variant="bodyStrong">Lokasi tidak dibagikan</AppText>
          <AppText variant="caption" tone="muted">
            {isCurrentUser
              ? 'Tekan “Bagikan Lokasi Saya” di bagian atas jika ingin membagikan posisi saat ini.'
              : 'Anggota ini sedang memilih untuk menjaga lokasinya tetap privat.'}
          </AppText>
        </View>
      )}
    </AppCard>
  );
}

function PrivacyInfoRow({number, text}: {number: string; text: string}) {
  return (
    <View style={styles.privacyInfoRow}>
      <View style={styles.privacyInfoNumber}>
        <AppText variant="label" tone="primary">{number}</AppText>
      </View>
      <AppText variant="caption" tone="secondary" style={styles.flexOne}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  flexOne: {flex: 1},
  flexButton: {flex: 1},
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCard: {
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
    gap: spacing.lg,
  },
  privacyTop: {flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start'},
  privacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primaryMuted,
  },
  privacyActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  warningCard: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: spacing.xs,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#F2B8AD',
    gap: spacing.sm,
  },
  errorActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mapCard: {overflow: 'hidden', borderRadius: radius.lg},
  mapCanvas: {
    height: 330,
    backgroundColor: '#EAF3F1',
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D2E3DF',
  },
  gridLineH1: {top: '33%'},
  gridLineH2: {top: '66%'},
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D2E3DF',
  },
  gridLineV1: {left: '33%'},
  gridLineV2: {left: '66%'},
  mapRoadOne: {
    position: 'absolute',
    width: '130%',
    height: 22,
    backgroundColor: '#FFFFFF',
    top: 128,
    left: -45,
    transform: [{rotate: '-12deg'}],
    borderWidth: 1,
    borderColor: '#D7E1DE',
  },
  mapRoadTwo: {
    position: 'absolute',
    width: 18,
    height: '130%',
    backgroundColor: '#FFFFFF',
    top: -48,
    left: '62%',
    transform: [{rotate: '9deg'}],
    borderWidth: 1,
    borderColor: '#D7E1DE',
  },
  mapPark: {
    position: 'absolute',
    width: 112,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: '#CCE8D9',
    left: 22,
    bottom: 30,
    transform: [{rotate: '-6deg'}],
  },
  mapWater: {
    position: 'absolute',
    width: 150,
    height: 70,
    borderRadius: 60,
    backgroundColor: '#CFE6F5',
    right: -45,
    top: 26,
    transform: [{rotate: '16deg'}],
  },
  mapPinWrap: {
    position: 'absolute',
    width: 90,
    alignItems: 'center',
    transform: [{translateX: -45}, {translateY: -28}],
  },
  mapPinPulse: {
    position: 'absolute',
    top: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 191, 136, 0.16)',
  },
  mapPinPulseSelected: {
    width: 58,
    height: 58,
    borderRadius: 29,
    top: -3,
    backgroundColor: 'rgba(74, 119, 229, 0.18)',
  },
  mapPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  mapPinSelected: {backgroundColor: colors.info, transform: [{scale: 1.08}]},
  mapPinLabel: {
    marginTop: spacing.xs,
    maxWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  freshDot: {width: 6, height: 6, borderRadius: 3},
  freshDotLive: {backgroundColor: colors.success},
  freshDotRecent: {backgroundColor: colors.info},
  freshDotStale: {backgroundColor: colors.warningDark},
  mapEmptyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: 'rgba(234,243,241,0.82)',
  },
  emptyPinIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  mapBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  memberList: {gap: spacing.md, paddingRight: layout.screenPadding},
  memberCard: {
    width: 220,
    minHeight: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  memberCardText: {flex: 1, minWidth: 0},
  detailCard: {gap: spacing.lg},
  detailTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  detailNameRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  detailMetrics: {flexDirection: 'row', gap: spacing.md},
  metricBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hiddenLocationBox: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyDetailCard: {gap: spacing.sm},
  privacyInfoCard: {
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: '#C7D7FA',
    gap: spacing.md,
  },
  privacyInfoList: {gap: spacing.md},
  privacyInfoRow: {flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start'},
  privacyInfoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
