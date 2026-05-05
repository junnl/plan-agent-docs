# plan-agent-docs

Turn your plan into persistent agent instructions.

`plan-agent-docs` reads `.omx/plans`, `.omc/plans`, or any `*plan*.md` file and generates:

- `AGENTS.md` for Codex, OpenCode, and other coding agents
- `CLAUDE.md` as thin Claude Code memory that points to `@AGENTS.md`
- optional CLI entries so Claude Code and OpenCode can run `/plan-agent-docs`

## Quick Start

Install the CLI:

```bash
npm install -g github:junnl/plan-agent-docs
```

Install coding-CLI entries once:

```bash
plan-agent-docs setup
```

Then, inside any project after writing a plan:

```bash
plan-agent-docs init
```

That is the normal workflow.

## Daily Use

Use the latest discovered plan:

```bash
plan-agent-docs init
```

Use a specific plan:

```bash
plan-agent-docs init --plan .omx/plans/prd-example.md
```

Preview without writing:

```bash
plan-agent-docs init --dry-run
```

Create greenfield placeholders when no plan exists yet:

```bash
plan-agent-docs init --greenfield
```

The generated files are safe to re-run. Existing content is preserved, and only this block is replaced:

```md
<!-- PLAN-AGENT-DOCS:START -->
...
<!-- PLAN-AGENT-DOCS:END -->
```

Existing files are backed up before writes.

## Use Inside Coding CLIs

After `plan-agent-docs setup`, use:

```text
Claude Code: /plan-agent-docs
OpenCode:    /plan-agent-docs
Codex:       $plan-agent-docs
```

Claude Code and OpenCode also accept arguments:

```text
/plan-agent-docs --plan .omx/plans/prd-example.md
/plan-agent-docs --greenfield
/plan-agent-docs --dry-run
```

Codex CLI does not currently provide an official user-defined slash command surface, so Codex uses the explicit skill trigger `$plan-agent-docs`. The shell command `plan-agent-docs init` works everywhere.

## What It Reads

Plan discovery checks, newest first:

- `.omx/plans/*.md`
- `.omc/plans/*.md`
- `.omx/drafts/*.md`
- `.omc/drafts/*.md`
- `plans/*.md`
- `docs/*plan*.md`
- root `*plan*.md`

If nearby PRD, test spec, plan, or ADR files were created around the same time, they are read together.

## What It Writes

`AGENTS.md` includes:

- source plan paths
- project intent
- selected stack or greenfield startup protocol
- detected manifests and commands
- acceptance criteria
- implementation guidance
- constraints, risks, and ADR notes
- coding and verification rules

`CLAUDE.md` includes:

- `@AGENTS.md`
- source plan paths
- Claude-specific memory notes

## Installation Details

One-step setup:

```bash
plan-agent-docs setup
```

Install only one CLI integration:

```bash
plan-agent-docs setup --target claude
plan-agent-docs setup --target opencode
plan-agent-docs setup --target codex
```

Project-local install instead of global:

```bash
plan-agent-docs install --scope project
```

Show install paths:

```bash
plan-agent-docs paths
```

Global paths:

```text
Codex:       ~/.codex/skills/plan-agent-docs
Claude Code: ~/.claude/skills/plan-agent-docs
OpenCode:    ~/.config/opencode/skills/plan-agent-docs
OpenCode:    ~/.config/opencode/commands/plan-agent-docs.md
```

On Windows, OpenCode uses `%APPDATA%/opencode`.

## Command Reference

```bash
plan-agent-docs setup [--target all|codex|claude|opencode] [--dry-run]
plan-agent-docs init [--project-root <dir>] [--plan <file>] [--dry-run] [--greenfield]
plan-agent-docs install [--target all|codex|claude|opencode] [--scope global|project]
plan-agent-docs paths
```

Legacy aliases are kept:

```bash
plan-agent-docs generate
plan-agent-docs install-skills
```

## Why This Exists

`/init` commands usually summarize an existing codebase. This tool is for plan-first work:

1. Write the plan.
2. Convert the plan into durable agent instructions.
3. Let future Codex, Claude Code, and OpenCode sessions inherit the same stack, constraints, commands, and verification gates.

It does not replace lint, typecheck, tests, or CI. It tells agents what to run and how to behave; your toolchain still enforces correctness.
