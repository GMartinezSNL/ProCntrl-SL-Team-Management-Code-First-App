# Team Management (Code App)

Power Apps code app (React + TypeScript + Vite) replacing the Team Management canvas app.
Project managers submit onboarding requests; existing Dataverse row-event flows do the real work.
Full spec: docs/BUILD_SPEC.md. Read only the sections the current phase needs.
Design decisions: docs/ARCHITECTURE.md (read one numbered section at a time). Log: BUILD_LOG.md.

## Hard rules (every phase)
- Use ONLY the existing Dataverse tables in spec section 5. Never create, change, or delete tables,
  columns, relationships, choices, flows, or connectors.
- The app calls no flows. Flows fire on row events (spec section 9); writes and their order must match exactly.
- Never write to calculated or formula columns.
- Never load whole tables: filter on the server, select only needed columns, limit rows.
- Security comes from Dataverse security roles. Don't imitate it by hiding controls.
- No hard-coded brand colors: every color comes from the theme (spec section 7) plus neutrals.
- Choice values, limits, and feature flags live in ONE file: src/config.ts.
- Every input and button has an accessible label, tab order matches visual order, focus is always
  visible, layout works on phone and desktop.
- Never publish, push, or deploy. The user does that.
- One phase per session; stop at the end. If blocked, log it in BUILD_LOG.md and stop. Never work
  around a blocker by changing the data model or faking data.
- The user is a Power Fx developer: explain in plain language, give manual steps as numbered lists.

## Environment and tooling
- Node 22 LTS lives at `C:\Elevated\nodejs\node-v22.16.0-win-x64` (system `node` is v20; don't use it).
  Prefix each shell session: `$env:Path="C:\Elevated\nodejs\node-v22.16.0-win-x64;"+$env:Path`
- Corporate TLS inspection: set `$env:NODE_OPTIONS="--use-system-ca"` before any `pa` or `npm` network call.
- CLI: npm-based `pa` (@microsoft/power-apps-cli). Confirm flags with `pa <cmd> --help`; don't guess.
  Fallback `pac code` only if `pa` is unavailable, and say so. Never mix both CLIs.
- Environment: ProCntrl SL Dev, ID ac16980f-6941-e145-a546-bdb527021604 (in power.config.json).
- Add tables: `pa app add data-source --connector dataverse --table <logical name>`.
- Data access ONLY through generated models/services in src/generated (never edit them). No
  hand-written Web API calls or fetch().
- If sign-in is needed, tell the user and wait. Never handle credentials.
- Local run: `npm run dev`, then open the Local Play URL in the same browser profile used for Power Apps.
- Commands: `npm install` | `npm run dev` | `npm run build` (typecheck + build) | `npm run lint`.

## Token efficiency
- Read only the files this task needs. Don't scan the whole repo or reread files you already have.
- Search (grep) for symbols before opening files. In large files, open only the relevant sections.
- Don't open or print node_modules, dist, lock files, or src/generated unless the task requires it.
- Make targeted edits. Don't rewrite whole files or reformat code you didn't change.
- Run typecheck, lint, and build once after your edits. If they fail, show only the relevant error lines.
- Don't paste full files or long logs back. List each changed file with one line on what changed.
- Don't explain the code unless asked. Keep replies under 200 words plus the changed-file list.
- Ask before any step that's large, risky, or outside the stated scope.
- If the same error survives 2 attempts, stop and report the error, what you tried, and what you need.
- When done, add one BUILD_LOG.md row (task, model, outcome, blockers); remind the user to fill in tokens/cost.

## Git
- Commit messages start with the phase/feature ID (e.g. "Phase 1: ..."). Commit only when asked.
