# Ailon Tusk roadmap: what "self-learning AI" can honestly mean here

This doc exists because the phrase "auto self-learning deep learning and
latest neuro pathways" was used to describe what should happen to Ailon Tusk
(RoamWise's AI copilot, `js/copilot/*.js`). Read this before proposing or
implementing anything under that banner — it draws a hard, explicit line
between the two very different things that phrase can mean for this specific
codebase, and commits to never blurring them in code, commit messages, or
user-facing copy.

## The blunt version

**RoamWise does not train, and cannot train, its own machine learning
model.** There is no training infrastructure in this repo, no labeled
dataset, no GPU or training budget, and no code path anywhere that updates a
neural network's weights. "Neuro pathways" is not a real technique this
codebase implements or could implement as a code change — building an actual
custom-trained travel model would be a multi-month, well-funded ML
engineering effort (data collection + labeling, training infra, evaluation,
safety review, hosting), categorically different from anything achievable in
a single PR to a static, no-bundler, classic-`<script>`-tag web app. Claiming
otherwise anywhere in this repo — in code comments, commit messages, or
in-app copy — would be fabricating a capability that does not exist, which
is exactly the kind of thing `js/copilot/tusk-knowledge.js`'s own header
comment already refuses to do for the older "learning layer" claim (see
"What already ships honestly" below). This doc extends that same honesty
discipline to the newer, bigger-sounding ask.

What RoamWise actually is, per `js/copilot/ai-providers.js` and
`js/copilot/agent.js`: a thin, provider-agnostic HTTP client that calls
*other people's* already-trained LLMs (Groq, Cerebras, GitHub Models,
Gemini, OpenRouter, Mistral, Anthropic — whichever the user has a free key
for) and a deterministic, hand-written fallback engine
(`js/copilot/core.js`'s `cpParseRegex`/`cpSmartAnswer`, `js/copilot/
tusk-knowledge.js`'s Wikivoyage lookups) for when no key is configured. There
is no model of RoamWise's own to "train" — every actual language-generation
step happens on a third-party server RoamWise doesn't control and has no
weights access to.

## What "self-learning" CAN realistically mean here

None of these require training a model. All of them are either already
shipped (marked ✅ below) or are concrete, buildable next steps using only
what this repo already has:

1. **Prompt and context improvement based on real usage feedback.**
   `js/copilot/rich-reply.js`'s `cpFinish()` already renders a 👍/👎 row
   under every bot reply (`rwTuskFeedback`, tracked anonymously, no per-message
   record — see `js/misc/engagement.js`). ✅ shipped. The realistic next step
   is a human (or a future AI session) periodically reading the aggregate
   feedback-vs-topic breakdown and adjusting the system prompt in
   `js/copilot/core.js`'s `copilotSend()` accordingly — a manual,
   reviewed edit, not an automatic one (see "What this does NOT mean," below).

2. **Retrieval-augmented grounding**, i.e. answering from real, checkable
   data instead of an LLM's own (possibly wrong or stale) recollection.
   Already the core design of this subsystem: `js/copilot/tusk-knowledge.js`
   fetches live Wikivoyage guide text before answering (`wvGuide`/`wvAnswer`),
   `js/copilot/core.js`'s `copilotSend()` grounds the AI-model path in that
   same fetched guide text plus `RW_PLACE_FACTS` curated overrides before
   ever calling the LLM, and `js/itinerary/ground-truth.js`'s terrain/road-time
   tables correct for a specific, named, previously-observed LLM failure mode
   (claiming Himalayan roads move at plains speed). ✅ shipped, and extended
   in this pass: the Ailon Tusk **agent** (`js/copilot/agent.js`) now has a
   `destination_facts` tool that looks a place up directly in the curated
   `DB` (`js/data/destinations.js`) — best months, typical daily cost,
   signature food, hidden gems, ground-truth local advice — instead of
   trusting the model's own memory for a specific place's facts. This is the
   single highest-leverage "self-improving" lever available in an
   LLM-API-based product: every fact you can hand the model instead of
   letting it guess is a fact it can no longer hallucinate.

3. **Expanding tool use** — giving the agent more real, safe, well-scoped
   actions to take against the app's own data and features, rather than
   letting the model narrate things it can't actually do.
   `js/copilot/agent.js`'s `RW_AGENT_TOOLS`/`RW_AGENT_IMPL` already covers
   booking search, partner lookup, budget math, travel-time estimation,
   cycle-safety checks, PNR parsing, and (as of this pass) curated
   destination facts. Genuine, safe next candidates (not implemented this
   pass — see "Proposed, not implemented" below) include a tool over
   `itinerary-library/`'s cinematic presets and a tool that surfaces a
   trip's existing `js/itinerary/build.js` itinerary back to the agent so it
   can reason about a plan the user already built instead of only ever
   starting from zero.

4. **A lightweight, eval-driven feedback loop** — a fixed, repeatable test
   suite that scores the agent's real behavior (not vibes) after a prompt or
   tool change, so "this change made Tusk better" is a checkable claim
   instead of an assertion. `js/copilot/agent-evals.js` (`RW_EVALS`/
   `rwEvalRun`/`rwEvalScore`) already implements exactly this — it existed
   before this pass but was reachable only via a hidden in-app "Agent evals
   (DEV)" drawer link, never wired into any script or CI. **This pass wires
   it into `npm run evals`** (see "What was implemented," below) so it's an
   actual, runnable, checkable signal a human or future AI session can use
   before/after changing `agent.js`/`agent-evals.js`/the system prompt — the
   realistic version of "self-improving": a human iterates using a real
   measurement, the system does not train itself.

## What "self-learning" CANNOT mean here

- **No custom neural network of any kind gets trained, fine-tuned, or
  distilled in this repo.** There is no training loop, no GPU/TPU access, no
  labeled dataset, and no code path that could produce one from a browser or
  a static-hosting deploy pipeline.
- **No "neuro pathways."** This is not a real, buildable technique for this
  product — it would require dedicated ML infrastructure this project has
  never had and was never scoped to build.
- **No runtime prompt/behavior mutation based on live user data without
  human review.** Per this task's explicit instruction, nothing in this pass
  makes the app silently rewrite its own system prompt, tool set, or
  persona based on what users type. That would be an unreviewed,
  unpredictable production behavior change to a live product serving real
  people's travel plans and (via `js/payments/`) real payments — exactly the
  kind of change `AI-ROLES-AND-HANDOFF.md` rule 7 and `CLAUDE.md`'s
  "behavior changes need separate review" rule exist to prevent. If a future
  session wants to explore this, it must be a specific, human-reviewed
  proposal (see below), never a background job that edits prompts on its
  own.

## What already ships honestly (for context — not new in this pass)

`js/copilot/tusk-knowledge.js`'s header comment already draws a version of
this same line for the existing "learning layer": *"The 'learning' is real
but modest and honestly named: every guide fetched is cached on the device,
and every place the traveller actually engages with is counted, so answers
get faster and ordering gets more personal the more the app is used. No
model weights are trained in a phone browser."* `js/copilot/core.js`'s
`rwLearnIntent`/`rwUserProfile` do the same for per-device vibe/budget/day
preferences — a local counter, not a model. This doc doesn't change any of
that; it extends the same discipline to the newer "deep learning / neuro
pathways" ask and to the agent/eval subsystem specifically.

## What was implemented in this pass

1. **This roadmap doc** — the honest scoping above.
2. **`npm run evals`** (`tools/run-evals.js`) — wires the previously-unused
   `js/copilot/agent-evals.js` eval harness into a runnable CLI. It loads the
   real, unmodified `js/copilot/agent.js`/`agent-evals.js` source (plus
   their real data dependencies — `js/data/destinations.js`,
   `js/copilot/core.js`, `js/itinerary/ground-truth.js`,
   `js/booking/pnr-parser.js`) into a small Node `vm` sandbox and calls the
   real `rwEvalRun`/`rwEvalScore`. Requires a real tool-calling provider key
   (`GROQ_API_KEY`, `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, or
   `MISTRAL_API_KEY` in the environment) since it makes live, billed LLM
   calls — by design, this is **not** wired into `npm test`/`npm run
   check`/CI, so a commit is never blocked on a live third-party API being
   reachable or a provider key being present in CI secrets. Run it by hand
   after changing the agent loop, its tools, or its system prompt, to get a
   real before/after signal instead of a guess. Covered by
   `tests/agent-evals-runner.test.js` (deterministic, mocked-fetch,
   no real key needed — checks the wiring, not model quality).
3. **A new agent tool: `destination_facts`** (`js/copilot/agent.js`) —
   queries the curated `DB` in `js/data/destinations.js` (via the existing
   `cpDbFind()` lookup already used elsewhere in the copilot) for best
   months, typical daily cost, signature food, hidden gems, and ground-truth
   local advice, so the agent can answer specific-place factual questions
   from RoamWise's own verified data instead of the model's own memory. The
   system prompt now instructs the agent to call it before stating any such
   fact, mirroring the existing `estimate_travel_time`-before-any-duration-
   claim rule. Added as `e11` to the eval suite (`js/copilot/
   agent-evals.js`) so its actual usage is measured, not just assumed.
   Covered by a unit test in `tests/agent-evals-runner.test.js`.
4. **A genuine reliability fix in `rwAgentCall`** (`js/copilot/agent.js`) —
   the function every agent step's LLM call goes through had no request
   timeout at all (unlike `js/copilot/ai-providers.js`'s `aiRequest`, which
   aborts after 15s) and tried exactly one tool-calling provider with no
   fallback (unlike that same file's `aiCallAny`, which tries every armed
   provider before giving up). A single stalled connection used to hang the
   whole agent loop indefinitely — the step ceiling in `rwAgentRun` only
   counts completed steps, not elapsed time, so it could not rescue a call
   that never returns. Fixed to abort after 20s and fall through to the next
   configured tool-calling provider on a timeout or an auth/quota-shaped
   error, mirroring the "one provider failing must never take the answer
   down" rule `aiCallAny`'s own comment already states for the rest of the
   app. Covered by `tests/agent-tool-loop.test.js` (mocked fetch —
   verifies both the fallback and the timeout-handling path).

## Proposed, not implemented (needs a human decision first)

- **A cinematic-preset lookup tool** over `itinerary-library/`'s presets
  (`itinerary-library/data/`, `itinerary-library/preset-loader.js`), so the
  agent could ground a plan in a curated preset itinerary instead of
  building one from scratch every time. Not implemented this pass — the
  preset library has its own integration contract (see
  `itinerary-library/README.md`) and deserves a scoped look at how a preset
  should be presented/attributed before wiring it into the agent loop.
- **An "existing itinerary" tool** that lets the agent read back a trip the
  user already built via `js/itinerary/build.js`/`js/itinerary/trip-vault.js`,
  so follow-up questions ("what's day 3 again?") can be answered from the
  user's own saved plan instead of re-deriving one. Not implemented —
  needs a decision on how much of a saved trip's data (which may include
  named companions, exact dates) is safe to hand to a third-party LLM
  provider as tool-call context.
- **CI-gated evals.** Right now `npm run evals` is manual-only, on purpose
  (see above). Turning it into a CI check would need: (a) a low-cost,
  low-quota provider key checked into repo/CI secrets, (b) a decision on
  what score threshold should block a merge given the harness's own
  documented run-to-run variance ("these are real runs against live
  providers... never round up"), and (c) sign-off that occasional live-API
  flakiness failing CI is an acceptable tradeoff. None of that is decided
  yet — proposing it here rather than deciding it unilaterally.
- **Prompt auto-tuning from aggregate feedback.** Per "What this does NOT
  mean" above, any system that would adjust `copilotSend()`'s system prompt
  or `agent.js`'s tool set based on live 👍/👎 feedback trends must stay a
  human-reviewed edit, never an automatic one. If a future session wants to
  build tooling that *summarizes* feedback trends for a human to act on
  (e.g., "topic X gets 👎 40% of the time, here's a sample of those
  replies"), that's a reasonable, safe addition — but the prompt edit itself
  must remain a separate, reviewed commit.

## Not done / not realistic without X

- **Custom-trained travel model**: not realistic without dedicated ML
  infrastructure (data pipeline, labeling, training compute, hosting, safety
  review) this project has never had — a multi-month, well-funded effort,
  not a code change.
- **"Neuro pathways"**: not a real, implementable technique for this
  codebase; not attempted.
- **Automatic runtime prompt/behavior mutation from user data**: deliberately
  not built — would be an unreviewed production behavior change (see
  above). Proposed as a human-in-the-loop tool instead, not implemented.
- **CI-gated live-provider evals**: not done — needs a funded key + an
  explicit human decision on acceptable live-API flakiness in CI, not just a
  code change (see "Proposed, not implemented" above).
