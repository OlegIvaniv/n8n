# Prompt Rule Log

Stable IDs for prompt guardrails added during eval-driven iteration.

Rules should keep their IDs permanently once introduced. New rules should be appended
with the next available `N###` identifier instead of rewriting or renumbering existing
entries.

## Planner Prompt Contract

The reference branch also changed the planner prompt so workflow items carry a
structured behavioral contract instead of freeform prose. This is active in
`src/tools/orchestration/plan-agent-prompt.ts`.

- Workflow `purpose` now uses fixed labels: `Outcome`, `Trigger mode`,
  `External systems`, `Required effects`, `Required branches`, `Required data`,
  `Explicit constraints`, `Empty/invalid behavior`, and `Done when`.
- Checkpoint `instructions` mirror the same contract with `Verify ...` labels
  and a `Pass condition`.
- The planner is explicitly told to preserve required side effects, branch
  behavior, downstream data requirements, and user-provided identifiers without
  naming nodes or inventing implementation details.
- Why it was added:
  - Planner output needed to separate what the workflow must do from how the
    builder implements it, so builder/checkpoint quality problems could be
    inspected and fixed more reliably.

## Builder Prompt Guardrails

### N001 - Decision inputs must come from stable normalized data

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When later branching, validation, or user-facing responses depend on normalized input facts, do not read those decision inputs from side-effect node outputs unless that output is explicitly required. Make the decision from the normalized source data, branch before the side-effect node, or explicitly preserve the fields needed for the later decision.
- Why it was added:
  - Contact-form workflows were making reply / response decisions from Telegram output instead of the normalized submission payload.

### N002 - Mutually exclusive branches must yield one downstream item per source item

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When branches are mutually exclusive outcomes for the same source item (for example attempted vs skipped, success vs fallback, valid vs invalid), downstream side effects must receive exactly one item per original source item. Do not append-merge both branch outputs into later notification, write, or response nodes. Rejoin into a single enriched item or route only the selected branch onward while preserving the original source data.
- Why it was added:
  - Contact-form workflows fixed the lost-field bug, but then duplicated Telegram/Sheets side effects by append-merging both attempted and skipped email branches.

### N003 - Independent side effects must degrade gracefully

- Status: reverted from active builder prompt on 2026-05-19
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When a workflow has multiple required side effects from the same source item or run, do not let a non-critical notification or delivery failure abort unrelated required actions unless the user explicitly asked for all-or-nothing behavior. Isolate expected destination or API failures with continue-on-fail behavior or an explicit error branch so other independent outputs can still complete.
- Why it was reverted:
  - This broader rule helped some individual cases but hurt full-suite stability.

### N004 - Validate at the narrowest scope necessary

- Status: reverted from active builder prompt on 2026-05-19
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - Validate at the narrowest scope necessary. Do not let one missing or invalid field block unrelated required actions unless the user explicitly asked for full rejection or all-or-nothing behavior. Distinguish between whether the input/run should continue, whether a specific branch is eligible, and whether a specific side effect can execute. If a field is only required for one branch, skip or reroute that branch while preserving other actions that can still run with the available data.
- Why it was reverted:
  - This broader rule helped some individual cases but hurt full-suite stability.

### N005 - Independent dataset fetches must join once on stable keys

- Status: reverted from active builder prompt on 2026-05-20
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When combining independent datasets from multiple systems, fetch each source once at the intended scope unless the task explicitly requires per-item fan-out. Do not accidentally place one source fetch downstream of rows from another source so it repeats per row. Before aggregating, ranking, or joining, preserve a canonical join key and confirm both inputs use the same key/value shape. Required query, filter, and request-body fields must not be submitted empty.
- Why it was reverted:
  - This broader rule helped some individual cases but hurt full-suite stability.

### N006 - Required non-secret identifiers must be preserved, not placeholdered

- Status: reverted from active builder prompt on 2026-05-20
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - Required non-secret identifiers must not be left as generic placeholders. If the prompt provides concrete IDs, table names, dataset names, channel IDs, URLs, or example query identifiers needed to make a node valid, preserve and use them literally unless they are clearly secrets. Only leave placeholders for actual credentials, secrets, or values that are genuinely missing or ambiguous.
- Why it was reverted:
  - This broader rule helped some individual cases but hurt full-suite stability.

### N007 - Fetch field-complete external data before depending on it downstream

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When downstream logic depends on specific related fields, labels, nested properties, or filters from an external system, do not assume a service-native node returns those fields by default. Fetch the exact fields explicitly using a node configuration that guarantees them; if the native node cannot clearly provide the required fields or query shape, use HTTP Request or the service API directly instead of a more convenient native node. Downstream code must only rely on fields that the upstream fetch is configured to return.
- Why it was added:
  - The builder regressed from a working HTTP Request / GraphQL Linear fetch to a native Linear node that did not provide the creator and team fields the report logic depended on.

### N008 - Keep empty, success, and failure source states distinct when combining channels or feeds

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - When a workflow reads from multiple independent sources and then combines the results, keep empty results, successful reads, and failed reads distinct. An empty result is a successful read with zero items, not a failure. If one source is allowed to fail without stopping the workflow, configure that source node to continue on fail or use an error output, and create a failure record only from the real error path. For each source, downstream merge or aggregation must receive either successful data or one failure record, never both. When some sources succeed and others fail, continue with the successful sources and include a clear note about the failed sources in the final output.
- Why it was added:
  - Empty Slack channels and successful channels were being mixed with synthetic failure records, so good data was discarded downstream.

### N009 - Multi-effect intake validation must stay branch-local

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SANDBOX_WORKFLOW_RULES` -> `Trust empty item lists - don't synthesize fake items`
- Rule text:
  - For multi-effect intake workflows, separate whole-item rejection from side-effect eligibility. A missing or invalid value needed by one requested effect must gate or fail that effect only; do not block logging, notifications, acknowledgements, or other effects that can use the remaining data unless the user explicitly requires whole-item rejection or every requested effect truly requires that value. Fields used only for message or log content may be empty or use a fallback without making the item invalid.
- Why it was added:
  - The planner and builder were converting branch-specific contact form field problems into workflow-wide invalid submissions.

### N010 - Embedded Code node source must stay parseable at Code node runtime

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area:
  - `TOOL_CODE_NODE_SOURCE_RULES` for the `build-workflow` tool builder path
  - `SANDBOX_CODE_NODE_SOURCE_RULES` for the sandbox builder path
- Rule text:
  - Keep embedded Code node source parseable at both `build-workflow` time and Code node runtime. In this tool-builder path, do not use tagged templates such as `String.raw` for `jsCode` / `pythonCode`; the workflow parser rejects them. Avoid nested Code-node template literals, use parser-safe multiline text construction such as `const LF = String.fromCharCode(10);` with `lines.join(LF)` instead of newline escapes that can become raw line breaks inside Code node string literals, and avoid regex literals or other escape-heavy Code node source when ordinary string or character helpers are sufficient.
  - In sandbox mode, prefer `String.raw` for `jsCode` / `pythonCode` because the workflow TypeScript runs through `tsx` and tagged templates preserve escapes for the saved Code node source.
- Why it was added:
  - Several full-suite tool-built workflows built Code nodes that later failed to parse at execution time.

### N011 - Code nodes must avoid unavailable runtime modules

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SDK_CODE_RULES` shared by the tool and sandbox builder prompts
- Rule text:
  - Code nodes run in a restricted runtime. Do not use `require()` or `import` inside Code node source unless the fetched node definition explicitly documents that dependency as available. Do not require `luxon`; use plain JavaScript `Date` / `Intl` or n8n-provided date values such as `$now` / `$today` when appropriate.
- Why it was added:
  - A tool-built Code node required `luxon`, which passed workflow construction but was rejected when the eval executed the Code node.

### N012 - List transforms must preserve itemized HTTP responses

- Status: active builder prompt rule
- Prompt file: `src/tools/orchestration/build-workflow-agent.prompt.ts`
- Area: `SDK_CODE_RULES` shared by the tool and sandbox builder prompts
- Rule text:
  - When Code or transform logic consumes list-like HTTP output, account for n8n itemization. The upstream node may emit one n8n item per returned record, one item containing a top-level array, or one item whose `body` is an array. If downstream work should run once per returned record, preserve the itemized flow or inspect `$input.all()`; do not collapse to no work just because `$input.first()?.json` is a single object instead of an array.
- Why it was added:
  - One full-suite workflow treated itemized GitHub issues as an empty list.

## Builder Orchestration Fixes

The SDK-migration branch already contains the `O001` runtime behavior, so this
merge does not reapply the old runtime diff. The prompt-side completion checks
from the reference branch are applied instead:

- Tool and sandbox builders must trace from trigger to the final user-facing
  outcome before declaring completion.
- Sandbox builders must not treat submitted chunk workflows as completion until
  the task's main workflow file has been submitted.
- Sandbox builders must preserve explicit user-provided resources and node
  choices, rather than replacing them with placeholders or more convenient
  native alternatives.
- Sandbox builders must repair repeated generated-source syntax errors and
  ensure structurally valid node `parameters` before submit.

### O001 - Recover or report when the background builder never submits the main workflow

- Status: active runtime fix
- Runtime file: `src/tools/orchestration/build-workflow-agent.tool.ts`
- Test file: `src/tools/orchestration/__tests__/build-workflow-agent.tool.test.ts`
- Behavior change:
  - If the detached builder finishes with a non-empty `/src/workflow.ts` but no recorded main-workflow submit attempt, the runtime tries one automatic submit for the main workflow file.
  - If that auto-submit still cannot produce a successful attempt, the runtime records an explicit failed build outcome for the work item instead of leaving verification with `No build outcome found`.
- Why it was added:
  - The leaderboard eval repeatedly failed before scenario execution because the background workflow-builder finished, but the root run never got a usable build outcome or submitted main workflow.

## Candidate Next Rules

These are not yet added; they are tracked here so they can be evaluated and, if needed, promoted to numbered rules later.
