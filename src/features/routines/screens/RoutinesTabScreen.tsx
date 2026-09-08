import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import type {
  AppStackParamList,
  MainTabParamList,
} from '../../../app/navigation/types';
import {AppText} from '../../../components/ui';
import {colors, radius, shadows, spacing} from '../../../constants/theme';
import {useFamilyStore} from '../../family/store/familyStore';
import {RoutinesScreen} from './RoutinesScreen';

export function RoutinesTabScreen() {
  const role = useFamilyStore(state => state.family?.role);
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList, 'Routines'>>();
  const appNavigation =
    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <RoutinesScreen />
      {role === 'member' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kelola rutinitas saya"
          onPress={() => appNavigation?.navigate('MyRoutines')}
          style={({pressed}) => [
            styles.memberFab,
            pressed ? styles.memberFabPressed : undefined,
          ]}>
          <AppText variant="section" tone="onPrimary">+</AppText>
          <AppText variant="micro" tone="onPrimary">Rutinitas Saya</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  memberFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 92,
    minHeight: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.lg,
  },
  memberFabPressed: {opacity: 0.78, transform: [{scale: 0.98}]},
});
