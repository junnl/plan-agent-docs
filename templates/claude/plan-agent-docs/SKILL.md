---
name: plan-agent-docs
description: Generate or update AGENTS.md and CLAUDE.md from OMX/OMC plan artifacts. Use after creating a plan, PRD, test spec, ralplan output, or greenfield project plan when future Claude Code, Codex, and OpenCode sessions should follow the selected stack, commands, constraints, and verification rules.
disable-model-invocation: true
argument-hint: "[--plan <file>] [--greenfield] [--dry-run]"
allowed-tools: Bash(plan-agent-docs init *)
---

# Plan Agent Docs

Run the generator immediately from the current project root.

!`plan-agent-docs init $ARGUMENTS`

## Workflow

1. Report whether `AGENTS.md` and `CLAUDE.md` were updated.
2. If the command failed because no plan exists, suggest rerunning with `/plan-agent-docs --greenfield` or `/plan-agent-docs --plan <file>`.
3. Do not rewrite generated files manually unless the user explicitly asks.
