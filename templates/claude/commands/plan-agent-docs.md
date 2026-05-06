---
description: Generate AGENTS.md and CLAUDE.md from the latest OMX/OMC plan with built-in Karpathy coding guardrails
argument-hint: "[--plan <file>] [--greenfield] [--dry-run]"
allowed-tools: Bash(plan-agent-docs init *)
---

Run the integrated plan-agent-docs generator in the current project root.

Command output:

!`plan-agent-docs init $ARGUMENTS`

Report whether `AGENTS.md` and `CLAUDE.md` were updated with plan-derived rules and built-in Karpathy coding guardrails. If no plan exists, suggest rerunning with `/plan-agent-docs --greenfield` or `/plan-agent-docs --plan <file>`.
