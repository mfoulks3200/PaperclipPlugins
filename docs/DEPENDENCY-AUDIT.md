# Dependency Audit

_Audited: 2026-03-25. Project status: pre-scaffold (no package.json yet). Audit based on planned dependencies from [TECH-STACK.md](TECH-STACK.md)._

## Summary

| Dependency | Planned Version | Latest Stable | Status | Action |
|---|---|---|---|---|
| Node.js | 20 LTS | 22.22.2 LTS | **Critical** | Target Node 22 LTS -- Node 20 EOL April 2026 |
| TypeScript | ~5.5+ | 6.0.2 (5.9.3 latest 5.x) | Major | Start with 5.9.x; test SDK compat with 6.0 later |
| pnpm | 9.x | 10.33.0 (9.15.9 latest 9.x) | Minor | Use pnpm 9.x if SDK scaffold requires it; plan 10.x migration |
| React | 18.x | 19.2.4 (18.3.1 latest 18.x) | SDK-constrained | Use 18.3.1 -- SDK hooks target React 18 |
| esbuild | via SDK presets | 0.27.4 | Current | Managed by SDK; no action needed |
| Vitest | 1.x | 4.1.1 (1.6.1 latest 1.x) | Major | Start with Vitest 2.x+ or latest; verify SDK test harness compat |
| ESLint | latest | 10.1.0 | Minor | Use ESLint 9.x+ with flat config; evaluate 10.x |
| Prettier | latest | 3.8.1 | Current | Use 3.8.x |
| `@paperclipai/plugin-sdk` | latest | _proprietary_ | Unknown | Pin to latest stable at scaffold time |

## Detailed Findings

### Critical

#### Node.js 20 LTS -- EOL April 2026

Node 20 ("Iron") enters end-of-life in April 2026, approximately one month from now. After EOL, no security patches will be issued.

**Node 22 LTS** ("Jod", v22.22.2) is the current Active LTS release with support through April 2027. It includes improved ESM support, performance improvements, and `require(esm)` by default.

**Recommendation:** Update TECH-STACK.md to target **Node 22 LTS** instead of Node 20. Verify that the Paperclip host runtime supports Node 22 workers before committing. If the host still requires Node 20, document this as a known risk and track host-side upgrade separately.

**Effort:** Low (version bump in `engines` field and CI matrix). No breaking changes expected for plugin worker code.

### Major

#### TypeScript 6.0

TypeScript 6.0.2 is the current latest. The TECH-STACK.md specifies `~5.5+` which is reasonable for initial scaffolding. TS 5.9.3 is the latest 5.x release.

**Recommendation:** Scaffold with TypeScript **5.9.x** for maximum SDK compatibility. Create a follow-up issue to test TypeScript 6.0 compatibility once the first plugin is functional. TS 6.0 likely includes breaking changes around decorator metadata and module resolution.

**Effort:** Low for 5.9.x. Medium for 6.0 migration (may require config changes).

#### Vitest Version Gap

Vitest 1.x (specified in TECH-STACK.md) is three major versions behind current (4.1.1). The SDK ships `createTestHarness` which may have compatibility constraints.

**Recommendation:** Start with **Vitest 2.x or 3.x** (whichever the SDK test harness supports). Vitest 1.x is unnecessarily old -- at minimum use 1.6.1 if constrained. Test the SDK harness against newer Vitest versions during scaffold.

**Effort:** Low if SDK supports newer Vitest. Medium if harness has version-specific dependencies.

### Minor

#### pnpm 10.x Available

pnpm 10 is the current mainline (10.33.0) with changes to lockfile format and dependency resolution. The Paperclip ecosystem standardizes on pnpm and the scaffold tool (`@paperclipai/create-paperclip-plugin`) assumes pnpm.

**Recommendation:** Use **pnpm 9.x** (9.15.9) initially if the scaffold tool requires it. Plan migration to pnpm 10 as a follow-up once the workspace is established and scaffold tool compatibility is confirmed.

**Effort:** Low for 9.x. Medium for 10.x (lockfile migration, potential resolution changes).

#### ESLint Flat Config

ESLint 9.x+ defaults to flat config (`eslint.config.js`). The legacy `.eslintrc` format is deprecated. ESLint 10.1.0 is now available.

**Recommendation:** Use **ESLint 9.x** with flat config from the start. Evaluate ESLint 10 after initial setup is stable.

**Effort:** Low (flat config is simpler than legacy format for new projects).

### SDK-Constrained (No Action)

#### React 18.x

The Paperclip plugin SDK UI hooks (`usePluginData`, `usePluginAction`, etc.) target React 18. React 19 (19.2.4) is mature and widely adopted, but upgrading requires SDK support.

**Recommendation:** Use **React 18.3.1** (latest 18.x, includes React 19 migration deprecation warnings). Do not upgrade to React 19 until the SDK officially supports it. Monitor SDK releases for React 19 compatibility.

#### esbuild (via SDK Presets)

esbuild (0.27.4) is managed by `@paperclipai/plugin-sdk/bundlers`. The SDK's `createPluginBundlerPresets` handles version and configuration. No independent version management needed.

## Prioritized Upgrade Plan

### At Scaffold Time (Immediate)

1. **Target Node 22 LTS** in `engines` field and CI matrix (verify host compatibility first)
2. **Use TypeScript 5.9.x** instead of 5.5
3. **Use React 18.3.1** (latest 18.x with migration warnings)
4. **Use Vitest 2.x+** (test SDK harness compatibility; fall back to 1.6.1 if needed)
5. **Use ESLint 9.x** with flat config
6. **Use Prettier 3.8.x**
7. **Use pnpm 9.15.x** (match scaffold tool expectations)
8. **Pin `@paperclipai/plugin-sdk`** to latest stable at install time

### Post-Scaffold Follow-ups

| Task | Priority | Effort | Dependency |
|---|---|---|---|
| Test TypeScript 6.0 compatibility | Medium | Medium | First plugin functional |
| Migrate to pnpm 10 | Low | Medium | Scaffold tool pnpm 10 support |
| Evaluate Vitest 4.x | Low | Low | SDK test harness compat |
| Evaluate ESLint 10 | Low | Low | Stable lint config |
| Monitor React 19 SDK support | Low | N/A | SDK release |

### Vulnerability Notes

No CVEs to report against planned dependencies at this time. The project has no installed packages. Vulnerability scanning (`npm audit`, `pnpm audit`) should be run immediately after scaffolding and integrated into CI.

## Lock File Hygiene

- Commit `pnpm-lock.yaml` from day one
- Run `pnpm audit` in CI on every PR
- Do not regenerate the lockfile without reason
- Pin exact versions for `@paperclipai/plugin-sdk` to avoid unexpected breaking changes from the proprietary SDK

---

_Next audit: after project scaffold is complete and dependencies are installed._
