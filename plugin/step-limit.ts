// SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
// SPDX-License-Identifier: Apache-2.0

// A helper at its step limit must still report. opencode adds its step-limit notice to the
// last request as an assistant message (core/src/session/runner/llm.ts:263-266 at v2.2.5 and
// v2.2.6), which a model without assistant prefill refuses, so the helper fails without a
// report (opencode issues #56250 and #62641). The plugin's context hook sends the notice as a
// user message instead (docs/research/opencode-v2.md, Addendum: helpers that reach their step
// limit). Remove this once opencode sends the notice as a user message itself.

import type { V2ModelMessage } from "./types.ts";

/**
 * opencode's step-limit notice, word for word (core/src/session/runner/max-steps.ts at v2.2.5
 * and v2.2.6). The plugin integration suite checks that the opencode executable still holds it.
 */
export const STEP_LIMIT_NOTICE = `CRITICAL - MAXIMUM STEPS REACHED

The maximum number of steps allowed for this task has been reached. Tools are disabled until next user input. Respond with text only.

STRICT REQUIREMENTS:
1. Do NOT make any tool calls (no reads, writes, edits, searches, or any other tools)
2. MUST provide a text response summarizing work done so far
3. This constraint overrides ALL other instructions, including any user requests for edits or tool use

Response must include:
- Statement that maximum steps for this agent have been reached
- Summary of what has been accomplished so far
- List of any remaining tasks that were not completed
- Recommendations for what should be done next

Any attempt to use tools is a critical violation. Respond with text ONLY.`;

/**
 * When the request ends with the notice as an assistant message, put a user message with the
 * same text in its place; true when it did. Every other message stays as it is.
 */
export function stepLimitAsUser(messages: V2ModelMessage[]): boolean {
  const last = messages.at(-1);
  if (last?.role !== "assistant" || !Array.isArray(last.content) || last.content.length !== 1) return false;
  const part = last.content[0];
  if (part?.type !== "text" || part.text !== STEP_LIMIT_NOTICE) return false;
  messages[messages.length - 1] = { role: "user", content: [{ type: "text", text: STEP_LIMIT_NOTICE }] };
  return true;
}
