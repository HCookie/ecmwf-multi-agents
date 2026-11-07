// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "bun:test";
import { enabledHelpers, helpersOf, rewriteHelperList } from "./helper-list.ts";
import { HELPER_OFF, LEAD_PROMPT, TESTER_ROUTING, embeddedFixture } from "./testing.ts";

const harness = embeddedFixture();
const helpers = helpersOf(harness);
const DEFAULTS = ["scout", "builder", "reviewer"];
const on = (...ids: string[]) => new Set(ids);

describe("helpersOf", () => {
  test("lists every agent but the default one, in harness order", () => {
    expect(helpers.map((helper) => [helper.id, helper.optional ?? false])).toEqual([
      ["scout", false],
      ["builder", false],
      ["reviewer", false],
      ["tester", true],
    ]);
  });
});

describe("enabledHelpers", () => {
  test("default helpers are on and optional ones off until a setting says otherwise", () => {
    expect([...enabledHelpers(harness, { agents: {} })]).toEqual(DEFAULTS);
    expect([...enabledHelpers(harness, { agents: { tester: { enabled: true }, builder: { enabled: false }, scout: { steps: 3 } } })]).toEqual([
      "scout",
      "reviewer",
      "tester",
    ]);
  });
});

describe("rewriteHelperList", () => {
  test("with the default helpers on, the prompt is unchanged", () => {
    expect(rewriteHelperList(LEAD_PROMPT, helpers, on(...DEFAULTS), HELPER_OFF, "lead")).toEqual({ prompt: LEAD_PROMPT });
  });

  test("an optional helper that is on gets its routing line after the default helpers", () => {
    expect(rewriteHelperList(LEAD_PROMPT, helpers, on(...DEFAULTS, "tester"), HELPER_OFF, "lead")).toEqual({
      prompt: LEAD_PROMPT.replace("- reviewer: checks work.\n", `- reviewer: checks work.\n- tester: ${TESTER_ROUTING}\n`),
    });
  });

  test("a default helper that is off loses its line, and the line for helpers that are off is added", () => {
    expect(rewriteHelperList(LEAD_PROMPT, helpers, on("scout", "reviewer"), HELPER_OFF, "lead")).toEqual({
      prompt: LEAD_PROMPT.replace("- builder: makes one change.\n- reviewer: checks work.\n", `- reviewer: checks work.\n- ${HELPER_OFF}\n`),
    });
  });

  test("every default helper off: the list is the optional ones that are on and the line for those off, or that line alone", () => {
    expect(rewriteHelperList(LEAD_PROMPT, helpers, on("tester"), HELPER_OFF, "lead")).toEqual({
      prompt: LEAD_PROMPT.replace("- scout: reads and reports.\n- builder: makes one change.\n- reviewer: checks work.\n", `- tester: ${TESTER_ROUTING}\n- ${HELPER_OFF}\n`),
    });
    const none = rewriteHelperList(LEAD_PROMPT, helpers, on(), HELPER_OFF, "lead").prompt!;
    expect(none).toBe(LEAD_PROMPT.replace("- scout: reads and reports.\n- builder: makes one change.\n- reviewer: checks work.\n", `- ${HELPER_OFF}\n`));
    // Rewritten again, the list is found from the line it added.
    expect(rewriteHelperList(none, helpers, on(), HELPER_OFF, "lead").prompt).toBe(none);
    expect(rewriteHelperList(none, helpers, on("tester"), HELPER_OFF, "lead").prompt).toContain(`- tester: ${TESTER_ROUTING}\n- ${HELPER_OFF}\n\nRun at most`);
  });

  test("without a line for helpers that are off, the lines of those helpers still go", () => {
    expect(rewriteHelperList(LEAD_PROMPT, helpers, on("scout", "reviewer"), undefined, "lead")).toEqual({
      prompt: LEAD_PROMPT.replace("- builder: makes one change.\n", ""),
    });
  });

  test("rewriting a rewritten prompt gives the same prompt, and CRLF line endings are kept", () => {
    const crlf = LEAD_PROMPT.replaceAll("\n", "\r\n");
    for (const ids of [on(...DEFAULTS, "tester"), on("scout", "tester"), on("reviewer")]) {
      const once = rewriteHelperList(crlf, helpers, ids, HELPER_OFF, "lead").prompt!;
      expect(once).not.toMatch(/[^\r]\n/);
      expect(rewriteHelperList(once, helpers, ids, HELPER_OFF, "lead").prompt).toBe(once);
      // Going back to the defaults from a rewritten prompt that still has every default line.
      if (ids.has("scout") && ids.has("builder") && ids.has("reviewer")) {
        expect(rewriteHelperList(once, helpers, on(...DEFAULTS), HELPER_OFF, "lead").prompt).toBe(crlf);
      }
    }
  });

  test("a prompt without exactly one line per default helper is reported and left alone", () => {
    expect(rewriteHelperList(LEAD_PROMPT.replace("- builder: makes one change.\n", ""), helpers, on(...DEFAULTS, "tester"), HELPER_OFF, "lead")).toEqual({
      problem: 'the prompt of lead has no line "- builder: ..."; its helper list was left as it is, so it may name helpers that are off and miss ones that are on',
    });
    expect(rewriteHelperList(`${LEAD_PROMPT}\n- scout: again.`, helpers, on(...DEFAULTS), HELPER_OFF, "lead")).toEqual({
      problem: 'the prompt of lead has 2 lines "- scout: ..."; its helper list was left as it is, so it may name helpers that are off and miss ones that are on',
    });
  });
});
