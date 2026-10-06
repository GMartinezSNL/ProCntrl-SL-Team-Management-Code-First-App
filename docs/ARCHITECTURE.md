# Team Management (Code App): Architecture

Source of truth: `docs/BUILD_SPEC.md`. This file turns it into decisions. Later sessions: read only the numbered section you need.
Stack: React + TypeScript (strict) + Vite, Power Apps code apps client library, generated Dataverse services. npm only.

## 1. Folder and file layout

```
src/
  main.tsx                  React root; imports theme CSS; mounts <App/>
  App.tsx                   Providers (Theme > UI > Request > Submit) + router
  routes.tsx                Route table + guards (section 2)
  config.ts                 THE single config file: choice values, limits, flags D1-D3, theme fallbacks, route paths
  content/helpContent.ts    Help text as data (headings + paragraphs), used by Help pages and Help panel
  pages/                    One folder per page: <Name>Page/<Name>Page.tsx + index.ts (+ .test.tsx in F13)
    HomePage, UnderConstructionPage, PersonSearchPage, StatusPage,
    NewDetailsPage, NewProjectsPage, NewReviewPage,
    ExistingProjectsPage, ExistingReviewPage, SuccessPage,
    HelpHomePage, HelpTopicPage (onboarding/offboarding/updating by param)
  components/               One folder per component + index.ts barrel
    AppShell, Header, StepIndicator, PageActions (Back/Continue bar), Button, IconButton,
    Card, ReviewCard, SelectedPersonBox, StatusBadge, Avatar, PersonSearchBox,
    Select, Toggle, ChipGroup, ProjectMultiSelect, FieldError, ConfirmDialog,
    HelpPanel, HelpContent, Toast, EmptyState, Skeleton, Confetti, CheckDraw
  state/
    requestStore.tsx        Request-in-progress context + reducer + reset() (section 3)
    submitStore.tsx         Submit engine state + runner (section 5)
    uiStore.tsx             Color scheme (persisted), help panel open/tab, nav direction
  data/
    dataService.ts          Public data functions (section 4); only file that imports src/generated
    payloads.ts             Pure builders for W1-W4 bodies (field allowlists)
    queries.ts              Pure OData filter builders + quote escaping
    mappers.ts              Generated model -> app types
    types.ts                Person, Role, Discipline, Project, ThemeColors, OnboardStatus
    DataError.ts            Error class (section 5)
  theme/
    tokens.css              Static tokens: spacing, radius, shadow, type, neutrals, motion
    global.css              Reset, focus ring, base elements, reduced-motion rules
    themeColors.ts          Pure math: fade, luminance, contrast, darken, derived vars
    ThemeProvider.tsx       Loads getTheme() once, writes CSS vars on <html>, sets data-theme
  hooks/
    useDebouncedValue.ts, usePersonSearch.ts (debounce + stale-response drop),
    useReducedMotion.ts, useAnnounce.ts (aria-live), useStepGuard.ts, useScrolled.ts
  assets/logo.png           Copied in by the user
  generated/                CLI-owned. Never edit by hand.
```

Rules: pages own layout and navigation; components are presentational; only `data/` touches `generated/`; only `config.ts` holds constants.

## 2. Route map

Router: `createHashRouter` (react-router-dom). Hash URLs need no server rewrites inside the Power Apps host and keep browser Back working.
Guards run in a route `loader`-free wrapper (`useStepGuard`) that redirects with `replace` to the earliest unmet step; with no person, it goes Home.

| Page | Route | Title | Step | Back | Continue / main action | Guard |
|---|---|---|---|---|---|---|
| Home | `/` | Team Management App | - | - | Onboard (reset, Person) / Offboard, Update (Under Construction) / Help (Help Home) | none |
| Under Construction | `/under-construction` | Team Management App | - | Home | Home button | none |
| Person search | `/onboard/person` | Onboard User | 1 | Home | Start Onboard: re-read status, then Status or New Details | none |
| Status | `/onboard/status` | Onboard Team Member | - | Person (selection kept) | Home (reset) / Project-Specific Onboard -> Existing Projects | person and status is Onboard or In-Progress |
| New Details | `/onboard/new/details` | Onboard User | 2 of 4 | Person | New Projects (blocks until valid) | person, path = new |
| New Projects | `/onboard/new/projects` | Onboard User | 3 of 4 | New Details | New Review | details valid |
| New Review | `/onboard/new/review` | Onboard User | 4 of 4 | Cancel -> New Details | Confirm -> W1-W3 | details valid |
| Existing Projects | `/onboard/existing/projects` | Project Onboard | 2 of 3 | Status | Existing Review (needs 1+ project) | person, path = existing |
| Existing Review | `/onboard/existing/review` | Project Onboard | 3 of 3 | Cancel -> Existing Projects | Confirm -> W4 | 1+ existing project |
| Success | `/success` | Team Management App | - | - | Return to Home (reset) | `lastSubmission` set, else Home |
| Help Home | `/help` | Help Page | - | Home | Onboarding / Offboarding / Updating | none |
| Help topic | `/help/:topic` (`onboarding`, `offboarding`, `updating`) | Help Page - Onboarding / Offboarding / Updating Users | - | Help Home | - | unknown topic -> Help Home |

Step indicator: new path Person -> Details -> Projects -> Review; existing path Person -> Projects -> Review. Status shows no indicator.
Review "Edit" links go to the page that owns the field. While a submit is running or partially done, guards on earlier steps send the user back to Review (section 5).
Header Home icon: if `isDirty`, show ConfirmDialog "Discard this request?"; on confirm, reset() and go `/`. Help icon opens the panel without navigating.
Nav direction (forward/back) is set by PageActions and read by the page transition (section 6).

## 3. Request store

React Context + `useReducer` (no state library). Nothing is persisted; only the color scheme is stored (uiStore, `localStorage` key `tm.colorScheme`, wrapped in try/catch).

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

`src/data/dataService.ts` wraps the services generated by `pa app add data-source`. Service class names, method names, result shape and lookup navigation-property casing are assumptions until F03 confirms them in `src/generated/services`; F03 updates this section if they differ. Every function: explicit `select`, server `filter`, `orderBy`, `top`. Failures throw `DataError` (no silent fallbacks, except the theme value chain the spec requires).

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
| getRoles | mpm_role | mpm_roleid, mpm_role | statecode eq 0 | mpm_role asc | 500 |
| getSlDisciplines | mpm_discipline | mpm_disciplineid, mpm_slname | mpm_sldisc eq 865540000 and statecode eq 0 | mpm_slname asc | 500 |
| getNdaProjects | cre9c_project | cre9c_projectid, cre9c_projectnumber, mpm_nda, at_projectstatus | mpm_nda eq true; D2 adds `at_projectstatus ne 120990001` | cre9c_projectnumber asc | PROJECT_MAX (2000) |
| getAllProjects | cre9c_project | same | `cre9c_projectnumber ne null`; D1 adds `mpm_nda eq true`; D2 as above | cre9c_projectnumber asc | PROJECT_MAX (2000) |
| W1 | systemuser (update) | - | by systemuserid | - | - |
| W2-W4 | mpm_teammanagementrequest (create) | - | - | - | - |

Notes:
- Theme is read as two parallel queries (all 6 definitions, then their values), never one per variable: generated services document select/filter/orderBy/top/skip but not expand. Per variable: current value -> default value -> config fallback; parse as number; invalid numbers fall back.
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

Tokens (`theme/tokens.css`, `:root`):
- Spacing `--space-1..10` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px. Radius `--radius-sm 8px`, `--radius-card 14px`, `--radius-pill 999px`.
- Shadows `--shadow-1..3`: layered, low-opacity neutral. Type: system stack (`"Segoe UI Variable", "Segoe UI", system-ui, sans-serif`); scale 12/14/16/18/22/28/36 px, weights 400/600/700.
- Neutrals `--gray-0..900` (white to near-black). The only literal colors in the codebase live here and in `themeColors.ts` math. Layout: centered column `max-width: 720px`, full width under 600px.

Theme variables (set at runtime by `ThemeProvider` on `<html>`, from `getTheme()` + section 6 fallbacks):
- `--tm-main` = rgba(R,G,B,A); `--tm-light` = fade(Main, Fade_Percentage); `--tm-medium` = fade(Main, Fade_Medium); fade = c + (255 - c) * p / 100.
- Derived in `themeColors.ts`: `--tm-main-rgb` (for tints), `--tm-on-main`, `--tm-on-medium` (white when contrast >= 4.5:1, else `--gray-900`), `--tm-main-text` (Main darkened until it reaches 4.5:1 on white). Alpha is composited over the page background before contrast checks. Any switch away from white text is logged once to the console so F11 can report it.
- Usage: header gradient Main -> Medium; primary button Medium fill, Main on hover, `--tm-on-medium` text; selected-person box Light fill + Main border; headings and status text use `--tm-main-text`.
- Fallback colors are applied immediately (no flash), then replaced when the query returns.

Dark mode: `html[data-theme="dark"]`, light by default, toggle in header (sun/moon). Neutral surfaces swap to dark grays; brand fills keep Main/Medium; Light becomes Main at 18% alpha over the dark surface; brand-colored text uses fade(Main, 45%) or lighter until 4.5:1 on the dark surface. Badges use tinted fill + icon + text (never color alone) and are contrast-checked in both modes.

Motion (CSS only, no animation library):
- `--motion-fast 150ms`, `--motion-base 250ms`, `--ease-out cubic-bezier(.2,.8,.2,1)`. Animate only transform and opacity.
- Page transition: AppShell keys the outlet by pathname and applies `enter-forward` (translateX 12px -> 0) or `enter-back` (-12px -> 0) with fade, from uiStore direction. Exit is instant, so navigation is never delayed.
- Staggered lists (search results, review cards, success cards) use `animation-delay: calc(var(--i) * 40ms)`.
- Loops only for skeleton shimmer, spinners and the In-Progress pulse.
- `@media (prefers-reduced-motion: reduce)` sets distances to 0, removes keyframes except opacity fades; `useReducedMotion()` skips confetti and the check-draw.
- Confetti: in-house `<Confetti/>` canvas burst (about 60 lines, theme colors, runs once).

Icons: `lucide-react` (one set). Focus: 2px outline + offset using `--tm-main-text`, always visible on `:focus-visible`.

Proposed npm packages (each needs your EA approval per S&L rules; checked `@snl-business/ui` is not in this repo, see risk 8):

| Package | Type | Reason |
|---|---|---|
| react-router-dom | runtime | Routes, guards, browser Back/history |
| lucide-react | runtime | One tree-shakable icon set |
| vitest | dev | Test runner native to Vite |
| @testing-library/react, @testing-library/user-event, @testing-library/jest-dom | dev | Component tests in the S&L standard style |
| jsdom | dev | Browser environment for tests |
| eslint-plugin-jsx-a11y | dev | Catches missing labels and roles during lint (F11) |

Not proposed: state libraries, UI kits (Fluent, MUI), Framer Motion, confetti libraries, date/utility libraries.

## 7. Feature-to-file map

| Feature | Creates | Changes |
|---|---|---|
| F02 scaffold | Microsoft Vite template files, `power.config.json` (via `pa app init`), `BUILD_LOG.md` row | `package.json` (scripts: typecheck, lint, test placeholder), `tsconfig.json` (strict), `CLAUDE.md` |
| F03 data layer | `src/generated/**` (CLI), `src/config.ts`, `src/data/*`, `src/pages/DiagnosticsPage/*` (temporary) | `App.tsx` (diagnostics route), this file section 4 if names differ |
| F04 shell + design system + Home + Under Construction | `theme/*`, `state/requestStore.tsx`, `state/uiStore.tsx`, `routes.tsx`, `components/{AppShell,Header,StepIndicator,PageActions,Button,IconButton,Card,ConfirmDialog,EmptyState,Skeleton}`, `pages/{HomePage,UnderConstructionPage}`, placeholder pages for every route | `App.tsx`, `main.tsx`; deletes `DiagnosticsPage` |
| F05 person search + status | `hooks/{useDebouncedValue,usePersonSearch,useAnnounce,useStepGuard}`, `components/{PersonSearchBox,Avatar,StatusBadge,SelectedPersonBox}`, `pages/{PersonSearchPage,StatusPage}` | `routes.tsx` (guards) |
| F06 new-user Details/Projects/Review UI | `components/{Select,Toggle,ChipGroup,ProjectMultiSelect,FieldError,ReviewCard}`, `pages/{NewDetailsPage,NewProjectsPage,NewReviewPage}` | `requestStore.tsx` (selectors) |
| F07 new-user submit W1-W3 | `state/submitStore.tsx`, `components/Toast` | `NewReviewPage`, `data/payloads.ts` (if F03 left gaps), `routes.tsx` (lock guards) |
| F08 existing path + W4 + Success + reset | `pages/{ExistingProjectsPage,ExistingReviewPage,SuccessPage}`, `components/{Confetti,CheckDraw}` | `submitStore.tsx` (submitExisting, lastSubmission), `Header` (dirty confirm) |
| F09 help | `content/helpContent.ts`, `components/{HelpContent,HelpPanel}`, `pages/{HelpHomePage,HelpTopicPage}` | `Header`, `uiStore.tsx` (panel state) |
| F10 motion + polish | `hooks/{useReducedMotion,useScrolled}` | `theme/*.css`, component and page styles |
| F11 accessibility + copy | - | Labels, aria-live, focus order, copy fixes across pages/components; `.eslintrc` (jsx-a11y) |
| F12 review gate | `docs/REVIEW_GATE.md` (audit: filters/limits on every query, no forbidden writes, no hard-coded colors, no table changes) | Fixes found by the audit |
| F13 tests + handoff | `*.test.ts(x)` beside units (themeColors, queries, payloads, requestStore, submitStore runner, key pages), `vitest.config.ts`, `HANDOFF.md` | `package.json` (test script) |

## 8. Risks and open questions

1. **Generated names unknown.** Service/method names, result shape, and lookup navigation casing (`mpm_User` vs `mpm_user`) are unconfirmed until F03. F03 must stop if any section 5 column is missing or renamed.
2. **Theme "one query".** Spec asks for one query; the plan uses two parallel queries (definitions, then values) because expand isn't documented for generated services. If F03 finds expand support, switch to one.
3. **Project volume.** Both lists load up to 2000 rows and search in the browser. If Dev has more projects, the existing path needs server-side type-ahead like person search.
4. **Hash routing in the host.** Assumes browser Back works inside the Power Apps player iframe with hash URLs. Verify at the F05 checkpoint.
5. **W1 permission.** Users need write on `systemuser.mpm_onboard`; if Dev roles block it, F07 is blocked (spec forbids workarounds).
6. **Lost response on create.** If a create succeeds but the response is lost (timeout), Retry will create a duplicate row and a second flow run. The app can't detect this without an idempotency key; flows owners should be asked.
7. **Theme contrast.** Environment colors are arbitrary; white on Medium may fail AA. Auto-switch to dark text is planned and will be reported.
8. **Approvals and scope.** New packages need EA approval; confirm whether `@snl-business/ui` must be used instead. "F12 review gate" is interpreted as the hard-rules audit; confirm.
