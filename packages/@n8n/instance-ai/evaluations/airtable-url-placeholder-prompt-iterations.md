# Airtable URL Placeholder Prompt Iterations

Date: 2026-05-12
Scope: Prompt-only iterations to stop the Instance AI builder from replacing a user-provided Airtable HTTP Request URL with `<__PLACEHOLDER_VALUE__Airtable API endpoint URL__>`.
Eval target: `airtable-split-to-slack`
Eval command:

```bash
cd /Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai
pnpm exec dotenvx run -f ../../../.env -f ../../../.env.local -- \
  pnpm eval:instance-ai --filter airtable-split-to-slack --verbose
```

## Baseline Context

- Failure observed in the generated workflow:
  - `Fetch Airtable Tasks.parameters.url`
  - value: `<__PLACEHOLDER_VALUE__Airtable API endpoint URL__>`
- The Airtable eval prompt already supplies the literal URL:
  - `https://api.airtable.com/v0/app123abc/Tasks`
- Working hypothesis before Round 1:
  - Existing prompt guidance overgeneralizes URL placeholders and does not strongly preserve prompt-provided literal URLs.

## Iteration Log

### Round 1
- Hypothesis: The URL placeholder issue is fixed, but the workflow still fails because the builder turns the prompt-provided Slack channel name `#daily-tasks` into an invalid `channelId` resource locator with `mode: "id"` and a placeholder value. If the resource-locator prompt explicitly preserves named Slack channels with `mode: "name"`, the workflow should get past the Slack channel validation error.
- Prompt change: Updated `packages/@n8n/workflow-sdk/src/prompts/node-guidance/parameter-guides/resource-locator.ts` to say that prompt-provided Slack channel names like `#daily-tasks` should use `mode: "name"` with the exact channel name, and should not be rewritten into ID-mode placeholders.
- Test result: Infrastructure-invalid. The filtered Airtable eval finished almost immediately with `BUILD FAILED` and `No workflow produced — no error details captured`. A run snapshot showed the orchestrator errored before building: `Cannot connect to API: connect EPERM ...:443`. This was caused by the locally restarted n8n process running inside the sandbox, not by the prompt change.

### Round 2
- Hypothesis: Round 1 may have hit a transient no-build failure unrelated to the prompt tweak. Re-running the exact same prompt without another change should show whether the resource-locator guidance is effective once the agent actually produces a workflow.
- Prompt change: None. Control rerun against the Round 1 prompt state.
- Test result: Infrastructure-invalid. The control rerun failed in the same way: no workflow, with the run snapshot again showing `Cannot connect to API: connect EPERM ...:443`. This confirmed the issue was the sandboxed server process, not prompt behavior.

### Round 3
- Hypothesis: With the n8n server restored outside the sandbox, the Round 1 resource-locator prompt change should finally be testable. The Airtable workflow should build, preserve the prompt-provided URL, and avoid the previous invalid Slack ID-mode placeholder by using a name-mode resource locator for `#daily-tasks`.
- Prompt change: None beyond the Round 1 resource-locator guidance already built into `@n8n/workflow-sdk`.
- Test result: Builder fix confirmed, verifier still blocked the eval. The filtered Airtable run completed against the restored server, built a workflow with the literal Airtable URL `https://api.airtable.com/v0/app123abc/Tasks`, and preserved the Slack channel name as `#daily-tasks` instead of the prior invalid ID placeholder. Execution itself succeeded for both scenarios (`execErrors: []`, scenario success marked true in `eval-results.json`), but the final eval still failed because the checklist verifier returned no parseable structured result: `No verification result — LLM verifier returned empty`.

### Round 4
- Hypothesis: The verifier is failing because its prompt says to return a bare JSON array, while the verifier runtime's structured schema expects an object shaped like `{ "results": [...] }`. Aligning the prompt with the actual schema should stop the empty-parser failures and allow the already-successful Airtable execution to score correctly.
- Prompt change: Updated `packages/@n8n/instance-ai/evaluations/system-prompts/mock-execution-verify.ts` to require a JSON object with a top-level `results` array, matching the verifier schema used by the eval runner.
- Test result: Failed. The Airtable workflow still built and executed, but both scenarios again ended with `No verification result — LLM verifier returned empty`. This showed the top-level shape mismatch was not the only verifier-prompt contract problem.

### Round 5
- Hypothesis: The verifier prompt's pass example still violates the runtime schema by setting `"failureCategory": null` and `"rootCause": null`, while the schema allows those fields only as strings or omitted. Removing the null-valued optional fields from successful examples should make structured parsing viable.
- Prompt change: Updated the successful verifier example to omit optional failure-only fields and added an explicit instruction to omit `failureCategory` and `rootCause` for passing results instead of returning `null`.
- Test result: Failed as a clean parser fix. The verifier still returned no parseable results. This full eval also introduced unrelated builder variance: the generated Airtable workflow itself was invalid at execution time (`The workflow has issues and cannot be executed for that reason`), so this round is not useful for judging workflow quality. It does still confirm that the verifier prompt remains unable to produce parseable checklist results.

### Round 6
- Hypothesis: The remaining failure is still isolated to verifier structured-output compliance, but the full eval is too slow and noisy for iteration. A direct verifier-only reproduction using `verifyChecklist()` with a minimal artifact should fail in the same way while giving a much faster loop for prompt tuning.
- Prompt change: None. Control reproduction against the current verifier prompt.
- Test result: Confirmed. The direct verifier probe returned `[]` after two `produced no parseable results` attempts. This proves the verifier-output problem reproduces without rebuilding or executing a workflow, so subsequent rounds can use the faster verifier-only loop.

### Round 7
- Hypothesis: The current output section over-specifies raw JSON text, while the underlying agent runtime is already using a structured-output schema. Reframing the instruction around “always respond with the structured output schema” and removing code-fence-style examples should align the prompt with the runtime mechanism more closely.
- Prompt change: Reworked the verifier output section to explicitly require the structured-output schema, forbid prose/code fences outside it, require exactly one result per checklist item, and describe the expected object shape in plain terms instead of relying on fenced JSON examples.
- Test result: Failed. The direct verifier probe still returned `[]` after two no-parse attempts, so simply restating the structured-output contract in prose was not enough.

### Round 8
- Hypothesis: The verifier may need an explicit schema signature in the prompt, not only a prose description. Writing the exact object shape and allowed failure categories in a compact type-like form should make the intended structure easier to follow.
- Prompt change: Added a concise schema signature for the required output object and the allowed `failureCategory` values directly in the verifier prompt.
- Test result: Failed. The direct verifier probe still returned no parseable results.

### Round 9
- Hypothesis: The verifier prompt is long and the output contract appears only at the end. Moving the structured-output requirement to the top as the highest-priority instruction should improve adherence.
- Prompt change: Added a top-of-prompt `Output contract` section that repeats the structured-output requirement, the exact `results` container, and the one-result-per-checklist rule before any domain guidance.
- Test result: Failed. The direct verifier probe still returned no parseable results.

### Round 10
- Hypothesis: The verifier prompt may be overlong and over-specified for the structured-output path. A shorter, more direct evaluator prompt that preserves only the critical mock-execution rules and output contract should be easier for the model/runtime combination to satisfy.
- Prompt change: Replaced the verbose verifier prompt with a compact prompt focused on: evaluating checklist items, not penalizing expected mock execution, distinguishing builder/mock/framework issues, and returning exactly one structured result per checklist item.
- Test result: Failed. The direct verifier probe still returned no parseable results, so reducing prompt length alone did not fix the contract.

### Round 11
- Hypothesis: The verifier may need a concrete canonical pass example, not just the abstract contract. Adding a single compact one-item example should reduce ambiguity around the expected populated `results` array.
- Prompt change: Added one concise pass-example line that shows a one-item checklist producing one structured result object.
- Test result: Failed. The direct verifier probe still returned no parseable results.

### Round 12
- Hypothesis: The model may still be drifting into natural-language evaluation instead of treating the schema as the only acceptable completion channel. A stronger imperative that it must fill the schema and never answer in prose may help.
- Prompt change: Added explicit instructions that the verifier's job is to populate the structured schema only, never provide a conversational answer, and always emit one result when one checklist item is present.
- Test result: Failed. The direct verifier probe still returned no parseable results. A raw debug call then showed the request is failing before model generation with an HTTP 400 invalid JSON schema error from the Responses API.

### Round 13
- Hypothesis: If the prompt's references to `failureCategory` and `rootCause` are somehow contributing to the structured-output failure, removing those instructions entirely should change the outcome.
- Prompt change: Removed the optional failure-field guidance from the concise verifier prompt so the visible prompt contract only asks for `id`, `pass`, and `reasoning`.
- Test result: Failed in the same way, with a stronger diagnosis. The API call returned HTTP 400 before model generation: `Invalid schema for response_format 'response' ... Missing 'failureCategory'`. Since the prompt no longer mentioned that field, the source is the runtime-generated response schema, not the prompt text.

### Round 14
- Hypothesis: If the verifier prompt is reduced to an almost trivial structured-output instruction and the same schema error persists, that conclusively shows prompt complexity is irrelevant to the present blocker.
- Prompt change: Replaced the verifier prompt with a one-line minimal instruction: return the structured output schema and include one result per checklist item.
- Test result: Failed with the same HTTP 400 schema rejection before model generation. This confirms prompt complexity is not the blocker.

### Round 15
- Hypothesis: After proving the blocker is outside prompt text, restore the original richer verifier prompt so the repo does not retain an experimentally degraded evaluator prompt. The same pre-generation schema error should remain, confirming prompt content is orthogonal to the failure.
- Prompt change: Restored the original detailed verifier prompt.
- Test result: Confirmed. The raw verifier control still failed before generation with the same HTTP 400 response-format schema error: `Missing 'failureCategory'`.

## Conclusion After Round 15

- Prompt-only work did improve the workflow builder earlier:
  - The Airtable URL placeholder issue was fixed.
  - The Slack channel resource-locator issue was fixed.
- The remaining eval failure is no longer a prompt-compliance problem.
- A direct verifier control showed:
  - Minimal standalone structured output with the same model/provider works correctly.
  - The verifier-specific structured-output request fails before model generation with:
    - `Invalid schema for response_format 'response'`
    - `Missing 'failureCategory'`
- That error comes from the runtime-generated strict JSON schema for the verifier result shape, not from prompt wording.
- I restored the verifier prompt to its original detailed form after the diagnostic rounds so the repo does not retain an experimentally degraded prompt.
- Prompt-only iteration cannot make the verifier pass from this point. The next required fix is outside the prompt surface: the verifier structured-output schema must be made compatible with strict response-format requirements.

## Follow-up Fix Applied

- The verifier schema was updated to make `failureCategory` and `rootCause` required-but-nullable in `evaluations/checklist/verifier.ts`.
- The verifier prompt examples were updated to match the actual structured object shape with a top-level `results` array and explicit `null` values on passing results.
- Direct verifier control now succeeds and returns a parsed result instead of `[]`.
- The filtered Airtable eval now reaches real verifier scoring instead of `verification_failure`.
- Latest end-to-end result:
  - Report: `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-12T16-44-09.html`
  - Outcome: `0/2` pass, both failures now correctly diagnosed as `builder_issue`
  - Root cause in that run: the generated Slack node used an invalid channel placeholder / invalid Slack channel ID instead of a valid locator for `#daily-tasks`
