import type {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Agenda: undefined;
  Tracking: {memberId?: string} | undefined;
  Routines: undefined;
  Finance: {module?: 'uangqu' | 'assetqu'} | undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
  FamilyInfo: undefined;
  AccountSettings: undefined;
  Contribution: undefined;
  Goresan: undefined;
};
