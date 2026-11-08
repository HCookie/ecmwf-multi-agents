<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

<!-- After lead's prompt kept only the review policy in force and the plugin took over adding the work folder to git's exclude file (lead 1893 to 1795 tokens), default profile, opencode 2.2.5, one run each. Under auto the reviewer still checked the change in feature and the plan and the change in plan-execute; in onboard the exclude check passed with no exclude command from lead. -->

# Eval summary

- Started 2026-11-08T08:36:00.231Z, finished 2026-11-08T08:41:26.450Z (5m 26s).
- opencode 2.2.5, profile `default`.
- 4 run(s), 4 passed. Total cost $1.86 (limit $8.00).

A run passes when it finished and every counted check passed. Checks in brackets are recorded only and do not decide the result. Cost is what opencode reports for each model request. Peak context is the largest input of one request by the agent that holds the conversation (lead, or build for the baseline), cached tokens included.

## onboard: /onboard writes the summary and changes nothing else

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 6/6 | $0.286 | lead $0.164, scout $0.122 | scout 3 | lead 18,855 | 19 | 57s |

| Check | harness #1 |
|---|---|
| .ecmwf-multi-agents/context/onboard.md exists | pass |
| its first line is Commit: <HEAD hash> (...) | pass |
| it has the seven numbered sections | pass |
| it names python3 -m unittest | pass |
| .ecmwf-multi-agents/ is listed in .git/info/exclude | pass |
| no other project file changed | pass |

## feature: Small feature across modules: summary --json

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 2/2 | $0.352 | lead $0.225, builder $0.097, reviewer $0.031 | builder 1, reviewer 1 | lead 21,347 | 17 | 1m 39s |

| Check | harness #1 |
|---|---|
| hidden tests pass (evals/hidden/feature) | pass |
| the project's tests pass (python3 -m unittest) | pass |

## review-background: /review while a background scout works: the reviewer answers in the session, and the scout's report wakes lead

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 5/5 | $0.232 | lead $0.114, scout $0.100, reviewer $0.019 | scout 1 | lead 19,759 | 11 | 58s |

| Check | harness #1 |
|---|---|
| lead handed off a helper in the background | pass |
| reviewer answered in the user's session | pass |
| the reviewer answers VERDICT: REJECT naming units.py | pass |
| every background completion in the user's session woke lead | pass |
| the review and the scout changed no project file | pass |

## plan-execute: /plan, approval, then the plan carried out (with /execute in a new session if needed)

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 3/3 | $0.988 | lead $0.733, builder $0.162, reviewer $0.093 | builder 3, reviewer 2 | lead 49,435 | 44 | 4m 28s |

| Check | harness #1 |
|---|---|
| a plan in .ecmwf-multi-agents/plans/ has status done with every task ticked | pass |
| hidden tests pass (evals/hidden/plan-execute) | pass |
| the project's tests pass (python3 -m unittest) | pass |
| lead handed off a helper in the background | (pass) |

## Totals

| Variant | Runs | Passed | Total cost | Mean cost | Mean duration | Mean peak context |
|---|---|---|---|---|---|---|
| harness | 4 | 4 | $1.86 | $0.465 | 2m 01s | 27,349 |
