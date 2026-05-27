# Prompt Optimization Report

Date: 2026-05-21
Scope: Instance AI prompt-only eval improvement in the copied workspace, measured against the full 35-scenario workflow-generation suite with builder and orchestration prompt behavior as the active optimization surface.
Reviewer: Codex using the prompt-optimizer skill

## Evidence Sources

- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/plan-agent-prompt.ts`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/agent/system-prompt.ts`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/agent/shared-prompts.ts`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/evaluations/data/workflows/contact-form-automation.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/docs/workflow-generation-status-2026-05-21.md`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/docs/prompt-rule-log.md`
- `/private/tmp/instance-ai-prompt-evals/baseline-openai-external/eval-results.json`
- `/private/tmp/instance-ai-prompt-evals/hypothesis-1-branch-local-intake/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/create-a-workflow-that-handles-contact-form-submissions-via-a-we_missing-fields_2026-05-21T12-23-54-122Z.json`
- `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-1/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T14-30-36.html`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/get-all-the-linear-issues-created-in-the-last-2-weeks-filter-the_happy-path_2026-05-21T14-12-16-046Z.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/every-day-get-the-posts-made-in-the-past-day-on-3-different-slac_happy-path_2026-05-21T14-15-43-105Z.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/every-day-fetch-all-open-github-issues-from-repository-acme-corp_happy-path_2026-05-21T14-17-52-803Z.json`
- `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-2/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T14-59-50.html`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/get-all-the-linear-issues-created-in-the-last-2-weeks-filter-the_multi-team-creator_2026-05-21T14-36-05-799Z.json`
- `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-3/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T15-29-42.html`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/create-a-workflow-that-handles-contact-form-submissions-via-a-we_happy-path_2026-05-21T15-09-17-648Z.json`
- `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-4/eval-results.json`
- `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T16-04-56.html`

## Checklist

### 1. Scope And Evidence

- [DONE] Question: Has the LLM tool, agent, or workflow being reviewed been clearly identified?
  - Status: Pass
  - Current state: The review target is the copied Instance AI prompt stack evaluated on the full workflow-generation suite, with prompt edits constrained to builder and orchestration surfaces.
  - Expected: The review scope should name the benchmark and prompt surfaces being optimized.
  - Action: No action required.
  - Evidence: This report scope plus `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-1/eval-results.json`
- [DONE] Question: Is the complete prompt surface available, including system prompts, developer prompts, tool instructions, retrieved context, and conditional prompt fragments?
  - Status: Could not verify
  - Current state: The builder, planner, system, and shared prompt source files are available in the copied workspace; runtime assembly and injected node guidance have not yet been traced for this iteration.
  - Expected: Prompt changes should be reviewed against the assembled runtime prompt and any injected tool or node guidance that can affect builder behavior.
  - Action: Inspect the builder prompt assembly path if source-level edits do not move the eval failure cluster.
  - Evidence: `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/src/tools/orchestration/build-workflow-agent.prompt.ts`
- [TODO] Question: Is the final assembled prompt available for key scenarios, not only the source fragments?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [DONE] Question: Are representative traces, eval failures, support tickets, Slack discussions, or customer complaints available as review evidence?
  - Status: Pass
  - Current state: The copied workspace includes full-suite eval artifacts, stored failure snapshots, prompt rule history, generation status notes, and earlier filtered contact-form runs for narrow hypothesis testing.
  - Expected: Prompt hypotheses should be grounded in eval failures or traces rather than speculative prompt edits.
  - Action: Keep full-suite aggregate runs as the acceptance gate for prompt changes.
  - Evidence: `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-1/eval-results.json`; `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/docs/workflow-generation-status-2026-05-21.md`

### 2. Prompt As Product

- [TODO] Question: Is the desired product experience explicitly specified?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are the agent's core responsibilities and out-of-scope behaviors clear?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are important product tradeoffs explicit, such as speed vs thoroughness, autonomy vs approval, and brevity vs detail?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Is the clarification policy clear: when should the agent ask, and when should it proceed?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are escalation, refusal, handoff, or fallback behaviors specified where relevant?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 3. Prompt As Code

- [TODO] Question: Is the prompt organized into clear sections such as Background, Behavior, Tool Use, and Output?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are sections MECE: no important behavior missing, and no major duplicated responsibility across sections?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are behavior/process instructions separated from final output instructions?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are old or obsolete instructions removed instead of being preserved alongside newer ones?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Is there a clear review path for prompt changes, similar to product or code review?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 4. Contradictions

- [TODO] Question: Does the prompt contain direct contradictions?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Does the prompt contain soft contradictions, where two instructions imply competing behavior?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are there conflicts between base prompts, conditional prompts, tool instructions, examples, or retrieved context?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are there conflicts between written instructions and actual examples?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Do failed traces reveal contradictions in what the agent was asked to do?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 5. Ambiguity

- [TODO] Question: Are vague terms defined, such as "brief", "detailed", "relevant", "competitor", "urgent", "high quality", or "safe"?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are company-specific terms, acronyms, products, competitors, policies, and user types defined?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are "always" and "never" instructions scoped precisely?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are important conditional behaviors written with clear if/else-style logic?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Does Slack/internal research reveal recurring disagreement or confusion about what the agent should do?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 6. Behavior And Tool Use

- [TODO] Question: Does the prompt specify how the agent should work before producing the final answer?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Is it clear when the agent should use internal knowledge, retrieved context, tools, or external research?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are overlapping tools disambiguated?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are tool failure modes, retries, and user approval requirements handled?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Is it clear when the agent should stop researching and answer?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 7. Output

- [TODO] Question: Is the required output format explicit?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are tone, language, level of detail, and formatting requirements specified?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are forbidden output elements explicit?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are output examples consistent with the written output rules?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Is the final answer optimized for the product's actual user, not just the prompt author?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 8. Evals And Regression

- [DONE] Question: Are evals or trace checks mapped to the most important product behaviors?
  - Status: Pass
  - Current state: The contact-form eval exercises happy-path side effects, missing data handling, side-effect partial failure, empty content handling, and malformed email handling against the generated workflow.
  - Expected: Prompt changes should be checked against representative behavior failures instead of a build-only success signal.
  - Action: Use the same copied-server contact-form eval after each narrow prompt hypothesis before keeping the change.
  - Evidence: `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/evaluations/data/workflows/contact-form-automation.json`; `/private/tmp/instance-ai-prompt-evals/baseline-openai-external/eval-results.json`
- [TODO] Question: Do evals cover known failures, ambiguity, contradictions, tool choice, and output format?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are eval rubrics specific enough to force clear product decisions?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [DONE] Question: Is there a regression process before changing prompts or upgrading models?
  - Status: Pass
  - Current state: Prompt hypotheses are accepted or rejected with the same full 35-scenario workflow-generation suite on the copied server. Candidate 3 reached `26/35`, improving the saved `24/35` latest run and `25/35` saved best run. Candidate 4 kept the prompt-only Code-node source rule after the same suite reached `32/35` while restoring the contact-form cluster to `5/5`.
  - Expected: Prompt-only experiments should have a stable aggregate benchmark and should not be promoted from a single filtered scenario.
  - Action: Keep full-suite results as the promotion gate and use scenario snapshots only to explain aggregate changes and form the next prompt hypothesis.
  - Evidence: `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-3/eval-results.json`; `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T15-29-42.html`; `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-4/eval-results.json`; `/Users/tevfik/Desktop/Projects/n8n2/instance_ai_2_prompt_eval_work/packages/@n8n/instance-ai/.data/workflow-eval-2026-05-21T16-04-56.html`

### 9. Cost And Maintainability

- [TODO] Question: Are duplicated or low-value instructions removable?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are examples still necessary for the current model?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are expensive tool calls or long research workflows gated by clear criteria?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Can every instruction be assigned to exactly one prompt section?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are unresolved product decisions listed explicitly before refactoring?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

### 10. Prompt Caching

- [TODO] Question: Is the prompt structured so stable, reusable instructions appear before dynamic user/session-specific content?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO
- [TODO] Question: Are dynamic fields such as user name, language, locale, account attributes, retrieved context, and request-specific data isolated near the end of the prompt where possible?
  - Status: Could not verify
  - Current state: TODO
  - Expected: TODO
  - Action: TODO
  - Evidence: TODO

## Highest-Priority Refactor Actions

1. Keep planner empty/invalid contracts branch-local for multi-effect intake workflows unless the user explicitly requests whole-item rejection.
2. Keep the builder guardrail and pre-finish audit that distinguish side-effect eligibility from whole-item validity.
3. Keep the tool-builder Code-node serialization guardrail that avoids parser-rejected tagged templates, raw newline escapes, and escape-heavy embedded regex source.

## Suggested Validation

1. Compare the saved full-suite baselines with `/private/tmp/instance-ai-prompt-evals/full-suite-candidate-4/eval-results.json`.
2. Use the candidate 4 report to inspect the three remaining full-suite failures: Linear `unknown-creator`, leaderboard BigQuery credential execution, and workflow inventory `instanceId` preservation.
3. Run the same full Instance AI workflow eval suite after any next prompt-only hypothesis before keeping it.
