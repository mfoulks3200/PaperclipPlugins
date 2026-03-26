# Tech Stack

## Chosen Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | TypeScript | ~5.5+ | Required by the Paperclip plugin SDK |
| Runtime | Node.js | 20 LTS | Worker processes run on Node; LTS for stability |
| UI Framework | React | 18.x | Plugin SDK UI entry (`@paperclipai/plugin-sdk/ui`) is React-based |
| Package Manager | pnpm | 9.x | Paperclip ecosystem uses pnpm workspaces |
| Bundler | esbuild | via SDK presets | SDK ships `createPluginBundlerPresets` for worker/manifest/UI builds |
| Testing | Vitest | 1.x | Fast, TypeScript-native; SDK ships `createTestHarness` for plugin tests |
| Linting | ESLint + Prettier | latest | Standard TS/React linting and formatting |
| CI/CD | GitHub Actions | N/A | Lightweight; runs typecheck, test, build on PRs |

## Rationale

### TypeScript
The Paperclip plugin SDK (`@paperclipai/plugin-sdk`) is written in TypeScript and exposes typed APIs for worker context, UI hooks, and protocol helpers. Using TypeScript is not optional -- it is the supported authoring language.

### Node.js 20 LTS
Plugin workers are Node processes started by the host runtime. Node 20 LTS provides long-term support through April 2026 and includes native ESM, `fetch`, and stable `worker_threads`. Using LTS avoids chasing runtime regressions.

### React 18
The plugin UI SDK (`@paperclipai/plugin-sdk/ui`) provides React hooks (`usePluginData`, `usePluginAction`, `usePluginStream`, `useHostContext`). Plugin UI runs as same-origin JavaScript inside the Paperclip app. React 18 is the version the host expects.

### pnpm
The Paperclip ecosystem standardizes on pnpm. The scaffold tool (`@paperclipai/create-paperclip-plugin`) assumes pnpm. Using a different package manager would fight the toolchain.

### esbuild (via SDK bundler presets)
The SDK provides `createPluginBundlerPresets` which configures esbuild for worker, manifest, and UI builds. No reason to introduce a separate bundler -- the SDK preset handles the build correctly.

### Vitest
The SDK ships `createTestHarness` for in-memory plugin testing. Vitest is the natural pairing: fast, supports TypeScript natively, and integrates cleanly with the test harness pattern. Jest would also work but adds more configuration overhead.

### GitHub Actions
Standard CI for open-source TypeScript projects. Runs `typecheck`, `test`, and `build` on every PR. No paid services required.

## Trade-offs

### What was considered and rejected

| Option | Considered For | Rejected Because |
|--------|---------------|-----------------|
| JavaScript (no TS) | Language | SDK APIs are typed; losing type safety would increase bugs and slow development |
| Bun | Runtime | Not yet proven for long-running worker processes; Paperclip host runtime targets Node |
| Vue / Svelte | UI framework | Plugin SDK is React-only; the UI hooks are React hooks |
| npm / yarn | Package manager | Paperclip standardizes on pnpm; scaffold tool assumes it |
| webpack / rollup | Bundler | SDK ships esbuild presets; adding another bundler is unnecessary complexity |
| Jest | Testing | Works but requires more config for TypeScript + ESM; Vitest is simpler for this stack |
| Deno | Runtime | Paperclip host runtime runs Node; Deno compatibility layer would add friction |

### Constraints acknowledged

- **No shared host UI component kit**: Plugins must bring their own React components and CSS. This means we'll build a minimal internal component library or use a lightweight CSS approach (e.g., CSS modules or Tailwind).
- **`ctx.assets` not supported**: No asset upload/read APIs available. Plugin UI must be self-contained.
- **Trusted code model**: Plugin workers and UI are trusted same-origin code. No sandboxing. Security is enforced by capability gating on the worker API, not by isolation.
- **Single-node deployment**: Dynamic plugin install works best on single-node persistent deployments. For production distribution, publish to npm.

## Key Dependencies

| Package | Purpose | License |
|---------|---------|---------|
| `@paperclipai/plugin-sdk` | Core SDK: `definePlugin`, `runWorker`, worker context, lifecycle hooks | Proprietary |
| `@paperclipai/plugin-sdk/ui` | UI SDK: React hooks for plugin data, actions, streams | Proprietary |
| `@paperclipai/plugin-sdk/testing` | Test harness: `createTestHarness` for unit/integration tests | Proprietary |
| `@paperclipai/plugin-sdk/bundlers` | Build presets: `createPluginBundlerPresets` for esbuild | Proprietary |
| `react` / `react-dom` | UI rendering | MIT |
| `typescript` | Type checking and compilation | Apache-2.0 |
| `vitest` | Test runner | MIT |
| `esbuild` | JavaScript/TypeScript bundler | MIT |
| `eslint` | Linting | MIT |
| `prettier` | Code formatting | MIT |

## Development Workflow

```
pnpm install              # install dependencies
pnpm typecheck            # type-check all packages
pnpm test                 # run tests via vitest
pnpm build                # build worker + UI bundles via SDK presets
```

Plugins are installed into a local Paperclip instance from an absolute path during development. For production, publish to npm and install the package at runtime.

---
_Evaluated 2026-03-25. Decisions driven by Paperclip plugin SDK constraints and "boring technology" principle._
