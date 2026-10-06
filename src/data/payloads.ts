// Pure builders for W1-W4 bodies. Each type is an allowlist: only these fields are ever sent.
// Never add at_projectstatusformula, mpm_nda, mpm_eci, mpm_task, or mpm_number (spec section 5).
import { ONBOARD_STATUS } from '../config';
import type { NewUserProjectInput, NewUserRequestInput } from './types';

const bindUser = (id: string) => `/systemusers(${id})`;
const bindProject = (id: string) => `/cre9c_projects(${id})`;
const bindRole = (id: string) => `/mpm_roles(${id})`;
const bindDiscipline = (id: string) => `/mpm_disciplines(${id})`;

export interface W1Payload {
  mpm_onboard: typeof ONBOARD_STATUS.IN_PROGRESS;
}

export interface W2Payload {
  'mpm_User@odata.bind': string;
  'mpm_Role@odata.bind': string;
  'mpm_Discipline@odata.bind': string;
  mpm_projectrelatedonboard: false;
  mpm_core: boolean;
  mpm_fulltime: boolean;
  mpm_egnyteaccess: boolean;
  mpm_teamsaccess: boolean;
  mpm_powerplatformaccess: boolean;
  mpm_hoursperweek: number;
}

export interface W3Payload {
  'mpm_User@odata.bind': string;
  'mpm_Project@odata.bind': string;
  mpm_projectrelatedonboard: true;
  mpm_egnyteaccess: boolean;
  mpm_powerplatformaccess: boolean;
  mpm_hoursperweek: number;
}

export interface W4Payload {
  'mpm_User@odata.bind': string;
  'mpm_Project@odata.bind': string;
  mpm_projectrelatedonboard: true;
}

export function buildW1(): W1Payload {
  return { mpm_onboard: ONBOARD_STATUS.IN_PROGRESS };
}

export function buildW2(input: NewUserRequestInput): W2Payload {
  return {
    'mpm_User@odata.bind': bindUser(input.userId),
    'mpm_Role@odata.bind': bindRole(input.roleId),
    'mpm_Discipline@odata.bind': bindDiscipline(input.disciplineId),
    mpm_projectrelatedonboard: false,
    mpm_core: input.isCore,
    mpm_fulltime: input.isFullTime,
    mpm_egnyteaccess: input.hasEgnyte,
    mpm_teamsaccess: input.hasTeams,
    mpm_powerplatformaccess: input.hasPowerPlatform,
    mpm_hoursperweek: input.hoursPerWeek,
  };
}

export function buildW3(input: NewUserProjectInput): W3Payload {
  return {
    'mpm_User@odata.bind': bindUser(input.userId),
    'mpm_Project@odata.bind': bindProject(input.projectId),
    mpm_projectrelatedonboard: true,
    mpm_egnyteaccess: input.hasEgnyte,
    mpm_powerplatformaccess: input.hasPowerPlatform,
    mpm_hoursperweek: input.hoursPerWeek,
  };
}

export function buildW4(userId: string, projectId: string): W4Payload {
  return {
    'mpm_User@odata.bind': bindUser(userId),
    'mpm_Project@odata.bind': bindProject(projectId),
    mpm_projectrelatedonboard: true,
  };
}
