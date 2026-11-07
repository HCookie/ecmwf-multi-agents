<!--
SPDX-FileCopyrightText: 2026 European Centre for Medium-Range Weather Forecasts (ECMWF)
SPDX-License-Identifier: Apache-2.0
-->

<!-- First real-model runs of the six cases for switched and optional helpers, default profile, opencode 2.2.5, one run each. researcher-compare timed out: the researcher went far deeper than the brief asked and wrote its report only at the end. data-question passed, but lead had sent the data scientist's scripts outside the project. Both are fixed; see optional-helpers-rerun.md. -->

# Eval summary

- Started 2026-11-07T15:50:22.191Z, finished 2026-11-07T16:11:28.603Z (21m 06s).
- opencode 2.2.5, profile `default`.
- 6 run(s), 5 passed. Total cost $6.02 (limit $20.00).

A run passes when it finished and every counted check passed. Checks in brackets are recorded only and do not decide the result. Cost is what opencode reports for each model request. Peak context is the largest input of one request by the agent that holds the conversation (lead, or build for the baseline), cached tokens included.

## review-off: With the reviewer off: /review refuses, saying so and how to switch it on, without a model turn

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0 | none | none | lead 0 | 0 | 7s |

| Check | harness #1 |
|---|---|
| the refusal says the reviewer is off and how to switch it on | pass |
| reviewer never ran | pass |
| lead never ran | pass |
| nothing changed | pass |

## builder-off: With builder off: lead fixes a seeded bug itself

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 3/3 | $0.117 | lead $0.117 | none | lead 14,519 | 7 | 27s |

| Check | harness #1 |
|---|---|
| builder ran in 0 sessions | pass |
| hidden tests pass (evals/hidden/bug-fix) | pass |
| the project's tests pass (python3 -m unittest) | pass |

## data-question: With data-scientist on: a question about a year of readings is answered with scripts, not by reading the file

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0.200 | lead $0.136, data-scientist $0.064 | data-scientist 1 | lead 15,687 | 8 | 54s |

| Check | harness #1 |
|---|---|
| data-scientist ran in 1 session | pass |
| the answer gives each station's number of valid readings and their mean | pass |
| no agent read /readings-2025\.csv$/ whole into its context | pass |
| no project file changed (work files allowed) | pass |

## tester-break: With tester on: a module to break goes to the tester, which finds the bug, adds tests and drafts an issue, fixing nothing

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $0.529 | tester $0.338, lead $0.191 | tester 1 | lead 18,446 | 18 | 5m 21s |

| Check | harness #1 |
|---|---|
| tester ran in 1 session | pass |
| the tester's report names the broken conversion | pass |
| an issue draft was written | pass |
| only test files changed; the package is untouched | pass |

## designer-page: With designer on: a page is designed as a spec and a prototype, and the package is untouched

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | pass | 4/4 | $1.56 | designer $1.29, lead $0.272 | designer 1 | lead 21,545 | 35 | 7m 31s |

| Check | harness #1 |
|---|---|
| designer ran in 1 session | pass |
| a spec was written | pass |
| a prototype was written | pass |
| no project file changed (work files allowed) | pass |

## researcher-compare: With researcher on: a question that needs depth and an experiment goes to the researcher, which changes no project file

| Run | Result | Checks | Cost | Cost per agent | Child sessions | Peak context (main agent) | Requests | Duration |
|---|---|---|---|---|---|---|---|---|
| harness #1 | FAIL (timeout) | 2/3 | $3.61 | researcher $3.50, lead $0.104 | researcher 1 | lead 12,459 | 37 | 20m 05s |

| Check | harness #1 |
|---|---|
| researcher ran in 1 session | pass |
| the researcher's report has its experiments and its confidence | FAIL |
| no project file changed (work files allowed) | pass |

- harness #1: timeout: the turn did not finish within the time limit
- harness #1, the researcher's report has its experiments and its confidence: missing experiments, confidence

## Totals

| Variant | Runs | Passed | Total cost | Mean cost | Mean duration | Mean peak context |
|---|---|---|---|---|---|---|
| harness | 6 | 5 | $6.02 | $1.00 | 5m 44s | 13,776 |
