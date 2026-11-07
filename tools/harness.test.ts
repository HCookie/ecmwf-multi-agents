// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

// The harness as src/ defines it, held to the contract for the optional helpers (ADR 0005 and
// docs/architecture.md: Roles, Permissions, Reports, Work files and Profiles).

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { load } from "./load.ts";
import { resolveHarness } from "./resolve.ts";
import { type JsonSchema, settingsSchema } from "./schema.ts";
import type { Rule } from "./types.ts";

const root = path.resolve(import.meta.dir, "..");
const harness = resolveHarness(await load(root));
const OPTIONAL = ["researcher", "tester", "designer", "data-scientist"];
const HELPERS = ["scout", "builder", "reviewer", ...OPTIONAL];

function agent(id: string) {
  const found = harness.agents.find((item) => item.id === id);
  if (found === undefined) throw new Error(`no agent ${id}`);
  return found;
}

/** opencode's wildcard: `*` matches anything, and a pattern ending in " *" also matches the command alone. */
function matches(pattern: string, value: string): boolean {
  const body = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  const loose = pattern.endsWith(" *") ? `${body.slice(0, -" .*".length)}( .*)?` : body;
  return new RegExp(`^${loose}$`, "s").test(value);
}

/** The effect of the last matching rule, as opencode decides; undefined leaves it to the user's policy. */
function decide(rules: readonly Rule[], action: string, resource: string): string | undefined {
  let effect: string | undefined;
  for (const rule of rules) if (rule.action === action && matches(rule.resource, resource)) effect = rule.effect;
  return effect;
}

describe("the optional helpers", () => {
  test("four subagents, off by default, each with a routing line and its step limit", () => {
    expect(harness.agents.filter((item) => item.optional === true).map((item) => [item.id, item.mode, item.steps])).toEqual([
      ["researcher", "subagent", 80],
      ["tester", "subagent", 60],
      ["designer", "subagent", 60],
      ["data-scientist", "subagent", 60],
    ]);
    for (const id of OPTIONAL) expect(agent(id).routing).toMatch(/^[a-z].+\.$/);
    expect(harness.helperOff).toBeDefined();
  });

  test("lead may hand work to the default helpers, the plugin allows an optional one while it is on, and lead asks before it files an issue", () => {
    const lead = agent("lead").permissions;
    for (const id of ["scout", "builder", "reviewer"]) expect([id, decide(lead, "delegate", id)]).toEqual([id, "allow"]);
    for (const id of [...OPTIONAL, "general"]) expect([id, decide(lead, "delegate", id)]).toEqual([id, "deny"]);
    expect(decide(lead, "shell", "gh issue create --title x --body-file y")).toBe("ask");
  });

  test("with the reviewer off, lead says no independent review is available instead of reviewing its own work", () => {
    expect(harness.helperOff).toContain("no independent review");
    const reviewer = (settingsSchema(harness).properties as Record<string, JsonSchema>).agents!.properties as Record<string, JsonSchema>;
    const enabled = (reviewer.reviewer!.properties as Record<string, JsonSchema>).enabled!;
    expect(String(enabled.description)).toBe("Switch reviewer on or off, for you or for one project. Default: true. When it is off, nothing is reviewed: lead says no independent review is available.");
  });

  test("lead knows that the tester's failing tests are meant to fail", () => {
    expect(agent("tester").routing).toContain("failing tests");
  });

  test("lead's routing line names the work folder of each helper that writes one, so a brief never sends its files elsewhere", () => {
    for (const [id, folder] of [
      ["tester", ".ecmwf-multi-agents/issues/"],
      ["designer", ".ecmwf-multi-agents/design/"],
      ["data-scientist", ".ecmwf-multi-agents/data/"],
    ] as const) {
      expect([id, agent(id).routing?.includes(`\`${folder}\``)]).toEqual([id, true]);
    }
    expect(agent("data-scientist").routing).toContain("not a project file");
  });

  test("the researcher matches its depth to the brief and keeps its report current, so a cut-off still leaves its findings", () => {
    const prompt = agent("researcher").prompt;
    expect(prompt).toContain("Match the depth to the brief");
    expect(prompt).toContain("so a cut-off still leaves them");
  });

  test("no helper asks the user, hands work on, loads the harness's skills or uses lead's helper tools", () => {
    for (const id of HELPERS) {
      const rules = agent(id).permissions;
      expect([id, decide(rules, "question", "*")]).toEqual([id, "deny"]);
      expect([id, decide(rules, "delegate", "scout")]).toEqual([id, "deny"]);
      expect([id, decide(rules, "skill", "ecmwf-multi-agents-plan")]).toEqual([id, "deny"]);
      for (const tool of ["helpers_status", "helpers_steer", "helpers_cancel"]) expect([id, decide(rules, "tool", tool)]).toEqual([id, "deny"]);
    }
  });

  test("they run code but never write to git or GitHub", () => {
    for (const id of OPTIONAL) {
      const rules = agent(id).permissions;
      for (const command of ["git commit -m x", "git push", "git add .", "git -C /x status", "gh issue create", "gh pr create"]) {
        expect([id, command, decide(rules, "shell", command)]).toEqual([id, command, "deny"]);
      }
      for (const command of ["python run.py", "uv run --with pandas script.py", "pytest -q"]) {
        expect([id, command, decide(rules, "shell", command)]).toEqual([id, command, undefined]);
      }
      // Code Mode stays the user's policy: a Playwright or data MCP server is reached through it.
      expect([id, decide(rules, "execute", "*")]).toEqual([id, undefined]);
    }
  });

  test("researcher, designer and data-scientist write only their own work folders; tester edits like builder", () => {
    const edit = (id: string, file: string) => decide(agent(id).permissions, "edit", file);
    for (const [id, folders] of [
      ["researcher", ["notes", "scratch"]],
      ["designer", ["design"]],
      ["data-scientist", ["data"]],
    ] as const) {
      for (const folder of ["notes", "scratch", "design", "data", "plans"]) {
        const expected = (folders as readonly string[]).includes(folder) ? "allow" : "deny";
        expect([id, folder, edit(id, `.ecmwf-multi-agents/${folder}/q/a.md`)]).toEqual([id, folder, expected]);
        expect([id, folder, edit(id, `sub/.ecmwf-multi-agents/${folder}/q/a.md`)]).toEqual([id, folder, expected]);
      }
      for (const file of ["src/app.py", "data/input.csv", "tests/test_app.py"]) expect([id, file, edit(id, file)]).toEqual([id, file, "deny"]);
    }
    for (const file of ["tests/test_app.py", ".ecmwf-multi-agents/issues/crash.md", ".ecmwf-multi-agents/scratch/probe.py"]) {
      expect(edit("tester", file)).toBeUndefined();
    }
  });

  test("each prompt names its work folder and ends with the report the architecture gives it", () => {
    const architecture = readFileSync(path.join(root, "docs/architecture.md"), "utf8");
    const reports: Record<string, [string, string]> = {
      researcher: ["Researcher:", ".ecmwf-multi-agents/scratch/"],
      tester: ["Tester:", ".ecmwf-multi-agents/issues/"],
      designer: ["Designer:", ".ecmwf-multi-agents/design/"],
      "data-scientist": ["Data scientist:", ".ecmwf-multi-agents/data/"],
    };
    for (const [id, [heading, folder]] of Object.entries(reports)) {
      const block = new RegExp(`\\n${heading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``).exec(architecture)?.[1];
      expect([id, block === undefined]).toEqual([id, false]);
      const prompt = agent(id).prompt;
      expect([id, prompt.trimEnd().endsWith(`\`\`\`text\n${block}\n\`\`\``)]).toEqual([id, true]);
      expect([id, prompt.includes(folder)]).toEqual([id, true]);
    }
  });
});

describe("profiles", () => {
  const models = (profile: string) =>
    Object.fromEntries(OPTIONAL.map((id) => [id, harness.profiles.find((item) => item.id === profile)!.agents[id]]));

  test("give the optional helpers the models ADR 0005 names", () => {
    expect(models("default")).toEqual({
      researcher: { model: "anthropic/claude-opus-5-5", effort: "max" },
      tester: { model: "github-copilot/gpt-6.1-sol", effort: "high" },
      designer: { model: "anthropic/claude-opus-5-5", effort: "high" },
      "data-scientist": { model: "anthropic/claude-sonnet-5-5", effort: "high" },
    });
    expect(models("anthropic")).toEqual({
      researcher: { model: "anthropic/claude-opus-5-5", effort: "max" },
      tester: { model: "anthropic/claude-opus-5-5", effort: "high" },
      designer: { model: "anthropic/claude-opus-5-5", effort: "high" },
      "data-scientist": { model: "anthropic/claude-sonnet-5-5", effort: "high" },
    });
    expect(models("copilot")).toEqual({
      researcher: { model: "github-copilot/claude-opus-5.5", effort: "max" },
      tester: { model: "github-copilot/gpt-6.1-sol", effort: "high" },
      designer: { model: "github-copilot/claude-opus-5.5", effort: "high" },
      "data-scientist": { model: "github-copilot/claude-sonnet-5.5", effort: "high" },
    });
    expect(models("inherit")).toEqual({ researcher: undefined, tester: undefined, designer: undefined, "data-scientist": undefined });
  });
});

test("the wildcard used here follows opencode's", () => {
  expect(matches("git push *", "git push")).toBe(true);
  expect(matches("git push *", "git pushx")).toBe(false);
  expect(matches(".ecmwf-multi-agents/notes/*", ".ecmwf-multi-agents/notes/sub/a.md")).toBe(true);
  expect(matches("*/.ecmwf-multi-agents/notes/*", "../.ecmwf-multi-agents/notes/a.md")).toBe(true);
  expect(matches("ecmwf-multi-agents-*", "ecmwf-multi-agents-plan")).toBe(true);
});
