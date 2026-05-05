# plan-agent-docs

Generate `AGENTS.md` and `CLAUDE.md` from OMX/OMC planning artifacts, then install programming-CLI entries for Codex, Claude Code, and OpenCode.

## Install

From this folder:

```bash
npm install -g .
```

Then verify:

```bash
plan-agent-docs --help
```

## Generate Agent Docs

In a project that has `.omx/plans/*.md`, `.omc/plans/*.md`, or another `*plan*.md`:

```bash
plan-agent-docs generate
```

Preview without writing:

```bash
plan-agent-docs generate --dry-run
```

Specify a plan:

```bash
plan-agent-docs generate --plan .omx/plans/prd-example.md
```

For an empty greenfield project with no plan file yet:

```bash
plan-agent-docs generate --force
```

Existing `AGENTS.md` and `CLAUDE.md` are preserved. The CLI only replaces the generated marker block:

```md
<!-- PLAN-AGENT-DOCS:START -->
...
<!-- PLAN-AGENT-DOCS:END -->
```

Existing files are backed up before writes unless `--no-backup` is passed.

## Install Programming CLI Entries

Install all global entries:

```bash
plan-agent-docs install --target all --scope global
```

Install only one tool:

```bash
plan-agent-docs install --target codex --scope global
plan-agent-docs install --target claude --scope global
plan-agent-docs install --target opencode --scope global
```

Install project-local entries:

```bash
plan-agent-docs install --target all --scope project
```

Show install paths:

```bash
plan-agent-docs paths
```

## Tool-Specific Use

Codex:

```text
$plan-agent-docs 根据最新 plan 生成 AGENTS.md 和 CLAUDE.md
```

Codex CLI currently has official built-in slash commands but no official user-defined slash command surface. Use the explicit skill trigger above or run `plan-agent-docs generate` from the shell.

Claude Code:

```text
/plan-agent-docs
```

With arguments:

```text
/plan-agent-docs --plan .omx/plans/prd-example.md
/plan-agent-docs --force
```

OpenCode:

```text
/plan-agent-docs
```

With arguments:

```text
/plan-agent-docs --plan .omx/plans/prd-example.md
/plan-agent-docs --force
```

## Install Locations

Codex global default:

```text
$CODEX_HOME/skills/plan-agent-docs
```

If `CODEX_HOME` is unset:

```text
~/.codex/skills/plan-agent-docs
```

Codex project install:

```text
.agents/skills/plan-agent-docs
```

Claude Code global install:

```text
~/.claude/skills/plan-agent-docs
```

Claude Code project install:

```text
.claude/skills/plan-agent-docs
```

OpenCode global install:

```text
~/.config/opencode/skills/plan-agent-docs
~/.config/opencode/commands/plan-agent-docs.md
```

On Windows, these follow `%APPDATA%/opencode/skills/plan-agent-docs` and `%APPDATA%/opencode/commands/plan-agent-docs.md`.

OpenCode project install:

```text
.opencode/skills/plan-agent-docs
.opencode/commands/plan-agent-docs.md
```

## Notes

- `AGENTS.md` is the canonical cross-agent contract.
- `CLAUDE.md` is generated as a thin Claude Code memory file that references `@AGENTS.md`.
- OpenCode uses `AGENTS.md` as project rules and supports OpenCode skills from `.opencode/skills` and global config.
- This package does not install lint, test, or build tools. It records the commands and verification gates that future agent sessions should follow.
