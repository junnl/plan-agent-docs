#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const START = "<!-- PLAN-AGENT-DOCS:START -->";
const END = "<!-- PLAN-AGENT-DOCS:END -->";
const SKILL_NAME = "plan-agent-docs";
const ROOT = path.resolve(__dirname, "..");

const STACK_KEYWORDS = {
  "Next.js": [/\bnext\.?js\b/i, /\bnext\b/i],
  React: [/\breact\b/i],
  Vue: [/\bvue\b/i],
  Svelte: [/\bsvelte\b/i],
  TypeScript: [/\btypescript\b/i, /\bts\b/i],
  "Node.js": [/\bnode\.?js\b/i, /\bnode\b/i],
  Express: [/\bexpress\b/i],
  NestJS: [/\bnest\.?js\b/i],
  Python: [/\bpython\b/i],
  FastAPI: [/\bfastapi\b/i],
  Django: [/\bdjango\b/i],
  Flask: [/\bflask\b/i],
  Rust: [/\brust\b/i, /\bcargo\b/i],
  Go: [/\bgolang\b/i, /\bgo\b/i],
  Java: [/\bjava\b/i, /\bmaven\b/i, /\bgradle\b/i],
  Kotlin: [/\bkotlin\b/i],
  Flutter: [/\bflutter\b/i, /\bdart\b/i],
  Tauri: [/\btauri\b/i],
  Electron: [/\belectron\b/i],
  PostgreSQL: [/\bpostgres(?:ql)?\b/i],
  SQLite: [/\bsqlite\b/i],
  Docker: [/\bdocker\b/i]
};

function main() {
  const args = process.argv.slice(2);
  const command = args.shift();

  try {
    if (!command || command === "--help" || command === "-h") {
      printHelp();
      return;
    }
    if (command === "--version" || command === "-v") {
      const pkg = JSON.parse(readText(path.join(ROOT, "package.json")));
      console.log(pkg.version);
      return;
    }
    if (command === "generate") {
      generate(parseOptions(args, {
        "project-root": ".",
        plan: [],
        "dry-run": false,
        force: false,
        "no-backup": false
      }, ["plan"]));
      return;
    }
    if (command === "install-skills" || command === "install") {
      installSkills(parseOptions(args, {
        target: "all",
        scope: "global",
        "project-root": ".",
        "dry-run": false,
        force: false
      }));
      return;
    }
    if (command === "paths") {
      printInstallPaths(parseOptions(args, { "project-root": "." }));
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(`plan-agent-docs: ${error.message}`);
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`plan-agent-docs

Usage:
  plan-agent-docs generate [--project-root <dir>] [--plan <file>] [--dry-run] [--force]
  plan-agent-docs install [--target all|codex|claude|opencode] [--scope global|project]
  plan-agent-docs paths

Commands:
  generate        Generate or update AGENTS.md and CLAUDE.md from plan artifacts.
  install        Install programming-CLI entries for Codex, Claude Code, and/or OpenCode.
  paths           Show default skill install paths.

Examples:
  plan-agent-docs generate
  plan-agent-docs generate --plan .omx/plans/prd-example.md
  plan-agent-docs generate --force --dry-run
  plan-agent-docs install --target all --scope global
  plan-agent-docs install --target opencode --scope project

Programming CLI entries:
  Codex:       $plan-agent-docs (Codex has no official custom slash commands)
  Claude Code: /plan-agent-docs
  OpenCode:    /plan-agent-docs
`);
}

function parseOptions(args, defaults, multiKeys = []) {
  const options = { ...defaults };
  const multi = new Set(multiKeys);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const eq = arg.indexOf("=");
    const rawKey = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const key = normalizeKey(rawKey);
    let value = eq === -1 ? undefined : arg.slice(eq + 1);

    if (!(key in options)) {
      throw new Error(`Unknown option: --${rawKey}`);
    }

    if (typeof options[key] === "boolean") {
      options[key] = value === undefined ? true : value !== "false";
      continue;
    }

    if (value === undefined) {
      index += 1;
      value = args[index];
    }
    if (value === undefined) {
      throw new Error(`Missing value for --${rawKey}`);
    }

    if (multi.has(key)) {
      options[key].push(value);
    } else {
      options[key] = value;
    }
  }
  return options;
}

function normalizeKey(key) {
  if (key === "agent") return "target";
  if (key === "root") return "project-root";
  return key;
}

function generate(options) {
  const projectRoot = path.resolve(options["project-root"]);
  assertDirectory(projectRoot, "Project root");

  const sources = loadPlanSources(projectRoot, options.plan);
  if (sources.length === 0 && !options.force) {
    throw new Error("No plan files found. Pass --plan <path> or --force for greenfield placeholders.");
  }

  const summary = summarizePlan(sources);
  const manifests = detectManifests(projectRoot);
  const agents = buildAgentsBlock(projectRoot, sources, summary, manifests);
  const claude = buildClaudeBlock(projectRoot, sources);

  writeMarkedFile(path.join(projectRoot, "AGENTS.md"), agents, options);
  writeMarkedFile(path.join(projectRoot, "CLAUDE.md"), claude, options);
}

function loadPlanSources(projectRoot, explicitPlans) {
  const paths = explicitPlans.length > 0
    ? explicitPlans.map((item) => path.resolve(projectRoot, item))
    : discoverPlanPaths(projectRoot);

  return unique(paths)
    .filter((file) => isFile(file))
    .map((file) => ({ path: file, text: readText(file) }));
}

function discoverPlanPaths(projectRoot) {
  const candidates = [];
  collectMdFromDir(path.join(projectRoot, ".omx", "plans"), candidates);
  collectMdFromDir(path.join(projectRoot, ".omc", "plans"), candidates);
  collectMdFromDir(path.join(projectRoot, ".omx", "drafts"), candidates);
  collectMdFromDir(path.join(projectRoot, ".omc", "drafts"), candidates);
  collectMdFromDir(path.join(projectRoot, "plans"), candidates);
  collectMatchingMd(path.join(projectRoot, "docs"), /plan/i, candidates);
  collectMatchingMd(projectRoot, /plan/i, candidates, false);

  const sorted = unique(candidates)
    .filter((file) => isFile(file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (sorted.length === 0) return [];

  const newest = sorted[0];
  const newestStat = fs.statSync(newest);
  const selected = [newest];
  for (const file of sorted.slice(1)) {
    if (path.dirname(file) !== path.dirname(newest)) continue;
    const diff = Math.abs(newestStat.mtimeMs - fs.statSync(file).mtimeMs);
    if (diff > 60 * 60 * 1000) continue;
    if (/(prd|test|spec|plan|adr)/i.test(path.basename(file))) {
      selected.push(file);
    }
    if (selected.length >= 4) break;
  }
  return selected.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function collectMdFromDir(dir, out) {
  collectMatchingMd(dir, /\.md$/i, out);
}

function collectMatchingMd(dir, pattern, out, recursive = true) {
  if (!isDirectory(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) collectMatchingMd(full, pattern, out, recursive);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md") && pattern.test(entry.name)) {
      out.push(full);
    }
  }
}

function summarizePlan(sources) {
  const text = sources.map((source) => source.text).join("\n\n");
  return {
    projectIntent: firstNonEmpty([
      extractSection(text, ["Requirements Summary", "Project Summary", "Summary", "Overview", "Goal", "Goals"]),
      extractSection(text, ["Purpose", "Problem", "Intent"])
    ]),
    acceptance: extractSection(text, ["Acceptance Criteria", "Success Criteria", "Definition of Done"]),
    steps: extractSection(text, ["Implementation Steps", "Plan", "Execution Plan", "Milestones"]),
    verification: extractSection(text, ["Verification Steps", "Test Plan", "Testing", "Expanded Test Plan"]),
    risks: extractSection(text, ["Risks and Mitigations", "Risks", "Constraints"]),
    adr: extractSection(text, ["ADR", "Decision", "Architecture Decision Record"])
  };
}

function extractSection(text, names, limit = 1200) {
  for (const name of names) {
    const escaped = escapeRegExp(name);
    const pattern = new RegExp(`^#{1,6}\\s*${escaped}\\s*$\\n([\\s\\S]*?)(?=^#{1,6}\\s+|(?![\\s\\S]))`, "im");
    const match = text.match(pattern);
    if (match) {
      return cleanExcerpt(match[1], limit);
    }
  }
  return "";
}

function detectManifests(projectRoot) {
  const stack = new Set();
  const commands = {};
  const manifests = [];

  const packageJson = path.join(projectRoot, "package.json");
  if (isFile(packageJson)) {
    manifests.push("package.json");
    const pkg = JSON.parse(readText(packageJson));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const scripts = pkg.scripts || {};
    stack.add("Node.js");
    if (deps.typescript) stack.add("TypeScript");
    if (deps.next) stack.add("Next.js");
    if (deps.react) stack.add("React");
    if (deps.vue) stack.add("Vue");
    if (deps.svelte) stack.add("Svelte");
    if (deps.vite) stack.add("Vite");
    if (deps.electron) stack.add("Electron");
    if (deps["@tauri-apps/api"]) stack.add("Tauri");
    for (const name of ["dev", "lint", "typecheck", "test", "build"]) {
      if (scripts[name]) commands[name] = `npm run ${name}`;
    }
    commands.install ||= "npm install";
  }

  const checks = [
    ["pyproject.toml", "Python"],
    ["requirements.txt", "Python"],
    ["setup.py", "Python"],
    ["Cargo.toml", "Rust"],
    ["go.mod", "Go"],
    ["pom.xml", "Java"],
    ["build.gradle", "Java/Gradle"],
    ["build.gradle.kts", "Kotlin/Gradle"],
    ["pubspec.yaml", "Flutter"],
    ["docker-compose.yml", "Docker"],
    ["Dockerfile", "Docker"]
  ];
  for (const [file, detected] of checks) {
    if (isFile(path.join(projectRoot, file))) {
      manifests.push(file);
      stack.add(detected);
    }
  }

  if (isFile(path.join(projectRoot, "pyproject.toml")) || isFile(path.join(projectRoot, "requirements.txt"))) {
    commands.install ||= "pip install -e .";
    commands.test ||= "pytest";
    if (isFile(path.join(projectRoot, "pyproject.toml"))) {
      commands.lint ||= "ruff check .";
      commands.typecheck ||= "mypy .";
    }
  }
  if (isFile(path.join(projectRoot, "Cargo.toml"))) {
    commands.build ||= "cargo build";
    commands.test ||= "cargo test";
    commands.lint ||= "cargo clippy -- -D warnings";
  }
  if (isFile(path.join(projectRoot, "go.mod"))) {
    commands.build ||= "go build ./...";
    commands.test ||= "go test ./...";
    commands.lint ||= "go vet ./...";
  }

  return { stack: [...stack].sort(), commands, manifests };
}

function detectStackFromPlan(text) {
  const decisionText = stripRejectedLines(text);
  const stack = new Set();
  for (const [name, patterns] of Object.entries(STACK_KEYWORDS)) {
    if (patterns.some((pattern) => pattern.test(decisionText))) {
      stack.add(name);
    }
  }
  return [...stack].sort();
}

function stripRejectedLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:Rejected|Alternative rejected|Not chosen)\s*:/i.test(line))
    .join("\n");
}

function buildAgentsBlock(projectRoot, sources, summary, manifestData) {
  const now = new Date().toISOString();
  const planText = sources.map((source) => source.text).join("\n\n");
  const stack = uniqueStrings([...manifestData.stack, ...detectStackFromPlan(planText)]).sort();
  const sourceLines = sources.length > 0
    ? sources.map((source) => relative(projectRoot, source.path))
    : ["TODO(plan-agent-docs): No plan file was found. Add a plan path or create .omx/plans/*.md."];

  const commandLines = ["install", "dev", "lint", "typecheck", "test", "build"].map((name) => {
    const command = manifestData.commands[name];
    return command
      ? `- ${name}: \`${command}\``
      : `- ${name}: TODO(plan-agent-docs): define the ${name} command after stack selection/scaffolding.`;
  });

  const greenfield = stack.length === 0 ? `
## Greenfield Startup Protocol
- Do not write application code before selecting and recording the technical stack.
- Propose the minimal viable stack from the plan requirements, including rejected alternatives.
- Scaffold lint, format, typecheck, test, and build commands before feature implementation.
- Update this generated block after the stack and commands are real.
` : "";

  return `${START}
# Project Agent Instructions

Generated by \`plan-agent-docs\` on ${now}.

## Source Plans
${bulletBlock(sourceLines, "TODO(plan-agent-docs): No source plan recorded.")}

## Project Intent
${textExcerpt(summary.projectIntent, "TODO(plan-agent-docs): Summarize the project intent from the plan.")}

## Stack
${bulletBlock(stack, "TODO(plan-agent-docs): Stack not yet selected. Before writing application code, choose and record the stack.")}

## Detected Manifests
${bulletBlock(manifestData.manifests, "No stack manifests detected yet.")}
${greenfield}
## Commands
${commandLines.join("\n")}

## Plan-Derived Requirements
${textExcerpt(summary.acceptance, "TODO(plan-agent-docs): Add concrete acceptance criteria from the plan.")}

## Implementation Guidance
${textExcerpt(summary.steps, "TODO(plan-agent-docs): Add implementation sequencing from the plan.")}

## Constraints And Risks
${textExcerpt(summary.risks || summary.adr, "TODO(plan-agent-docs): Add constraints, risks, rejected alternatives, and architecture decisions from the plan.")}

## Coding Rules
- Reuse existing project patterns before adding new abstractions.
- Keep diffs small, reviewable, and reversible.
- Do not add dependencies unless the plan or user explicitly justifies them.
- Do not overwrite unrelated user changes.
- Update this file when the plan, stack, commands, or verification gates change materially.

## Verification Rules
${textExcerpt(summary.verification, "TODO(plan-agent-docs): Add verification steps from the plan.")}

- Before claiming completion, run the relevant lint, typecheck, test, and build commands listed above.
- If a command is missing or cannot be run, report the exact gap and why.
- Bug fixes should include regression tests when feasible.

## Completion Report
- Mention changed files at a high level.
- Mention verification commands that passed.
- Mention known risks, TODOs, or checks not run.
${END}
`;
}

function buildClaudeBlock(projectRoot, sources) {
  const now = new Date().toISOString();
  const sourceLines = sources.length > 0
    ? sources.map((source) => relative(projectRoot, source.path))
    : ["TODO(plan-agent-docs): No source plan recorded."];

  return `${START}
@AGENTS.md

# Claude Code Memory

Generated by \`plan-agent-docs\` on ${now}.

## Source Plans
${bulletBlock(sourceLines, "TODO(plan-agent-docs): No source plan recorded.")}

## Claude-Specific Instructions
- Treat \`AGENTS.md\` as the canonical project contract.
- Use this file for Claude Code memory only; keep durable cross-agent rules in \`AGENTS.md\`.
- Before implementing after a new plan, verify \`AGENTS.md\` reflects that plan.
- If plan details conflict with code, inspect the code and update the plan-derived block instead of guessing.
${END}
`;
}

function writeMarkedFile(file, block, options) {
  const existing = isFile(file) ? readText(file) : "";
  const updated = updateMarkedContent(existing, block);
  if (options["dry-run"]) {
    console.log(`\n--- ${file} ---\n${updated}`);
    return;
  }
  if (isFile(file) && !options["no-backup"]) {
    backup(file);
  }
  fs.writeFileSync(file, updated, "utf8");
  console.log(`updated ${file}`);
}

function updateMarkedContent(existing, block) {
  if (existing.includes(START) && existing.includes(END)) {
    const pattern = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`, "m");
    return `${existing.replace(pattern, block.trim()).trimEnd()}\n`;
  }
  if (existing.trim()) {
    return `${existing.trimEnd()}\n\n${block.trim()}\n`;
  }
  return `${block.trim()}\n`;
}

function installSkills(options) {
  const targets = expandTargets(options.target);
  const scope = options.scope;
  if (!["global", "project"].includes(scope)) {
    throw new Error("--scope must be global or project");
  }
  const projectRoot = path.resolve(options["project-root"]);

  for (const target of targets) {
    installIntegration(target, scope, projectRoot, options);
  }
}

function expandTargets(target) {
  if (target === "all") return ["codex", "claude", "opencode"];
  if (["codex", "claude", "opencode"].includes(target)) return [target];
  throw new Error("--target must be all, codex, claude, or opencode");
}

function skillInstallDir(target, scope, projectRoot) {
  if (scope === "project") {
    if (target === "codex") return path.join(projectRoot, ".agents", "skills", SKILL_NAME);
    if (target === "claude") return path.join(projectRoot, ".claude", "skills", SKILL_NAME);
    return path.join(projectRoot, ".opencode", "skills", SKILL_NAME);
  }

  if (target === "codex") {
    const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
    return path.join(codexHome, "skills", SKILL_NAME);
  }
  if (target === "claude") {
    return path.join(os.homedir(), ".claude", "skills", SKILL_NAME);
  }
  return path.join(opencodeConfigHome(), "skills", SKILL_NAME);
}

function commandInstallDir(target, scope, projectRoot) {
  if (target === "claude") {
    return scope === "project"
      ? path.join(projectRoot, ".claude", "commands")
      : path.join(os.homedir(), ".claude", "commands");
  }
  if (target === "opencode") {
    return scope === "project"
      ? path.join(projectRoot, ".opencode", "commands")
      : path.join(opencodeConfigHome(), "commands");
  }
  return "";
}

function installIntegration(target, scope, projectRoot, options) {
  installSkill(target, skillInstallDir(target, scope, projectRoot), options);
  if (target === "opencode") {
    installCommandFile(target, commandInstallDir(target, scope, projectRoot), options);
  }
}

function installSkill(target, installDir, options) {
  const templateDir = path.join(ROOT, "templates", target, SKILL_NAME);
  assertDirectory(templateDir, `Template directory for ${target}`);
  if (options["dry-run"]) {
    console.log(`would install ${target} skill to ${installDir}`);
    return;
  }
  if (isDirectory(installDir) && !options.force) {
    throw new Error(`${installDir} already exists. Pass --force to replace it.`);
  }
  fs.rmSync(installDir, { recursive: true, force: true });
  copyDir(templateDir, installDir);
  console.log(`installed ${target} skill to ${installDir}`);
}

function installCommandFile(target, commandsDir, options) {
  const source = path.join(ROOT, "templates", target, "commands", `${SKILL_NAME}.md`);
  if (!isFile(source)) return;
  const dest = path.join(commandsDir, `${SKILL_NAME}.md`);
  if (options["dry-run"]) {
    console.log(`would install ${target} command to ${dest}`);
    return;
  }
  if (isFile(dest) && !options.force) {
    throw new Error(`${dest} already exists. Pass --force to replace it.`);
  }
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.copyFileSync(source, dest);
  console.log(`installed ${target} command to ${dest}`);
}

function printInstallPaths(options) {
  const projectRoot = path.resolve(options["project-root"]);
  for (const scope of ["global", "project"]) {
    for (const target of ["codex", "claude", "opencode"]) {
      console.log(`${scope}/${target}: ${skillInstallDir(target, scope, projectRoot)}`);
      const commandDir = commandInstallDir(target, scope, projectRoot);
      if (commandDir) {
        console.log(`${scope}/${target}-command: ${path.join(commandDir, `${SKILL_NAME}.md`)}`);
      }
    }
  }
}

function opencodeConfigHome() {
  if (process.env.OPENCODE_CONFIG) {
    return path.dirname(path.resolve(process.env.OPENCODE_CONFIG));
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "opencode");
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "opencode");
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, dest);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, dest);
    }
  }
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  fs.copyFileSync(file, `${file}.${stamp}.bak`);
}

function bulletBlock(items, fallback) {
  const values = items.filter((item) => String(item || "").trim());
  if (values.length === 0) return `- ${fallback}`;
  return values.map((item) => `- ${item}`).join("\n");
}

function textExcerpt(value, fallback, limit = 900) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit).trimEnd()}\n\nTODO(plan-agent-docs): Source section was truncated; read the plan for full detail.`;
}

function cleanExcerpt(value, limit) {
  return String(value || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, limit).trim();
}

function firstNonEmpty(items) {
  return items.find((item) => item && item.trim()) || "";
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function assertDirectory(dir, label) {
  if (!isDirectory(dir)) throw new Error(`${label} does not exist: ${dir}`);
}

function unique(items) {
  return [...new Set(items.map((item) => path.resolve(item)))];
}

function uniqueStrings(items) {
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

function relative(root, file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main();
