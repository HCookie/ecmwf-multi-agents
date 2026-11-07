<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

# 0005. Optional and switchable helpers

Status: Accepted. Date: 2026-11-07.

## Context

The harness has four agents: `lead` and three helpers, `scout`, `builder` and `reviewer`
(principle 4 in `docs/architecture.md`: few agents, each with one job). Users asked for two
things the four do not give:

- Specialists for jobs that recur in some projects and never in others: deep research that may
  run experiments, adversarial testing, UI design, and work on datasets that are too large to
  read into a model's context.
- A way to switch helpers on and off per project, for example a project where every change is
  made by hand and `builder` is not wanted, or one that never needs a designer.

Every helper costs tokens even when unused: its line in `lead`'s instructions, and its entry in
the delegation tool's list of subagents, which every `lead` request carries. `lead`'s prompt is
at its budget (2047 of 2050 tokens).

opencode 2.2.5 lets a plugin remove any agent from its late agent transform, whatever brought
it, and a removed agent leaves the delegation tool's list. A plugin command can refuse with a
message, which the TUI shows, without starting a model turn. A helper cannot use opencode's browser tools, which only work in
the session a desktop browser attached to (`docs/research/opencode-v2.md`, Addendum: switching
helpers on and off).

## Decisions

- Each helper is on or off per project, with `agents.<id>.enabled` in the settings files,
  merged per field like `model`, `effort` and `steps`. `lead` cannot be switched off.
- Four new helpers, off by default: `researcher`, `tester`, `designer` and `data-scientist`.
  `scout`, `builder` and `reviewer` stay on by default. No new commands: `lead` routes to the
  new helpers from plain requests.
- The optional helpers come only from the plugin. The generator writes no agent file and no
  central config entry for them; the plugin embeds them and registers each one only when it is
  on. A user's own agent with one of their names is left alone while the harness's is off.
- A default helper that is switched off is removed by the plugin's late transform, so it is
  gone whether it came from a file, the central config or the plugin's own registration.
- `lead`'s instructions name only the helpers that are on. The plugin removes the lines of the
  helpers that are off from `lead`'s helper list and adds a one-line routing entry for each
  optional helper that is on, from the manifest. When a default helper is off it adds one line
  telling `lead` to do that helper's work itself. With the defaults, `lead`'s prompt does not
  change.
- `lead` may delegate to every harness helper; an allow rule for a helper that is not there
  lists nothing.
- With the reviewer off the review policy is `never`; a settings file that chose another policy
  gets a warning. `/review` then refuses with a message naming the setting, and no model turn
  starts. With `scout` off,
  `/progress` runs on `lead`; `/onboard` and the plan skill follow `lead`'s rule for helpers
  that are off.
- Writes stay narrow: `researcher` writes notes and its scratch folder, `designer` its design
  folder, `data-scientist` its data folder, and `tester` test files and issue drafts, which
  `lead` files with `gh issue create` only after the user approves (an `ask` rule). Shell
  access for the four is the user's policy with git and `gh` writes denied, like `builder`.
- No browser rule for `designer`: it checks a prototype with a Playwright MCP server the user
  configured, through Code Mode, or with a headless browser from the shell, and reads the
  screenshot.

## Consequences

- Principle 4 becomes: few agents on by default, specialists on where a project needs them.
- A project that turns on every optional helper pays for their lines in `lead`'s instructions
  and in the subagent list; a project that turns none on pays nothing. A budget covers `lead`'s
  prompt with every helper on.
- The optional helpers need the plugin, which every install method brings. Without the plugin,
  only the default helpers exist.
- Permissions are a guard rail: `tester`'s limit to test files, and the folders of the other
  three, hold through their prompts and `lead`'s check of the changed files, not through the
  shell.
- Settings take effect when opencode restarts, as before.
