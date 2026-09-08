import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY, DEMO_USER_ID} from '../../../mocks/demoData';
import type {FamilyMember, FamilyRole, FamilySummary} from '../types';

type FamilyRpcRow = {
  family_id: string;
  family_name: string;
  family_code: string;
  role: FamilyRole;
};

type MembershipRow = {
  role: FamilyRole;
  joined_at: string;
  families:
    | {id: string; name: string; family_code: string}
    | Array<{id: string; name: string; family_code: string}>
    | null;
};

type FamilyMemberRow = {
  user_id: string;
  role: FamilyRole;
  joined_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
};

const DEMO_MOTHER_ID = '44444444-4444-4444-8444-444444444444';
const DEMO_CHILD_ID = '33333333-3333-4333-8333-333333333333';
const DEMO_SIBLING_ID = '55555555-5555-4555-8555-555555555555';

let demoMembers: FamilyMember[] = [
  {
    id: DEMO_USER_ID,
    fullName: 'Pak Dahlan',
    avatarUrl: null,
    phoneNumber: '+62 812-3456-7890',
    role: 'head',
    joinedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: DEMO_MOTHER_ID,
    fullName: 'Bu Rina',
    avatarUrl: null,
    phoneNumber: '+62 813-2200-1100',
    role: 'member',
    joinedAt: '2026-09-01T08:15:00.000Z',
  },
  {
    id: DEMO_CHILD_ID,
    fullName: 'Alya',
    avatarUrl: null,
    phoneNumber: null,
    role: 'member',
    joinedAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: DEMO_SIBLING_ID,
    fullName: 'Budi',
    avatarUrl: null,
    phoneNumber: null,
    role: 'member',
    joinedAt: '2026-09-03T14:00:00.000Z',
  },
];

function toSummaryFromRpc(row: FamilyRpcRow): FamilySummary {
  return {
    id: row.family_id,
    name: row.family_name,
    familyCode: row.family_code,
    role: row.role,
  };
}

function toSummaryFromMembership(row: MembershipRow): FamilySummary | null {
  const family = Array.isArray(row.families) ? row.families[0] : row.families;

  if (!family) {
    return null;
  }

  return {
    id: family.id,
    name: family.name,
    familyCode: family.family_code,
    role: row.role,
  };
}

function firstRpcRow(data: unknown): FamilyRpcRow {
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row !== 'object') {
    throw new Error('INVALID_FAMILY_RESPONSE');
  }

  return row as FamilyRpcRow;
}

function rpcString(data: unknown): string {
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && typeof data[0] === 'string') return data[0];
  throw new Error('INVALID_FAMILY_RESPONSE');
}

export const familyService = {
  async getCurrentFamily(): Promise<FamilySummary | null> {
    if (FRONTEND_DEMO_MODE) return {...DEMO_FAMILY};

    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) return null;

    const {data, error} = await client
      .from('family_members')
      .select('role, joined_at, families!inner(id, name, family_code)')
      .eq('user_id', userId)
      .order('joined_at', {ascending: true})
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toSummaryFromMembership(data as unknown as MembershipRow);
  },

  async createFamily(name: string): Promise<FamilySummary> {
    const {data, error} = await getSupabaseClient().rpc('create_family', {
      p_name: name.trim(),
    });
    if (error) throw error;
    return toSummaryFromRpc(firstRpcRow(data));
  },

  async joinFamily(code: string): Promise<FamilySummary> {
    const {data, error} = await getSupabaseClient().rpc('join_family', {
      p_family_code: code.trim().toUpperCase(),
    });
    if (error) throw error;
    return toSummaryFromRpc(firstRpcRow(data));
  },

  async listMembers(familyId: string): Promise<FamilyMember[]> {
    if (FRONTEND_DEMO_MODE) {
      return familyId === DEMO_FAMILY.id ? demoMembers.map(item => ({...item})) : [];
    }

    const client = getSupabaseClient();
    const {data: memberships, error: membershipError} = await client
      .from('family_members')
      .select('user_id, role, joined_at')
      .eq('family_id', familyId)
      .order('joined_at', {ascending: true});
    if (membershipError) throw membershipError;

    const rows = (memberships ?? []) as FamilyMemberRow[];
    if (rows.length === 0) return [];

    const ids = rows.map(item => item.user_id);
    const {data: profiles, error: profileError} = await client
      .from('profiles')
      .select('id, full_name, avatar_url, phone_number')
      .in('id', ids);
    if (profileError) throw profileError;

    const profileMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map(profile => [profile.id, profile]),
    );

    return rows.map(member => {
      const profile = profileMap.get(member.user_id);
      return {
        id: member.user_id,
        fullName: profile?.full_name ?? 'Anggota Keluarga',
        avatarUrl: profile?.avatar_url ?? null,
        phoneNumber: profile?.phone_number ?? null,
        role: member.role,
        joinedAt: member.joined_at,
      };
    });
  },

  async renameFamily(familyId: string, name: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) return;
    const {error} = await getSupabaseClient().rpc('update_family_name', {
      p_family_id: familyId,
      p_name: name.trim(),
    });
    if (error) throw error;
  },

  async regenerateFamilyCode(familyId: string): Promise<string> {
    if (FRONTEND_DEMO_MODE) {
      return `DQ-${Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '7')}`;
    }
    const {data, error} = await getSupabaseClient().rpc('regenerate_family_code', {
      p_family_id: familyId,
    });
    if (error) throw error;
    return rpcString(data);
  },

  async removeMember(familyId: string, userId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoMembers = demoMembers.filter(member => member.id !== userId);
      return;
    }
    const {error} = await getSupabaseClient().rpc('remove_family_member', {
      p_family_id: familyId,
      p_user_id: userId,
    });
    if (error) throw error;
  },

  async transferHead(familyId: string, userId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoMembers = demoMembers.map(member => ({
        ...member,
        role:
          member.id === DEMO_USER_ID
            ? 'member'
            : member.id === userId
              ? 'head'
              : member.role,
      }));
      return;
    }
    const {error} = await getSupabaseClient().rpc('transfer_family_head', {
      p_family_id: familyId,
      p_new_head_user_id: userId,
    });
    if (error) throw error;
  },

  async leaveFamily(familyId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoMembers = demoMembers.filter(member => member.id !== DEMO_USER_ID);
      return;
    }
    const {error} = await getSupabaseClient().rpc('leave_family', {
      p_family_id: familyId,
    });
    if (error) throw error;
  },
};
