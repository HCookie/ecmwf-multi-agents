<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

<!-- designer-limit after the step-limit fixes, default profile, opencode 2.2.5, one run. The designer (Claude Opus 5.5) had a step limit of 12: it reached it and reported PARTIAL with its spec started, with no request refused; lead continued the same session, and the designer finished the spec, the prototype and 17 screenshots. lead wrote no design file. -->

# Eval summary

- Started 2026-11-08T20:10:22.131Z, finished 2026-11-08T20:19:27.877Z (9m 06s).
- opencode 2.2.5, profile `default`.
- 1 run(s), 1 passed. Total cost $1.98 (limit $5.00).

A run passes when it finished and every counted check passed. Checks in brackets are recorded only and do not decide the result. Cost is what opencode reports for each model request. Peak context is the largest input of one request by the agent that holds the conversation (lead, or build for the baseline), cached tokens included.

## designer-limit: With designer on and a low step limit: it reports at the limit with a spec started, and lead continues its session rather than designing itself

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 6/6 | $1.98 | designer $1.67, lead $0.305 | designer 1 | lead 23,654 | 29 | 9m 06s |

| Check | harness #1 |
|---|---|
| designer ran in 1 session | pass |
| no request of designer ended in an error | pass |
| lead continued the designer's session | pass |
| a spec was written | pass |
| lead wrote no design file itself | pass |
| no project file changed (work files allowed) | pass |

## Totals

| Variant | Runs | Passed | Total cost | Mean cost | Mean duration | Mean peak context |
|---|---|---|---|---|---|---|
| harness | 1 | 1 | $1.98 | $1.98 | 9m 06s | 23,654 |
