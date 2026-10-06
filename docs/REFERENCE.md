# Team Management (Code App) — Verified Reference

Last researched: 2026-10-06

## Quick facts

- **Power Apps code apps:** Current documentation does not label the feature GA or Preview; treat lifecycle status as Unknown until Microsoft labels it. Build locally with React/Vite, the Power Apps client library, generated services, `power.config.json`, and the Power Apps host. [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) · Checked 2026-10-06
- **Environment enablement:** Dev must have the **Power Apps code apps** feature enabled in Power Platform admin center before `pa app init`. [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) · Checked 2026-10-06
- **CLI direction:** Use the npm-based `pa app` CLI. Classic `pac code` remains a fallback but is marked for future deprecation. [CLI reference](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli) · [pac code](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code) · Checked 2026-10-06
- **Dataverse data access:** `pa app add data-source --connector dataverse --table <table-logical-name>` generates typed models/services supporting CRUD, filter, sort, top, and paging. [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) · Checked 2026-10-06
- **Local play:** Open the `Local Play` URL in the same browser profile signed in to Power Apps. [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) · Checked 2026-10-06
- **Licensing:** End users need Power Apps Premium, pay-as-you-go, an App Pass, or auto-claim. [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) · Checked 2026-10-06
- **ALM:** Code apps can target a solution; Power Platform pipelines deploy managed solutions to non-development environments. [Code-app ALM](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/alm) · [Pipelines](https://learn.microsoft.com/en-us/power-platform/alm/pipelines) · Checked 2026-10-06
- **Claude session cost:** `/usage` shows session token and estimated cost detail; `/clear` resets session totals; `/compact` costs tokens because it summarizes context. [Costs](https://code.claude.com/docs/en/costs) · Checked 2026-10-06
- **Current Claude models:** Opus 5.5 is $4/$20 per MTok with 1M context and medium default effort; Sonnet 5.5 is $2/$10 with 1M context and high default effort; Haiku 4.5 is $1/$5 with 200K context. [Model configuration](https://code.claude.com/docs/en/model-config) · [Opus](https://platform.claude.com/docs/en/models/opus-5-5/overview) · [Sonnet](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) · [Haiku](https://platform.claude.com/docs/en/models/haiku-4-5/overview) · Checked 2026-10-06
- **MCP boundary:** Dataverse MCP supports Claude Code, but its current tool surface includes record writes and table/schema changes. Do not enable it for this build unless the client and tools are tightly allowlisted. [Dataverse MCP](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp) · [MCP configuration](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp-disable) · Checked 2026-10-06

## Contents

- [R1. Token efficiency in Claude Code](#r1-token-efficiency-in-claude-code)
- [R2. Claude Code project setup](#r2-claude-code-project-setup)
- [R3. Power Apps code apps](#r3-power-apps-code-apps)
- [R4. Dataverse structure and data access](#r4-dataverse-structure-and-data-access)
- [R5. Power Platform development](#r5-power-platform-development-general)
- [R6. Verify our assumptions](#r6-verify-our-assumptions)
- [R7. Recommended changes to our setup](#r7-recommended-changes-to-our-setup)

---

## R1. Token efficiency in Claude Code

### Summary

- Each request carries the system prompt, tool definitions, loaded project context, conversation history, and current tool results. Repeated history is the main cost driver in long sessions.
- Prompt caching lowers repeat-context cost: cache writes are charged at a higher rate and cache reads at a lower rate than normal input. Cache misses happen after expiry or prefix changes.
- Keep always-loaded instructions short. Put task-specific material in rules, skills, or explicitly read files.
- Use `/clear` for an unrelated feature, `/compact` only when continuity is valuable, and `/context` to see what is loaded.
- Measure with `/usage` for the current session, `ccusage` for local historical reports, OpenTelemetry for fleet attribution, and Console/Team reports for authoritative spend.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| The context includes system instructions, tool definitions, conversation history, tool inputs, and tool outputs. | Confirmed | [Agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) | 2026-10-06 |
| A long conversation resends its context each turn; prompt caching makes repeated context cheaper but does not make it free. | Confirmed | [Costs](https://code.claude.com/docs/en/costs) | 2026-10-06 |
| Cache layers include system prompt, project context, and conversation; changing loaded tools or rebuilding context can invalidate the cache. | Confirmed | [Prompt caching](https://code.claude.com/docs/en/prompt-caching) | 2026-10-06 |
| Opus 5.5 pricing is $4 input, $20 output, $5 5-minute cache write, $8 1-hour cache write, and $0.20 cache read per MTok. | Confirmed | [Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/overview) | 2026-10-06 |
| Sonnet 5.5 pricing is $2 input, $10 output, $2.50 5-minute cache write, $4 1-hour cache write, and $0.20 cache read per MTok. | Confirmed | [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) | 2026-10-06 |
| Haiku 4.5 pricing is $1 input, $5 output, $1.25 5-minute cache write, $2 1-hour cache write, and $0.10 cache read per MTok. | Confirmed | [Haiku 4.5](https://platform.claude.com/docs/en/models/haiku-4-5/overview) | 2026-10-06 |
| `/usage` shows session token detail and local estimated cost; authoritative billing is in the Console or organization report. | Confirmed | [Costs](https://code.claude.com/docs/en/costs) | 2026-10-06 |
| `/clear` starts a fresh context and resets session totals; `/compact` summarizes the existing context and consumes tokens. | Confirmed | [Costs](https://code.claude.com/docs/en/costs) · [Commands](https://code.claude.com/docs/en/commands) | 2026-10-06 |
| `/context` shows live context categories and optimization suggestions, including loaded instruction files. | Confirmed | [Context window](https://code.claude.com/docs/en/context-window) | 2026-10-06 |
| `opusplan` uses Opus in plan mode and Sonnet in execution mode. | Confirmed | [Model configuration](https://code.claude.com/docs/en/model-config) | 2026-10-06 |
| Skill/subagent effort can override the session effort; `CLAUDE_CODE_SUBAGENT_MODEL` sets the default subagent model. | Confirmed | [Model configuration](https://code.claude.com/docs/en/model-config) | 2026-10-06 |
| Opus 5.5 defaults to medium effort; Sonnet 5.5 defaults to high; Haiku 4.5 has no Claude Code effort setting. | Confirmed | [Model configuration](https://code.claude.com/docs/en/model-config) · [Model pages](https://platform.claude.com/docs/en/models/opus-5-5/overview) | 2026-10-06 |
| Status lines can display estimated cost, model, context percentage, cache fields, and rate limits. | Confirmed | [Status line](https://code.claude.com/docs/en/statusline) | 2026-10-06 |
| OpenTelemetry exposes token and cost metrics with model, session, skill, plugin, and agent dimensions. | Confirmed | [Monitoring](https://code.claude.com/docs/en/monitoring-usage) | 2026-10-06 |
| Team/Enterprise reports and Console reports are different sources: seat allowances for Team/Enterprise versus token billing for Console/API access. | Confirmed | [Costs](https://code.claude.com/docs/en/costs) | 2026-10-06 |
| `ccusage` is a community tool that parses local Claude Code logs and reports daily, session, and model usage. | Confirmed — Community | [ccusage](https://github.com/ryoppippi/ccusage) | 2026-10-06 |
| Subagent tokens are not included in the main conversation prompt-cache line; use model or agent attribution for a full task total. | Confirmed | [Costs](https://code.claude.com/docs/en/costs) · [Agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) | 2026-10-06 |
| Hooks that run shell checks do not inherently require another model call; their output can still add tool-result tokens if returned to Claude. | Confirmed | [Hooks](https://code.claude.com/docs/en/hooks) | 2026-10-06 |

### Current model reference

| Alias/model | Context | Default effort | Input/output per MTok | Cache read | Cache write | Retirement | Status/source |
|---|---:|---|---:|---:|---:|---|---|
| `opus` / Opus 5.5 | 1M | medium | $4 / $20 | $0.20 | $5 (5m), $8 (1h) | Not sooner than 2027-09-22 | Active/latest · [model page](https://platform.claude.com/docs/en/models/opus-5-5/overview) |
| `sonnet` / Sonnet 5.5 | 1M | high | $2 / $10 | $0.20 | $2.50 (5m), $4 (1h) | Not sooner than 2027-09-28 | Active/latest · [model page](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) |
| `haiku` / Haiku 4.5 | 200K | Not supported | $1 / $5 | $0.10 | $1.25 (5m), $2 (1h) | Not sooner than 2026-10-15 | Active/latest · [model page](https://platform.claude.com/docs/en/models/haiku-4-5/overview) |
| `fable` / Fable 5.1 | 1M | high | $10 / $50 | $0.25 | $12.50 (5m), $20 (1h) | Not stated in page reviewed | Active/latest · [model page](https://platform.claude.com/docs/en/models/fable-5-1/overview) |

### Do

- Keep `CLAUDE.md` under the planned 80 lines and restrict it to rules every F01–F13 session needs.
- Put detailed Power Fx-to-React explanations in `docs/BUILD_SPEC.md` or `docs/ARCHITECTURE.md`, then mention only those paths in `CLAUDE.md`.
- Start each feature in a fresh session; use `/clear` only when staying in the same process is useful.
- Run `/context` at the start of a new feature and record loaded files in the build log.
- Use `/compact` before a long review only when preserving the current reasoning is worth the summarization cost.
- Use Opus for architecture, data access, writes, and review; Sonnet for page implementation; Haiku for short documentation.
- Use `@file` for a known small file; use search or targeted reads for unknown locations.
- Capture model, session ID, task, input/output/cache tokens, and estimated cost per feature.

### Don’t

- Don’t paste generated services, `node_modules`, build output, or full logs into prompts.
- Don’t read the whole repository when a targeted search or named file answers the question.
- Don’t assume a cache hit means zero input cost.
- Don’t switch models casually in a long session; a model switch can lose the current model’s prompt cache.
- Don’t use `/compact` as a substitute for starting a clean session for a new feature.
- Don’t rely on `/usage` as the billing ledger.
- Don’t mix the main feature’s tokens with unrelated experiments in the same session.
- Don’t launch parallel subagents for this pilot unless their cost is explicitly part of the task budget.

### Commands or settings

Verified command names:

```text
/usage
/context
/clear
/compact
/model opusplan
/effort medium
```

Verified model aliases and cost-oriented settings:

```text
opus
sonnet
haiku
opusplan
CLAUDE_CODE_SUBAGENT_MODEL
```

A verified status-line data source includes these fields:

```text
cost.total_cost_usd
context_window.used_percentage
prompt_cache.hit_ratio
model.display_name
```

### Common token wasters in this build

- Re-reading the same generated service after every page session.
- Asking Claude to rediscover table and column names that belong in `BUILD_SPEC.md`.
- Returning full npm, Vite, or browser logs when the first error is sufficient.
- Searching `node_modules` or `dist` instead of using source files and package metadata.
- Loading every page component for a localized visual change.
- Keeping a data-layer debugging conversation open while implementing unrelated pages.
- Repeating the same schema explanation in prompts instead of linking the authoritative project doc.
- Using Opus for routine copy, styling, or documentation edits.
- Using Haiku for cross-table write design or security review.
- Running speculative MCP calls when generated services or metadata already answer the question.
- Switching models mid-session and forfeiting the warm prefix cache.
- Compaction after the context is already too large to summarize cheaply.
- Leaving typecheck/lint output unbounded in a PostToolUse hook.
- Running parallel agents whose outputs must all be read and reconciled.
- Mixing the build log, implementation, and research in one session.

### Applies to Team Management

- Treat each F01–F13 session as the accounting boundary; do not combine pages, data layer, and review work in one session.
- Use Opus 5.5 for the generated-service/data-layer contract and W1–W4 write review; use Sonnet 5.5 for page work; use Haiku 4.5 only for concise docs.
- Keep `CLAUDE.md` as a pointer file to `docs/BUILD_SPEC.md` and `docs/ARCHITECTURE.md`; do not embed the full table/column inventory there.
- Log `/usage` before ending each session, then reconcile the local log with `ccusage` by session and model.
- Treat cache writes and cache reads as separate fields in the build log; they matter when a long review is resumed.

### Open questions

- Which authenticated Claude surface will be used for the pilot: Team/Enterprise seat usage or Console/API billing?
- Should the build log use one status-line format across all Windows sessions?
- What retention setting is needed if the pilot must be auditable beyond the default local-log retention period?

---

## R2. Claude Code project setup

### Summary

- `CLAUDE.md` is persistent project guidance; `CLAUDE.local.md` is local guidance and should remain uncommitted.
- `.claude/settings.json` is the shared project settings file for permissions, hooks, plugins, and project environment values.
- `.claude/rules/` provides reusable or path-scoped rules; `.claude/commands/` provides custom slash commands. Use skills/rules for detailed workflows instead of bloating `CLAUDE.md`.
- Plan mode, checkpoints/rewind, commits, branches/worktrees, and hooks improve control; they do not remove the need for human review.
- On Windows, install the current native Claude Code, Git for Windows, Node.js LTS, npm, and the npm Power Apps CLI. Keep publish commands human-only.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| Root `CLAUDE.md` and `CLAUDE.local.md` are loaded at session start when their setting source is enabled; nested files load on demand. | Confirmed | [Memory](https://code.claude.com/docs/en/memory) | 2026-10-06 |
| `CLAUDE.md` is context, not an enforcement boundary; use hooks or permissions for mandatory behavior. | Confirmed | [Memory](https://code.claude.com/docs/en/memory) · [Features](https://code.claude.com/docs/en/features-overview) | 2026-10-06 |
| Shorter `CLAUDE.md` files improve adherence; task-specific content belongs in rules or skills. | Confirmed | [Best practices](https://code.claude.com/docs/en/best-practices) | 2026-10-06 |
| `.claude/settings.json` is shared project configuration; `.claude/settings.local.json` is personal and normally gitignored. | Confirmed | [Settings](https://code.claude.com/docs/en/settings) | 2026-10-06 |
| Permission rules support `allow`, `ask`, and `deny`; deny rules are evaluated before allow rules. | Confirmed | [Settings](https://code.claude.com/docs/en/settings) | 2026-10-06 |
| Read-deny rules can exclude `.env`, secrets, credentials, and build folders; Bash rules can block destructive or network commands. | Confirmed | [Settings](https://code.claude.com/docs/en/settings) | 2026-10-06 |
| Hooks run on events such as `PreToolUse`, `PostToolUse`, and `PostToolUseFailure`; async hooks are supported. | Confirmed | [Hooks](https://code.claude.com/docs/en/hooks) | 2026-10-06 |
| A hook command can run PowerShell on Windows by setting its shell to `powershell`. | Confirmed | [Hooks](https://code.claude.com/docs/en/hooks) | 2026-10-06 |
| `/cost` and `/stats` were merged into `/usage`; old names remain shortcuts to the relevant tab. | Changed | [Changelog](https://code.claude.com/docs/en/whats-new/2026-w17) | 2026-10-06 |
| Plan mode is a workflow choice; it does not automatically make a change safe. | Confirmed | [Commands](https://code.claude.com/docs/en/commands) | 2026-10-06 |
| The official Power Apps quickstart requires Node.js LTS and Git. | Confirmed | [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) | 2026-10-06 |
| Dataverse MCP requires the environment feature and explicit allowed-client configuration for Claude Code. | Confirmed | [MCP configuration](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp-disable) | 2026-10-06 |
| Dataverse MCP current tools include `create_record`, `update_record`, `create_table`, `update_table`, and delete operations. | Confirmed | [MCP tools](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp) | 2026-10-06 |
| Code apps publish with `pa app push`; no AI session should run this for Team Management. | Confirmed | [CLI reference](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli) | 2026-10-06 |

### Do

- Commit `CLAUDE.md`, `.claude/settings.json`, shared rules, and shared commands only after reviewing them as team policy.
- Keep `CLAUDE.local.md` for personal paths, credentials-adjacent notes, and temporary experiments.
- Add deny rules for `.env*`, secrets, credentials, `node_modules`, `dist`, and `src/generated` when the task does not require reading them.
- Add explicit deny or ask rules for `pa app push`, `pac code push`, publish, delete, reset, and destructive Git commands.
- Add a small PostToolUse hook for `npm run typecheck` or `npm run lint` after source edits, preferably with concise output and an async mode if latency matters.
- Use one branch or worktree per feature, with a human-reviewed commit per F01–F13 feature.
- Use plan mode for architecture/data-layer/writes and checkpoints before broad edits.
- Use a dedicated, read-only metadata workflow if Dataverse MCP is enabled.

### Don’t

- Don’t put secrets, tenant tokens, environment URLs containing credentials, or personal overrides in committed files.
- Don’t treat a permission allow rule as a substitute for code review.
- Don’t allow the AI to run Power Apps publish or pipeline commands.
- Don’t run destructive commands in `PreToolUse` hooks unless the hook is itself reviewed and tested.
- Don’t add a broad MCP server to the project without reviewing every tool it exposes.
- Don’t assume a `.claude/commands` file can change the model unless the current command documentation explicitly supports that field.
- Don’t make `CLAUDE.local.md` the only place a project rule exists.
- Don’t use Windows path strings interchangeably between PowerShell, Git Bash, and JSON without testing the exact command.

### Commands or settings

Verified shared-settings syntax for excluding sensitive files and allowing safe checks:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./build)"
    ]
  }
}
```

Verified hook shape for a source-edit check:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint"
          }
        ]
      }
    ]
  }
}
```

### Applies to Team Management

- Put only the non-negotiable build rules, Dev-only boundary, no-schema-change rule, and doc pointers in `CLAUDE.md`.
- Put the detailed logical-name inventory and W1–W4 write contract in `docs/BUILD_SPEC.md` and `docs/ARCHITECTURE.md`.
- Deny `src/generated` only in page-only sessions; allow Opus data-layer sessions to read it because generated types are the source of truth for data access.
- Deny `pa app push`, `pac code push`, and any publish/pipeline command in the shared project settings.
- Use a PostToolUse hook for typecheck/lint, but have it emit only the failing command and concise diagnostics.
- Keep MCP disabled for the pilot by default; if enabled later, allow metadata/read tools only and keep schema/write tools denied.

### Open questions

- Which exact TypeScript check is the repository standard: `npm run typecheck`, `npm run build`, or both?
- Will the pilot use branches or Git worktrees for F01–F13?
- Which Windows shell is the supported operator path for the build log: PowerShell, Git Bash, or both?

---

## R3. Power Apps code apps

### Summary

- A code app is a code-first SPA hosted and authenticated by Power Apps. The app code uses the Power Apps client library; the host handles authentication and runtime loading.
- `power.config.json` holds connection and publish metadata. Generated models/services are created when data sources are added.
- The current npm CLI is `@microsoft/power-apps-cli` with `pa app ...`; `pac code` is the older fallback and is planned for deprecation.
- Dataverse data sources provide typed CRUD, delegated filter/sort/top, and paging. Use generated services rather than hand-building Web API calls for normal app data access.
- Code apps are Premium-capable Power Apps assets, subject to Power Platform governance, Conditional Access, DLP, sharing, and solution/ALM constraints.

### Feature status

| Feature | Lifecycle status | Evidence | Checked |
|---|---|---|---|
| Power Apps code apps | Unknown | Current overview and limitations pages do not label the feature GA or Preview. | 2026-10-06 |
| npm `pa app` CLI | Unknown | Current CLI reference documents the command family and release surface. | 2026-10-06 |
| Classic `pac code` | Deprecated | The command reference says it will be deprecated in a future release. | 2026-10-06 |
| Dataverse MCP for Claude Code | Unknown | Microsoft documents Claude Code connectivity and a current tool surface; no GA/Preview label was found in the page reviewed. | 2026-10-06 |
| Power Platform Git integration for code apps | Unknown | Code-app limitations say code apps do not support Power Platform Git integration today. | 2026-10-06 |

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| Code apps are custom web apps built with code-first IDEs such as VS Code and frameworks such as React and Vue. | Confirmed | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| The runtime has three logical parts: app code, the Power Apps client library, and the Power Apps host. | Confirmed | [Architecture](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture) | 2026-10-06 |
| `power.config.json` contains metadata used by the client library and CLI for connections and publishing. | Confirmed | [Architecture](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture) | 2026-10-06 |
| Dataverse data sources generate models/services under `src/generated/services` in the current docs. | Confirmed | [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| Dataverse generated services support create, retrieve, retrieve-multiple, update, delete, filter, sort, top, and paging. | Confirmed | [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| Filter, sort, top, and paging are delegated by the generated Dataverse service; the exact supported expression surface is still connector-specific. | Confirmed | [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| The npm CLI installs with `@microsoft/power-apps-cli` and `@microsoft/power-apps`. | Confirmed | [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) | 2026-10-06 |
| `pa app init`, `pa app run`, `pa app push`, and `pa app add data-source` are current commands. | Confirmed | [CLI reference](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli) | 2026-10-06 |
| `pac code` is the older command group and will be deprecated in a future release; it remains a fallback today. | Confirmed — Deprecated path | [pac code](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code) | 2026-10-06 |
| Node.js LTS and Git are prerequisites; the docs do not pin one exact Node major version for code apps. | Confirmed; exact version Unverified | [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) | 2026-10-06 |
| End users need Power Apps Premium, pay-as-you-go, App Pass, or auto-claim to run code apps. | Confirmed | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| Code apps are enabled per environment in admin center under Settings > Product > Features. | Confirmed | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| The local play URL must be opened in the same browser profile used for Power Apps authentication. | Confirmed | [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) | 2026-10-06 |
| Code app assets are hosted on a publicly accessible endpoint; use Conditional Access for location/IP controls because IP-based restrictions are not currently supported there. | Confirmed | [System configuration](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/system-limits-configuration) | 2026-10-06 |
| Code apps can use solution-aware connection references and can be added to a solution for ALM. | Confirmed | [Connect to data](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-data) · [Code-app ALM](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/alm) | 2026-10-06 |
| Code-app ALM docs say source-code integration and solution packager support are currently limited/not supported in the code-app workflow. | Confirmed limitation | [Code-app ALM](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/alm) | 2026-10-06 |
| Official samples/templates are in the Microsoft `PowerAppsCodeApps` repository. | Confirmed | [PowerAppsCodeApps](https://github.com/microsoft/PowerAppsCodeApps) | 2026-10-06 |
| A code app does not call a flow unless a supported solution-aware instant flow is explicitly added; existing Dataverse row-event flows can run independently. | Confirmed | [Add flows](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/add-flows) | 2026-10-06 |

### Do

- Use the npm CLI as the primary path and keep `pac code` only as a fallback.
- Treat generated models/services as the connector contract and import them into React data-access modules.
- Use `select`, `filter`, `orderBy`, `top`, and paging options to keep type-ahead and list reads bounded.
- Build locally with `pa app run`; use `Local Play` with the signed-in browser profile.
- Use `npm run build` before any human-controlled publish action.
- Add the app and environment-aware connection references to the intended solution.
- Test in the Dev environment only during this AI-assisted build.
- Use Microsoft samples when checking current CLI and generated-service patterns.

### Don’t

- Don’t use `pac code` as the primary implementation path for new work.
- Don’t hand-edit generated service files or treat them as a stable custom abstraction.
- Don’t call Power Automate from this app; W1–W4 are direct Dataverse writes and existing flows react to row events.
- Don’t publish from Claude Code.
- Don’t assume a generic Web API sample exactly matches generated-service method names.
- Don’t hard-code environment-specific connection IDs or theme values.
- Don’t expose a broad data source when a narrow table/column projection is enough.
- Don’t assume local success proves published-host success; test both when the human publishes.

### Commands or settings

Install the current npm CLI and client library:

```powershell
npm install --global @microsoft/power-apps-cli
npm install --global @microsoft/power-apps
npm install
```

Initialize and connect the app:

```powershell
pa app init --display-name "Team Management (Code App)" --environment-id <environment-id>
pa app add data-source --connector dataverse --table <table-logical-name>
```

Run and build locally:

```powershell
pa app run
npm run build
```

Human-controlled publish only:

```powershell
pa app push
```

Fallback command family:

```powershell
pac code init
pac code run
pac code push
```

### Applies to Team Management

- Initialize against Dev environment `procntrlsldev`; do not target Test during AI sessions.
- Add exactly the stated tables as data sources, using logical names and no schema changes.
- Keep generated files in `src/generated`; wrap them with small app-owned data-access functions rather than duplicating Web API logic.
- Implement W1 as a systemuser update and W2–W4 as create-only request rows; do not add a flow connector.
- Use environment variable tables for theme colors and resolve current value before default value.
- Have the human run `pa app push` after review; the AI may run build/typecheck but never publish.

### Open questions

- What exact npm package versions will be pinned in the repository lockfile?
- Does the generated service expose lookup binding through a typed field or an OData annotation field in this version?
- Which solution should receive the code app and connection references in Dev?

---

## R4. Dataverse structure and data access

### Summary

- Dataverse distinguishes display name, schema name, logical name, and entity set name. Generated code and OData filters use logical names; lookup navigation properties are case-sensitive metadata names.
- Lookup values are represented through single-valued navigation properties and `_name_value` lookup properties. Resolve exact navigation names from metadata, not from guesses.
- Choices are integer-backed option values; yes/no columns are boolean values. Formatted labels are annotations and should not replace raw values in writes.
- Environment variable definitions hold keys/defaults; values hold current values. Current value wins over default value.
- Dataverse security, row-event triggers, and service-protection limits remain server-side concerns even when the UI is React.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| `systemuser` is the standard User table, entity set `systemusers`, primary key `systemuserid`, and primary name `fullname`. | Confirmed | [SystemUser reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/systemuser) | 2026-10-06 |
| `systemuser` includes disabled users, access mode, integration-user indicators, licensing fields, and directory/email fields. | Confirmed | [SystemUser reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/systemuser) | 2026-10-06 |
| `IsDisabled=false` means enabled; access mode values include Read-Write, Administrative, Read, Support User, Non-interactive, and Delegated Admin. | Confirmed | [SystemUser reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/systemuser) | 2026-10-06 |
| A lookup `_name_value` field holds the related GUID; associated-navigation annotations identify the exact single-valued navigation property. | Confirmed | [Select columns](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/select-columns) · [Multi-table lookups](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/multitable-lookup) | 2026-10-06 |
| Navigation-property casing matters; use `$metadata`, relationship metadata, or `associatednavigationproperty` rather than deriving casing. | Confirmed | [Associate entities](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api) · [Multi-table lookups](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/multitable-lookup) | 2026-10-06 |
| `$select` reduces payload; `$filter`, `$orderby`, `$top`, and paging are server-side OData query concepts. | Confirmed | [Select columns](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/select-columns) · [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| The generated Dataverse service exposes `select`, `filter`, `orderBy`, `top`, `skip`, and `skipToken` options. | Confirmed | [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| Choices are integer-backed; use the generated model’s numeric value for writes and a formatted label only for display. | Confirmed | [Choice column reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview) | 2026-10-06 |
| Boolean/yes-no values are represented as boolean values in Dataverse/Web API payloads. | Confirmed | [Web API query overview](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview) | 2026-10-06 |
| Calculated and formula columns are read-only from the app’s write perspective; do not include them in create/update payloads. | Confirmed | [Calculated columns](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-edit-calculated-fields) | 2026-10-06 |
| `environmentvariabledefinition.defaultvalue` is used when there is no associated current value; a defined current value wins. | Confirmed | [Environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables) | 2026-10-06 |
| `environmentvariablevalue.value` stores the actual current data and is related to the definition table. | Confirmed | [Environment variable value reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/environmentvariablevalue) | 2026-10-06 |
| Environment variable definitions belong in a solution; current values should be supplied per target environment rather than committed as the portable definition. | Confirmed | [Environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables) | 2026-10-06 |
| A Dataverse row trigger runs when its configured create/update/delete event occurs; trigger conditions and filter rows can narrow runs. | Confirmed | [Dataverse trigger](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger) | 2026-10-06 |
| Two request rows created by the app are two independent row events; W3 with two projects can start two row-triggered flow runs. | Confirmed | [Dataverse trigger](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger) | 2026-10-06 |
| Repeated submits, retries, or updating the same row again can create duplicate downstream work unless the app and flow are idempotent. | Confirmed | [Dataverse trigger](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger) | 2026-10-06 |
| Dataverse service-protection limits can return throttling; clients should reduce concurrency and honor retry guidance. | Confirmed | [Service protection API limits](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits) | 2026-10-06 |
| A type-ahead people search should use a bounded `$select`, a narrow filter, a small page/top, and debounce; do not fetch all `systemuser` rows. | Recommended | [Service protection API limits](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits) · [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) | 2026-10-06 |
| Minimum privileges for this app cannot be inferred from table names alone; they depend on row ownership, business units, teams, and column security. | Confirmed | [Security concepts](https://learn.microsoft.com/en-us/power-platform/admin/wp-security) | 2026-10-06 |

### Do

- Use logical table/column names in generated-service queries and confirm each generated type before coding.
- Resolve lookup navigation-property names from generated metadata or Dataverse metadata, preserving case.
- Add `$select`-equivalent projections for all lists and people searches.
- Filter real people with `IsDisabled=false` and a project-approved access-mode/integration-user policy.
- Treat W1 as an update and W2–W4 as separate creates with explicit success/error handling.
- Make submit buttons single-flight: disable while pending and do not retry a successful create blindly.
- Test row-event flows with one-row and multi-row submissions.
- Keep environment-variable definitions portable and current values environment-specific.

### Don’t

- Don’t use display names where generated code expects logical names.
- Don’t guess `mpm_User` versus `mpm_user` navigation-property casing.
- Don’t patch calculated/formula columns.
- Don’t use formatted labels as write values.
- Don’t load all system users for a ComboBox/type-ahead.
- Don’t assume a row trigger batches multiple created rows into one run.
- Don’t rely on client-side filtering for a large people table.
- Don’t grant broad create/update/delete privileges just because the app reads a table.

### Commands or settings

Metadata request patterns below are verified Web API patterns; use them for investigation, not as a replacement for generated services in the app:

```text
GET [Organization URI]/api/data/v9.2/$metadata
GET [Organization URI]/api/data/v9.2/systemusers?$select=systemuserid,fullname,internalemailaddress,isdisabled,accessmode&$filter=isdisabled eq false&$top=25
```

Verified lookup association pattern:

```json
{
  "<navigation-property>@odata.bind": "/<target-entity-set>(<guid>)"
}
```

### Applies to Team Management

- Read `systemuser` as a people lookup, not as an unrestricted directory; exclude disabled users and follow the approved application/integration-user rule.
- Add lookup metadata checks for request lookups to `systemuser`, `cre9c_project`, `mpm_role`, and `mpm_discipline` before implementing W2–W4.
- Test exact navigation casing for every lookup; do not assume display/schema/logical names are interchangeable.
- Read theme colors from `environmentvariabledefinition` and related `environmentvariablevalue`, using current value first and default second.
- Treat W2–W4 as independent row creations and verify expected flow-run counts after a multi-project request.
- Implement bounded people/project/role/discipline searches with debounce, `$select`, filter, top, and paging.

### Data-access checklist

1. Confirm the table logical name and generated entity type.
2. Confirm the primary key and entity-set name.
3. Confirm every lookup navigation property from generated code or metadata.
4. Confirm choice option integers and yes/no boolean shape.
5. Confirm which columns are calculated, formula, or otherwise read-only.
6. Define the smallest `$select` projection for the screen.
7. Define the server-side filter and sort.
8. Define the page size and continuation behavior.
9. Debounce type-ahead input before issuing a request.
10. Cancel or ignore stale responses when the search text changes.
11. Disable submit while a write is pending.
12. Record the Dataverse row ID returned by each create.
13. Do not retry a create without an idempotency decision.
14. Refresh only the affected view after a successful write.
15. Verify the corresponding flow run separately from the app response.
16. Capture correlation IDs or error details without exposing secrets.

### Open questions

- What are the exact generated navigation-property names for the four request-table lookups in Dev?
- Which security role/team grants the minimum read/write privileges for W1–W4?
- What is the exact flow trigger filter/scope for each existing row-event flow?

---

## R5. Power Platform development (general)

### Summary

- Use unmanaged solutions for development and managed solutions for Test/UAT/Production; pipelines should move the managed artifact.
- Environment variables and connection references are the portability boundary between Dev and Test.
- Code apps are a good fit for custom, responsive, code-first UI; canvas remains faster for low-code forms, and model-driven apps remain strong for Dataverse-centric CRUD and security.
- Apply normal web accessibility/performance practices plus Power Platform governance: DLP, Conditional Access, sharing limits, managed environments, and least privilege.
- Treat Power Platform Checker as the closest solution-level static-analysis equivalent; pair it with TypeScript checks and browser tests such as Playwright.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| Unmanaged solutions are for development; managed solutions are the deployment artifact for non-development environments. | Confirmed | [Solution concepts](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm) | 2026-10-06 |
| Pipelines validate and deploy solutions and can provide connection/environment-variable configuration before deployment. | Confirmed | [Pipelines](https://learn.microsoft.com/en-us/power-platform/alm/pipelines) | 2026-10-06 |
| Environment variables and connection references make deployments environment-aware. | Confirmed | [Build tools](https://learn.microsoft.com/en-us/power-platform/alm/conn-ref-env-variables-build-tools) | 2026-10-06 |
| Native Git integration is available for Dataverse solutions; use it in development environments, not Test/Production. | Confirmed | [Git integration](https://learn.microsoft.com/en-us/power-platform/alm/git-integration/overview) | 2026-10-06 |
| Current code-app ALM documentation says code apps do not support source-code integration or solution packager in the code-app workflow. | Confirmed limitation | [Code-app ALM](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/alm) | 2026-10-06 |
| Code apps inherit Microsoft Entra authentication/authorization, Conditional Access, DLP, sharing, and managed-platform policies. | Confirmed | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| Managed environments provide governance/insights but have licensing implications; Developer Plan is not an entitlement for running assets in a managed environment. | Confirmed | [Managed environments](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview) · [Licensing](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing) | 2026-10-06 |
| Power Platform Checker can statically analyze managed or unmanaged solution ZIP files in build tooling. | Confirmed | [Build tools checker](https://learn.microsoft.com/en-us/power-platform/alm/devops-build-tool-tasks) | 2026-10-06 |
| A code-app-specific “Solution Checker equivalent” is not documented; use Power Platform Checker plus TypeScript/lint/build and browser tests. | Unverified product equivalence; recommendation confirmed | [Build tools checker](https://learn.microsoft.com/en-us/power-platform/alm/devops-build-tool-tasks) | 2026-10-06 |
| WCAG 2.1 AA is a suitable project accessibility target, but the code-app docs do not certify the generated app as compliant. | Recommended; product certification Unverified | [WCAG 2.1](https://www.w3.org/TR/WCAG21/) | 2026-10-06 |
| Playwright can provide browser-level regression coverage; Power Apps Test Engine is a separate Power Apps testing option and should not be assumed to understand arbitrary React internals. | Recommended; exact code-app coverage Unverified | [Playwright](https://playwright.dev/docs/intro) · [Power Apps Test Engine](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/test-engine) | 2026-10-06 |
| The 2026 release-wave material highlights Dataverse APIs, MCP, Python SDK, Git integration, governance, and AI features; verify monthly because these surfaces change quickly. | Confirmed | [2026 wave 1 overview](https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/) · [June update](https://www.microsoft.com/en-us/power-platform/blog/2026/06/11/whats-new-in-power-platform-june-2026-feature-update/) | 2026-10-06 |
| The current CoE guidance is shifting toward admin-center governance capabilities; use the CoE Starter Kit only where it fills a tenant-specific gap. | Changed direction | [Governance](https://learn.microsoft.com/en-us/power-platform/admin/governance-considerations) · [June update](https://www.microsoft.com/en-us/power-platform/blog/2026/06/11/whats-new-in-power-platform-june-2026-feature-update/) | 2026-10-06 |
| DLP and Conditional Access remain policy controls around connectors and access, not substitutes for Dataverse row/column privileges. | Confirmed | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) · [Security governance](https://learn.microsoft.com/en-us/power-platform/admin/governance-considerations) | 2026-10-06 |

### Do

- Develop in Dev with an unmanaged solution and deploy a managed solution to Test through the company standard.
- Keep environment-specific theme values in environment variables and connection details in connection references.
- Run TypeScript typecheck, lint, build, browser smoke tests, and solution-level checker before human publish.
- Test keyboard navigation, focus order, labels, contrast, errors, loading states, and responsive layouts against WCAG 2.1 AA criteria.
- Use server-side filtering and bounded projections for Dataverse lists.
- Use feature flags or explicit user-facing error states for incomplete configuration.
- Review DLP/Conditional Access/sharing before Test promotion.
- Keep a build log that records feature, model, tokens, cost, test result, and human publish decision.

### Don’t

- Don’t treat Dev success as proof that Test configuration is correct.
- Don’t deploy unmanaged solutions to Test.
- Don’t hard-code Test/Prod IDs, URLs, or theme colors into React.
- Don’t assume Solution Checker catches React/TypeScript defects.
- Don’t call Power Apps Test Engine a full substitute for Playwright/browser tests without validating coverage.
- Don’t enable a tenant-wide governance feature only because the pilot uses code apps.
- Don’t let a code app bypass Dataverse security because the UI is custom.
- Don’t add new schema components when the Team Management build is explicitly no-schema-change.

### Commands or settings

Verified pipeline/solution concepts:

```text
Development: unmanaged solution
Test/UAT/Production: managed solution
Deployment boundary: environment variables + connection references
```

Verified Power Platform Checker build-tool shape:

```yaml
- task: microsoft-IsvExpTools.PowerPlatform-BuildTools.checker.PowerPlatformChecker@2
  inputs:
    FilesToAnalyze: '**\\*.zip'
```

### Applies to Team Management

- Keep `procntrlsldev` as the only AI-targeted environment; promotion to Test stays a human/company-standard action.
- Add the code app to the existing solution strategy without changing the seven stated tables or their schema.
- Use the existing row-event flows as external consumers of W1–W4; test them after app writes instead of adding a flow connector.
- Require a Playwright-style browser smoke test for people/project lookups, W1, W2–W4, duplicate-submit prevention, and error recovery.
- Add Power Platform Checker to the human promotion checklist, while relying on TypeScript/lint/build for React defects.
- Track the 2026 MCP/CLI/code-app changes as monthly documentation refresh items.

### Suggested human promotion gate

1. Confirm the commit contains only the intended feature and generated-service changes.
2. Run dependency installation from the lockfile.
3. Run typecheck and lint.
4. Run the production build.
5. Run the local browser smoke suite.
6. Confirm Dev-only environment targeting.
7. Confirm no schema or solution-component drift.
8. Confirm W1 and W2–W4 write payloads against generated types.
9. Confirm lookup, choice, boolean, and environment-variable behavior.
10. Confirm expected row-event flow-run counts.
11. Run Power Platform Checker on the solution artifact when available.
12. Review accessibility failures and unresolved warnings.
13. Record model, tokens, cost, and test evidence.
14. Human approves the publish/pipeline action.
15. Human verifies Test behavior after promotion.

### Open questions

- Is `procntrlsldev` managed, and if so, which managed-environment settings are enabled?
- Which CI system will run TypeScript/lint/build and Power Platform Checker?
- What browser matrix is required for the pilot and Test promotion?

---

## R6. Verify our assumptions

### Summary

- Nine claims are confirmed as written.
- Four claims need wording changes; none are outright wrong.
- The biggest changes are the `pac code` retirement wording, generated-service path wording, `/cost` terminology, and `ccusage` status.
- Lookup binding is confirmed at the Web API level but still needs a generated-service check in Dev.
- Model pricing and retirement dates are valid only as of the checked date.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| The current reference has 13 explicitly verified claims, with 9 Confirmed, 4 Changed, 0 Wrong, and 0 Unverified. | Confirmed | Sources in the R6 verification table below | 2026-10-06 |
| Changed claims should be updated in the project instructions before the first feature session. | Recommended | R6 verification table below | 2026-10-06 |

| Claim | Verdict | Correct version | Source | Checked |
|---|---|---|---|---|
| 1. Code apps must be turned on per environment in the Power Platform admin center (Settings > Product > Features > Enable code apps). | Confirmed | Enable the **Power Apps code apps** feature per environment under Settings > Product > Features. | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| 2. The npm CLI commands are `pa app init --display-name <name> --environment-id <id>` and `pa app add data-source --connector dataverse --table <logical name>`. `pac code` is being retired. | Changed | The commands are current. `pac code` is still available as fallback but is marked for future deprecation, not already retired. | [CLI reference](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli) · [pac code](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code) | 2026-10-06 |
| 3. Generated models and services go in `src/generated`, and data access should only go through them. | Changed | Current Dataverse docs say generated functions are under `src/generated/services`; use them as the normal connector contract, with a small app-owned data-access layer around them. | [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) · [Architecture](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture) | 2026-10-06 |
| 4. Local testing needs the local play URL opened in the same browser profile that's signed in to Power Apps. | Confirmed | Open `Local Play` in the same signed-in browser profile. | [npm quickstart](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart) | 2026-10-06 |
| 5. Code app users need a Power Apps Premium license. | Confirmed | Premium is one valid route; pay-as-you-go, App Pass, or auto-claim are also valid routes. | [Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview) | 2026-10-06 |
| 6. Code apps can be added to solutions and promoted with Power Platform Pipelines. | Confirmed | Use solution-aware connections/components and managed solution deployment through the company pipeline. | [Connect to data](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-data) · [Pipelines](https://learn.microsoft.com/en-us/power-platform/alm/pipelines) | 2026-10-06 |
| 7. In Claude Code, `/usage` shows per-model tokens and cost for the session, `/cost` opens the same view, and `/clear` resets the totals. | Changed | `/usage` is current; `/cost` is a legacy shortcut into the merged usage view; `/clear` resets totals. | [Costs](https://code.claude.com/docs/en/costs) · [Changelog](https://code.claude.com/docs/en/whats-new/2026-w17) | 2026-10-06 |
| 8. `CLAUDE.md` loads every session and should stay short. | Confirmed | Root/project `CLAUDE.md` is loaded at session start; keep only broad, always-needed rules. | [Memory](https://code.claude.com/docs/en/memory) · [Best practices](https://code.claude.com/docs/en/best-practices) | 2026-10-06 |
| 9. Claude Code model aliases include `opus`, `sonnet`, `haiku` and `opusplan`, and Opus 5.5 defaults to medium effort. | Confirmed | All four aliases are documented; Opus 5.5 default effort is medium. | [Model configuration](https://code.claude.com/docs/en/model-config) | 2026-10-06 |
| 10. List prices per million tokens (input/output): Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 4.5 $1/$5, Fable 5.1 $10/$50. Haiku 4.5 retires no sooner than 2026-10-15. | Confirmed | Add cache pricing to the build log: Opus read/write $0.20/$5 (5m), Sonnet $0.20/$2.50, Haiku $0.10/$1.25, Fable $0.25/$12.50; 1h writes differ. | [Opus](https://platform.claude.com/docs/en/models/opus-5-5/overview) · [Sonnet](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) · [Haiku](https://platform.claude.com/docs/en/models/haiku-4-5/overview) · [Fable](https://platform.claude.com/docs/en/models/fable-5-1/overview) | 2026-10-06 |
| 11. Setting a lookup on create through the generated service uses `@odata.bind` with the navigation property name and the target table's entity set. | Confirmed | The underlying Dataverse Web API pattern is `<navigation-property>@odata.bind: "/<entity-set>(<guid>)"`; exact navigation-property casing comes from metadata/generated types. | [Associate entities](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api) · [Multi-table lookups](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/multitable-lookup) | 2026-10-06 |
| 12. A Dataverse “row added” flow trigger fires once per created row, so W3 with two projects starts the flow twice. | Confirmed | Each create event is a separate row event; configure trigger filters and make the process idempotent. | [Dataverse trigger](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger) | 2026-10-06 |
| 13. `ccusage` reads Claude Code's local logs and reports usage by day, session and model. | Changed | Confirmed as a Community tool, not an Anthropic built-in. Treat its numbers as a local analytical reconciliation, not authoritative billing. | [ccusage GitHub](https://github.com/ryoppippi/ccusage) · [Claude costs](https://code.claude.com/docs/en/costs) | 2026-10-06 |

### Verdict counts

- Confirmed: 9
- Wrong: 0
- Changed: 4
- Unverified: 0

### Verification notes

- Claim 1 is current even though older guidance may show a different admin-center navigation path.
- Claim 2 is operationally correct for the npm CLI; only the retirement wording is too strong.
- Claim 3 has the right architectural intent but the documented generated path is more specific than `src/generated`.
- Claim 4 is a browser-profile requirement, not a claim that any browser can use any account.
- Claim 5 describes the licensing family; Premium is the safe planning assumption for this project.
- Claim 6 depends on the code app being included in the intended solution and connection-reference design.
- Claim 7 needs the current `/usage` terminology in the build log; legacy shortcuts may still work.
- Claim 8 applies to project-root instructions; nested instructions are not all loaded at session start.
- Claim 9 distinguishes aliases from pinned model IDs; aliases can resolve to newer models.
- Claim 10 is valid at the research date; model pricing and retirement dates are time-sensitive.
- Claim 11 gives the Web API binding pattern; generated-service ergonomics still require a Dev check.
- Claim 12 applies to each created row, not to a logical user action that created multiple rows.
- Claim 13 is useful for local attribution but is not an Anthropic billing source.

### Applies to Team Management

- Keep claims 1, 4, 5, 6, 8, 9, 10, 11, and 12 as build rules.
- Change claims 2, 3, 7, and 13 in `CLAUDE.md`/build-log guidance before the first feature session.
- Treat generated lookup types and actual navigation-property casing as a Dev verification task before W2–W4 implementation.
- Treat `/usage` plus Console/Team reporting as the primary measurement chain; use `ccusage` for local task attribution.

### Do

- Use the corrected wording in the R6 table as the project baseline.
- Recheck time-sensitive model, CLI, and MCP claims before a later build phase.
- Validate generated lookup syntax in the actual Dev-generated files.
- Keep source links beside every decision-driving claim.

### Don’t

- Don’t copy the original assumptions into `CLAUDE.md` without the Changed qualifiers.
- Don’t treat a current alias or price as permanent.
- Don’t use a general Web API pattern as proof of a generated-service method signature.
- Don’t use `ccusage` as the billing authority.

### Commands or settings

No new command is required by R6; use the verified commands and settings documented in R1–R5.

### Open questions

- Which Claude plan/account source is authoritative for the pilot cost column?
- Which generated service version will determine the final lookup-create syntax?
- Will the flow owners add idempotency guards for repeated W1–W4 submissions?

---

## R7. Recommended changes to our setup

### Summary

- The highest-impact changes are the CLI migration, human-only publish boundary, metadata checkpoint, and single-flight write behavior.
- Keep the pilot Dev-only and preserve the no-schema-change rule.
- Use Claude model routing and short contexts as a cost-control mechanism, not as a substitute for review.
- Keep Dataverse MCP disabled unless it is reduced to a read-only metadata toolset.
- Add browser, build, and solution checks before human promotion.

### Key facts

| Fact | Status | Source | Checked |
|---|---|---|---|
| The plan has 10 ranked changes and maps each change to F01–F13. | Confirmed | R7 table below | 2026-10-06 |
| All listed changes are supported by sources cited in R1–R5 or the R7 source list. | Confirmed | R7 source list below | 2026-10-06 |

| Rank | Change | Why | Effort | Features affected |
|---:|---|---|:---:|---|
| 1 | Make `pa app` the primary CLI and document `pac code` only as fallback. | Microsoft’s current docs make the npm CLI the forward path and mark `pac code` for future deprecation. | S | F01–F13 |
| 2 | Add a human-only publish boundary: deny `pa app push`, `pac code push`, and pipeline/publish commands in shared Claude settings. | Code apps publish to Power Platform; the project explicitly says the AI must never publish. | S | F01–F13 |
| 3 | Add a pre-build metadata checkpoint for generated models, logical names, lookup navigation names, choice values, and environment-variable relationships. | Generated services are the data contract, and lookup casing cannot safely be guessed. | M | F01, F02, F03, F04, F05, F06, F07 |
| 4 | Split the data layer into an Opus session and page sessions; keep `src/generated` readable only when the feature needs generated types. | Reduces repeated context while preserving a strong review boundary around W1–W4. | S | F01–F13 |
| 5 | Add concise PostToolUse typecheck/lint hooks and keep their output short. | Hooks provide repeatable checks without requiring a model call; concise output limits context growth. | M | F01–F13 |
| 6 | Add a single-flight submit state and explicit W1/W2–W4 write ledger in the app. | Each create fires its own row-event flow; double submits or blind retries can duplicate downstream work. | M | F04, F05, F06, F07, F08 |
| 7 | Add Playwright/browser smoke coverage plus TypeScript/lint/build and Power Platform Checker to the human promotion checklist. | No single checker covers React, browser UX, generated data access, and solution quality. | M | F01–F13 |
| 8 | Keep Dataverse MCP disabled by default; if enabled, use a separate read-only metadata workflow and deny record/schema mutation tools. | The official MCP surface includes create/update record and table/schema operations, conflicting with the no-schema-change rule. | M | F01, F02, F03, F04, F05 |
| 9 | Record cache read/write tokens and model effort in the build log, not just input/output totals. | Cache and effort materially affect cost and model routing; `/usage` exposes the fields. | S | F01–F13 |
| 10 | Pin npm/Node versions in the repository after the first known-good Dev build and record them in the build log. | Microsoft requires Node LTS but does not pin one exact major version in the code-app docs; reproducibility needs an explicit project decision. | S | F01 |

### Do

- Implement the S-effort guardrails before F01.
- Implement metadata and write-safety changes before W1–W4.
- Keep human approval at the publish and promotion boundary.
- Recheck current docs before changing a command, model, or MCP policy.

### Don’t

- Don’t add a recommendation that lacks a source.
- Don’t turn a recommendation into a schema change.
- Don’t make the AI the publisher of the app.
- Don’t combine unrelated feature work just to reduce session count.

### Commands or settings

Use only the verified CLI and Claude settings examples shown in R1–R3; no additional unverified command is introduced by R7.

### Source support for the recommended changes

- CLI migration and commands: [Power Apps CLI reference](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli) · [pac code](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code)
- Publish boundary and host behavior: [System configuration](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/system-limits-configuration) · [Code-app ALM](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/alm)
- Generated services and metadata: [Dataverse connection](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) · [Associate entities](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api)
- Hooks and permissions: [Settings](https://code.claude.com/docs/en/settings) · [Hooks](https://code.claude.com/docs/en/hooks)
- Row events and service protection: [Dataverse trigger](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger) · [API limits](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits)
- MCP tools and governance: [Dataverse MCP](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp) · [MCP configuration](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp-disable)
- Token measurement and routing: [Costs](https://code.claude.com/docs/en/costs) · [Model configuration](https://code.claude.com/docs/en/model-config) · [Monitoring](https://code.claude.com/docs/en/monitoring-usage)

### Implementation order

- Before F01: enable code apps in Dev, pin the CLI choice, and establish the human publish boundary.
- Before F01: verify the solution, publisher, environment ID, and current npm/Node versions.
- During F01: initialize the app and capture the generated `power.config.json` and service layout.
- Before W1–W4: inspect generated types, lookup metadata, choices, booleans, and environment variables.
- Before page sessions: agree the data-access wrapper shape and error model.
- Before first create: implement single-flight submit state and write-result logging.
- During W1: verify update semantics against `systemuser.mpm_onboard`.
- During W2–W4: verify one request row per intended create and correct lookup bindings.
- After W2–W4: verify row-event flow counts and duplicate-submit behavior.
- Before review: run typecheck, lint, build, browser smoke tests, and static checks.
- Before Test: human reviews the managed-solution artifact and environment-variable values.
- After Test: compare Dev and Test behavior without changing the no-schema-change rule.

### Decision guardrails

- Prefer a verified existing generated-service pattern over a clever new abstraction.
- Prefer a bounded query over a full-table read.
- Prefer a human gate over an AI-controlled publish action.
- Prefer a new feature session over carrying unrelated history forward.
- Prefer a source-backed “Unverified” label over invented CLI flags or API names.
- Prefer a small local fix over a cross-app refactor.
- Prefer observable write outcomes over assumptions based on UI state.
- Prefer managed deployment artifacts for Test over direct edits in Test.

### Applies to Team Management

- Adopt recommendations 1–3 before F01.
- Adopt recommendations 4–5 before the first page session.
- Adopt recommendation 6 before the first end-to-end write test.
- Adopt recommendations 7–9 before Test promotion.
- Treat recommendation 10 as a reproducibility checkpoint after the first successful Dev initialization.

### Open questions

- Which existing solution and publisher should own the code app?
- Which human will approve the Dev-to-Test pipeline promotion?
- Which exact F01–F13 feature boundaries map to the existing product backlog?
