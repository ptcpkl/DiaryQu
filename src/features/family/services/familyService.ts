import {getSupabaseClient} from '../../../lib/supabase/client';
import type {FamilyRole, FamilySummary} from '../types';

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

export const familyService = {
  async getCurrentFamily(): Promise<FamilySummary | null> {
    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();

    if (userError) {
      throw userError;
    }

    const userId = userData.user?.id;
    if (!userId) {
      return null;
    }

    const {data, error} = await client
      .from('family_members')
      .select('role, joined_at, families!inner(id, name, family_code)')
      .eq('user_id', userId)
      .order('joined_at', {ascending: true})
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return toSummaryFromMembership(data as unknown as MembershipRow);
  },

  async createFamily(name: string): Promise<FamilySummary> {
    const {data, error} = await getSupabaseClient().rpc('create_family', {
      p_name: name.trim(),
    });

    if (error) {
      throw error;
    }

    return toSummaryFromRpc(firstRpcRow(data));
  },

  async joinFamily(code: string): Promise<FamilySummary> {
    const {data, error} = await getSupabaseClient().rpc('join_family', {
      p_family_code: code.trim().toUpperCase(),
    });

    if (error) {
      throw error;
    }

    return toSummaryFromRpc(firstRpcRow(data));
  },
};
