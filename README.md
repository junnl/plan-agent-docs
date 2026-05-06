# plan-agent-docs

`plan-agent-docs` converts a project plan into persistent coding-agent instructions.

It is for teams and solo developers who start projects with a PRD, design plan, OMX/OMC plan, test spec, or ADR, then switch between Codex, Claude Code, and OpenCode while implementing. Instead of re-explaining the stack, constraints, commands, verification rules, and "don't overcomplicate this" behavior in every new chat, this single tool writes them into `AGENTS.md` and `CLAUDE.md`.

The basic idea:

```text
plan / PRD / ADR / test spec
        |
        v
plan-agent-docs
        |
        v
AGENTS.md + CLAUDE.md
        |
        v
Codex / Claude Code / OpenCode follow the same project contract
```

## What Problem It Solves

Coding agents are good at reading existing code, but greenfield and plan-first projects have a gap: the most important decisions often live in a planning document, not in code yet.

That creates recurring problems:

- A new agent session does not know the selected stack.
- Claude Code and Codex receive different instructions.
- A plan says "use Playwright smoke tests", but the next session forgets.
- A greenfield repo has no code to infer conventions from.
- `/init` summarizes the codebase, but your project has not been scaffolded yet.

`plan-agent-docs` closes that gap by turning the plan itself into reusable agent instructions.

## What It Generates

`AGENTS.md` is the canonical cross-agent contract. It includes:

- source plan paths
- project intent
- selected stack or greenfield startup protocol
- detected manifests and commands
- acceptance criteria
- implementation guidance
- constraints, risks, and ADR notes
- coding and verification rules

`CLAUDE.md` is generated as a thin Claude Code memory file. It points to `@AGENTS.md` and adds Claude-specific reminders.

Existing files are preserved. Only this generated block is replaced:

```md
<!-- PLAN-AGENT-DOCS:START -->
...
<!-- PLAN-AGENT-DOCS:END -->
```

Backups are created before writes.

## Quick Start

Install the CLI:

```bash
npm install -g github:junnl/plan-agent-docs
```

Install the `plan-agent-docs` coding-CLI entries once:

```bash
plan-agent-docs setup
```

This installs only `plan-agent-docs` integrations for Codex, Claude Code, and OpenCode.

Then, inside any project after writing a plan:

```bash
plan-agent-docs init
```

This is the normal workflow.

## Typical Workflow

1. Write or generate a plan in `.omx/plans`, `.omc/plans`, `plans`, `docs`, or the project root.
2. Run `plan-agent-docs init`.
3. Commit the generated `AGENTS.md` and `CLAUDE.md`.
4. Start Codex, Claude Code, or OpenCode.
5. The agent now has project instructions derived from the plan.

For an empty project with no plan file yet:

```bash
plan-agent-docs init --greenfield
```

That creates a startup protocol telling agents not to write application code before choosing a stack, recording commands, and scaffolding verification.

## Use Inside Coding CLIs

After `plan-agent-docs setup`, use:

```text
Claude Code: /plan-agent-docs
OpenCode:    /plan-agent-docs
Codex:       $plan-agent-docs
```

Claude Code and OpenCode accept arguments:

```text
/plan-agent-docs --plan .omx/plans/prd-example.md
/plan-agent-docs --greenfield
/plan-agent-docs --dry-run
```

Codex CLI currently has built-in slash commands but no official user-defined slash command surface. Use `$plan-agent-docs` in Codex, or run `plan-agent-docs init` in the shell.

## Examples

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

Create greenfield placeholders:

```bash
plan-agent-docs init --greenfield
```

Install only Claude Code integration:

```bash
plan-agent-docs setup --target claude
```

Install project-local entries instead of global entries:

```bash
plan-agent-docs install --scope project
```

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

The tool also checks lightweight project signals such as:

- `package.json`
- `pyproject.toml`
- `Cargo.toml`
- `go.mod`
- Docker files
- common build/test scripts

It does not deeply analyze source code. It is designed to preserve plan intent, not replace code review.

## Good Fit

Use this when:

- you use Codex, Claude Code, and/or OpenCode across the same repo
- you write plans before implementation
- you use OMX/OMC planning outputs
- you create greenfield repos where no code conventions exist yet
- you want future agent sessions to inherit stack decisions and verification gates

Do not use it as a replacement for:

- lint
- typecheck
- tests
- CI
- human architecture review

`plan-agent-docs` tells agents what to do. Your toolchain still enforces whether the code is correct.

## Installation Details

One-step global setup:

```bash
plan-agent-docs setup
```

Install only one CLI integration:

```bash
plan-agent-docs setup --target claude
plan-agent-docs setup --target opencode
plan-agent-docs setup --target codex
```

Show install paths:

```bash
plan-agent-docs paths
```

Global paths:

```text
Codex skill:        ~/.codex/skills/plan-agent-docs
Claude Code skill:  ~/.claude/skills/plan-agent-docs
Claude Code command: ~/.claude/commands/plan-agent-docs.md
OpenCode skill:     ~/.config/opencode/skills/plan-agent-docs
OpenCode command:   ~/.config/opencode/commands/plan-agent-docs.md
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
