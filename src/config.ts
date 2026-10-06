// Single source for choice values, limits, feature flags, and theme fallbacks (spec sections 6-7).

export const ONBOARD_STATUS = {
  ONBOARD: 865540000,
  IN_PROGRESS: 865540001,
  OFFBOARD: 865540002,
} as const;

// Disciplines "S&L Disc" choice: generated name is mpm_sldisc (matches spec).
export const SL_DISCIPLINE_COLUMN = 'mpm_sldisc';
export const SL_DISCIPLINE_VALUE = 865540000;

// Projects "NDA" flag: generated name is mpm_nda (matches spec).
export const PROJECT_NDA_COLUMN = 'mpm_nda';
export const PROJECT_STATUS = {
  ACTIVE: 120990000,
  CLOSED: 120990001,
} as const;

// Dataverse accessmode value for non-interactive users (used by D3).
export const ACCESS_MODE_NON_INTERACTIVE = 4;

export const FULL_TIME_HOURS = 40;
export const PART_TIME_HOURS = [1, 5, 10, 20, 30] as const;

export const PERSON_SEARCH = {
  MIN_CHARS: 2,
  DEBOUNCE_MS: 300,
  MAX_RESULTS: 50,
} as const;

// The spec defines no project picker limits; these mirror person search.
export const PROJECT_SEARCH = {
  MIN_CHARS: 2,
  DEBOUNCE_MS: 300,
  MAX_RESULTS: 50,
} as const;

// Upper bounds for small lookup lists (never load whole tables).
export const LIST_LIMITS = {
  ROLES: 500,
  DISCIPLINES: 500,
  PROJECTS: 2000,
} as const;

// Feature flags (all OFF per spec).
export const FEATURE_FLAGS = {
  D1_EXISTING_PATH_NDA_ONLY: false,
  D2_HIDE_CLOSED_PROJECTS: false,
  D3_EXCLUDE_DISABLED_AND_NON_INTERACTIVE_USERS: false,
} as const;

// Layout breakpoints in px (spec section 6) and content width (spec section 13).
export const BREAKPOINTS = {
  TABLET: 640,
  DESKTOP: 1024,
  WIDE: 1440,
} as const;
export const CONTENT_MAX_WIDTH = 1200;

// Hash routes (spec section 13). Pages link to these, never to string literals.
export const ROUTES = {
  HOME: '/',
  UNDER_CONSTRUCTION: '/under-construction',
  PERSON: '/person',
  STATUS: '/status',
  NEW_DETAILS: '/new/details',
  NEW_PROJECTS: '/new/projects',
  NEW_REVIEW: '/new/review',
  EXISTING_PROJECTS: '/existing/projects',
  EXISTING_REVIEW: '/existing/review',
  SUCCESS: '/success',
  HELP: '/help',
  HELP_TOPIC: '/help/:topic',
} as const;

// Device-local preference key (the only persisted value).
export const COLOR_SCHEME_STORAGE_KEY = 'tm.colorScheme';

// Theme environment variables, by definition display name, with fallbacks (spec section 7).
// TODO-BRAND: replace these fallbacks with the official S&L brand values when supplied.
export const THEME_VARIABLES = {
  red: { displayName: 'Color_Main_RGBA-Red', fallback: 0 },
  green: { displayName: 'Color_Main_RGBA-Green', fallback: 51 },
  blue: { displayName: 'Color_Main_RGBA-Blue', fallback: 160 },
  alpha: { displayName: 'Main_Color_Brightness_Decimal', fallback: 1 },
  fadeLight: { displayName: 'Main_Color_Fade_Percentage', fallback: 80 },
  fadeMedium: { displayName: 'Main_Color_Fade_Medium', fallback: 30 },
} as const;
