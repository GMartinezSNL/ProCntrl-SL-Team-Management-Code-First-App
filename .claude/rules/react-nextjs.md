---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# React / TypeScript / Next.js — S&L standard (condensed from the JTR Standards)

Full standard, code examples, and tool-specific playbooks (TanStack Query, Forms + Zod, AG Grid,
DND Kit, PrimeReact theming): Coding-Standards repo, `JavaScript-TypeScript-React/` folder.

## New projects

New S&L React projects are scaffolded with **EnifCLI** (`npx create-enif my-project`), which
pre-configures ESLint, Prettier, Husky, and lint-staged with S&L rules already applied. If this
repo wasn't created that way, check `package.json`/config files before assuming defaults — don't
hand-roll config that EnifCLI would normally provide without checking first.

## Language and types

- TypeScript is mandatory for new projects. `strict` mode on in `tsconfig.json` (`noImplicitAny`,
  `strictNullChecks`, `strictFunctionTypes`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`, `esModuleInterop`, `skipLibCheck`).
- Avoid `any`; use `unknown` plus a type guard when a type is genuinely uncertain.
- Functional components + hooks by default — prefer composition over class inheritance.

## Naming

- `PascalCase`: components, interfaces/types (no `I` prefix), enums.
- `camelCase`: functions, variables, hooks. Acronyms stay capitalized (`fetchAPI`, `parseHTML`,
  `getHTTPHeaders` — not `fetchApi`).
- `ALL_CAPS`: constants. Booleans prefixed `is`/`has`/`should`/`can`.
- Files: components `PascalCase.tsx`, hooks/utils `camelCase.ts`, tests `Name.test.tsx`.

## Structure

Feature-based `src/`: `components/`, `features/`, `hooks/`, `services/`, `utils/`, `types/`,
`contexts/`. Each component gets its own folder: `Component.tsx` + `Component.test.tsx` + styles +
an `index.ts` barrel export.

## Size limit

The 70-line guideline applies to business logic only — hooks, handlers, state management. JSX
markup in the return statement is exempt and can run long; don't count it.

## Coding practices

- Early returns over nested conditionals. No nested ternaries — extract to a function instead.
- Destructure props and hook results. Prefer optional chaining (`?.`) and nullish coalescing (`??`)
  over manual null checks. Name non-trivial magic numbers/strings as constants.
- Always type props via an `interface`. Use a stable, unique `key` in lists — never the array
  index.
- `useMemo`/`useCallback` for expensive computations or handlers passed to memoized children.
  Lazy-load heavy components with `Suspense`. Implement error boundaries around risky subtrees.
- Use Context (or a state library) instead of deep prop drilling.

## Next.js specifics

- Routing is file-based (`app/` or `pages/` — check which this repo uses). Don't add manual route
  config on top of it.
- App Router: mark client-only code with `'use client'` at the top of the file; default to Server
  Components otherwise.
- Public env vars are prefixed `NEXT_PUBLIC_` in Next.js (vs `VITE_` in a Vite/React-Router repo —
  check `package.json` to know which stack this repo actually is).

## Formatting and linting

Prettier (`semi: true`, `singleQuote: true`, `tabWidth: 2`, `printWidth: 80`,
`trailingComma: "es5"`) and ESLint (`@typescript-eslint/no-explicit-any: error`,
`react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn`,
`no-console: warn` except `warn`/`error`) are both required and automated — don't hand-format or
relitigate a rule in review.

## Package manager

**npm only.** Never mix in yarn/pnpm without explicit project approval. Never delete
`package-lock.json` — commit it. Use `npm ci` in CI, not `npm install`.

## Dependencies and UI components

Check the internal `@snl-business/ui` component library before building a custom component or
installing an external UI library. Any new open-source dependency needs Enterprise Architecture
approval — flag it to me before adding one rather than installing it directly.

## Security

- Never `dangerouslySetInnerHTML` unless required and sanitized (e.g. DOMPurify).
- Auth tokens in httpOnly cookies, never `localStorage`. CSRF tokens + SameSite cookies for
  state-changing requests.
- Never commit secrets. Public-only env vars only, correctly prefixed for the framework in use.

## Testing

Vitest/Jest + React Testing Library, Arrange-Act-Assert. 80% coverage minimum on critical
features, 100% on utility/service functions. Every component gets at least a render test. Mock at
the network boundary (MSW) — not internal implementation details.

## Accessibility

WCAG 2.1 AA required. Prefer semantic HTML over `<div onClick>` + ARIA; add ARIA only when
semantic HTML isn't enough. Verify keyboard navigation, focus management on modals/dialogs, and
color contrast (4.5:1 normal text, 3:1 large text).

## Git

Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Branch names:
`feature/...`, `bugfix/...`, `hotfix/...`, `refactor/...`.
