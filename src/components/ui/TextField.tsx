import React, {type ReactNode} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  controlSize,
  radius,
  spacing,
  textStyles,
} from '../../constants/theme';
import {AppText} from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function TextField({
  label,
  error,
  helperText,
  leftAdornment,
  rightAdornment,
  containerStyle,
  inputStyle,
  editable = true,
  placeholderTextColor = colors.textSubtle,
  ...inputProps
}: TextFieldProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="label" tone="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputShell,
          error ? styles.inputShellError : undefined,
          !editable ? styles.inputShellDisabled : undefined,
        ]}>
        {leftAdornment ? <View style={styles.adornment}>{leftAdornment}</View> : null}
        <TextInput
          {...inputProps}
          editable={editable}
          placeholderTextColor={placeholderTextColor}
          accessibilityState={{disabled: !editable}}
          style={[styles.input, inputStyle]}
        />
        {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger" style={styles.supportingText}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" tone="muted" style={styles.supportingText}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {width: '100%'},
  label: {marginBottom: spacing.sm, marginLeft: spacing.xs},
  inputShell: {
    minHeight: controlSize.input,
    borderWidth: 1.2,
    borderColor: colors.borderFocus,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  inputShellError: {borderColor: colors.danger},
  inputShellDisabled: {backgroundColor: colors.surfaceMuted, opacity: 0.7},
  input: {
    ...textStyles.body,
    flex: 1,
    color: colors.text,
    paddingVertical: 0,
    minWidth: 0,
  },
  adornment: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportingText: {marginTop: spacing.xs, marginLeft: spacing.md},
});
