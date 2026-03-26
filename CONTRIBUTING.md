# Contributing to Paperclip Plugins

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
   cd PaperclipPlugins
   npm install
   ```

2. Start the development server for your plugin:

   ```bash
   npx paperclipai plugin dev ./my-plugin
   ```

3. Run the test suite to verify everything works:

   ```bash
   npm test
   ```

## Development Workflow

This project follows a **direct-to-main** workflow for small changes and a **PR-based** workflow for significant changes.

### Direct-to-Main (small changes)

Acceptable for: typos, comment-only changes, minor doc fixes.

1. Pull latest from main
2. Make changes
3. Run tests/linting locally
4. Commit with a conventional commit message
5. Push to main

### PR Workflow (significant changes)

Required for: code logic, APIs, database schema, agent configs, infrastructure.

1. Create a branch from main: `papa-<N>/<short-description>`
2. Make changes and commit
3. Open a PR using the template below
4. Request review from Code Reviewer and Product Owner
5. Merge after both approve and CI passes

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short description>
```

| Type       | When to use                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature or capability            |
| `fix`      | Bug fix                              |
| `docs`     | Documentation changes                |
| `chore`    | Maintenance, dependency updates      |
| `refactor` | Code restructuring without behavior change |
| `test`     | Adding or updating tests             |
| `perf`     | Performance improvement              |

Rules:
- Lowercase after the colon
- No period at the end
- Under 72 characters
- Reference the issue ID in the commit body when applicable

## Branch Naming

```
papa-<N>/<short-description>
```

Where `<N>` is the issue number. Examples: `papa-6/add-auth-endpoint`, `papa-12/fix-event-handler`.

## Pull Request Template

```markdown
## What changed
<Brief description of the changes>

## Why
<Motivation and context>

## How to test
<Steps to verify the changes>

## Related
Closes [PAPA-N]
```

Apply one primary label: `feature`, `bug`, `docs`, `chore`, `infra`, `agent`.

## Review Process

1. **Engineer** opens PR and sets the originating issue to `in_review`
2. **Engineer** @-mentions Code Reviewer and Product Owner on the issue with the PR link
3. **Code Reviewer** reviews for correctness, security, code style, and simplicity
4. **Product Owner** reviews for intent match, scope discipline, and roadmap alignment
5. Both post their verdict on the issue
6. **Engineer** merges when both approve

## Merge Rules

- Code Reviewer and Product Owner must approve (required)
- CI must pass
- No force pushes
- Merge with `gh pr merge <number> --merge`
- The engineer is the merge owner — reviewers never merge

## Plugin Development Guidelines

### Structure

Each plugin lives in its own package directory:

```
plugins/
  my-plugin/
    package.json
    src/
      manifest.ts
      worker.ts
      ui/           # Optional React UI components
    tests/
```

### Testing

Use the SDK test harness to test your plugin in isolation:

```typescript
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";

const harness = createTestHarness(myPlugin);
// ... test your handlers
```

### Capabilities

Only request the capabilities your plugin needs. Each capability is shown to the operator during installation for approval. Requesting unnecessary capabilities reduces trust and may lead to installation rejection.

## Code of Conduct

- Write clear, tested code
- Keep PRs focused — one concern per PR
- Respond to review feedback promptly
- Document non-obvious decisions in code comments or commit messages
