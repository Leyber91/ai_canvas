# AI Canvas — Roadmap

Generated 2026-06-16 from a 6-lens panel (engine, agentic frontier, computation-made-visible,
the AEA/"understanding-AI" thesis, product/income, and a devil's advocate), then synthesized.
Companion to `DEVELOPMENT_BACKLOG.md` (what to fix) — this is *what it could become*.

Evidence tags: **[PROVEN]** already true in the code · **[PLAUSIBLE]** direct extension of what
exists · **[SPECULATIVE]** a real reach.

---

## North star

> ai_canvas is the instrument that makes a model's reasoning **legible and comparable** — a
> provider-agnostic canvas where chain-of-thought is a first-class, inspectable, diffable object —
> **not** another flow-builder competing on orchestration breadth.

## The honest moat (and where it isn't one)

The differentiator is the **provider-agnostic reasoning-trace layer** (`backend/app/services/reasoning.py`
+ `static/js/ui/reasoning.js`, ~160 LOC) turned into a *deliberation and observability surface*:
chain-of-thought as a normalized, node-attached, routable, diffable object. It's defensible because
(a) it solves an annoying cross-provider normalization problem once — `reasoning_content` vs inline
`<think>`, including Groq dumping DeepSeek-R1 think-tags raw — and (b) treating a trace as **structured
input** to a downstream judge, or as a **side-by-side diff** across models, is something no flow-builder
ships. A chat box has no edges to annotate; a flat LangSmith-style trace has thrown the topology away.
Graph-native reasoning attribution is structurally hard for either to clone.

Where it is **honestly just another flow-builder**: the node editor, the topological DAG executor,
cycle detection, three-provider switching, SQLite persistence, save/load — all commodity that
LangGraph / n8n / Flowise / Dify / LangFlow do with funding, docs, and a community. **As a general
agent-building runtime or a hosted SaaS it loses on every axis.** Every roadmap item must defend the
reasoning/legibility thesis or it is scope inflation. The differentiator is ~160 LOC; the rest is the
demo harness, not the moat.

## Principles the architecture already shows

1. **Mechanism over magic** — a model's hidden chain-of-thought is captured as a normalized, storable,
   renderable object instead of an opaque side effect. Legibility *as architecture*, not slideware.
2. **Provider-pluralism as a seam, not a feature** — ollama/groq/nvidia sit behind one identical
   `process_node(node, parent_contexts, history, conversation)` signature. The engine is genuinely
   provider-agnostic at the execution boundary. [PROVEN]
3. **Composition is the program** — a node is a fully-specified model-call; an edge is a typed channel
   passing a parent's output to a child. The graph *is* the executable, walked parent-before-child by
   topological sort. [PROVEN]
4. **A run should be an artifact, not a transient** — order, resolved inputs, reasoning, and outputs are
   data you can persist, replay, and diff. Debugging a runtime, not redrawing a canvas.
5. **Honest scope** — the differentiator is small and defended; the substrate is commodity and
   deliberately *not* expanded into a platform.

---

## Three horizons

### H1 — next: make the reasoning layer THE product surface (and bank it as portfolio in the same move)

The differentiator already exists and the multi-provider plumbing was hardened this session. The DAG
already executes parallel siblings, so this is **reuse, not new architecture** — highest value-per-effort,
and it doubles as job-hunt evidence and newsletter content (one artifact, three returns).

- **Reasoning-diff view** — one prompt fanned to 2–4 reasoning models across Ollama/Groq/NVIDIA, traces
  rendered **side-by-side in columns** (word-count signal + final answer below), reusing `splitReasoning`
  + `renderReasoningTrace` verbatim. [PLAUSIBLE]
- **Per-node cost/latency/token meters** — return `{content, usage:{prompt_tokens, completion_tokens},
  latency_ms, model}` from each `process_node` (wrap `requests.post` in a timer; map Ollama
  `eval_count`/`eval_duration`). The JSON is *already parsed at `groq_service.py:217` and dropped at `:227`*.
  [PLAUSIBLE]
- **Per-node timestamps** — stamp `t_start` on `workflow:node-executing` and `t_end`/`duration_ms` on
  `workflow:node-completed` (both emit points already exist, `ExecutionEngine.js:473/564`). Unlocks the
  timeline for free. [PLAUSIBLE]
- **Seeded starter-graph gallery** — 3–4 JSON graphs (critique-then-revise, multi-model debate,
  cheap-drafts/reasoning-judges) loadable on first run via existing `GraphStorage`, so a stranger reaches
  a working reasoning-diff in under 60 seconds. [PLAUSIBLE]
- **Bank the normalizer** — lift `reasoning.py` + `reasoning.js` into a named standalone micro-repo with a
  README + a Nemotron/DeepSeek-R1-on-Groq/gpt-oss folding demo GIF. [PROVEN]

### H2 — differentiated: from a viewer to an instrument

Where the canvas stops being a flow-builder and becomes something no incumbent ships: chain-of-thought
consumed as **structured input**, and runs as **navigable, diffable objects**. These compound
differentiation but earn nothing directly — gate each on the H1 demo earning real attention first.

- **Fan-in aggregation node** — a node that gets ALL parent answers as a structured list + a strategy
  (`concat`/`vote`/`synthesize`) instead of single-hop string concatenation. ~one backend function + one
  node-config field; `concat` default preserves current behavior. [PLAUSIBLE]
- **Reasoning-aware judge node** — receives competitors' answers AND their split-out traces as structured
  input (`split_reasoning` already separates them); its verdict's own trace cites which reasoning it
  trusted. [PLAUSIBLE]
- **Execution timeline + replay scrubber + run-diff** — scrub a stored run frame-by-frame; compare run A
  vs B with per-node output/token/latency deltas. Reuses `WorkflowVisualizer`'s existing live-restyle path
  over a stored run object; no live model calls. [PLAUSIBLE]
- **Typed edges** — promote the dormant `edge_type` (`'provides_context'` is stored, never branched on)
  into answer-only / reasoning-only / full-trace / JSON-slice channels the engine branches on when
  assembling `parent_contexts`. [PLAUSIBLE]
- **Export-to-HTML report** — the deliverable for the Operational AI Diagnostic, leaning on the
  Ollama-local=free / cloud=priced boundary shown on-canvas. [PLAUSIBLE]

### H3 — big vision: reasoning observability for *agentic* systems

The only big-vision slot that fits the "understanding what AI actually is" thesis without re-entering the
most crowded category as a worse clone. Flow-*building* is saturated; reasoning-*observability* for
multi-agent systems is where the field is heading as reasoning models proliferate. **Pursue ONLY after H1
ships and earns attention — otherwise it is infrastructure-as-avoidance.**

- **Ingest external traces** — generalize the `<think>` normalization to fold third-party agent / MCP
  tool-call traces into the same inspectable reasoning graph: where the model branched, backtracked,
  burned tokens, contradicted a parent. [SPECULATIVE]
- **Context-flow attribution on edges** — edge thickness/heat showing how much each parent shaped a child.
  Phase 1: token-share (fully computable from `parent_contexts`) [PLAUSIBLE]; Phase 2: ablation "influence"
  runs on the H2 diff machinery [SPECULATIVE].
- **Export to portable code** — emit a designed graph as a runnable LangGraph `StateGraph` and/or an
  MCP-server definition. The canvas is where you *design and understand*; production runs in the user's own
  stack. Sidesteps the unwinnable "be a production runtime" fight; plays to the translator identity. [SPECULATIVE]
- **Bounded, trace-visible cyclic deliberation** (debate-until-converged) — built by **rewriting** the dead
  `executeWithCycleIteration`/`cycleHandlingMode='iterate'` scaffolding against the H2 run-journal, with
  hard iteration + cost ceilings. Never extended in place. [SPECULATIVE]

---

## Income & career — the one wedge

The monetizable wedge is **reasoning-aware cost legibility as the delivery instrument for the Operational
AI Diagnostic** — NOT a SaaS subscription. The per-node meters (H1) + the exportable executed-graph report
(H2) let you run a fixed-scope paid diagnostic *on the canvas*: "here is exactly where your agent burns
tokens, where context leaks, and what cheap-first/escalate-on-low-confidence routing would save — with the
inspectable trace proving every decision." **Sell the judgment; the canvas makes it repeatable and visibly
more rigorous than a slide deck; the core stays open-source.** It respects the clock because the meters
reuse telemetry already in every response.

For career: the strongest single Applied-AI / AI-Agent-Engineer portfolio piece in the collection. Not "I
called an LLM API" but "I built a provider-agnostic orchestration engine with a topological executor, cycle
detection, and a reasoning-normalization layer no incumbent ships" — the forking-infrastructure instinct
turned into an original from-scratch artifact. The reasoning-diff view **is** the interview screenshot and
**is** a newsletter post.

## Kill list (do NOT build)

- **A hosted multi-tenant "reasoning canvas SaaS"** (auth, billing, key custody, support, a security story
  this repo doesn't have — it leaked keys this session). Months of undifferentiated work in the most crowded
  category. Reject outright.
- **Generic flow-builder parity** — 200 integrations, RBAC, plugin system, node marketplace, team collab.
  Every one is a funded incumbent's home turf and buries the reasoning wedge.
- **Tool-calling/MCP nodes and headless cron as an EARLY move.** Legitimate only at H3, only after the
  runtime core is proven. Doing them now repeats the dead-cycle-code failure.
- **Extending the stubbed `iterate`/`unwrap` cycle code in place** — it already rots (mutates
  getter-returned edge arrays). If loops are ever built, rewrite against the run-journal.
- **More substrate hardening / refactor passes as the next move.** The base is solid enough; another cleanup
  is infrastructure-as-avoidance. The next commit must be the reasoning-diff demo, not the EventBus.
- **Treating ai_canvas as a flagship product or startup.** The venture is the diagnostic, not this. A phantom
  "H3-as-company" is what quietly drains nights.

## The single next bounded artifact

> **STATUS: reasoning-diff view SHIPPED + screenshot-verified 2026-06-16.**
> `/api/chat/compare` (stateless, folds reasoning uniformly) + `static/reasoning-diff.html`
> + `static/js/ui/reasoning-diff.js` (reuses `reasoning.js` verbatim). Demo mode (`?demo=1`)
> renders without a backend. **Still owed: bank `reasoning.py`/`reasoning.js` as a named micro-repo
> with a README + multi-provider folding demo.**

**Ship the reasoning-diff view.** A graph that fans ONE user prompt to 3 reasoning models across Ollama +
Groq + NVIDIA (parallel siblings the DAG already executes), rendering each model's normalized `<think>`
trace in a side-by-side column with word-count and final answer below — reusing `splitReasoning` and
`renderReasoningTrace` verbatim, **zero new architecture**. Done means: runs end-to-end, screenshot-verified
(headless Chrome per the project recipe), and the capture goes straight into the luisblanco.dev showcase as
a case study. In the same artifact, bank the standalone reasoning-normalizer as a named micro-repo with a
README + multi-provider folding demo.

This is simultaneously the adversary's *harvest* (bank the differentiator) and the builder's *wedge* (seed
the product) — it resolves build-vs-park by doing both, and it ships against the clock this week.

## Honest risks (the devil's advocate, kept)

- **Thesis-as-decoration.** Mapping ai_canvas onto AEA/Four Levels is seductive because Luis is a
  connection-finder. The test: *would the code be different without the framework?* If "node = AEA entity"
  never constrains one design decision, it's a retrofitted slogan, not a principle.
- **Demo-vs-revenue gap.** Reasoning-diff is a stunning demo that may not itself convert. It pays the clock
  only if it plugs into the diagnostic story — otherwise it's a beautiful portfolio piece, acceptable ONLY
  if explicitly framed as job-hunt evidence, not income.
- **Reasoning-diff is PLAUSIBLE, not proven valuable.** It assumes a buyer pays attention to side-by-side
  traces. Validate with one real demo in front of one real person before building judge/comparison infra.
- **The over-engineering tax is measured, not theoretical** — 43 of 99 JS files are
  Manager/Registry/Factory/Behavior; two parallel theme trees; a 62KB panel manager. A grand vision is the
  permission structure to build *more* abstraction instead of the one screenshot that proves the thesis. The
  dead cycle code is the standing warning.
- **Telemetry uniformity can lie.** Ollama gives clean `eval_count`/`eval_duration`; cloud `usage` fields
  vary. The "uniform meter" needs per-provider normalization or it reports false numbers — and false cost
  numbers in a *paid* diagnostic are worse than none.
- **Causal attribution is partly an open research problem.** v1 edge-attribution shows token-share only.
  Tag token-share PLAUSIBLE and influence-runs SPECULATIVE, and say so out loud.
- **The meta-trap.** An over-engineered vanilla-JS SPA kept "alive but not dead" is a permanent maintenance
  tax. If H1 ships and the diagnostic framing doesn't earn traction, the honest move is to declare it
  finished — a portfolio piece, not an open project.
