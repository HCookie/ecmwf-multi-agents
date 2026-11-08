// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "bun:test";
import { STEP_LIMIT_NOTICE, stepLimitAsUser } from "./step-limit.ts";
import type { V2ModelMessage } from "./types.ts";

const user = (text: string): V2ModelMessage => ({ role: "user", content: [{ type: "text", text }] });
const assistant = (...content: Array<Record<string, unknown>>): V2ModelMessage => ({ role: "assistant", content });
const notice = (): V2ModelMessage => assistant({ type: "text", text: STEP_LIMIT_NOTICE });
const request = (): V2ModelMessage[] => [
  user("GOAL: look things up."),
  assistant({ type: "tool-call", id: "call_1", name: "glob", input: { pattern: "*" } }),
  { role: "tool", content: [{ type: "tool-result", id: "call_1", name: "glob", result: { type: "text", value: "a.py" } }] },
];

describe("STEP_LIMIT_NOTICE", () => {
  test("is opencode's notice, from its first line to its last", () => {
    expect(STEP_LIMIT_NOTICE.startsWith("CRITICAL - MAXIMUM STEPS REACHED\n\nThe maximum number of steps allowed for this task has been reached.")).toBe(true);
    expect(STEP_LIMIT_NOTICE.endsWith("Any attempt to use tools is a critical violation. Respond with text ONLY.")).toBe(true);
  });
});

describe("stepLimitAsUser", () => {
  test("a request that ends with the notice as an assistant message ends with it as a user message instead", () => {
    const messages = [...request(), notice()];
    const before = [...messages];
    expect(stepLimitAsUser(messages)).toBe(true);
    expect(messages).toHaveLength(4);
    expect(messages.at(-1)).toEqual(user(STEP_LIMIT_NOTICE));
    // Nothing else changes: the other messages are the same objects.
    for (let i = 0; i < 3; i++) expect(messages[i]).toBe(before[i]!);
    // Once changed, it stays as it is.
    expect(stepLimitAsUser(messages)).toBe(false);
    expect(messages.at(-1)).toEqual(user(STEP_LIMIT_NOTICE));
  });

  test("anything else is left alone", () => {
    const cases: Array<[string, V2ModelMessage[]]> = [
      ["no notice", request()],
      ["empty", []],
      ["the notice already from the user", [...request(), user(STEP_LIMIT_NOTICE)]],
      ["the notice, then more", [...request(), notice(), user("Go on.")]],
      ["the notice and other text", [...request(), assistant({ type: "text", text: STEP_LIMIT_NOTICE }, { type: "text", text: "More." })]],
      ["the notice and a tool call", [...request(), assistant({ type: "text", text: STEP_LIMIT_NOTICE }, { type: "tool-call", id: "c", name: "glob", input: {} })]],
      ["another text", [...request(), assistant({ type: "text", text: "CRITICAL - MAXIMUM STEPS REACHED" })]],
    ];
    for (const [name, messages] of cases) {
      const before = JSON.stringify(messages);
      expect([name, stepLimitAsUser(messages)]).toEqual([name, false]);
      expect([name, JSON.stringify(messages)]).toEqual([name, before]);
    }
  });
});
