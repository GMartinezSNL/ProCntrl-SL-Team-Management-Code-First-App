// Request-in-progress state, reducer and selectors (docs/ARCHITECTURE.md section 3). Pure, no React.
import { FULL_TIME_HOURS } from '../config';
import type { OnboardStatus, ProjectOption } from '../data/types';

export type OnboardPath = 'new' | 'existing' | null;

export interface SelectedPerson {
  id: string; // systemuserid (F2)
  fullName: string;
  email: string | null;
  status: OnboardStatus;
}

export interface RequestState {
  path: OnboardPath;
  person: SelectedPerson | null;
  roleId: string | null;
  roleName: string | null; // display only
  disciplineId: string | null;
  disciplineName: string | null; // display only
  isCore: boolean;
  isFullTime: boolean;
  hasEgnyte: boolean;
  hasTeams: boolean;
  hasPowerPlatform: boolean;
  partTimeHours: number | null;
  newProjects: ProjectOption[];
  existingProjects: ProjectOption[];
}

export type ToggleKey = 'isCore' | 'isFullTime' | 'hasEgnyte' | 'hasTeams' | 'hasPowerPlatform';

export const DEFAULT_REQUEST: RequestState = {
  path: null,
  person: null,
  roleId: null,
  roleName: null,
  disciplineId: null,
  disciplineName: null,
  isCore: true,
  isFullTime: true,
  hasEgnyte: true,
  hasTeams: true,
  hasPowerPlatform: true,
  partTimeHours: null,
  newProjects: [],
  existingProjects: [],
};

export type RequestAction =
  | { type: 'selectPerson'; person: SelectedPerson | null }
  | { type: 'setPersonStatus'; status: OnboardStatus }
  | { type: 'setPath'; path: OnboardPath }
  | { type: 'setRole'; id: string | null; name: string | null }
  | { type: 'setDiscipline'; id: string | null; name: string | null }
  | { type: 'setToggle'; key: ToggleKey; value: boolean }
  | { type: 'setHours'; hours: number | null }
  | { type: 'setNewProjects'; projects: ProjectOption[] }
  | { type: 'setExistingProjects'; projects: ProjectOption[] }
  | { type: 'reset' };

export function requestReducer(state: RequestState, action: RequestAction): RequestState {
  switch (action.type) {
    case 'selectPerson':
      // A different person starts a fresh request; re-selecting the same person keeps entries.
      if (action.person?.id === state.person?.id) return { ...state, person: action.person };
      return { ...DEFAULT_REQUEST, person: action.person };
    case 'setPersonStatus':
      return state.person ? { ...state, person: { ...state.person, status: action.status } } : state;
    case 'setPath':
      return { ...state, path: action.path };
    case 'setRole':
      return { ...state, roleId: action.id, roleName: action.name };
    case 'setDiscipline':
      return { ...state, disciplineId: action.id, disciplineName: action.name };
    case 'setToggle':
      if (action.key === 'isFullTime' && action.value) return { ...state, isFullTime: true, partTimeHours: null };
      return { ...state, [action.key]: action.value };
    case 'setHours':
      return { ...state, partTimeHours: action.hours };
    case 'setNewProjects':
      return { ...state, newProjects: action.projects };
    case 'setExistingProjects':
      return { ...state, existingProjects: action.projects };
    case 'reset':
      return DEFAULT_REQUEST;
  }
}

export interface DetailsErrors {
  role?: string;
  discipline?: string;
  hours?: string;
}

export function getDetailsErrors(state: RequestState): DetailsErrors {
  const errors: DetailsErrors = {};
  if (!state.roleId) errors.role = 'Please select a role';
  if (!state.disciplineId) errors.discipline = 'Please select a discipline';
  if (!state.isFullTime && state.partTimeHours === null) errors.hours = 'Please select hours per week';
  return errors;
}

export function isDetailsValid(state: RequestState): boolean {
  return Object.keys(getDetailsErrors(state)).length === 0;
}

export function isRequestDirty(state: RequestState): boolean {
  return (Object.keys(DEFAULT_REQUEST) as (keyof RequestState)[]).some((key) => {
    const current = state[key];
    const initial = DEFAULT_REQUEST[key];
    if (Array.isArray(current) && Array.isArray(initial)) return current.length !== initial.length;
    return current !== initial;
  });
}

export function hoursToWrite(state: RequestState): number | null {
  return state.isFullTime ? FULL_TIME_HOURS : state.partTimeHours;
}
