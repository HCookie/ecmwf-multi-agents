// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

// lead's helper list: one line "- <id>: <what it does>" per helper that is on (ADR 0005). The
// generated prompt has a line for each helper that is on by default; the plugin removes the
// lines of those switched off, adds the routing line of each optional helper switched on after
// them, and, when a default helper is off, the harness's line telling lead to do that work itself.
// The generator measures the largest list with the same function (tools/resolve.ts).

import type { AgentOverride } from "./types.ts";

/** What the list needs to know about one helper. */
export interface HelperEntry {
  id: string;
  optional?: true;
  routing?: string;
}

/** Every agent but the default one, in harness order: the helpers. */
export function helpersOf<A extends HelperEntry & { mode: string }>(harness: { defaultAgent: string; agents: readonly A[] }): A[] {
  return harness.agents.filter((agent) => agent.id !== harness.defaultAgent && agent.mode === "subagent");
}

/** The helpers that are on: a setting decides, else every helper but the optional ones. */
export function enabledHelpers(
  harness: { defaultAgent: string; agents: readonly (HelperEntry & { mode: string })[] },
  settings: { agents: Readonly<Record<string, AgentOverride>> },
): Set<string> {
  const on = new Set<string>();
  for (const helper of helpersOf(harness)) {
    if (settings.agents[helper.id]?.enabled ?? helper.optional !== true) on.add(helper.id);
  }
  return on;
}

const line = (id: string, text: string) => `- ${id}: ${text}`;
const bare = (text: string) => (text.endsWith("\r") ? text.slice(0, -1) : text);

/**
 * The prompt with the helper list for the helpers that are on. The list goes where the last of
 * its lines is: a default helper's line or one this function added. Lines it added before are
 * taken out first, so a rewritten prompt rewrites to the same text. A prompt without exactly one
 * line for each default helper that is on is someone else's list: it is reported and left alone.
 */
export function rewriteHelperList(
  prompt: string,
  helpers: readonly HelperEntry[],
  on: ReadonlySet<string>,
  helperOff: string | undefined,
  agent: string,
): { prompt: string; problem?: undefined } | { prompt?: undefined; problem: string } {
  const added = new Set<string>(helpers.filter((helper) => helper.optional === true && helper.routing !== undefined).map((helper) => line(helper.id, helper.routing!)));
  if (helperOff !== undefined) added.add(`- ${helperOff}`);
  const defaults = helpers.filter((helper) => helper.optional !== true);
  const lines = prompt.split("\n");
  const isDefault = (text: string) => defaults.some((helper) => bare(text).startsWith(`- ${helper.id}: `));

  for (const helper of defaults.filter((item) => on.has(item.id))) {
    const count = lines.filter((text) => bare(text).startsWith(`- ${helper.id}: `)).length;
    if (count !== 1) {
      const shown = count === 0 ? "no line" : `${count} lines`;
      return { problem: `the prompt of ${agent} has ${shown} "- ${helper.id}: ..."; its helper list was left as it is, so it may name helpers that are off and miss ones that are on` };
    }
  }
  let anchor = -1;
  lines.forEach((text, index) => {
    if (isDefault(text) || added.has(bare(text))) anchor = index;
  });
  if (anchor === -1) {
    return defaults.length === 0 ? { prompt } : { problem: `the prompt of ${agent} has no helper list; it was left as it is, so it may name helpers that are off and miss ones that are on` };
  }

  const ending = lines[anchor]!.endsWith("\r") ? "\r" : "";
  const insert = helpers.filter((helper) => helper.optional === true && helper.routing !== undefined && on.has(helper.id)).map((helper) => line(helper.id, helper.routing!) + ending);
  if (helperOff !== undefined && defaults.some((helper) => !on.has(helper.id))) insert.push(`- ${helperOff}${ending}`);
  const off = defaults.filter((helper) => !on.has(helper.id)).map((helper) => `- ${helper.id}: `);

  const out: string[] = [];
  lines.forEach((text, index) => {
    if (!added.has(bare(text)) && !off.some((start) => bare(text).startsWith(start))) out.push(text);
    if (index === anchor) out.push(...insert);
  });
  return { prompt: out.join("\n") };
}
