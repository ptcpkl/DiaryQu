import type {AppSession} from '../features/auth/types';
import type {FamilySummary} from '../features/family/types';

export const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_FAMILY_ID = '22222222-2222-4222-8222-222222222222';

export const DEMO_SESSION: AppSession = {
  user: {
    id: DEMO_USER_ID,
    email: 'pak.dahlan@diaryqu.demo',
    user_metadata: {
      full_name: 'Pak Dahlan',
    },
  },
};

export const DEMO_FAMILY: FamilySummary = {
  id: DEMO_FAMILY_ID,
  name: 'Keluarga Pak Dahlan',
  familyCode: 'DQ-7K4P9X',
  role: 'head',
};
