# Paperclip Plugins

Build plugins that extend the [Paperclip](https://paperclip.ing) platform with connectors, workspace tools, automation, and custom UI.

## What is a Paperclip Plugin?

A Paperclip plugin is an installable extension package that adds capabilities to a Paperclip instance. Plugins run as isolated worker processes and communicate with the host through a JSON-RPC protocol with capability-gated access.

Plugins can:

- **Connect external systems** (Linear, GitHub, Stripe, etc.)
- **Add workspace tools** (file browsing, git integration, terminals)
- **Automate workflows** (scheduled jobs, event processing)
- **Extend the UI** (dashboard widgets, detail tabs, sidebars, custom pages)

## Prerequisites

- Node.js (LTS recommended)
- A running Paperclip instance
- `@paperclipai/plugin-sdk` (installed as a dependency)

## Quick Start

### Scaffold a new plugin

```bash
npx @paperclipai/create-paperclip-plugin my-plugin --template connector
```

This generates a complete plugin package with manifest, worker, UI components, tests, and build configuration.

### Project structure

```
my-plugin/
  package.json          # Plugin metadata and paperclipPlugin entry points
  src/
    manifest.ts         # Plugin manifest (id, capabilities, slots, jobs)
    worker.ts           # Worker entry — lifecycle hooks and handler registration
    ui/                 # React components for UI slots (optional)
  dist/                 # Build output
  tests/                # Test harness files
```

### Define your plugin

Every plugin starts with a manifest and a worker:

**Manifest** (`src/manifest.ts`) declares identity, requested capabilities, and extension points:

```typescript
import { defineManifest } from "@paperclipai/plugin-sdk";

export default defineManifest({
  id: "my-plugin",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "My Plugin",
  description: "What this plugin does",
  categories: ["connector"],
  capabilities: ["events.subscribe", "http.outbound"],
});
```

**Worker** (`src/worker.ts`) implements lifecycle hooks and registers handlers:

```typescript
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.events.on("issue.created", async (event) => {
      ctx.logger.info("New issue created", { issueId: event.issueId });
    });
  },
});

runWorker(plugin);
```

### Install to your Paperclip instance

```bash
npx paperclipai plugin install ./my-plugin
```

The installer reads the manifest, prompts for capability approval, and starts the worker process.

## Plugin Categories

| Category      | Purpose                                    | Example                        |
| ------------- | ------------------------------------------ | ------------------------------ |
| `connector`   | Sync data with external systems            | Linear issue sync              |
| `workspace`   | File, git, and terminal tooling            | Code browser                   |
| `automation`  | Scheduled jobs and event-driven processing | Nightly report generator       |
| `ui`          | Dashboard widgets, tabs, sidebars, pages   | Project analytics dashboard    |

A single plugin can declare multiple categories.

## SDK Packages

| Import Path                        | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `@paperclipai/plugin-sdk`          | Worker SDK: `definePlugin`, `runWorker`, context |
| `@paperclipai/plugin-sdk/ui`       | React hooks: `usePluginData`, `usePluginAction`  |
| `@paperclipai/plugin-sdk/testing`  | Test harness: `createTestHarness`                |
| `@paperclipai/plugin-sdk/bundlers` | esbuild/rollup build presets                     |
| `@paperclipai/plugin-sdk/dev-server` | Local hot-reload development server            |

## Worker Context API

The `ctx` object passed to `setup()` provides capability-gated access to Paperclip internals:

| API                | Purpose                          | Required Capability        |
| ------------------ | -------------------------------- | -------------------------- |
| `ctx.config`       | Read plugin configuration        | _(always available)_       |
| `ctx.events`       | Subscribe to / emit events       | `events.subscribe`, `events.emit` |
| `ctx.jobs`         | Register scheduled jobs          | `jobs.schedule`            |
| `ctx.http`         | Outbound HTTP requests           | `http.outbound`            |
| `ctx.secrets`      | Resolve secret references        | `secrets.read-ref`         |
| `ctx.state`        | Key-value plugin state storage   | `plugin.state.read`, `plugin.state.write` |
| `ctx.data`         | Register data providers for UI   | _(always available)_       |
| `ctx.actions`      | Register action handlers for UI  | _(always available)_       |
| `ctx.tools`        | Register agent-invokable tools   | _(always available)_       |
| `ctx.logger`       | Structured logging               | _(always available)_       |

See the [Architecture Overview](docs/ARCHITECTURE.md) for the full data flow and component diagram.

## UI Slots

Plugins can render React components into predefined host slots:

- **Dashboard widget** — Card on the main dashboard
- **Detail tab** — Additional tab on project/issue/agent/goal views
- **Sidebar** — Sidebar panel entry
- **Settings page** — Custom plugin configuration UI
- **Comment annotation** — Per-comment enhancement
- **Full page** — Dedicated page at `/plugins/:pluginId`

UI components use hooks from `@paperclipai/plugin-sdk/ui` to communicate with the worker.

## Development

```bash
# Start the dev server with hot reload
npx paperclipai plugin dev ./my-plugin

# Run tests
npm test

# Build for production
npm run build
```

## Plugins

| Plugin | Description | Status |
| ------ | ----------- | ------ |
| [`@paperclipai/plugin-chat`](packages/chat/) | Sidebar chat for direct agent messaging | In development |

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) — System design and data flow
- [Contributing Guide](CONTRIBUTING.md) — Development workflow and conventions

## License

See [LICENSE](LICENSE) for details.
