import type {TextStyle, ViewStyle} from 'react-native';

export const colors = {
  background: '#F7F8FD',
  backgroundElevated: '#FBFCFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F3',
  surfacePressed: '#EEF7F3',

  primary: '#10BF88',
  primaryStrong: '#0AAE7B',
  primaryDark: '#08795B',
  primarySoft: '#DFF7EE',
  primaryMuted: '#BFECDC',
  primaryOn: '#FFFFFF',

  text: '#152033',
  textSecondary: '#44524D',
  textMuted: '#657181',
  textSubtle: '#8B9691',
  textOnPrimary: '#FFFFFF',

  border: '#DDE6E2',
  borderStrong: '#BFCFC7',
  borderFocus: '#67D9B4',

  danger: '#DF3413',
  dangerDark: '#B52A10',
  dangerSoft: '#FDE9E5',
  warning: '#F1CF58',
  warningDark: '#806B16',
  warningSoft: '#FFF6CE',
  info: '#4A77E5',
  infoSoft: '#EAF1FF',
  success: '#10BF88',
  successSoft: '#DFF7EE',

  blueSoft: '#EAF1FF',
  ad: '#DDE8FF',
  shadow: '#18243A',
  overlay: 'rgba(21, 32, 51, 0.46)',
  overlayLight: 'rgba(255, 255, 255, 0.18)',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
  section: 28,
} as const;

export const radius = {
  xs: 8,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export const typography = {
  display: 28,
  title: 24,
  heading: 20,
  section: 17,
  body: 14,
  bodySmall: 13,
  caption: 12,
  micro: 11,
  button: 14,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const lineHeight = {
  display: 35,
  title: 31,
  heading: 27,
  section: 23,
  body: 21,
  bodySmall: 19,
  caption: 17,
  micro: 15,
  button: 20,
} as const;

export const textStyles = {
  display: {
    fontSize: typography.display,
    lineHeight: lineHeight.display,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: typography.title,
    lineHeight: lineHeight.title,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.35,
  },
  heading: {
    fontSize: typography.heading,
    lineHeight: lineHeight.heading,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.2,
  },
  section: {
    fontSize: typography.section,
    lineHeight: lineHeight.section,
    fontWeight: fontWeight.bold,
  },
  body: {
    fontSize: typography.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeight.regular,
  },
  bodyStrong: {
    fontSize: typography.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeight.bold,
  },
  bodySmall: {
    fontSize: typography.bodySmall,
    lineHeight: lineHeight.bodySmall,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontSize: typography.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeight.regular,
  },
  micro: {
    fontSize: typography.micro,
    lineHeight: lineHeight.micro,
    fontWeight: fontWeight.regular,
  },
  button: {
    fontSize: typography.button,
    lineHeight: lineHeight.button,
    fontWeight: fontWeight.extrabold,
  },
} as const satisfies Record<string, TextStyle>;

export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  hero: 40,
} as const;

export const controlSize = {
  buttonSm: 38,
  buttonMd: 46,
  buttonLg: 52,
  input: 52,
  chip: 34,
  fab: 56,
  fabLarge: 64,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 56,
  tabBar: 74,
} as const;

export const shadows = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 5},
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  screenPadding: spacing.xl,
  sectionGap: spacing.section,
  cardPadding: spacing.lg,
  contentMaxWidth: 720,
  touchTarget: 44,
} as const;
