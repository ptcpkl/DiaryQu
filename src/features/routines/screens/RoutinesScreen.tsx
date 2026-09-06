import React from 'react';

import {EmptyModuleCard, FeatureScaffold} from '../../../components/common/FeatureScaffold';

export function RoutinesScreen() {
  return (
    <FeatureScaffold title="Rutinitas Harian" subtitle="Atur aktivitas keluarga di sini" glyph="✓">
      <EmptyModuleCard
        title="Belum ada rutinitas"
        description="Rutinitas akan memakai alur task → proof → pending approval → approved/rejected. Bukti foto akan disimpan di Firebase Storage."
      />
    </FeatureScaffold>
  );
}
