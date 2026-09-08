import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, Linking, StyleSheet, Text, View} from 'react-native';

import {AppText} from '../../components/ui';
import {
  colors,
  controlSize,
  fontWeight,
  iconSize,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';
import {AgendaScreen} from '../../features/agenda/screens/AgendaScreen';
import {LoginScreen} from '../../features/auth/screens/LoginScreen';
import {RegisterScreen} from '../../features/auth/screens/RegisterScreen';
import {AUTH_REDIRECT_URL} from '../../features/auth/services/authService';
import {useAuthStore} from '../../features/auth/store/authStore';
import {ContributionScreen} from '../../features/contribution/screens/ContributionScreen';
import {FamilyInfoScreen} from '../../features/family/screens/FamilyInfoScreen';
import {FamilySetupScreen} from '../../features/family/screens/FamilySetupScreen';
import {useFamilyStore} from '../../features/family/store/familyStore';
import {FinanceScreen} from '../../features/finance/screens/FinanceScreen';
import {GoresanScreen} from '../../features/goresan/screens/GoresanScreen';
import {HomeScreen} from '../../features/home/screens/HomeScreen';
import {AccountSettingsScreen} from '../../features/profile/screens/AccountSettingsScreen';
import {ProfileScreen} from '../../features/profile/screens/ProfileScreen';
import {useProfileStore} from '../../features/profile/store/profileStore';
import {MyRoutinesScreen} from '../../features/routines/screens/MyRoutinesScreen';
import {RoutinesTabScreen} from '../../features/routines/screens/RoutinesTabScreen';
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
      <ActivityIndicator size="large" color={colors.primaryOn} />
      <AppText variant="heading" tone="onPrimary">
        {message}
      </AppText>
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
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.micro,
          fontWeight: fontWeight.semibold,
          marginTop: -spacing.xxs,
        },
        tabBarStyle: {
          height: controlSize.tabBar,
          paddingTop: 9,
          paddingBottom: spacing.sm,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          ...shadows.sm,
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
      <Tab.Screen name="Routines" component={RoutinesTabScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
    </Tab.Navigator>
  );
}

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{headerShown: false}}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="FamilyInfo" component={FamilyInfoScreen} />
      <AppStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <AppStack.Screen name="Contribution" component={ContributionScreen} />
      <AppStack.Screen name="Goresan" component={GoresanScreen} />
      <AppStack.Screen name="MyRoutines" component={MyRoutinesScreen} />
    </AppStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
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
  const completeOAuthCallback = useAuthStore(state => state.completeOAuthCallback);
  const resetFamily = useFamilyStore(state => state.reset);
  const resetProfile = useProfileStore(state => state.reset);
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
    const handleUrl = (url: string | null) => {
      if (url?.startsWith(AUTH_REDIRECT_URL)) {
        completeOAuthCallback(url).catch(() => undefined);
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => undefined);
    const subscription = Linking.addEventListener('url', event => handleUrl(event.url));
    return () => subscription.remove();
  }, [completeOAuthCallback]);

  useEffect(() => {
    resetFamily();
    resetProfile();
  }, [userId, resetFamily, resetProfile]);

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
    gap: spacing.lg,
  },
  tabGlyph: {
    fontSize: iconSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.textMuted,
  },
  tabGlyphActive: {
    fontSize: iconSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  trackingTabOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  trackingTabInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingGlyph: {
    color: colors.primaryOn,
    fontSize: iconSize.md,
    lineHeight: iconSize.md,
  },
});
