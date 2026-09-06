import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../constants/theme';
import {AgendaScreen} from '../../features/agenda/screens/AgendaScreen';
import {LoginScreen} from '../../features/auth/screens/LoginScreen';
import {useAuthStore} from '../../features/auth/store/authStore';
import {ContributionScreen} from '../../features/contribution/screens/ContributionScreen';
import {FamilySetupScreen} from '../../features/family/screens/FamilySetupScreen';
import {useFamilyStore} from '../../features/family/store/familyStore';
import {FinanceScreen} from '../../features/finance/screens/FinanceScreen';
import {HomeScreen} from '../../features/home/screens/HomeScreen';
import {ProfileScreen} from '../../features/profile/screens/ProfileScreen';
import {RoutinesScreen} from '../../features/routines/screens/RoutinesScreen';
import {TrackingScreen} from '../../features/tracking/screens/TrackingScreen';
import type {
  AppStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
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

function AppLoadingScreen({message = 'DiaryQu'}: {message?: string}) {
  return (
    <View style={styles.bootScreen}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.bootText}>{message}</Text>
    </View>
  );
}

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
            <Text style={focused ? styles.tabGlyphActive : styles.tabGlyph}>
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

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{headerShown: false}}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="Contribution" component={ContributionScreen} />
    </AppStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function FamilyGate() {
  const familyStatus = useFamilyStore(state => state.status);
  const loadFamily = useFamilyStore(state => state.load);

  useEffect(() => {
    if (familyStatus === 'idle') {
      loadFamily().catch(() => undefined);
    }
  }, [familyStatus, loadFamily]);

  if (familyStatus === 'idle' || familyStatus === 'loading') {
    return <AppLoadingScreen message="Menyiapkan Family Room" />;
  }

  if (familyStatus === 'ready') {
    return <AppStackNavigator />;
  }

  return <FamilySetupScreen />;
}

export function AppNavigator() {
  const status = useAuthStore(state => state.status);
  const session = useAuthStore(state => state.session);
  const initialize = useAuthStore(state => state.initialize);
  const resetFamily = useFamilyStore(state => state.reset);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    initialize().then(cleanup => {
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

  useEffect(() => {
    resetFamily();
  }, [userId, resetFamily]);

  if (status === 'booting') {
    return <AppLoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'authenticated' && session ? (
        <FamilyGate key={session.user.id} />
      ) : (
        <AuthNavigator />
      )}
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
  bootText: {color: '#FFFFFF', fontSize: 20, fontWeight: '800'},
  tabGlyph: {fontSize: 23, fontWeight: '800', color: '#69716F'},
  tabGlyphActive: {fontSize: 23, fontWeight: '800', color: colors.primary},
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
