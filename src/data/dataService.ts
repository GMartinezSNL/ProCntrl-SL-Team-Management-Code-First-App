// App-owned data layer. The only module that imports src/generated (docs/ARCHITECTURE.md section 4).
import { getContext } from '@microsoft/power-apps/app';
import type { IOperationResult } from '@microsoft/power-apps/data';
import {
  Cre9c_projectsService,
  EnvironmentvariabledefinitionsService,
  EnvironmentvariablevaluesService,
  Mpm_disciplinesService,
  Mpm_rolesService,
  Mpm_teammanagementrequestsService,
  OrganizationsService,
  SystemusersService,
} from '../generated';
import type { Cre9c_projects } from '../generated/models/Cre9c_projectsModel';
import type { Mpm_teammanagementrequestsBase } from '../generated/models/Mpm_teammanagementrequestsModel';
import {
  ACCESS_MODE_NON_INTERACTIVE,
  FEATURE_FLAGS,
  LIST_LIMITS,
  ONBOARD_STATUS,
  PERSON_SEARCH,
  PROJECT_NDA_COLUMN,
  PROJECT_SEARCH,
  PROJECT_STATUS,
  SL_DISCIPLINE_COLUMN,
  SL_DISCIPLINE_VALUE,
  THEME_VARIABLES,
} from '../config';
import { DataError, type DataOperation } from './DataError';
import { buildW1, buildW2, buildW3, buildW4, type W2Payload, type W3Payload, type W4Payload } from './payloads';
import { escapeODataString, joinAnd, orEquals, orEqualsGuid, userSearchFilter } from './queries';
import { buildThemeColors, resolveNumber } from './theme';
import type {
  CurrentUser,
  Discipline,
  NewUserProjectInput,
  NewUserRequestInput,
  OnboardStatus,
  PersonResult,
  ProjectOption,
  Role,
  ThemeColors,
  ThemeValues,
} from './types';

const PROJECT_SELECT = ['cre9c_projectid', 'cre9c_projectnumber', PROJECT_NDA_COLUMN, 'at_projectstatus'];
const THEME_KEYS = Object.keys(THEME_VARIABLES) as (keyof ThemeValues)[];

async function unwrap<T>(table: string, operation: DataOperation, call: Promise<IOperationResult<T>>): Promise<T> {
  let result: IOperationResult<T>;
  try {
    result = await call;
  } catch (cause) {
    throw new DataError(table, operation, cause);
  }
  if (!result.success) throw new DataError(table, operation, result.error);
  return result.data;
}

function toOnboardStatus(value: number | undefined | null): OnboardStatus {
  if (value === ONBOARD_STATUS.ONBOARD) return 'onboard';
  if (value === ONBOARD_STATUS.IN_PROGRESS) return 'inProgress';
  if (value === ONBOARD_STATUS.OFFBOARD) return 'offboard';
  return 'none';
}

function toProject(row: Cre9c_projects): ProjectOption {
  return {
    id: row.cre9c_projectid,
    number: row.cre9c_projectnumber,
    isNda: row.mpm_nda === true,
    isClosed: row.at_projectstatus === PROJECT_STATUS.CLOSED,
  };
}

function closedProjectFilter(): string | null {
  return FEATURE_FLAGS.D2_HIDE_CLOSED_PROJECTS ? `at_projectstatus ne ${PROJECT_STATUS.CLOSED}` : null;
}

// ---- Reads ----

export async function getCurrentUser(): Promise<CurrentUser> {
  const { user } = await getContext();
  return {
    fullName: user.fullName || null,
    userPrincipalName: user.userPrincipalName || null,
    systemUserId: user.systemUserId || null,
  };
}

// Each project has its own environment; the organization row's name tells the user which one.
export async function getEnvironmentName(): Promise<string> {
  const rows = await unwrap('organization', 'read', OrganizationsService.getAll({ select: ['name'], top: 1 }));
  const name = rows[0]?.name;
  if (!name) throw new DataError('organization', 'read', new Error('No organization name returned'));
  return name;
}

// Two batched queries (definitions, then their values); generated services have no expand option.
export async function getTheme(): Promise<ThemeColors> {
  const names = THEME_KEYS.map((key) => THEME_VARIABLES[key].displayName);
  const definitions = await unwrap(
    'environmentvariabledefinition',
    'read',
    EnvironmentvariabledefinitionsService.getAll({
      select: ['environmentvariabledefinitionid', 'displayname', 'defaultvalue'],
      filter: orEquals('displayname', names),
      top: names.length * 2,
    })
  );
  const ids = definitions.map((definition) => definition.environmentvariabledefinitionid);
  const values = ids.length === 0
    ? []
    : await unwrap(
        'environmentvariablevalue',
        'read',
        EnvironmentvariablevaluesService.getAll({
          select: ['value', '_environmentvariabledefinitionid_value'],
          filter: orEqualsGuid('_environmentvariabledefinitionid_value', ids),
          top: ids.length * 2,
        })
      );

  const resolved = {} as ThemeValues;
  for (const key of THEME_KEYS) {
    const { displayName, fallback } = THEME_VARIABLES[key];
    const definition = definitions.find((d) => d.displayname === displayName);
    const current = values.find((v) => v._environmentvariabledefinitionid_value === definition?.environmentvariabledefinitionid);
    resolved[key] = resolveNumber(current?.value, definition?.defaultvalue, fallback);
  }
  return { values: resolved, ...buildThemeColors(resolved) };
}

export async function searchUsers(text: string): Promise<PersonResult[]> {
  const trimmed = text.trim();
  if (trimmed.length < PERSON_SEARCH.MIN_CHARS) return [];
  const rows = await unwrap(
    'systemuser',
    'read',
    SystemusersService.getAll({
      select: ['systemuserid', 'fullname', 'internalemailaddress', 'mpm_onboard'],
      filter: userSearchFilter(
        trimmed,
        FEATURE_FLAGS.D3_EXCLUDE_DISABLED_AND_NON_INTERACTIVE_USERS,
        ACCESS_MODE_NON_INTERACTIVE
      ),
      orderBy: ['fullname asc'],
      top: PERSON_SEARCH.MAX_RESULTS,
    })
  );
  return rows.map((row) => ({
    id: row.systemuserid,
    fullName: row.fullname ?? '',
    email: row.internalemailaddress || null,
    status: toOnboardStatus(row.mpm_onboard),
  }));
}

export async function getUserStatus(userId: string): Promise<OnboardStatus> {
  const row = await unwrap('systemuser', 'read', SystemusersService.get(userId, { select: ['mpm_onboard'] }));
  return toOnboardStatus(row.mpm_onboard);
}

export async function getRoles(): Promise<Role[]> {
  const rows = await unwrap(
    'mpm_role',
    'read',
    Mpm_rolesService.getAll({
      select: ['mpm_roleid', 'mpm_role'],
      filter: 'statecode eq 0',
      orderBy: ['mpm_role asc'],
      top: LIST_LIMITS.ROLES,
    })
  );
  return rows.map((row) => ({ id: row.mpm_roleid, name: row.mpm_role }));
}

export async function getSlDisciplines(): Promise<Discipline[]> {
  const rows = await unwrap(
    'mpm_discipline',
    'read',
    Mpm_disciplinesService.getAll({
      select: ['mpm_disciplineid', 'mpm_slname'],
      filter: `${SL_DISCIPLINE_COLUMN} eq ${SL_DISCIPLINE_VALUE} and statecode eq 0`,
      orderBy: ['mpm_slname asc'],
      top: LIST_LIMITS.DISCIPLINES,
    })
  );
  return rows.map((row) => ({ id: row.mpm_disciplineid, name: row.mpm_slname }));
}

async function getProjects(filter: string, top: number): Promise<ProjectOption[]> {
  const rows = await unwrap(
    'cre9c_project',
    'read',
    Cre9c_projectsService.getAll({
      select: PROJECT_SELECT,
      filter,
      orderBy: ['cre9c_projectnumber asc'],
      top,
    })
  );
  return rows.map(toProject);
}

export function getNdaProjects(): Promise<ProjectOption[]> {
  return getProjects(joinAnd([`${PROJECT_NDA_COLUMN} eq true`, closedProjectFilter()]), LIST_LIMITS.PROJECTS);
}

export function getAllProjects(): Promise<ProjectOption[]> {
  const ndaFilter = FEATURE_FLAGS.D1_EXISTING_PATH_NDA_ONLY ? `${PROJECT_NDA_COLUMN} eq true` : null;
  return getProjects(joinAnd(['cre9c_projectnumber ne null', ndaFilter, closedProjectFilter()]), LIST_LIMITS.PROJECTS);
}

// Server-side type-ahead on project number; limits from PROJECT_SEARCH in config.ts.
export async function searchProjects(text: string, ndaOnly: boolean): Promise<ProjectOption[]> {
  const trimmed = text.trim();
  if (trimmed.length < PROJECT_SEARCH.MIN_CHARS) return [];
  const match = `contains(cre9c_projectnumber,'${escapeODataString(trimmed)}')`;
  const ndaFilter = ndaOnly ? `${PROJECT_NDA_COLUMN} eq true` : null;
  return getProjects(joinAnd([match, ndaFilter, closedProjectFilter()]), PROJECT_SEARCH.MAX_RESULTS);
}

// ---- Writes (spec section 9). Not called until F07/F08. ----

// The generated create type marks mpm_number and statecode as required, but the spec forbids
// writing mpm_number. Payloads are strict allowlists, so cast only at this boundary.
type RequestCreate = Omit<Mpm_teammanagementrequestsBase, 'mpm_teammanagementrequestid'>;

async function createRequest(payload: W2Payload | W3Payload | W4Payload): Promise<string> {
  const row = await unwrap(
    'mpm_teammanagementrequest',
    'create',
    Mpm_teammanagementrequestsService.create(payload as unknown as RequestCreate)
  );
  return row.mpm_teammanagementrequestid;
}

/** W1: mark the selected user In-Progress. */
export async function markUserInProgress(userId: string): Promise<void> {
  await unwrap('systemuser', 'update', SystemusersService.update(userId, buildW1()));
}

/** W2: the new-user request row. Returns the created row id. */
export function createNewUserRequest(input: NewUserRequestInput): Promise<string> {
  return createRequest(buildW2(input));
}

/** W3: one project row for a new user. Returns the created row id. */
export function createNewUserProjectRequest(input: NewUserProjectInput): Promise<string> {
  return createRequest(buildW3(input));
}

/** W4: one project row for an existing user. Returns the created row id. */
export function createExistingProjectRequest(userId: string, projectId: string): Promise<string> {
  return createRequest(buildW4(userId, projectId));
}
