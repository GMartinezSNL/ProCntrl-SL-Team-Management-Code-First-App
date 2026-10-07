# Team Management (Code App): Architecture

Source of truth: `docs/BUILD_SPEC.md`. This file turns it into decisions. Later sessions: read only the numbered section you need.
Stack: React + TypeScript (strict) + Vite, Power Apps code apps client library, generated Dataverse services. npm only.

## 1. Folder and file layout

```
src/
  main.tsx                  React root; imports theme CSS; mounts <App/>
  App.tsx                   Providers (Theme > UI > Request > Submit) + router
  routes.tsx                Hash route table (section 2); routeElements.tsx holds Guard + HelpTopicRoute
  config.ts                 THE single config file: choice values, limits, flags D1-D3, theme fallbacks, route paths
  content/helpContent.ts    Help text as data (headings + paragraphs), used by Help pages and Help panel
  pages/                    One folder per page: <Name>Page/<Name>Page.tsx + index.ts (+ .test.tsx in F13)
    HomePage, UnderConstructionPage, PersonSearchPage, StatusPage,
    NewDetailsPage, NewProjectsPage, NewReviewPage,
    ExistingProjectsPage, ExistingReviewPage, SuccessPage,
    HelpHomePage, HelpTopicPage (onboarding/offboarding/updating by param)
  components/               One folder per component + index.ts barrel
    App-specific only (spec section 15); pages use Fluent UI v9 controls directly for the rest:
    AppShell, Header, StepIndicator, PageActions (Back/Continue bar), WizardLayout,
    RequestSummary (U8), SelectedPersonBox, ReviewCard, HelpContent, Confetti, CheckDraw,
    HeroBanner
  state/
    request.ts              Request state, defaults, reducer, selectors (pure; section 3)
    requestStore.tsx        RequestProvider + useRequest() (reset(), isDirty)
    guards.ts               Pure guardRedirect() for route guards (section 2)
    submitStore.tsx         Submit engine state + runner (section 5, F07)
  data/
    dataService.ts          Public data functions (section 4); only file that imports src/generated
    payloads.ts             Pure builders for W1-W4 bodies (field allowlists)
    queries.ts              Pure OData filter builders + quote escaping
    mappers.ts              Generated model -> app types
    types.ts                Person, Role, Discipline, Project, ThemeColors, OnboardStatus
    DataError.ts            Error class (section 5)
  theme/
    brandRamp.ts            Pure: Main -> Fluent BrandVariants, contrast helpers (uses data/theme.ts fade)
    FluentThemeProvider.tsx Loads getTheme() once, light/dark Fluent themes, color-scheme toggle (persisted), --tm-* vars
    layout.ts               Media queries from config breakpoints (use non-overlapping ranges: Griffel doesn't sort them)
    motion.ts               Shared Griffel keyframes (F10)
    global.css              Minimal reset + .visually-hidden only
  hooks/
    useAppNavigate.ts (direction-aware navigate), useMediaQuery.ts, useScrolled.ts,
    useDebouncedValue.ts, usePersonSearch.ts (debounce + stale-response drop),
    useReducedMotion.ts, useAnnounce.ts (aria-live)
  assets/logo.png           Copied in by the user
  generated/                CLI-owned. Never edit by hand.
```

Rules: pages own layout and navigation; components are presentational; only `data/` touches `generated/`; only `config.ts` holds constants.

## 2. Route map

Router: `createHashRouter` (react-router-dom). Hash URLs need no server rewrites inside the Power Apps host and keep browser Back working. Paths live in `ROUTES` in `config.ts` (`#/person`, `#/new/details`, ... per spec section 13); unknown paths go Home. Guards: `state/guards.ts` (pure) + `Guard` in `routeElements.tsx`.
Guards run in a route `loader`-free wrapper (`useStepGuard`) that redirects with `replace` to the earliest unmet step; with no person, it goes Home.

| Page | Route | Title | Step | Back | Continue / main action | Guard |
|---|---|---|---|---|---|---|
| Home | `/` | Team Management App | - | - | Onboard (reset, Person) / Offboard, Update (Under Construction) / Help (Help Home) | none |
| Under Construction | `/under-construction` | Team Management App | - | Home | Home button | none |
| Person search | `/person` | Onboard User | 1 | Home | Start Onboard: re-read status, then Status or New Details | none |
| Status | `/status` | Onboard Team Member | - | Person (selection kept) | Home (reset) / Project-Specific Onboard -> Existing Projects | person and status is Onboard or In-Progress |
| New Details | `/new/details` | Onboard User | 2 of 4 | Person | New Projects (blocks until valid) | person, path = new |
| New Projects | `/new/projects` | Onboard User | 3 of 4 | New Details | New Review | details valid |
| New Review | `/new/review` | Onboard User | 4 of 4 | Cancel -> New Details | Confirm -> W1-W3 | details valid |
| Existing Projects | `/existing/projects` | Project Onboard | 2 of 3 | Status | Existing Review (needs 1+ project) | person, path = existing |
| Existing Review | `/existing/review` | Project Onboard | 3 of 3 | Cancel -> Existing Projects | Confirm -> W4 | 1+ existing project |
| Success | `/success` | Team Management App | - | - | Return to Home (reset) | `lastSubmission` set, else Home |
| Help Home | `/help` | Help Page | - | Home | Onboarding / Offboarding / Updating | none |
| Help topic | `/help/:topic` (`onboarding`, `offboarding`, `updating`) | Help Page - Onboarding / Offboarding / Updating Users | - | Help Home | - | unknown topic -> Help Home |

Step indicator: new path Person -> Details -> Projects -> Review; existing path Person -> Projects -> Review. Status shows no indicator.
Review "Edit" links go to the page that owns the field. While a submit is running or partially done, guards on earlier steps send the user back to Review (section 5).
Header Home icon: if `isDirty`, show ConfirmDialog "Discard this request?"; on confirm, reset() and go `/`. Help icon opens the panel without navigating.
Nav direction (forward/back) is set by PageActions and read by the page transition (section 6).

## 3. Request store

React Context + `useReducer` (no state library). Nothing is persisted; only the color scheme is stored (FluentThemeProvider, `localStorage` key `tm.colorScheme`, wrapped in try/catch).

```ts
type OnboardStatus = 'onboard' | 'inProgress' | 'offboard' | 'none';
type OnboardPath = 'new' | 'existing' | null;

interface SelectedPerson { id: string; fullName: string; email: string | null; status: OnboardStatus }
interface ProjectOption { id: string; number: string; isNda: boolean; isClosed: boolean }

interface RequestState {
  path: OnboardPath;
  person: SelectedPerson | null;       // stored by systemuserid (F2)
  roleId: string | null;    roleName: string | null;       // name is display-only
  disciplineId: string | null; disciplineName: string | null;
  isCore: boolean; isFullTime: boolean;
  hasEgnyte: boolean; hasTeams: boolean; hasPowerPlatform: boolean;
  partTimeHours: number | null;        // required only when !isFullTime; write 40 when full time
  newProjects: ProjectOption[];        // optional, NDA list
  existingProjects: ProjectOption[];   // required 1+, all-projects list
}

const DEFAULT_REQUEST: RequestState = {
  path: null, person: null, roleId: null, roleName: null, disciplineId: null, disciplineName: null,
  isCore: true, isFullTime: true, hasEgnyte: true, hasTeams: true, hasPowerPlatform: true,
  partTimeHours: null, newProjects: [], existingProjects: [],
};
```

Actions: `selectPerson`, `setPersonStatus`, `setPath`, `setRole`, `setDiscipline`, `setToggle(key, value)`, `setHours`, `setNewProjects`, `setExistingProjects`, `reset`.
Derived selectors: `isDirty` (state differs from defaults), `detailsErrors` (role, discipline, hours), `hoursToWrite` (40 or partTimeHours).

| Value | Set on | Notes |
|---|---|---|
| person | Person search (select) | Choosing a different person resets everything else to defaults |
| person.status | Person search (badge) and Start Onboard (re-read) | Routing uses the re-read value |
| path | Start Onboard (`new`) or Status "Project-Specific Onboard" (`existing`) | |
| role, discipline, toggles, hours | New Details | Turning Full Time back on clears hours |
| newProjects | New Projects | |
| existingProjects | Existing Projects | |
| reset() | Home action "Onboard User", header Home icon, Status "Home", Success "Return to Home", successful submit | Also clears submit state (section 5) |

## 4. Data module

`src/data/dataService.ts` wraps the services generated by `pa app add data-source` (pa CLI 1.2.0, `@microsoft/power-apps` 1.5.0). Every function: explicit `select`, server `filter`, `orderBy`, `top`. Failures throw `DataError` (no silent fallbacks, except the theme value chain the spec requires).

Confirmed in F03 (`src/generated/services`, all static classes with `create`, `update`, `delete`, `get(id, {select})`, `getAll({select, filter, orderBy, top, skip, skipToken, count, maxPageSize})`, each returning `IOperationResult<T>` = `{ success, data, error?, skipToken?, count? }`):

| Table | Service | Model type | Entity set (for @odata.bind) |
|---|---|---|---|
| systemuser | `SystemusersService` | `Systemusers` | `systemusers` |
| mpm_role | `Mpm_rolesService` | `Mpm_roles` | `mpm_roles` |
| mpm_discipline | `Mpm_disciplinesService` | `Mpm_disciplines` | `mpm_disciplines` |
| cre9c_project | `Cre9c_projectsService` | `Cre9c_projects` | `cre9c_projects` |
| mpm_teammanagementrequest | `Mpm_teammanagementrequestsService` | `Mpm_teammanagementrequests` | - |
| environmentvariabledefinition | `EnvironmentvariabledefinitionsService` | `Environmentvariabledefinitions` | - |
| environmentvariablevalue | `EnvironmentvariablevaluesService` | `Environmentvariablevalues` | - |
| organization | `OrganizationsService` | `Organizations` | - |

Request lookups (exact casing): `mpm_User@odata.bind`, `mpm_Project@odata.bind`, `mpm_Role@odata.bind`, `mpm_Discipline@odata.bind`. Choice/flag names match the spec: `mpm_sldisc`, `mpm_nda`. The generated create type marks `mpm_number` and `statecode` as required; `createRequest()` casts the allowlisted payload at that one boundary so neither is ever sent. Signed-in user comes from `getContext()` in `@microsoft/power-apps/app` (`user.fullName`, `userPrincipalName`, `systemUserId`). Extra read added in F03: `searchProjects(text, ndaOnly)`, server-side `contains(cre9c_projectnumber, t)` with `PROJECT_SEARCH` limits (2 chars, 300 ms, 50 rows; mirrors person search because the spec defines none).

```ts
getTheme(): Promise<ThemeColors>
searchUsers(text: string): Promise<PersonResult[]>
getUserStatus(userId: string): Promise<OnboardStatus>
getRoles(): Promise<Role[]>
getSlDisciplines(): Promise<Discipline[]>
getNdaProjects(): Promise<ProjectOption[]>
getAllProjects(): Promise<ProjectOption[]>
markUserInProgress(userId: string): Promise<void>                        // W1
createNewUserRequest(req: NewUserRequestInput): Promise<string>          // W2, returns row id
createNewUserProjectRequest(req: NewUserProjectInput): Promise<string>   // W3, one project
createExistingProjectRequest(userId: string, projectId: string): Promise<string> // W4, one project
```

| Function | Table | Select | Filter | Sort | Top |
|---|---|---|---|---|---|
| getTheme (query A) | environmentvariabledefinition | environmentvariabledefinitionid, displayname, defaultvalue | displayname eq each of the 6 names (OR) | - | 12 |
| getTheme (query B) | environmentvariablevalue | value, _environmentvariabledefinitionid_value | definition id eq each id from A (OR) | - | 12 |
| searchUsers | systemuser | systemuserid, fullname, internalemailaddress, mpm_onboard | `startswith(firstname,t) or startswith(lastname,t) or contains(fullname,t)`; D3 on adds `isdisabled eq false and accessmode ne 4` | fullname asc | 50 |
| getUserStatus | systemuser (by id) | mpm_onboard | systemuserid | - | 1 |
| getEnvironmentName | organization | name | - (one row per environment) | - | 1 |
| getRoles | mpm_role | mpm_roleid, mpm_role | statecode eq 0 | mpm_role asc | 500 |
| getSlDisciplines | mpm_discipline | mpm_disciplineid, mpm_slname | mpm_sldisc eq 865540000 and statecode eq 0 | mpm_slname asc | 500 |
| getNdaProjects | cre9c_project | cre9c_projectid, cre9c_projectnumber, mpm_nda, at_projectstatus | mpm_nda eq true; D2 adds `at_projectstatus ne 120990001` | cre9c_projectnumber asc | PROJECT_MAX (2000) |
| getAllProjects | cre9c_project | same | `cre9c_projectnumber ne null`; D1 adds `mpm_nda eq true`; D2 as above | cre9c_projectnumber asc | PROJECT_MAX (2000) |
| W1 | systemuser (update) | - | by systemuserid | - | - |
| W2-W4 | mpm_teammanagementrequest (create) | - | - | - | - |

Notes:
- Theme is read as two batched queries (all 6 definitions, then all their values by definition id), never one per variable: the generated `IGetAllOptions` has no expand. Confirmed with the user in F03. Per variable: current value -> default value -> config fallback; parse as number; invalid numbers fall back.
- `searchUsers`: trims, returns `[]` under 2 chars, escapes `'` as `''` (in `queries.ts`). Debounce (300 ms) and stale-response dropping live in `usePersonSearch`, not here.
- Project lists are loaded once per page visit and searched in the browser. If a result returns exactly `PROJECT_MAX` rows, log a warning and show "Showing first 2000 projects" (see risk 3).
- Payloads (`payloads.ts`) are typed allowlists. W1: `{ mpm_onboard: 865540001 }`. W2: mpm_User, mpm_Role, mpm_Discipline (lookups), mpm_projectrelatedonboard=false, mpm_core, mpm_fulltime, mpm_egnyteaccess, mpm_teamsaccess, mpm_powerplatformaccess, mpm_hoursperweek. W3: mpm_User, mpm_Project, mpm_projectrelatedonboard=true, mpm_egnyteaccess, mpm_powerplatformaccess, mpm_hoursperweek. W4: mpm_User, mpm_Project, mpm_projectrelatedonboard=true. Lookups use `<NavProperty>@odata.bind: "/<entityset>(<guid>)"` unless the generated model offers a typed field. A unit test asserts the forbidden fields (at_projectstatusformula, mpm_nda, mpm_eci, mpm_task, mpm_number) never appear.

## 5. Submit engine

`state/submitStore.tsx` exposes `useSubmit()` -> `{ state, submitNew(), submitExisting(), retry(), clear() }`.

Plan: on first Confirm, build a frozen list of steps from a snapshot of the request:
- New path: `W1`, `W2`, then `W3:<projectId>` per project in display order (none if no projects).
- Existing path: `W4:<projectId>` per project.

```ts
interface SubmitState {
  status: 'idle' | 'running' | 'failed' | 'done';
  kind: 'new' | 'existing' | null;
  steps: { key: string; label: string }[];
  completed: Record<string, string | true>;   // key -> created row id (true for W1 update)
  failedKey: string | null;
  error: DataError | null;
}
```

Runner: loop over steps in order; skip keys already in `completed`; await each write (strictly one at a time); record success; on the first throw set `failed` + `failedKey` + `error` and stop. `retry()` runs the same loop with the same frozen plan, so it resumes at the failed step and never repeats a successful write.

Double-submit guard: a `useRef` in-flight flag set synchronously before the first await (catches double clicks in the same tick), plus `status === 'running'` disabling Confirm and Cancel and switching the label to a spinner + "Submitting...".

Locking: once any step has succeeded, the Review page hides Edit links and Cancel; only Retry and the header Home (with a warning in the confirm text) remain. Guards on earlier steps redirect back to Review while `status` is `running` or `failed` with completed steps. This keeps the frozen plan and the visible request in sync.

Error model: `DataError { step: string; table: string; operation: 'read' | 'create' | 'update'; message: string; code?: string }`, built from the generated-service error. Failure UI: a Toast (role="alert") with the message, code, "N request rows were created before the error" (count of completed create steps; W1 is an update, not a row), and Retry. If `W1` is in `completed`, also show "The person is now marked In-Progress but the request was not fully created. Contact DMS." W1 is never undone. If W1 itself fails, show the error and stop; F07 reports it as a blocker (no workaround).

Done: write `lastSubmission = { personName, kind, projectRequestCount }` to the submit store, call request `reset()`, clear the plan, then `navigate('/success', { replace: true })`. Browser Back lands on a guarded step with no person and is redirected Home, so nothing can be resubmitted. Success "Return to Home" clears `lastSubmission`.

## 6. Design system

Base: **Fluent UI v9** (`@fluentui/react-components`) for every standard control, plus a thin custom layer for the section 11 "wow" pieces. Decided after F03 (reasons: built-in accessibility for the hardest controls, native Power Platform look, built-in light/dark theming, Microsoft-maintained). Styling uses Fluent's `makeStyles` + `tokens` (Griffel, included in the package); no CSS frameworks, no separate design-token files.

Colors (Sargent & Lundy brand, still no hard-coded brand colors):
- S&L colors arrive through the 6 environment variables (spec section 7), set in Dev to the S&L palette. `config.ts` fallbacks switch to the official S&L values once supplied (open item); until then they stay at the spec values.
- `theme/brandRamp.ts` turns Main into a Fluent `BrandVariants` ramp (keys 10-160): Main is composited over white (alpha), placed at 80; 10-70 step toward black, 90-160 fade toward white with the spec fade formula (`data/theme.ts`). Pure function, unit-tested.
- `theme/FluentThemeProvider.tsx` loads `getTheme()` once, builds `createLightTheme(ramp)` / `createDarkTheme(ramp)` (dark: `colorBrandForeground1` = ramp 110, `colorBrandForeground2` = ramp 120, per spec section 7), and wraps the app in `FluentProvider`. Fallback theme renders immediately (no flash), then swaps when the query returns. If the query fails, the fallback theme stays and the error is logged.
- No per-control overrides (spec section 7): Fluent primary buttons use the brand tokens as-is (Main fill, darker on hover/press). If white text fails AA on a brand shade, fix the ramp in `brandRamp.ts`; `whiteTextFailures()` checks shades 40/70/80 and the provider logs failures. Headers use the Main -> Medium gradient; the selected-person box uses Light fill + Main border (dark mode: `colorBrandBackground2` fill).
- Header controls sit on the brand gradient through a nested `FluentProvider` with a partial theme (on-brand foregrounds, translucent subtle hover), not by restyling controls. Tooltips there use `appearance="inverted"`.
- Main, Light and Medium are also written as CSS variables `--tm-main`, `--tm-light`, `--tm-medium` on the provider root for the custom layer (gradients, step line, confetti).
- Dark mode: header toggle (sun/moon, `WeatherSunny`/`WeatherMoon` icons) switches between the two Fluent themes; light by default; choice stored in `localStorage` (`tm.colorScheme`, try/catch) by `FluentThemeProvider` (`useThemeMode()`). In dark mode, brand text uses ramp 100-120 until it reaches 4.5:1; badges use Fluent `Badge` tinted appearance + icon + text (never color alone). Any contrast fallback is logged once so F11 can report it.

Fluent controls per spec element:

| Spec element | Fluent v9 control |
|---|---|
| Person search ("Search & Select User") | `Combobox` (freeform, server results, `Option` with name + email, `Avatar` initials) |
| Role / Discipline | `Dropdown` with placeholder, `Field` for label + required + validation message |
| Core, Full Time, Egnyte, Teams, Power Platform | `Switch` with state-dependent label |
| Approx. Hrs/wk | `RadioGroup` (horizontal) or `ToggleButton` chips, in a `Field` |
| Project pickers | `TagPicker` (searchable multi-select with removable tags) + live "N selected" `Text` |
| Status pills | `Badge` (`tint`, icon); In-Progress gets the custom pulse |
| Buttons / Home + Help icons | `Button` (`primary` / `secondary` / `subtle`), `Tooltip` for icon labels |
| "Discard this request?" | `Dialog` |
| Help panel | `OverlayDrawer` (position end) + `TabList` (Onboarding / Offboarding / Updating) |
| Inline validation / page errors | `Field` validationMessage, `MessageBar` |
| Submit failure with Retry | `Toaster` + `Toast` (intent error, Retry action) |
| Loading / empty | `Spinner`, `Skeleton`, custom `EmptyState` (icon + one line) |
| Cards (status, review, success) | `Card` + `CardHeader` |

Custom layer (built on Fluent tokens + `--tm-*` variables, in `components/`): `HeroBanner` (Home, slow animated gradient Main -> Medium, logo glow), `StepIndicator` (numbered dots, filling line, current-step pulse, check on done), `AppShell`/`Header` (Main -> Medium gradient, frosted blur when scrolled), `ReviewCard` stagger, `CheckDraw` (SVG stroke animation), `Confetti` (one canvas burst in theme colors, about 60 lines, no library).

Layout and type (spec section 13): sticky 64px header; content centered, `max-width: 1200px`, gutters 32/24/16px (desktop/tablet/phone); breakpoints phone < 640, tablet 640-1023, desktop >= 1024, wide >= 1440; wizard pages 2/3 form + 1/3 sticky RequestSummary on desktop, one column + collapsible Summary below desktop; PageActions sticky at the bottom below desktop; spacing from Fluent `tokens.spacing*` (4/8 grid); card radius `tokens.borderRadiusXLarge`, pills `borderRadiusCircular`; shadows `tokens.shadow4/8/16`; type from Fluent `typographyStyles` (Segoe UI).

Motion: Fluent motion tokens (`tokens.durationNormal`, `tokens.curveDecelerateMid`) in Griffel keyframes; animate only transform and opacity. Page change: fade + 12px slide, direction from router location state set by `useAppNavigate` (browser Back = back), 200-300 ms, never delays navigation. Stagger via `animationDelay` per index (40 ms). Loops only for skeletons, spinners and the In-Progress pulse, plus the spec-required slow Home hero gradient (off under reduced motion); the step pulse runs 3 times. `@media (prefers-reduced-motion: reduce)` removes movement (fades only); `useReducedMotion()` skips confetti and check-draw. No motion preview packages.

Icons: `@fluentui/react-icons` only (`bundleIcon` for Regular/Filled pairs). Focus: Fluent's built-in focus indicators (`createFocusOutlineStyle` for custom elements), always visible on keyboard focus.

npm packages (each needs S&L EA approval; `@snl-business/ui` question still open):

| Package | Type | Reason |
|---|---|---|
| @fluentui/react-components | runtime | Accessible controls, theming, makeStyles/tokens, dark mode |
| @fluentui/react-icons | runtime | The one icon set, matches Fluent |
| react-router-dom | runtime | Routes, guards, browser Back/history |
| vitest | dev | Test runner native to Vite |
| @testing-library/react, @testing-library/user-event, @testing-library/jest-dom | dev | Component tests in the S&L standard style |
| jsdom | dev | Browser environment for tests |
| eslint-plugin-jsx-a11y | dev | Catches missing labels and roles during lint (F11) |

Not proposed: lucide-react (replaced by Fluent icons), Fluent motion preview packages, state libraries, other UI kits, Framer Motion, confetti libraries.

## 7. Feature-to-file map

| Feature | Creates | Changes |
|---|---|---|
| F02 scaffold | Done in Phase 0 (template, `power.config.json`, `CLAUDE.md`, `BUILD_LOG.md`) | - |
| F03 data layer | Done: `src/generated/**`, `.power/**`, `src/config.ts`, `src/data/*`, `pages/DiagnosticsPage` (temporary) | `App.tsx` (temporary hash route) |
| F04 shell + design system + Home + Under Construction | Done: installed Fluent + icons + react-router-dom + test/a11y dev packages; `theme/{brandRamp.ts,FluentThemeProvider.tsx,layout.ts,global.css}`, `state/{request.ts,requestStore.tsx,guards.ts}`, `routes.tsx`, `routeElements.tsx`, `hooks/{useAppNavigate,useMediaQuery,useScrolled}`, `components/{AppShell,Header,StepIndicator,PageActions,WizardLayout,RequestSummary,SelectedPersonBox,HeroBanner}`, `pages/{HomePage,UnderConstructionPage,PlaceholderPage}`, `vitest.config.ts`, 2 tests | `App.tsx`, `main.tsx`, `index.html`, `eslint.config.js` (jsx-a11y), `package.json`; deleted `DiagnosticsPage` and template assets |
| F05 person search + status | `hooks/{useDebouncedValue,usePersonSearch,useAnnounce}`, Fluent `Combobox` + `Badge` in `pages/{PersonSearchPage,StatusPage}` | `routes.tsx` (replace placeholders) |
| F06 new-user Details/Projects/Review UI | `components/{ProjectPicker (TagPicker),HoursPicker,AccessSwitch,ReviewCard}`, `pages/{NewDetailsPage,NewProjectsPage,NewReviewPage}` | `requestStore.tsx` (selectors) |
| F07 new-user submit W1-W3 | `state/submitStore.tsx`; Fluent `Toast` with Retry via `TOASTER_ID` (Toaster already in AppShell) | `NewReviewPage`, `state/guards.ts` (lock guards) |
| F08 existing path + W4 + Success + reset | `pages/{ExistingProjectsPage,ExistingReviewPage,SuccessPage}`, `components/{Confetti,CheckDraw}` | `submitStore.tsx` (submitExisting, lastSubmission), `Header` (Dialog for dirty confirm) |
| F09 help | `content/helpContent.ts`, `components/HelpContent`, `pages/{HelpHomePage,HelpTopicPage}` | `AppShell` (fill the placeholder OverlayDrawer tabs), `routeElements.tsx` |
| F10 motion + polish | `hooks/{useReducedMotion,useScrolled}`, `theme/motion.ts` (shared Griffel keyframes) | Component and page `makeStyles` |
| F11 accessibility + copy | - | Labels, aria-live, focus order, contrast fallbacks, copy fixes; `eslint.config.js` (jsx-a11y) |
| F12 review gate | `docs/REVIEW_GATE.md` (audit: filters/limits on every query, no forbidden writes, no hard-coded colors, no table changes) | Fixes found by the audit |
| F13 tests + handoff | `*.test.ts(x)` beside units (brandRamp, data/theme, queries, payloads, requestStore, submitStore runner, key pages), `vitest.config.ts`, `HANDOFF.md` | `package.json` (test script) |

## 8. Risks and open questions

1. **S&L brand values.** Official S&L colors are still needed for the Dev environment variables and the `config.ts` fallbacks. Until then the spec fallbacks (0, 51, 160) are used.
2. **Fluent theme fit.** Fluent derives many tokens from the brand ramp; a generated ramp from an arbitrary Main can produce weak hover/pressed or dark-mode shades. F04 must eyeball both modes and F11 must contrast-check them. (Resolved in F03: generated names confirmed; theme = 2 batched queries, user-approved.)
3. **Project volume.** Both lists load up to 2000 rows and search in the browser. If Dev has more projects, the existing path needs server-side type-ahead like person search.
4. **Hash routing in the host.** Assumes browser Back works inside the Power Apps player iframe with hash URLs. Verify at the F05 checkpoint.
5. **W1 permission.** Users need write on `systemuser.mpm_onboard`; if Dev roles block it, F07 is blocked (spec forbids workarounds).
6. **Lost response on create.** If a create succeeds but the response is lost (timeout), Retry will create a duplicate row and a second flow run. The app can't detect this without an idempotency key; flows owners should be asked.
7. **Theme contrast.** Environment colors are arbitrary; white on Medium may fail AA. Auto-switch to dark text is planned and will be reported.
8. **Approvals and scope.** `@fluentui/react-components`, `@fluentui/react-icons` and `react-router-dom` need EA approval before F04 installs them; confirm whether `@snl-business/ui` must be used instead of or alongside Fluent. "F12 review gate" is interpreted as the hard-rules audit; confirm.
9. **One environment per project (decided in F05).** Each project has its own environment and Dataverse, with the same security roles everywhere; the app is deployed into each one and only ever sees that project's data, so it does no project filtering of its own. To show users which project they are in, `getEnvironmentName()` reads `organization.name` (user-approved addition of the organization table, outside spec section 5) and `useEnvironmentName` shares it: shown in the header and as an "Environment:" line on Status (spec section 8 messages unchanged). If it can't be read, the error is logged and the name is simply not shown.
