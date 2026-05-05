---
name: plan-agent-docs
description: Generate or update AGENTS.md and CLAUDE.md from OMX/OMC plan artifacts. Use after creating a plan, PRD, test spec, ralplan output, or greenfield project plan when future OpenCode, Codex, and Claude Code sessions should follow the selected stack, commands, constraints, and verification rules.
compatibility: opencode
---

# Plan Agent Docs

Generate project agent instruction files from the latest plan. Prefer invoking the installed OpenCode custom command `/plan-agent-docs`, which runs `plan-agent-docs init` directly.

## Command

Run:

```bash
plan-agent-docs init
```

Useful variants:

```bash
plan-agent-docs init --plan .omx/plans/prd-example.md
plan-agent-docs init --dry-run
plan-agent-docs init --greenfield
```

After running, verify both files exist and include the `PLAN-AGENT-DOCS` marker block.
