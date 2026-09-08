import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY_ID, DEMO_USER_ID} from '../../../mocks/demoData';
import type {AssetDraft, AssetRecord} from '../types';

type AssetRow = {
  id: string;
  family_id: string;
  created_by: string;
  category: AssetRecord['category'];
  name: string;
  estimated_value: number | string;
  quantity: number | string | null;
  unit: string | null;
  note: string | null;
  acquired_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function toAsset(row: AssetRow): AssetRecord {
  return {
    id: row.id,
    familyId: row.family_id,
    createdBy: row.created_by,
    category: row.category,
    name: row.name,
    value: Number(row.estimated_value),
    quantity: row.quantity === null ? null : Number(row.quantity),
    unit: row.unit,
    note: row.note,
    acquiredOn: row.acquired_on,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const nowIso = () => new Date().toISOString();
const demoId = () => `demo-asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let demoAssets: AssetRecord[] = [
  {
    id: 'demo-asset-1',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    category: 'savings',
    name: 'Tabungan Keluarga',
    value: 18_500_000,
    quantity: null,
    unit: null,
    note: 'Dana darurat keluarga',
    acquiredOn: null,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-asset-2',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    category: 'gold',
    name: 'Emas Batangan',
    value: 8_000_000,
    quantity: 5,
    unit: 'gram',
    note: 'Simpanan jangka panjang',
    acquiredOn: '2026-05-12',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-asset-3',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    category: 'land',
    name: 'Tanah Kampung',
    value: 150_000_000,
    quantity: 120,
    unit: 'm²',
    note: 'Estimasi nilai terkini',
    acquiredOn: '2022-07-01',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-asset-4',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    category: 'garden',
    name: 'Kebun Keluarga',
    value: 75_000_000,
    quantity: 300,
    unit: 'm²',
    note: 'Kebun produktif',
    acquiredOn: '2021-03-08',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-asset-5',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    category: 'debt',
    name: 'Sisa Cicilan Kendaraan',
    value: 24_000_000,
    quantity: null,
    unit: null,
    note: 'Dicatat sebagai kewajiban keluarga',
    acquiredOn: null,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export const assetService = {
  async listAssets(familyId: string): Promise<AssetRecord[]> {
    if (FRONTEND_DEMO_MODE) {
      return demoAssets.filter(asset => asset.familyId === familyId).map(asset => ({...asset}));
    }

    const {data, error} = await getSupabaseClient()
      .from('family_assets')
      .select('*')
      .eq('family_id', familyId)
      .order('is_active', {ascending: false})
      .order('updated_at', {ascending: false});
    if (error) throw error;
    return ((data ?? []) as AssetRow[]).map(toAsset);
  },

  async saveAsset(familyId: string, assetId: string | null, draft: AssetDraft): Promise<string> {
    if (FRONTEND_DEMO_MODE) {
      const id = assetId ?? demoId();
      const existing = demoAssets.find(asset => asset.id === id);
      const next: AssetRecord = {
        id,
        familyId,
        createdBy: existing?.createdBy ?? DEMO_USER_ID,
        category: draft.category,
        name: draft.name.trim(),
        value: draft.value,
        quantity: draft.quantity,
        unit: draft.unit?.trim() || null,
        note: draft.note?.trim() || null,
        acquiredOn: draft.acquiredOn || null,
        isActive: draft.isActive,
        createdAt: existing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      demoAssets = [...demoAssets.filter(asset => asset.id !== id), next];
      return id;
    }

    const client = getSupabaseClient();
    if (assetId) {
      const {data, error} = await client
        .from('family_assets')
        .update({
          category: draft.category,
          name: draft.name.trim(),
          estimated_value: draft.value,
          quantity: draft.quantity,
          unit: draft.unit?.trim() || null,
          note: draft.note?.trim() || null,
          acquired_on: draft.acquiredOn || null,
          is_active: draft.isActive,
        })
        .eq('id', assetId)
        .eq('family_id', familyId)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    }

    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error('AUTH_REQUIRED');

    const {data, error} = await client
      .from('family_assets')
      .insert({
        family_id: familyId,
        created_by: userId,
        category: draft.category,
        name: draft.name.trim(),
        estimated_value: draft.value,
        quantity: draft.quantity,
        unit: draft.unit?.trim() || null,
        note: draft.note?.trim() || null,
        acquired_on: draft.acquiredOn || null,
        is_active: draft.isActive,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  },

  async removeAsset(familyId: string, assetId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoAssets = demoAssets.filter(asset => !(asset.familyId === familyId && asset.id === assetId));
      return;
    }

    const {error} = await getSupabaseClient()
      .from('family_assets')
      .delete()
      .eq('id', assetId)
      .eq('family_id', familyId);
    if (error) throw error;
  },

  subscribe(familyId: string, onChange: () => void): () => void {
    if (FRONTEND_DEMO_MODE) return () => undefined;

    const client = getSupabaseClient();
    const channel = client
      .channel(`assets:${familyId}`)
      .on(
        'postgres_changes',
        {event: '*', schema: 'public', table: 'family_assets', filter: `family_id=eq.${familyId}`},
        () => onChange(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel).catch(() => undefined);
    };
  },
};
