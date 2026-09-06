import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../constants/theme';
import {AgendaScreen} from '../../features/agenda/screens/AgendaScreen';
import {LoginScreen} from '../../features/auth/screens/LoginScreen';
import {useAuthStore} from '../../features/auth/store/authStore';
import {FinanceScreen} from '../../features/finance/screens/FinanceScreen';
import {HomeScreen} from '../../features/home/screens/HomeScreen';
import {RoutinesScreen} from '../../features/routines/screens/RoutinesScreen';
import {TrackingScreen} from '../../features/tracking/screens/TrackingScreen';
import type {AuthStackParamList, MainTabParamList} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const TAB_META: Record<
  keyof MainTabParamList,
  {label: string; glyph: string}
> = {
  Home: {label: 'Beranda', glyph: '⌂'},
  Agenda: {label: 'Agenda', glyph: '▦'},
  Tracking: {label: '', glyph: '●'},
  Routines: {label: 'Rutinitas', glyph: '✓'},
  Finance: {label: 'Keuangan', glyph: '▣'},
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabel: TAB_META[route.name].label,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#66716D',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          height: 74,
          paddingTop: 9,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: '#FFFFFF',
        },
        tabBarIcon: ({focused}) => {
          const meta = TAB_META[route.name];

          if (route.name === 'Tracking') {
            return (
              <View style={styles.trackingTabOuter}>
                <View style={styles.trackingTabInner}>
                  <Text style={styles.trackingGlyph}>●</Text>
                </View>
              </View>
            );
          }

          return (
            <Text
              style={[
                styles.tabGlyph,
                {color: focused ? colors.primary : '#69716F'},
              ]}>
              {meta.glyph}
            </Text>
          );
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Tracking" component={TrackingScreen} />
      <Tab.Screen name="Routines" component={RoutinesScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const status = useAuthStore(state => state.status);
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    void initialize().then(cleanup => {
      if (disposed) {
        cleanup?.();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [initialize]);

  if (status === 'booting') {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.bootText}>DiaryQu</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'authenticated' ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bootText: {color: '#FFFFFF', fontSize: 24, fontWeight: '800'},
  tabGlyph: {fontSize: 23, fontWeight: '800'},
  trackingTabOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 1,
    borderColor: '#D5DFDB',
  },
  trackingTabInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingGlyph: {color: '#FFFFFF', fontSize: 21, lineHeight: 22},
});
