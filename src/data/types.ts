export type OnboardStatus = 'onboard' | 'inProgress' | 'offboard' | 'none';

export interface PersonResult {
  id: string;
  fullName: string;
  email: string | null;
  status: OnboardStatus;
}

export interface CurrentUser {
  fullName: string | null;
  userPrincipalName: string | null;
  systemUserId: string | null;
}

export interface Role {
  id: string;
  name: string;
}

export interface Discipline {
  id: string;
  name: string;
}

export interface ProjectOption {
  id: string;
  number: string;
  isNda: boolean;
  isClosed: boolean;
}

export interface ThemeValues {
  red: number;
  green: number;
  blue: number;
  alpha: number;
  fadeLight: number;
  fadeMedium: number;
}

export interface ThemeColors {
  values: ThemeValues;
  main: string;
  light: string;
  medium: string;
}

export interface NewUserRequestInput {
  userId: string;
  roleId: string;
  disciplineId: string;
  isCore: boolean;
  isFullTime: boolean;
  hasEgnyte: boolean;
  hasTeams: boolean;
  hasPowerPlatform: boolean;
  hoursPerWeek: number;
}

export interface NewUserProjectInput {
  userId: string;
  projectId: string;
  hasEgnyte: boolean;
  hasPowerPlatform: boolean;
  hoursPerWeek: number;
}
