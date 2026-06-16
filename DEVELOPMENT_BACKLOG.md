# AI Canvas — Development Backlog

Generated 2026-06-16 from a multi-agent audit of the whole codebase (80 confirmed
pending items, each adversarially re-verified against the real code). This file is
the single source of truth for "what is left to build." `file_analysis.md` and
`refactor.md` are aspirational/historical — trust this document over them.

## State of the project (honest)

The app **works** end-to-end: the active flat Flask backend (`backend/app/routes/*`
+ `services/*` + `models/*`) plus the vanilla-JS Cytoscape frontend run, and
workflows execute (via a client-side topological fallback). The real state is
"functional but littered." The biggest risks were not features — they were a
**clean install that crashed** and a **committed live API key**. Both fixed below.

Surrounding the working core is a large half-finished clean-architecture refactor
(`backend/app/api/` + `domain/` + `infrastructure/` + `core/`; `refactor.md` =
75-item checklist, 0 done). It is **unwired and transitively broken in ~8 places**.
Recommendation: **delete it, do not finish it** (see Big Rocks).

---

## DONE this session (shipped + verified)

### Feature: NVIDIA NIM provider, end-to-end
- `backend/app/services/nvidia_service.py` + `reasoning.py`; wired into
  `routes/models.py`, `routes/chat.py`, `services/graph_service.py`,
  `services/__init__.py`, `backend/.env`. Reads `NVIDIA_API_KEY` from env; live
  `/v1/models` catalog with editable seed fallback; folds `reasoning_content`.
- Verified: `py_compile` clean; reasoning fold/split round-trips (unit-tested).

### Feature: universal reasoning-trace UI (all providers)
- `static/js/ui/reasoning.js` + `static/css/modules/_reasoning.css`; wired into
  `ConversationPanelManager`, `ConversationManager`, `ModelRegistry`, `config.js`,
  `templates/index.html`. Collapsible "Reasoning" block for Nemotron / DeepSeek-R1
  / QwQ / gpt-oss — including DeepSeek-R1 on Groq, whose `<think>` was dumped raw.
- Verified: headless screenshot of a harness loading the real module + CSS.

### Ship-now tier (all verified by compile / call-chain)
1. **Security:** untracked `backend/.env` + 3 `*_test_log.txt` (`git rm --cached`),
   removed `test_groq_hardcoded.py` (hardcoded key), scrubbed key-logging in
   `test_groq.py` / `test_groq_doc.py`, hardened `.gitignore`. Working tree is
   clean of the key. **(See "Only you can do" — revoke + history purge.)**
2. **Boot fix:** pinned `flask-migrate==4.0.5` in `requirements.txt`
   (`app/__init__.py:5` imports it; a clean `pip install && python run.py` crashed).
3. **Server-side workflow execution:** `ExecutionEngine.js` posted `/api/execute`
   (404) — fixed to `/api/workflow/execute`; also fixed the dead 404 self-disable
   (`error.response.status` -> `error.status`).
4. **Cycle-prevention wiring:** `app.js` now sets `graphManager.workflowManager`;
   added `WorkflowManager.wouldCreateCycle()` (delegates to `CycleDetector`); fixed
   `GraphManager.highlightCycles()` (`detectCycles` -> `getCycleInfo`). The
   connect-node "would create a cycle" guard now actually fires.
5. **Decommissioned default:** replaced `mixtral-8x7b-32768` (Groq-decommissioned,
   400s) with `llama-3.3-70b-versatile` and fixed the bogus
   `deepseek-r1-distill-llama-32b` id across `config.js`, `ModelRegistry.js`,
   `groq_service.py`, `routes/models.py`.
6. **CORS no-op:** `CORS(app)` ignored the parsed allowlist — now scopes origins to
   `/api/*` when `CORS_ALLOWED_ORIGINS` is set (still permissive by default).
7. **`node_chat` 500:** a DB failure left `conversation` unbound -> raw 500. Now
   initialised to `None` and the three backend dispatch calls are guarded.

### Also done this session (2026-06-16, second pass)
8. **SSE protocol standardized** (was NEXT tier). Backend (`streaming.py`) now emits
   every event as a JSON envelope — `data: {"content": ...}` / `data: {"error": ...}`
   / `data: [DONE]`. Client (`APIClient.stream`) buffers across network reads and
   routes by type; errors no longer render as chat content and multi-line content no
   longer drops lines. The panel now surfaces stream errors as system messages.
   *Verified: a node test drove the real `APIClient.stream` with a mocked streaming
   fetch — multi-line content split across reads reassembled correctly, error frame
   routed to onError and suppressed onComplete.*
9. **Deleted the dead clean-arch tree** (was Big Rock #1). Removed
   `backend/app/{api,domain,infrastructure,core}` + `services/workflow_service.py` +
   `services/topology_service.py` (~2000 LOC, unreachable + transitively broken).
   *Verified: the only importers were the deleted files themselves; active backend
   still compiles and has zero dangling imports.*
10. **EventBus unsubscribe leak fixed** (was NEXT tier). `unsubscribe` now matches
    either the subscriber object or the raw callback and maps legacy event names;
    `BaseComponent.subscribeWithCleanup` and `EventBehavior` now route cleanup
    through the closure `subscribe()` returns. Destroyed components stop receiving
    events. *Verified: node test on the real `EventBus`/`EventBehavior` — closure,
    raw-callback, legacy-name, and component-destroy paths all unsubscribe.*
11. **APIClient request timeout** (was NEXT tier). Non-streaming requests now use an
    `AbortController` bound to `config.apiTimeout` (30s); a hung backend no longer
    holds a concurrency slot forever, and timeouts surface as a clear error
    (`status: 'timeout'`). Streaming path intentionally exempt. *Verified: node test
    on the real `APIClient` — a hung fetch aborts at the timeout, throws a timeout
    error, and frees the slot.*

### Also done this session (2026-06-16, third pass)
12. **SQLite FK enforcement + node-exist guard** (was NEXT/LATER). A `PRAGMA
    foreign_keys=ON` connect-listener (no-op for non-SQLite) + `node_chat` now 404s
    on an unknown `node_id` before persisting — no orphan conversation rows. *py_compile.*
13. **node-exec event-name mismatch** (was NEXT). Removed the dead
    `node:executing/completed/error` subscriptions in `EventListenerSetup` — the
    engine emits `workflow:node-*` and UIManager already forwards those to
    themeManager; re-pointing them would have double-fired the animation.
14. **Duplicate panel managers** (was NEXT). ThemeManager no longer constructs its
    own `WorkflowPanelManager`/`ConversationPanelManager`; it reuses UIManager's
    instances (statically verified the methods it calls — togglePanel/expandPanel/
    isExpanded/isCollapsed — exist on those). Deleted `theme/panels/ConversationPanelManager.js`.
15. **Dead duplicate `publish()`/`attemptErrorRecovery()`** removed from `EventBus.js`
    (157 lines, shadowed by the later copies). *Verified: exactly one of each now;
    node test confirms publish/unsubscribe still work.*
16. **Frontend dead-file sweep** — deleted 8 zero-importer files (`Spacetheme.js`,
    `ui/utils/DOMElementFinder.js`, `EnhancedBasePanelManager.js`, `modules/GraphEditor.js`,
    `modules/ConversationPanel.js`, `graph/CytoscapeRenderFix.js`,
    `core/dialog/behaviors/{Draggable,Resizable}Behavior.js`). *Verified: no importers, no
    dangling references after deletion.*
17. **Small UI bugs** — modal title now updates (`#modal-title` id + selector + element
    key); edge-tap shows the "Remove Connection" button (`handleEdgeSelected` ->
    `showEdgeRemoveButton`, payload shape confirmed); `ThemeService` system-theme
    listener now uses a stored bound handler so `destroy()` actually detaches it.

> All touched files: full `node --check` (18 JS files) + `py_compile` (8 PY files) pass.

---

## NEXT tier (ready to implement; needs runtime verification)

| Item | Files | Effort | Notes |
|---|---|---|---|
| ~~Standardize SSE protocol~~ | — | — | **DONE 2026-06-16** (see "Also done this session"). |
| ~~EventBus unsubscribe no-op (memory leak)~~ | — | — | **DONE 2026-06-16** (see "Also done this session"). Note: the shadowed duplicate `publish()`/`attemptErrorRecovery()` in `EventBus.js` (lines ~139-294) is still present — harmless (later defs win) but worth deleting for clarity. |
| ~~APIClient request timeout~~ | — | — | **DONE 2026-06-16** (see "Also done this session"). |
| Duplicate ConversationPanelManager + WorkflowPanelManager instances | `ui/UIManager.js`, `ui/ThemeManager.js`, `ui/theme/panels/ConversationPanelManager.js` | M | `ThemeManager` builds its own panel managers -> handlers double-fire. Remove the ThemeManager copies, repoint to `uiManager.*`. |
| Node-exec event-name mismatch (theme animations never fire) | `ui/theme/events/EventListenerSetup.js`, `ui/UIManager.js` | S | Subscribes `node:executing/...` but engine emits `workflow:node-executing/...`. Pick ONE path (UIManager already calls themeManager directly) to avoid double animation. |
| Enable SQLite FK enforcement + verify node exists before Conversation | `backend/app/__init__.py`, `routes/chat.py` | S | `PRAGMA foreign_keys=ON`; 404 on unknown node to stop orphan rows. |

## LATER tier (real but not urgent — bundle opportunistically)

- Storage key chaos: `StorageManager.getKey` double-prefixes (`aiCanvas_aiCanvas_*`)
  while several call sites read single-prefixed keys via raw `localStorage` ->
  silent misses. Pick one convention + a one-time migration.
  (`storage/StorageManager.js`, `graph/GraphManager.js`, `GraphStorage.js`,
  `workflow/WorkflowManager.js`, `app.js`)
  **DELIBERATELY NOT DONE (2026-06-16):** 5-file change + a migration over users'
  saved graphs. Without a running app this risks silent data loss (worse than the
  current cosmetic double-prefix). Hold until it can be exercised live.
- Wire `EventBus` errorHandler in `app.js`; delete `EventManagerFactory.js` (TDZ, dead).
- `graph.py` reset-database nested-transaction brittleness; `WorkflowPanelManager`
  destroy graph-handler leak + timeout-message mismatch.
- Cycle-execution dead code (`iterate`/`unwrap`) mutates getter-returned `edges`
  arrays — only reachable if cycle modes are ever exposed (today `cycleHandlingMode`
  is permanently `'stop'`). Fix only if exposing cycles, else delete the dead methods.
- Small UI bugs: modal title never updates (`modal-title` id/selector not wired),
  edge-remove button unwired, `ThemeService` media-query listener leak on destroy.

## OPTIONAL / hygiene (zero runtime impact — delete in batches)

- **DELETE the unwired clean-arch tree** `backend/app/{api,domain,infrastructure,core}`
  + `services/workflow_service.py` + `services/topology_service.py` (~2000 LOC of
  broken, unreachable code). See Big Rocks.
- Delete confirmed zero-importer frontend files: `ui/Spacetheme.js`,
  `ui/utils/DOMElementFinder.js` (585-line orphan; keep the 50-line `theme/utils` one),
  `ui/panel/EnhancedBasePanelManager.js`, `modules/GraphEditor.js`,
  `modules/ConversationPanel.js`, `graph/CytoscapeRenderFix.js` (0 bytes),
  `core/dialog/behaviors/{Draggable,Resizable}Behavior.js`.
- Remove dead UI execute/admin paths (`GraphControlsManager.executeWorkflow/...`,
  `addResetDbButton`), `DialogController.registerTemplates` stub.
- Doc reconciliation: mark `refactor.md` abandoned; strike fabricated APIs +
  the non-existent `git-server/` from `file_analysis.md`; regenerate
  `current_project_strcutre.md`; delete the duplicate `static/frontend-architecture-animation.svg`.
- Drop unused SocketIO (zero handlers/emits; real-time is SSE) -> `app.run(threaded=True)`,
  or wire real handlers. Prune dead `config.features.*` flags or honor them.

## BIG ROCKS (multi-day — decide deliberately)

1. **The clean-architecture refactor — DONE: DELETED 2026-06-16.** It never ran
   end-to-end (no `__init__.py` packages; `base.py` imported a nonexistent
   `ollama_provider`; `groq_provider` imported an undefined `settings`; controllers
   missing imports; `edge_service` created a second SQLAlchemy instance). Registered
   nowhere. Removed `backend/app/{api,domain,infrastructure,core}` + the two dead
   `services/` duplicates; active backend verified intact.
2. **A real test suite (PARKED).** `refactor.md` promises unit/integration/e2e/CI;
   none exists. If the diagnostic product needs a credibility story, scope a minimal
   slice only: `pytest` + a `TestingConfig` in-memory-SQLite app fixture, unit tests
   for `graph_service.execute_workflow` topo-ordering + cycle rejection and
   `create_edge` cycle prevention. Defer frontend/e2e/CI.

## Only you can do (out of my hands)

- **Revoke the leaked Groq key** (the `gsk_…` value previously committed) at
  console.groq.com — it is in git **history** even though the working tree is now
  clean. Revoking makes the
  historical copy worthless.
- **Rotate the NVIDIA key** `nvapi-...` you pasted in chat (also treat as burned).
- **Purge history** (optional, after revocation): `git filter-repo` / BFG to strip
  the key from past commits. Destructive — your call.
- **Commit** the staged changes when you have reviewed them (nothing was committed).
