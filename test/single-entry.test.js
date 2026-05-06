"use strict";

const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin", "plan-agent-docs.js");

const output = execFileSync(process.execPath, [
  cli,
  "setup",
  "--target",
  "all",
  "--project-root",
  path.join(root, "test", "fixtures", "install-target"),
  "--dry-run"
], { encoding: "utf8" });

assert.match(output, /plan-agent-docs/);
assert.doesNotMatch(output, /karpathy-guidelines/);
assert.doesNotMatch(output, /andrej-karpathy-skills/);
assert.match(output, /would install codex skill/);
assert.match(output, /would install claude skill/);
assert.match(output, /would install claude command/);
assert.match(output, /would install opencode skill/);
assert.match(output, /would install opencode command/);

console.log("single-entry setup verified");
