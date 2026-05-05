---
name: plan-agent-docs
description: Generate or update AGENTS.md and CLAUDE.md from OMX/OMC plan artifacts. Use after creating a plan, PRD, test spec, ralplan output, or greenfield project plan when future Codex, Claude Code, and OpenCode sessions should follow the selected stack, commands, constraints, and verification rules.
---

# Plan Agent Docs

Generate project agent instruction files from the latest plan.

## Workflow

1. Prefer explicit user-provided plan paths.
2. Otherwise discover `.omx/plans/*.md`, `.omc/plans/*.md`, drafts, `plans/*.md`, `docs/*plan*.md`, and root `*plan*.md`.
3. Generate or update root `AGENTS.md` as the canonical cross-agent contract.
4. Generate or update root `CLAUDE.md` as thin Claude Code memory that references `@AGENTS.md`.
5. Preserve manual content; update only the generated marker block.

## Command

Run:

```bash
plan-agent-docs generate
```

Useful variants:

```bash
plan-agent-docs generate --plan .omx/plans/prd-example.md
plan-agent-docs generate --dry-run
plan-agent-docs generate --force
```

After running, verify both files exist and include the `PLAN-AGENT-DOCS` marker block.
