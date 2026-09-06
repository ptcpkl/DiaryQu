import React from 'react';

import {EmptyModuleCard, FeatureScaffold} from '../../../components/common/FeatureScaffold';

export function AgendaScreen() {
  return (
    <FeatureScaffold title="Agenda" subtitle="Atur Jadwal Anda di sini" glyph="▦">
      <EmptyModuleCard
        title="Belum ada agenda"
        description="Agenda akan berfungsi sebagai reminder/alarm murni tanpa proof atau approval. CRUD dan alarm native akan dihubungkan pada milestone Agenda."
      />
    </FeatureScaffold>
  );
}
