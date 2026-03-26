# System Architecture

## Overview

Paperclip Plugins is a monorepo of installable extension packages for the [Paperclip](https://paperclip.ing) agent orchestration platform. Each plugin runs as an isolated Node.js worker process, communicates with the Paperclip host via a capability-gated JSON-RPC protocol, and optionally renders React UI into predefined host slots.

This project does not modify the Paperclip core. It produces npm-publishable plugin packages that any Paperclip instance can install.

## Repository Structure

```
PaperclipPlugins/                   # pnpm workspace root
  package.json                      # workspace config, shared scripts
  pnpm-workspace.yaml               # declares packages/*
  tsconfig.base.json                # shared TypeScript config
  .github/
    workflows/
      ci.yml                        # typecheck + test + build on PRs
  packages/
    shared/                         # (optional) shared utilities across plugins
      package.json
      src/
    <plugin-name>/                  # one directory per plugin
      package.json                  # paperclipPlugin entry points
      src/
        manifest.ts                 # plugin identity, capabilities, slots
        worker.ts                   # worker entry point
        handlers/                   # event, action, and data handlers
        jobs/                       # scheduled job definitions
        ui/                         # React components for host slots
          index.tsx                 # UI entry point
          components/               # slot-specific components
      tests/
        worker.test.ts              # test harness tests
        ui.test.tsx                 # UI component tests (if applicable)
      dist/                         # build output (gitignored)
  docs/
    ARCHITECTURE.md                 # this file
    TECH-STACK.md                   # technology decisions
    ROADMAP.md                      # milestone plan
```

### Package conventions

- Each plugin is a standalone npm package under `packages/`.
- Plugins share a common `tsconfig.base.json` for consistent compiler settings.
- An optional `packages/shared/` package holds cross-plugin utilities (e.g., common formatters, error types). Only create this if two or more plugins need the same code.
- Each plugin's `package.json` declares `paperclipPlugin` entry points consumed by the installer:

```json
{
  "paperclipPlugin": {
    "manifest": "dist/manifest.js",
    "worker": "dist/worker.js",
    "ui": "dist/ui.js"
  }
}
```

## Components

| Component | Responsibility | Technology | Location |
|-----------|---------------|------------|----------|
| Plugin Manifest | Declares identity, version, capabilities, and UI slots | TypeScript (`defineManifest`) | `src/manifest.ts` |
| Plugin Worker | Implements lifecycle hooks, event handlers, data providers, actions, jobs | Node.js process (`definePlugin` + `runWorker`) | `src/worker.ts` + `src/handlers/` |
| Plugin UI | Renders React components into host slots; bridges to worker via hooks | React 18 | `src/ui/` |
| Plugin SDK | Typed APIs for worker context, UI hooks, test harness, and build presets | `@paperclipai/plugin-sdk` | npm dependency |
| Paperclip Host | Manages plugin lifecycle, routes JSON-RPC, gates capabilities, stores state | Paperclip runtime (external) | Not in this repo |
| Plugin State Store | Persistent key-value storage scoped by entity (company, project, issue, etc.) | PostgreSQL (managed by host) | Not in this repo |

## Data Flow

### Primary flow: Host to Worker to UI

```
  ┌───────────────────────────────────────────────────────────────┐
  │                     Paperclip Host                            │
  │  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
  │  │ Process  │  │  Event    │  │ Capability│  │  State    │  │
  │  │ Manager  │  │  Bus      │  │  Gate     │  │  Store    │  │
  │  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
  └───────┼──────────────┼──────────────┼──────────────┼──────────┘
          │ spawn        │ events       │ auth         │ read/write
          │              │              │              │
  ┌───────▼──────────────▼──────────────▼──────────────▼──────────┐
  │                    Plugin Worker (isolated process)            │
  │                                                               │
  │  setup(ctx) ──► register handlers ──► process events          │
  │       │                                    │                  │
  │       ├── ctx.events.on(...)               ├── ctx.state.*    │
  │       ├── ctx.data.register(...)           ├── ctx.http.*     │
  │       ├── ctx.actions.register(...)        └── ctx.secrets.*  │
  │       ├── ctx.jobs.register(...)                              │
  │       └── ctx.tools.register(...)                             │
  └──────────────────────────┬────────────────────────────────────┘
                             │ data / actions / streams
                             │ (same-origin bridge)
  ┌──────────────────────────▼────────────────────────────────────┐
  │                    Plugin UI (React, in host)                  │
  │                                                               │
  │  usePluginData(key, params) ──► render data                   │
  │  usePluginAction(key)       ──► trigger worker action         │
  │  usePluginStream(channel)   ──► subscribe to live updates     │
  │  useHostContext()            ──► read host state (theme, user) │
  └───────────────────────────────────────────────────────────────┘
```

### Detailed sequence: Event handling

1. A domain event occurs in Paperclip (e.g., `issue.created`).
2. The Host event bus delivers the event to all workers that declared `events.subscribe` and registered a handler for that event type.
3. The worker handler runs, optionally reading/writing state via `ctx.state`, making outbound HTTP calls via `ctx.http`, or emitting derived events via `ctx.events.emit`.
4. If the worker updated data that a UI data provider serves, the UI component reactively re-fetches via `usePluginData`.

### Detailed sequence: UI action

1. User clicks a button in a plugin UI component.
2. The component calls `usePluginAction("doSomething").execute(payload)`.
3. The host bridges this to the worker's registered action handler for `"doSomething"`.
4. The worker processes the action, returns a result, and optionally updates state.
5. The UI receives the response and re-renders.

## API Boundaries

### Worker-to-Host (JSON-RPC, capability-gated)

| API | Purpose | Required Capability |
|-----|---------|-------------------|
| `ctx.config` | Read plugin configuration | _(always available)_ |
| `ctx.logger` | Structured logging | _(always available)_ |
| `ctx.data.register(key, handler)` | Register data providers for UI | _(always available)_ |
| `ctx.actions.register(key, handler)` | Register action handlers for UI | _(always available)_ |
| `ctx.tools.register(name, handler)` | Register agent-invokable tools | _(always available)_ |
| `ctx.events.on(type, handler)` | Subscribe to domain events | `events.subscribe` |
| `ctx.events.emit(type, payload)` | Emit custom events | `events.emit` |
| `ctx.state.get/set/delete(scope, key)` | Scoped key-value state | `plugin.state.read` / `plugin.state.write` |
| `ctx.http.fetch(url, options)` | Outbound HTTP (proxied through host) | `http.outbound` |
| `ctx.secrets.resolve(ref)` | Resolve secret references | `secrets.read-ref` |
| `ctx.jobs.register(name, schedule, handler)` | Register scheduled jobs | `jobs.schedule` |

### UI-to-Worker (same-origin bridge)

| Hook | Purpose |
|------|---------|
| `usePluginData(key, params?)` | Fetch data from worker's registered provider |
| `usePluginAction(key)` | Get `execute(payload)` function for a worker action |
| `usePluginStream(channel)` | Subscribe to server-sent event stream from worker |
| `useHostContext()` | Read host state: current user, theme, active entity |

### External APIs

Connector plugins make outbound HTTP requests via `ctx.http.fetch`. This is proxied through the host, which enforces the `http.outbound` capability gate. Plugins never open raw network connections.

## Plugin Lifecycle

```
Install ──► Manifest Validation ──► Capability Approval ──► Worker Start
                                                                │
                                                          setup(ctx) called
                                                                │
                                                          Health Check ──► Ready
                                                                │
                                              ┌─────────────────┼─────────────────┐
                                              │                 │                 │
                                        Events/Jobs        UI Rendering    Config Change
                                              │                 │                 │
                                              │                 │         onConfigChanged()
                                              │                 │                 │
                                              └─────────────────┼─────────────────┘
                                                                │
                                                          Shutdown signal
                                                                │
                                                          onShutdown()
                                                                │
                                                             Stopped
```

**Key lifecycle hooks:**

- `setup(ctx)` — Called once when the worker starts. Register all handlers here.
- `onConfigChanged(ctx, newConfig)` — Called when an operator updates plugin configuration.
- `onShutdown(ctx)` — Called before the process exits. Clean up resources.

## State Scopes

Plugin state is scoped to prevent cross-concern leakage. The scope determines the key namespace:

| Scope | Granularity | Example use |
|-------|-------------|-------------|
| `instance` | Global to the Paperclip instance | Feature flags, global counters |
| `company` | Per-company | Company-level sync cursors |
| `project` | Per-project | Project-specific settings |
| `project_workspace` | Per-workspace directory | Workspace cache metadata |
| `agent` | Per-agent | Agent-specific preferences |
| `issue` | Per-issue | Linked external ticket IDs |
| `goal` | Per-goal | Goal tracking metadata |
| `run` | Per-agent-run | Ephemeral run state |

Workers specify the scope when calling `ctx.state.get/set/delete`. The host enforces that a plugin can only access its own state within each scope.

## Build Pipeline

Each plugin builds independently using SDK-provided esbuild presets:

```
src/manifest.ts  ──►  esbuild (SDK preset)  ──►  dist/manifest.js
src/worker.ts    ──►  esbuild (SDK preset)  ──►  dist/worker.js     (Node target, CJS)
src/ui/index.tsx ──►  esbuild (SDK preset)  ──►  dist/ui.js         (browser target, ESM)
```

The build is configured in each plugin's `package.json` scripts:

```json
{
  "scripts": {
    "build": "node build.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "dev": "paperclipai plugin dev ."
  }
}
```

Where `build.mjs` calls `createPluginBundlerPresets` from `@paperclipai/plugin-sdk/bundlers`.

### Workspace-level scripts (root `package.json`)

```
pnpm install       # install all workspace dependencies
pnpm typecheck     # run tsc --noEmit across all packages
pnpm test          # run vitest across all packages
pnpm build         # build all plugins
pnpm lint          # eslint + prettier check
```

## Testing Architecture

### Unit tests (worker logic)

Use `createTestHarness` from `@paperclipai/plugin-sdk/testing` to test worker handlers in isolation without a running Paperclip instance:

```typescript
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import plugin from "../src/worker";

const harness = createTestHarness(plugin);

// Simulate an event
await harness.emit("issue.created", { issueId: "test-1" });

// Assert state was written
const state = await harness.state.get("issue", "test-1", "external-id");
expect(state).toBe("LINEAR-42");
```

### UI tests (components)

Use Vitest with `@testing-library/react` for component tests. Mock the SDK hooks to test rendering in isolation.

### Integration tests

For end-to-end validation, install the built plugin into a local Paperclip instance and verify the full lifecycle (install, events, UI rendering, state persistence).

### CI pipeline

```
PR opened / push to PR branch
  └── GitHub Actions: ci.yml
        ├── pnpm install
        ├── pnpm typecheck    (fail-fast)
        ├── pnpm lint         (fail-fast)
        ├── pnpm test         (fail-fast)
        └── pnpm build        (verify clean build)
```

All four checks must pass before a PR can merge.

## Deployment Model

### Development

1. `pnpm dev` starts the SDK dev server with hot reload for a specific plugin.
2. `npx paperclipai plugin install ./<plugin-dir>` installs from a local path for manual testing.

### Production

1. Build the plugin: `pnpm build` in the plugin directory.
2. Publish to npm: `npm publish` from the plugin directory.
3. Install on target instance: `npx paperclipai plugin install <package-name>`.
4. The host reads the manifest, prompts for capability approval, then starts the worker.

Current deployment is single-tenant: one plugin install per Paperclip instance. No multi-tenant plugin hosting or marketplace is in scope.

## Error Handling

- **Worker crashes**: The host detects a crashed worker process and can auto-restart it (host-managed). Plugins should keep `setup()` idempotent.
- **Capability denial**: If a plugin calls an API it didn't declare, the host rejects the call with a clear error. The worker should handle this gracefully.
- **State conflicts**: `ctx.state` operations are last-write-wins within a scope. Plugins that need optimistic concurrency should implement their own versioning on top of the key-value store.
- **Outbound HTTP failures**: `ctx.http.fetch` surfaces standard HTTP errors. Plugins are responsible for retry logic on transient failures.

## Security Model

- **Trusted code**: Plugin workers and UI run as trusted same-origin code. There is no sandbox.
- **Capability gating**: Security is enforced at the API level. A plugin can only call APIs for capabilities it declared in its manifest and that the operator approved at install time.
- **Secrets**: Plugins access secrets through `ctx.secrets.resolve(ref)`, which requires the `secrets.read-ref` capability. Secrets are never embedded in code or config.
- **No asset uploads**: `ctx.assets` is not currently supported. Plugin UI must be self-contained.

## Key Decisions

| Decision | Context | Rationale |
|----------|---------|-----------|
| pnpm monorepo | Multiple plugins share tooling and config | Workspace-level scripts, single lockfile, consistent dependency versions |
| Out-of-process workers | Plugins could run in-process or isolated | Fault isolation: a crashing plugin doesn't take down the host |
| Capability-gated APIs | Plugins need host access but shouldn't have carte blanche | Least-privilege security; operators approve capabilities at install |
| JSON-RPC protocol | Need a stable, versioned contract between host and worker | Language-agnostic, easy to version, well-understood |
| React for UI slots | Host UI is React-based | Consistent rendering model; hooks bridge naturally to worker |
| PostgreSQL for plugin state | Need persistent, queryable state | Already used by Paperclip core; no new infrastructure required |
| esbuild via SDK presets | Need fast builds with correct output targets | SDK owns the build config; plugins stay simple |
| Vitest for testing | Need TypeScript-native test runner | Pairs naturally with SDK test harness; minimal config |
| Optional shared package | Cross-plugin code reuse | Only create when two plugins need the same utility; avoid premature abstraction |

---

_Architecture designed 2026-03-25. Based on tech stack decisions in [TECH-STACK.md](TECH-STACK.md) and Paperclip plugin SDK conventions._
