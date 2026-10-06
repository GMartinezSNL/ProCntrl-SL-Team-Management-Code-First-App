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

// Theme environment variables, by definition display name, with fallbacks (spec section 7).
export const THEME_VARIABLES = {
  red: { displayName: 'Color_Main_RGBA-Red', fallback: 0 },
  green: { displayName: 'Color_Main_RGBA-Green', fallback: 51 },
  blue: { displayName: 'Color_Main_RGBA-Blue', fallback: 160 },
  alpha: { displayName: 'Main_Color_Brightness_Decimal', fallback: 1 },
  fadeLight: { displayName: 'Main_Color_Fade_Percentage', fallback: 80 },
  fadeMedium: { displayName: 'Main_Color_Fade_Medium', fallback: 30 },
} as const;
