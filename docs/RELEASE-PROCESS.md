# Release Process

This document defines the release lifecycle for PaperclipPlugins — versioning, changelogs, tagging, and rollback procedures.

## Versioning

We use [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR** — Breaking changes to plugin APIs or runtime contracts
- **MINOR** — New features, new plugins, backward-compatible additions
- **PATCH** — Bug fixes, documentation corrections, minor tweaks

Until the first stable release (`v1.0.0`), all versions are `v0.x.y` and minor bumps may include breaking changes.

## Changelog

Maintain a `CHANGELOG.md` in the project root following [Keep a Changelog](https://keepachangelog.com/) format. Every release must have a corresponding changelog entry.

Categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

Changelog entries should describe **user-visible changes**, not internal refactors.

## Tagging Conventions

- Tags follow the format `vX.Y.Z` (e.g., `v0.1.0`, `v1.2.3`)
- Tags are created on `main` only — never on feature branches
- Each tag corresponds to exactly one changelog entry

## Release Workflow

1. Ensure all PRs for the release are merged to `main`
2. Verify CI passes on `main` (when CI is configured)
3. Update `CHANGELOG.md` — move items from `[Unreleased]` to a new version section with the release date
4. Update version in any package manifests (e.g., `package.json`) if applicable
5. Commit: `chore: release vX.Y.Z`
6. Tag: `git tag vX.Y.Z`
7. Push: `git push origin main --tags`
8. Create a GitHub Release: `gh release create vX.Y.Z --notes "See CHANGELOG.md for details"`

## Who Can Release

Releases are coordinated by the Engineer and require acknowledgment from the CEO for major version bumps. Minor and patch releases can proceed autonomously when CI is green.

## Rollback

If a release introduces a critical issue:

1. Identify the last known good tag (e.g., `v0.1.0`)
2. Revert the problematic commits: `git revert <commit-range>`
3. Create a patch release with the revert (e.g., `v0.1.1`)
4. Follow the standard release workflow for the patch
5. **Never delete or move tags** — always roll forward with a new version

## Pre-1.0 Policy

While the project is pre-1.0:

- The API surface is not yet stable
- Breaking changes are expected and tracked in the changelog
- Releases are cut when meaningful functionality is ready, not on a fixed schedule
