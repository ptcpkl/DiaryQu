import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import type {PickedRoutineProof} from '../types';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(value: string): Uint8Array {
  const clean = value.replace(/\s/g, '').replace(/=+$/, '');
  const outputLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(outputLength);
  let buffer = 0;
  let bits = 0;
  let offset = 0;

  for (const char of clean) {
    const index = BASE64_ALPHABET.indexOf(char);
    if (index < 0) {
      throw new Error('INVALID_PROOF_BASE64');
    }

    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }

  return offset === bytes.length ? bytes : bytes.slice(0, offset);
}

function proofPath(familyId: string, userId: string, routineId: string, occurrenceDate: string) {
  return `${familyId}/${userId}/${routineId}/${occurrenceDate}/proof`;
}

export const routineProofStorage = {
  async upload(
    familyId: string,
    userId: string,
    routineId: string,
    occurrenceDate: string,
    proof: PickedRoutineProof,
  ): Promise<string> {
    const path = proofPath(familyId, userId, routineId, occurrenceDate);
    if (FRONTEND_DEMO_MODE) {
      return `demo://${path}`;
    }

    const bytes = decodeBase64(proof.base64);
    const {error} = await getSupabaseClient().storage
      .from('routine-proofs')
      .upload(path, bytes, {
        contentType: proof.mimeType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }
    return path;
  },

  async signedUrl(path: string | null): Promise<string | null> {
    if (!path || path.startsWith('demo://') || FRONTEND_DEMO_MODE) {
      return null;
    }

    const {data, error} = await getSupabaseClient().storage
      .from('routine-proofs')
      .createSignedUrl(path, 60 * 30);
    if (error) {
      return null;
    }
    return data.signedUrl;
  },
};
