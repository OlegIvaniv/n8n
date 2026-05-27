# Prompt Rule Log

Stable IDs for prompt guardrails added during eval-driven iteration.

Rules should keep their IDs permanently once introduced. New rules should be appended with the next available `N###` identifier instead of rewriting or renumbering existing entries.

## Builder prompt guardrails

### N001 - Decision inputs must come from stable normalized data

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When later branching, validation, or user-facing responses depend on normalized input facts, do not read those decision inputs from side-effect node outputs unless that output is explicitly required. Make the decision from the normalized source data, branch before the side-effect node, or explicitly preserve the fields needed for the later decision.
- Why it was added:
  - Contact-form workflows were making reply / response decisions from Telegram output instead of the normalized submission payload.
- Primary evidence:
  - `contact-form-automation` failures where valid submissions skipped the auto-reply because downstream nodes lost `validEmail`.

### N002 - Mutually exclusive branches must yield one downstream item per source item

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When branches are mutually exclusive outcomes for the same source item (for example attempted vs skipped, success vs fallback, valid vs invalid), downstream side effects must receive exactly one item per original source item. Do not append-merge both branch outputs into later notification, write, or response nodes. Rejoin into a single enriched item or route only the selected branch onward while preserving the original source data.
- Why it was added:
  - Contact-form workflows fixed the lost-field bug, but then duplicated Telegram/Sheets side effects by append-merging both attempted and skipped email branches.
- Primary evidence:
  - `contact-form-automation` runs where `happy-path` and `missing-fields` produced extra null rows / duplicate notifications from a bogus skipped-email item.

### N003 - Independent side effects must degrade gracefully

- Status: reverted from active builder prompt on 2026-05-19

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When a workflow has multiple required side effects from the same source item or run, do not let a non-critical notification or delivery failure abort unrelated required actions unless the user explicitly asked for all-or-nothing behavior. Isolate expected destination or API failures with continue-on-fail behavior or an explicit error branch so other independent outputs can still complete.
- Why it was added:
  - Notification failures were still aborting logging and final responses in multi-effect workflows.
- Primary evidence:
  - `contact-form-automation` `partial-action-failure` where Telegram failure stopped Sheets logging and the webhook response.
  - `daily-slack-summary` `insufficient-permissions` where one inaccessible Slack channel stopped the digest.

### N004 - Validate at the narrowest scope necessary

- Status: reverted from active builder prompt on 2026-05-19

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - Validate at the narrowest scope necessary. Do not let one missing or invalid field block unrelated required actions unless the user explicitly asked for full rejection or all-or-nothing behavior. Distinguish between whether the input/run should continue, whether a specific branch is eligible, and whether a specific side effect can execute. If a field is only required for one branch, skip or reroute that branch while preserving other actions that can still run with the available data.
- Why it was added:
  - Intake workflows were treating branch-specific invalidity as workflow-wide failure.
- Primary evidence:
  - `contact-form-automation` `empty-message` where an empty message incorrectly made the whole submission invalid.
  - `contact-form-automation` `invalid-email` where a malformed recipient email incorrectly blocked logging and team notification.

### N005 - Independent dataset fetches must join once on stable keys

- Status: reverted from active builder prompt on 2026-05-20

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When combining independent datasets from multiple systems, fetch each source once at the intended scope unless the task explicitly requires per-item fan-out. Do not accidentally place one source fetch downstream of rows from another source so it repeats per row. Before aggregating, ranking, or joining, preserve a canonical join key and confirm both inputs use the same key/value shape. Required query, filter, and request-body fields must not be submitted empty.
- Why it was added:
  - Multi-source aggregation workflows were duplicating one dataset by fetching it once per item from another dataset, then failing to join metrics because the emitted identifiers did not stay aligned.
- Primary evidence:
  - `linear-bq-leaderboard` `happy-path`, where Linear issues were fetched once per BigQuery row, bug counts were multiplied, the BigQuery SQL body was empty, and usage metrics did not merge back onto the roster keys.

### N006 - Required non-secret identifiers must be preserved, not placeholdered

- Status: reverted from active builder prompt on 2026-05-20

- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - Required non-secret identifiers must not be left as generic placeholders. If the prompt provides concrete IDs, table names, dataset names, channel IDs, URLs, or example query identifiers needed to make a node valid, preserve and use them literally unless they are clearly secrets. Only leave placeholders for actual credentials, secrets, or values that are genuinely missing or ambiguous.
- Why it was added:
  - Builder runs were leaving required BigQuery setup fields as generic placeholders even when the prompt already supplied concrete query/table identifiers, causing the workflow to fail validation before execution.
- Primary evidence:
  - `linear-bq-leaderboard` `happy-path`, where `Query BigQuery Usage` used `placeholder('Google BigQuery project ID')` and failed with `Not a valid BigQuery Project ID` before Slack posting.

### N007 - Fetch field-complete external data before depending on it downstream

- Status: active builder prompt rule added on 2026-05-20
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When downstream logic depends on specific related fields, labels, nested properties, or filters from an external system, do not assume a service-native node returns those fields by default. Fetch the exact fields explicitly using a node configuration that guarantees them; if the native node cannot clearly provide the required fields or query shape, use HTTP Request or the service API directly instead of a more convenient native node. Downstream code must only rely on fields that the upstream fetch is configured to return.
- Why it was added:
  - The builder regressed from a working HTTP Request / GraphQL Linear fetch to a native Linear node that did not provide the creator and team fields the report logic depended on.
- Primary evidence:
  - `cross-team-linear-report` dropped from `5/5` in `workflow-eval-2026-05-19T14-18-16.html` to `1/5` in `workflow-eval-2026-05-20T15-41-04.html` after switching from `Query Linear Issues` (`httpRequest`) to `Get Linear Issues` (`linear`) while downstream code still expected creator email and team fields.

### N008 - Keep empty, success, and failure source states distinct when combining channels or feeds

- Status: active builder prompt rule added on 2026-05-20
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - When a workflow reads from multiple independent sources and then combines the results, keep empty results, successful reads, and failed reads distinct. An empty result is a successful read with zero items, not a failure. If one source is allowed to fail without stopping the workflow, configure that source node to continue on fail or use an error output, and create a failure record only from the real error path. For each source, downstream merge or aggregation must receive either successful data or one failure record, never both. When some sources succeed and others fail, continue with the successful sources and include a clear note about the failed sources in the final output.
- Why it was added:
  - The Slack digest workflow regressed after adding per-channel failure handling. Empty channels and successful channels were being mixed with synthetic failure records, so good data was discarded downstream.
- Primary evidence:
  - `daily-slack-summary` `empty-channel` regressed from pass in `workflow-eval-2026-05-19T14-18-16.html` to fail in `workflow-eval-2026-05-20T16-23-37.html` because failure-recording branches emitted failed rows even when channels succeeded.
  - The same workflow already showed related partial-failure problems in `channel-not-found` and `insufficient-permissions`, where one failed channel should not block summarizing successful channels.

### N009 - Multi-effect intake validation must stay branch-local

- Status: active builder prompt rule added on 2026-05-21
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists — don't synthesize fake items`
- Rule text:
  - For multi-effect intake workflows, separate whole-item rejection from side-effect eligibility. A missing or invalid value needed by one requested effect must gate or fail that effect only; do not block logging, notifications, acknowledgements, or other effects that can use the remaining data unless the user explicitly requires whole-item rejection or every requested effect truly requires that value. Fields used only for message or log content may be empty or use a fallback without making the item invalid.
- Why it was added:
  - The planner and builder were converting branch-specific contact form field problems into workflow-wide invalid submissions even though the workflow still had enough data to log and notify.
- Primary evidence:
  - Fresh copied-server `contact-form-automation` baseline on 2026-05-21 passed `happy-path` and `partial-action-failure` but failed `missing-fields`, `empty-message`, and `invalid-email` because the generated workflow rejected the submission before requested side effects.

### N010 - Embedded Code node source must stay parseable at Code node runtime

- Status: active builder prompt rule added on 2026-05-21
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `TOOL_CODE_NODE_SOURCE_RULES` for the `build-workflow` tool builder path
- Rule text:
  - Keep embedded Code node source parseable at both `build-workflow` time and Code node runtime. In this tool-builder path, do not use tagged templates such as `String.raw` for `jsCode` / `pythonCode`; the workflow parser rejects them. Avoid nested Code-node template literals, use parser-safe multiline text construction such as `const LF = String.fromCharCode(10);` with `lines.join(LF)` instead of newline escapes that can become raw line breaks inside Code node string literals, and avoid regex literals or other escape-heavy Code node source when ordinary string or character helpers are sufficient.
- Why it was added:
  - Several full-suite tool-built workflows built Code nodes that later failed to parse at execution time. The first attempt to share sandbox `String.raw` guidance into tool mode proved invalid because `build-workflow` rejects `TaggedTemplateExpression`, then the builder patched back to the unsafe plain-template pattern. A later full-suite candidate showed the same serialization hazard on regex escapes: newline replacement source failed with `missing /`, and an email regex lost its backslash escapes after save.
- Primary evidence:
  - Full-suite copied-workspace run `workflow-eval-2026-05-21T14-30-36.html` failed all four `cross-team-linear-report` success-path scenarios in `Prepare Ranked Report`.
  - The same run failed four `daily-slack-summary` scenarios in `Build Digest Input` for the same raw-newline-in-string Code node pattern.
  - Full-suite copied-workspace run `workflow-eval-2026-05-21T14-59-50.html` showed the builder trying `jsCode: String.raw` for `Aggregate Cross-Team Counts`, receiving `Unsupported syntax: 'TaggedTemplateExpression' is not allowed in SDK code`, and patching back to a workflow that still failed at Code node runtime.
  - Full-suite candidate snapshots from 2026-05-21 showed `contact-form-automation` failing in `Normalize Submission` with `missing /` after saved Code node source used `.replace(/\r?\n/g, '<br>')` and persisted an email regex with stripped backslash escapes.
  - Full-suite copied-workspace run `workflow-eval-2026-05-21T16-04-56.html` validated the tightened tool-builder guidance at aggregate scope: `contact-form-automation` recovered to `5/5`, `daily-slack-summary` stayed `5/5`, and the full suite reached `32/35`.

### N011 - Code nodes must avoid unavailable runtime modules

- Status: active builder prompt rule added on 2026-05-21
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SDK_CODE_RULES` shared by the tool and sandbox builder prompts
- Rule text:
  - Code nodes run in a restricted runtime. Do not use `require()` or `import` inside Code node source unless the fetched node definition explicitly documents that dependency as available. Do not require `luxon`; use plain JavaScript `Date` / `Intl` or n8n-provided date values such as `$now` / `$today` when appropriate.
- Why it was added:
  - A tool-built Code node required `luxon`, which passed workflow construction but was rejected when the eval executed the Code node.
- Primary evidence:
  - Full-suite copied-workspace run `workflow-eval-2026-05-21T14-30-36.html` failed `linear-bq-leaderboard` because `Validate Roster and Reporting Window` raised `Module 'luxon' is disallowed [line 1]`.

### N012 - List transforms must preserve itemized HTTP responses

- Status: active builder prompt rule added on 2026-05-21
- Prompt file: [src/tools/orchestration/build-workflow-agent.prompt.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts)
- Area: `SDK_CODE_RULES` shared by the tool and sandbox builder prompts
- Rule text:
  - When Code or transform logic consumes list-like HTTP output, account for n8n itemization. The upstream node may emit one n8n item per returned record, one item containing a top-level array, or one item whose `body` is an array. If downstream work should run once per returned record, preserve the itemized flow or inspect `$input.all()`; do not collapse to no work just because `$input.first()?.json` is a single object instead of an array.
- Why it was added:
  - The tool-mode rules did not carry the local sandbox itemization guardrail, so one full-suite workflow treated itemized GitHub issues as an empty list.
- Primary evidence:
  - Full-suite copied-workspace run `workflow-eval-2026-05-21T14-30-36.html` failed `github-notion-sync` `happy-path` because `Split Issues Into Items` read only `$input.first().json`, saw a single issue object, and returned zero Notion page items.

## Builder orchestration fixes

### O001 - Recover or report when the background builder never submits the main workflow

- Status: active runtime fix added on 2026-05-20
- Runtime file: [src/tools/orchestration/build-workflow-agent.tool.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.tool.ts)
- Test file: [src/tools/orchestration/__tests__/build-workflow-agent.tool.test.ts](/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/src/tools/orchestration/__tests__/build-workflow-agent.tool.test.ts)
- Behavior change:
  - If the detached builder finishes with a non-empty `/src/workflow.ts` but no recorded main-workflow submit attempt, the runtime now tries one automatic submit for the main workflow file.
  - If that auto-submit still cannot produce a successful attempt, the runtime now records an explicit failed build outcome for the work item instead of leaving verification with `No build outcome found`.
- Why it was added:
  - The leaderboard eval repeatedly failed before scenario execution because the background workflow-builder finished, but the root run never got a usable build outcome or submitted main workflow.
- Primary evidence:
  - `linear-bq-leaderboard` build failures where the report stopped at `The background workflow-builder task finished` and `I finished the run, but I did not generate a final response`.
  - Earlier traces showing `Error: workflow builder finished without submitting /src/workflow.ts.` and verifier failures with `No build outcome found for work item ...`.

## Candidate next rules

These are not yet added; they are tracked here so they can be evaluated and, if needed, promoted to numbered rules later.
