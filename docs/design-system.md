# DiaryQu Design System

Dokumen ini menjadi pedoman visual dan implementasi komponen reusable untuk aplikasi Android DiaryQu.

## Prinsip

- Gunakan token dari `src/constants/theme.ts`; hindari hardcoded color, spacing, radius, shadow, dan font size baru di screen.
- Gunakan primitive dari `src/components/ui` sebelum membuat komponen lokal baru.
- UI harus terasa ringan, ramah keluarga, modern, dan konsisten dengan identitas hijau DiaryQu.
- Touch target interaktif minimum mengikuti `layout.touchTarget`.
- State loading, disabled, pressed, error, dan empty harus terlihat jelas.

## Token

### Color

Token utama:

- `colors.primary` — hijau utama DiaryQu
- `colors.primaryDark` — teks/ikon hijau kontras
- `colors.primarySoft` — background lembut
- `colors.background` — background screen
- `colors.surface` — card/input surface
- `colors.text`, `textSecondary`, `textMuted`, `textSubtle`
- `colors.border`, `borderStrong`, `borderFocus`
- semantic state: `danger`, `warning`, `info`, `success`

### Spacing

Gunakan `spacing.xxs` hingga `spacing.jumbo`. Untuk layout screen gunakan `layout.screenPadding` dan `layout.sectionGap`.

### Radius

Gunakan `radius.xs` hingga `radius.xxl`, dan `radius.pill` untuk chip, button, avatar, serta input yang berbentuk pill.

### Typography

Gunakan `AppText` dan varian:

- `display`
- `title`
- `heading`
- `section`
- `body`
- `bodyStrong`
- `bodySmall`
- `label`
- `caption`
- `micro`
- `button`

### Elevation

Gunakan `shadows.sm`, `shadows.md`, atau `shadows.lg`. Jangan menulis shadow baru langsung di screen kecuali ada kebutuhan desain yang benar-benar khusus.

## Primitive Components

Semua component tersedia dari `src/components/ui`.

### `AppText`

Typography dan semantic color yang konsisten.

### `AppButton`

Variant:

- `primary`
- `secondary`
- `outline`
- `danger`
- `ghost`

Size:

- `sm`
- `md`
- `lg`

Mendukung loading, disabled, left/right icon, dan full width.

### `TextField`

Mendukung label, error, helper text, left/right adornment, disabled state, serta semua prop `TextInput` React Native.

### `AppCard`

Variant:

- `default`
- `soft`
- `outlined`
- `primary`

Mendukung elevation dan mode pressable.

### `Chip`

Untuk filter, status, dan selection. Tone: neutral, primary, success, warning, danger.

### `IconBadge`

Wrapper standar untuk glyph/icon pada card/menu agar ukuran icon konsisten.

### `ScreenHeader`

Header reusable untuk screen/feature. Variant `plain` dan `primary`.

### `SectionHeader`

Heading section dengan optional action.

### `FloatingActionButton`

FAB standar DiaryQu, termasuk extended label.

### `Avatar`

Avatar dengan image atau fallback initial otomatis.

## Implementasi Existing

Design system ini sudah dipakai oleh:

- Login screen
- generic feature scaffold
- empty module card
- navigation loading state
- bottom navigation styling
- BrandMark token alignment

Screen besar seperti Home, Agenda, Rutinitas, Finance, AssetQu, Tracking, dan Profile akan dimigrasikan bertahap pada milestone visual masing-masing agar perubahan tetap mudah divalidasi.

## Figma

Figma tetap menjadi source of truth untuk detail visual. Saat asset dan node Figma dapat dibaca dari integration, ukuran/warna/spacing spesifik dari node akan dipetakan ke token ini. Primitive tidak boleh mengunci asset palsu; icon atau ilustrasi final harus memakai asset Figma yang benar ketika tersedia.
