<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

<!-- The background helper cases after lead's prompt stopped repeating what its tools' descriptions say (2049 to 1893 tokens), default profile, opencode 2.2.5, one run each: lead still hands off in the background, steers, cancels and answers first without those rules in its prompt. -->

# Eval summary

- Started 2026-11-07T23:05:56.836Z, finished 2026-11-07T23:08:16.474Z (2m 20s).
- opencode 2.2.5, profile `default`.
- 5 run(s), 5 passed. Total cost $1.04 (limit $10.00).

A run passes when it finished and every counted check passed. Checks in brackets are recorded only and do not decide the result. Cost is what opencode reports for each model request. Peak context is the largest input of one request by the agent that holds the conversation (lead, or build for the baseline), cached tokens included.

## background-scouts: Two independent questions answered through background scouts while the user keeps talking

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0.167 | lead $0.121, scout $0.046 | scout 2 | lead 17,461 | 11 | 41s |

| Check | harness #1 |
|---|---|
| lead handed off 2 helpers in the background | pass |
| the answers give the valid range, -90 to 60 degrees Celsius | pass |
| the answers name the row reader and say a missing value becomes None or is skipped | pass |
| no project files changed (notes allowed) | pass |

## restart: The same change of scope as steer, done by cancelling and starting a new scout, for comparison

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0.210 | lead $0.156, scout $0.054 | scout 2 | lead 17,376 | 13 | 1m 08s |

| Check | harness #1 |
|---|---|
| lead stopped the first scout with helpers_cancel | pass |
| scout ran in 2 sessions | pass |
| the second scout's report covers quality.py and units.py | pass |
| no project files changed (notes allowed) | pass |

## cancel: A running builder is stopped with helpers_cancel and not restarted

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 3/3 | $0.130 | lead $0.103, builder $0.027 | builder 1 | lead 13,488 | 11 | 34s |

| Check | harness #1 |
|---|---|
| lead stopped the running builder with helpers_cancel | pass |
| builder ran in 1 session | pass |
| the project's tests pass (python3 -m unittest) | pass |

## steer: A running scout is redirected with helpers_steer instead of restarted

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0.277 | lead $0.168, scout $0.109 | scout 1 | lead 16,875 | 12 | 1m 15s |

| Check | harness #1 |
|---|---|
| lead redirected the running scout with helpers_steer, naming the two files | pass |
| scout ran in 1 session | pass |
| the scout's report covers quality.py and units.py and says the scope changed | pass |
| no project files changed (notes allowed) | pass |

## review-background: /review while a background scout works: the reviewer answers in the session, and the scout's report wakes lead

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 5/5 | $0.254 | lead $0.143, scout $0.093, reviewer $0.019 | scout 1 | lead 23,294 | 12 | 1m 10s |

| Check | harness #1 |
|---|---|
| lead handed off a helper in the background | pass |
| reviewer answered in the user's session | pass |
| the reviewer answers VERDICT: REJECT naming units.py | pass |
| every background completion in the user's session woke lead | pass |
| the review and the scout changed no project file | pass |

## Totals

| Variant | Runs | Passed | Total cost | Mean cost | Mean duration | Mean peak context |
|---|---|---|---|---|---|---|
| harness | 5 | 5 | $1.04 | $0.207 | 58s | 17,699 |
