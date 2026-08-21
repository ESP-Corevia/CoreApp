# Testing guide

Corevia uses different test layers for frontend behavior, server behavior and
browser journeys. The commands below are the repository scripts, so they remain
the preferred entry points for local and CI validation.

## Test layers

| Layer | Workspace | Tooling | Scope |
| --- | --- | --- | --- |
| Unit/component | `apps/web` | Vitest, Testing Library, jsdom | React components, hooks and client behavior |
| Server unit/integration | `apps/server` | Vitest, Istanbul, PGlite | Services, repositories, HTTP/tRPC journeys and Better Auth integration |
| Browser E2E | `apps/web` / `apps/corevia-app` | Playwright | Authenticated user journeys in a real browser |
| Accessibility E2E | `apps/web` | Playwright + axe | Browser accessibility checks tagged `@a11y` |

The server integration suites exercise the HTTP-to-tRPC-to-service-to-repository
path. Their test setup uses isolated PGlite state; S3 and the external medication
API are mocked where the suite requires deterministic behavior. Browser suites
use seeded E2E accounts and require the server/database/object-storage stack.

## Commands

```powershell
# Type checking and builds
pnpm check-types
pnpm build

# Unit/component suites with coverage
pnpm --filter server check:test
pnpm --filter web check:test

# Browser suites
pnpm --filter web e2e
pnpm --filter corevia-app e2e
pnpm --filter web axe

# Deterministic E2E data
pnpm --filter server db:seed:e2e
```

Use `test:watch`, `test:ui`, `e2e:ui` or `e2e:headed` from the relevant workspace
for interactive debugging.

## Coverage gates

The current Vitest thresholds are configured in the workspace Vitest files:

| Workspace | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `server` | 95% | 90% | 95% | 95% |
| `web` | 80% | 85% | 75% | 80% |

Coverage excludes generated/build output, test helpers and selected infrastructure
files. A zero-coverage report combined with collection errors is not a valid
project coverage result: the suite must collect and execute tests before its
percentages can be interpreted.

The ESP902 remediation baseline validated locally before this documentation pass
was:

- web: 81/81 files and 478/478 tests passed;
- server: 51/51 files and 939/939 tests passed.

## CI artifacts and troubleshooting

In CI, Vitest writes JUnit reports under `apps/*/reports/`; CI publishes those
reports and coverage summaries. Playwright writes its HTML report and JUnit
artifacts in the relevant workspace.

If all files fail before tests are collected, check the runtime and install first:

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
```

The root engine range is `^20.19.0 || >=22.12.0`. Native dependency build scripts
are allowlisted in the root `package.json`; a clean install should not leave the
required build scripts ignored.

For E2E failures, ensure PostgreSQL and MinIO are reachable, run the E2E seed,
and verify that the application/API URLs match the selected local or Docker
profile.
