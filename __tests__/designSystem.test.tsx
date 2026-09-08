/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  Chip,
  FloatingActionButton,
  IconBadge,
  ScreenHeader,
  SectionHeader,
  TextField,
} from '../src/components/ui';

const noop = () => undefined;

test('renders core design system primitives', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <AppCard elevated>
        <ScreenHeader title="DiaryQu" subtitle="Keluarga" variant="primary" />
        <SectionHeader title="Hari Ini" actionLabel="Lihat semua" onAction={noop} />
        <Avatar name="Pak Dahlan" />
        <IconBadge glyph="✓" />
        <AppText variant="bodyStrong">Aktivitas keluarga</AppText>
        <Chip label="Hari ini" selected tone="primary" onPress={noop} />
        <TextField value="DiaryQu" onChangeText={noop} />
        <AppButton label="Simpan" onPress={noop} />
        <FloatingActionButton accessibilityLabel="Tambah" onPress={noop} />
      </AppCard>,
    );
  });
});

test('renders disabled and error states', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <AppCard variant="outlined">
        <TextField value="" error="Field wajib diisi" editable={false} />
        <AppButton label="Proses" disabled variant="outline" />
        <Chip label="Ditolak" tone="danger" />
      </AppCard>,
    );
  });
});
