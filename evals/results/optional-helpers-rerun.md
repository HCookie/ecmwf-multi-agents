<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

<!-- The two cases rerun after the fixes (the researcher matches its depth to the brief and keeps its report current; lead's routing line names the data scientist's folder; data-question checks for a script there). data-question failed only its statistics check, which did not accept the typographic minus sign of "−2.7"; the answer was right, and the fixed check passes on it. -->

# Eval summary

- Started 2026-11-07T21:47:06.949Z, finished 2026-11-07T22:02:24.687Z (15m 18s).
- opencode 2.2.5, profile `default`.
- 2 run(s), 1 passed. Total cost $3.98 (limit $10.00).

A run passes when it finished and every counted check passed. Checks in brackets are recorded only and do not decide the result. Cost is what opencode reports for each model request. Peak context is the largest input of one request by the agent that holds the conversation (lead, or build for the baseline), cached tokens included.

## data-question: With data-scientist on: a question about a year of readings is answered with scripts, not by reading the file

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | FAIL | 4/5 | $0.229 | lead $0.160, data-scientist $0.069 | data-scientist 1 | lead 18,794 | 11 | 57s |

| Check | harness #1 |
|---|---|
| data-scientist ran in 1 session | pass |
| the answer gives each station's number of valid readings and their mean | FAIL |
| the computation was kept as a script in the data scientist's folder | pass |
| no agent read /readings-2025\.csv$/ whole into its context | pass |
| no project file changed (work files allowed) | pass |

- harness #1, the answer gives each station's number of valid readings and their mean: missing STN-13 mean

## researcher-compare: With researcher on: a question that needs depth and an experiment goes to the researcher, which changes no project file

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 3/3 | $3.75 | researcher $3.50, lead $0.252 | researcher 1 | lead 19,383 | 41 | 15m 17s |

| Check | harness #1 |
|---|---|
| researcher ran in 1 session | pass |
| the researcher's report has its experiments and its confidence | pass |
| no project file changed (work files allowed) | pass |

## Totals

| Variant | Runs | Passed | Total cost | Mean cost | Mean duration | Mean peak context |
|---|---|---|---|---|---|---|
| harness | 2 | 1 | $3.98 | $1.99 | 8m 07s | 19,089 |
