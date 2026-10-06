---
description: Review this project's CLAUDE.md, rules, and auto memory for staleness, duplication, and bloat
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
---

Do a maintenance pass over this project's Claude Code instructions. Work through each step and report findings before editing anything — then ask before applying edits.

1. Read `CLAUDE.md` (and `.claude/CLAUDE.md` if present), every file in `.claude/rules/`, and `CLAUDE.local.md` if it exists.
2. Flag anything that:
   - Is now derivable from the codebase itself (directory layout, dependency list, architecture that's obvious from reading the code) — this belongs in `/doctor`'s trim, not here, but call it out.
   - Duplicates or contradicts another instruction file.
   - References a file, command, tool, or workflow that no longer exists in this repo.
   - Is vague enough that you couldn't verify whether it was followed ("format code nicely" style).
3. Open `/memory` mentally — read the auto memory index at `~/.claude/projects/<this-repo>/memory/MEMORY.md` and its topic files (use Read/Glob to find the directory). Flag entries that:
   - Are now stale (resolved bugs, old sandbox URLs, decisions that were reversed).
   - Have shown up enough times that they should be promoted into CLAUDE.md as a real rule instead of living in auto memory.
4. Summarize findings as a short list: keep / promote to CLAUDE.md / delete / merge. Wait for confirmation before editing any file.
