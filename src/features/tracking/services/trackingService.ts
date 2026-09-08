import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY_ID, DEMO_USER_ID} from '../../../mocks/demoData';
import type {
  LocationShareInput,
  SharedFamilyLocation,
  TrackingMember,
} from '../types';

type FamilyMemberRow = {user_id: string; role: TrackingMember['role']};
type ProfileRow = {id: string; full_name: string; avatar_url: string | null};
type LocationRow = {
  family_id: string;
  user_id: string;
  latitude: number | string | null;
  longitude: number | string | null;
  accuracy_meters: number | string | null;
  provider: string | null;
  sharing_enabled: boolean;
  recorded_at: string | null;
  created_at: string;
  updated_at: string;
};

const DEMO_MOTHER_ID = '44444444-4444-4444-8444-444444444444';
const DEMO_CHILD_ID = '33333333-3333-4333-8333-333333333333';

const demoMembers: TrackingMember[] = [
  {id: DEMO_USER_ID, fullName: 'Pak Dahlan', avatarUrl: null, role: 'head'},
  {id: DEMO_MOTHER_ID, fullName: 'Bu Rina', avatarUrl: null, role: 'member'},
  {id: DEMO_CHILD_ID, fullName: 'Alya', avatarUrl: null, role: 'member'},
];

const now = Date.now();
let demoLocations: SharedFamilyLocation[] = [
  {
    familyId: DEMO_FAMILY_ID,
    userId: DEMO_USER_ID,
    latitude: -6.2383,
    longitude: 106.9756,
    accuracyMeters: 18,
    provider: 'demo',
    sharingEnabled: true,
    recordedAt: new Date(now - 2 * 60_000).toISOString(),
    createdAt: new Date(now - 7 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 2 * 60_000).toISOString(),
  },
  {
    familyId: DEMO_FAMILY_ID,
    userId: DEMO_MOTHER_ID,
    latitude: -6.2414,
    longitude: 106.9818,
    accuracyMeters: 24,
    provider: 'demo',
    sharingEnabled: true,
    recordedAt: new Date(now - 12 * 60_000).toISOString(),
    createdAt: new Date(now - 5 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 12 * 60_000).toISOString(),
  },
  {
    familyId: DEMO_FAMILY_ID,
    userId: DEMO_CHILD_ID,
    latitude: -6.233,
    longitude: 106.968,
    accuracyMeters: 35,
    provider: 'demo',
    sharingEnabled: true,
    recordedAt: new Date(now - 95 * 60_000).toISOString(),
    createdAt: new Date(now - 4 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 95 * 60_000).toISOString(),
  },
];

function toLocation(row: LocationRow): SharedFamilyLocation {
  return {
    familyId: row.family_id,
    userId: row.user_id,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    accuracyMeters:
      row.accuracy_meters === null ? null : Number(row.accuracy_meters),
    provider: row.provider,
    sharingEnabled: row.sharing_enabled,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const trackingService = {
  async listMembers(familyId: string): Promise<TrackingMember[]> {
    if (FRONTEND_DEMO_MODE) {
      return familyId === DEMO_FAMILY_ID ? [...demoMembers] : [];
    }

    const client = getSupabaseClient();
    const {data: memberships, error: membershipError} = await client
      .from('family_members')
      .select('user_id, role')
      .eq('family_id', familyId)
      .order('joined_at', {ascending: true});
    if (membershipError) throw membershipError;

    const membershipRows = (memberships ?? []) as FamilyMemberRow[];
    const ids = membershipRows.map(item => item.user_id);
    if (ids.length === 0) return [];

    const {data: profiles, error: profileError} = await client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);
    if (profileError) throw profileError;

    const profileMap = new Map(
      (profiles ?? []).map(row => [(row as ProfileRow).id, row as ProfileRow]),
    );

    return membershipRows.map(member => {
      const profile = profileMap.get(member.user_id);
      return {
        id: member.user_id,
        fullName: profile?.full_name ?? 'Anggota Keluarga',
        avatarUrl: profile?.avatar_url ?? null,
        role: member.role,
      };
    });
  },

  async listLocations(familyId: string): Promise<SharedFamilyLocation[]> {
    if (FRONTEND_DEMO_MODE) {
      return demoLocations
        .filter(item => item.familyId === familyId)
        .map(item => ({...item}));
    }

    const {data, error} = await getSupabaseClient()
      .from('family_member_locations')
      .select('*')
      .eq('family_id', familyId)
      .order('updated_at', {ascending: false});
    if (error) throw error;
    return ((data ?? []) as LocationRow[]).map(toLocation);
  },

  async shareMyLocation(
    familyId: string,
    input: LocationShareInput,
  ): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      const existing = demoLocations.find(
        item => item.familyId === familyId && item.userId === DEMO_USER_ID,
      );
      const timestamp = new Date().toISOString();
      const next: SharedFamilyLocation = {
        familyId,
        userId: DEMO_USER_ID,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        provider: input.provider,
        sharingEnabled: true,
        recordedAt: input.recordedAt,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      demoLocations = [
        ...demoLocations.filter(
          item => !(item.familyId === familyId && item.userId === DEMO_USER_ID),
        ),
        next,
      ];
      return;
    }

    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error('AUTH_REQUIRED');

    const {error} = await client.from('family_member_locations').upsert(
      {
        family_id: familyId,
        user_id: userId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy_meters: input.accuracyMeters,
        provider: input.provider,
        sharing_enabled: true,
        recorded_at: input.recordedAt,
      },
      {onConflict: 'family_id,user_id'},
    );
    if (error) throw error;
  },

  async stopSharing(familyId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      const timestamp = new Date().toISOString();
      demoLocations = demoLocations.map(item =>
        item.familyId === familyId && item.userId === DEMO_USER_ID
          ? {
              ...item,
              latitude: null,
              longitude: null,
              accuracyMeters: null,
              provider: null,
              sharingEnabled: false,
              recordedAt: null,
              updatedAt: timestamp,
            }
          : item,
      );
      return;
    }

    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error('AUTH_REQUIRED');

    const {error} = await client
      .from('family_member_locations')
      .update({
        latitude: null,
        longitude: null,
        accuracy_meters: null,
        provider: null,
        sharing_enabled: false,
        recorded_at: null,
      })
      .eq('family_id', familyId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  subscribe(familyId: string, onChange: () => void): () => void {
    if (FRONTEND_DEMO_MODE) return () => undefined;

    const client = getSupabaseClient();
    const channel = client
      .channel(`tracking:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_member_locations',
          filter: `family_id=eq.${familyId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      client.removeChannel(channel).catch(() => undefined);
    };
  },
};
