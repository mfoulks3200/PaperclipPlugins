# Roadmap

_Aligned with [VISION.md](../../../docs/VISION.md) strategic milestones. Goal: Ship the first Paperclip plugin._

## Milestones

### M1 — Foundation (target: 2026-04-15)

**Outcome:** Repo initialized, CI green, first plugin scaffolded and building.

| Deliverable | Owner | Status |
|-------------|-------|--------|
| GitHub repo initialized with README, license, .gitignore | Engineer | in progress |
| Branch protection and PR workflow configured | Engineer | todo |
| pnpm workspace + TypeScript config | Engineer | todo |
| CI pipeline (typecheck, test, build) via GitHub Actions | Engineer | todo |
| Scaffold first plugin using `@paperclipai/create-paperclip-plugin` | Engineer | todo |
| System architecture documented (ARCHITECTURE.md) | Engineer | todo |
| Release process defined (semver + changelog) | Engineer | todo |

**Exit criteria:** `pnpm install && pnpm typecheck && pnpm test && pnpm build` passes in CI on main.

---

### M2 — First Plugin MVP (target: 2026-05-15)

**Outcome:** Core plugin functionality complete, tested, and installable locally.

| Deliverable | Owner | Status |
|-------------|-------|--------|
| Plugin use case selected and scoped | Product Owner | todo |
| Manifest defined (id, capabilities, slots) | Engineer | todo |
| Worker implemented with core event/data handlers | Engineer | todo |
| UI components for declared slots (if applicable) | Engineer + UI Designer | todo |
| Unit + integration tests via `createTestHarness` | Engineer | todo |
| Plugin installs and runs on local Paperclip instance | Engineer | todo |
| User-facing documentation (README, usage examples) | Technical Writer | todo |

**Exit criteria:** Plugin installs via `npx paperclipai plugin install ./plugin` and core workflow completes end-to-end on a local instance.

---

### M3 — Ship v1.0 (target: 2026-06-01)

**Outcome:** Plugin published, validated, documented, and announced.

| Deliverable | Owner | Status |
|-------------|-------|--------|
| SDK conformance validation passes | Engineer + Code Reviewer | todo |
| Edge case and error handling hardened | Engineer | todo |
| API reference and examples complete | Technical Writer | todo |
| Plugin published to npm | Engineer | todo |
| Announcement / changelog entry | Technical Writer | todo |
| Post-ship monitoring plan | Product Owner | todo |

**Exit criteria:** Plugin is installable via npm package name, passes SDK conformance, docs are complete.

---

### M4 — Second Plugin (target: 2026-07-15)

**Outcome:** Second plugin scoped from feedback, built, and shipped.

| Deliverable | Owner | Status |
|-------------|-------|--------|
| User feedback collected and analyzed | UX Researcher | todo |
| Second plugin scoped and backlogged | Product Owner | todo |
| Build, test, ship (repeat M2-M3 cycle) | Engineer | todo |

**Exit criteria:** Second plugin published and installable.

---

## Current Focus

**Active milestone:** M1 — Foundation
**Status:** In progress. Repo init and tech stack decisions are underway. Architecture design is next.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Plugin SDK is alpha; APIs may change | High — rework | Pin SDK version; isolate SDK calls behind thin wrappers |
| No plugin use case selected yet | Medium — delays M2 | Scope plugin use case during M1 using market analysis |
| Single engineer | Medium — throughput | Keep scope tight; avoid feature creep |

---
_Created 2026-03-25 by Product Owner_
