---
name: plan-agent-docs
description: Generate or update AGENTS.md and CLAUDE.md from OMX/OMC plan artifacts. Use after creating a plan, PRD, test spec, ralplan output, or greenfield project plan when future OpenCode, Codex, and Claude Code sessions should follow the selected stack, commands, constraints, and verification rules.
compatibility: opencode
---

# Plan Agent Docs

Generate project agent instruction files from the latest plan. Prefer invoking the installed OpenCode custom command `/plan-agent-docs`, which runs `plan-agent-docs generate` directly.

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
