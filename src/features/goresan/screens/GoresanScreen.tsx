import React from 'react';

import {
  EmptyModuleCard,
  FeatureScaffold,
} from '../../../components/common/FeatureScaffold';

export function GoresanScreen() {
  return (
    <FeatureScaffold
      title="Goresan"
      subtitle="Ruang catatan keluarga DiaryQu"
      glyph="✎">
      <EmptyModuleCard
        title="Goresan segera hadir"
        description="Tahap ini menyiapkan tujuan navigasi agar seluruh menu Beranda dapat dibuka selama pengembangan frontend. Fitur Goresan akan diselesaikan pada milestone khususnya."
      />
    </FeatureScaffold>
  );
}
