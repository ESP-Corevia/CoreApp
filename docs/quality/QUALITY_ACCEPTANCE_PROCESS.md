# Corevia Quality Acceptance Process

This document defines the final quality acceptance process for Corevia. It is the practical
Definition of Done used before merging or releasing a change.

## Objective

A version is acceptable only when every mandatory automated and manual criterion is validated. A
single failed blocking criterion means the final decision is `FAIL`.

## Scope and responsibilities

This process applies to the CoreApp monorepo and its `server`, `web`, `corevia-app`, and `home`
workspaces.

- The **author** implements the change, adds or updates tests, runs the relevant checks, and
  records known risks in the pull request.
- The **reviewer** checks functional behaviour, regression risk, security/accessibility impact,
  documentation, and the CI results.
- The **validator/release owner** records the final decision for the version or release. This can
  be a project member already acting as release owner; no additional role or team is required.

## Automated acceptance criteria

| Criterion | Command / evidence | Expected result | Blocking |
| --- | --- | --- | --- |
| Installation | `pnpm install --frozen-lockfile` | Reproducible install, exit code 0 | Yes |
| TypeScript | `pnpm check-types` | All four workspaces pass | Yes |
| Build | `pnpm build` | All workspace builds pass | Yes |
| Server lint | `pnpm --filter server check:lint` | Biome passes | Yes |
| Web lint | `pnpm --filter web check:lint` | Biome passes | Yes |
| Server tests | `pnpm --filter server check:test` | 0 failed tests and coverage thresholds pass | Yes |
| Web tests | `pnpm --filter web check:test` | 0 failed tests and coverage thresholds pass | Yes |
| Coverage | Vitest reports from the two test commands | Configured thresholds remain satisfied | Yes |
| Dependency quality | Workspace `check:knip` and `check:dep` jobs | No blocking quality error | Yes in CI |
| Migration safety | Server migration workflow when migrations change | Drizzle check/generation/migration pass | Yes when applicable |

The coverage thresholds are defined in the Vitest configurations and are not changed by this
process:

- `apps/server/vitest.config.ts`: 90% branches, 95% functions, lines, and statements;
- `apps/web/vitest.config.ts`: 85% branches, 75% functions, and 80% lines and statements.

The workflows in `.github/workflows/server.yml` and `.github/workflows/web.yml` run the relevant
checks and publish JUnit/coverage evidence. A green local command is useful evidence, but the CI
result is the merge gate.

## Manual acceptance criteria

- [ ] The functional acceptance criteria of the task are demonstrated.
- [ ] The changed business behaviour and relevant error paths have suitable tests.
- [ ] No obvious regression is present in the impacted user journey or API.
- [ ] Documentation and environment variables are updated when required.
- [ ] No secret, credential, production URL, or production data is committed.
- [ ] A database migration is reviewed and reproducible when applicable.
- [ ] Security impact is considered, including authentication, authorization, validation, and
      dependency changes.
- [ ] Accessibility impact is considered for web UI changes.
- [ ] Reviewer approval is recorded.

## Final decision

The validator/release owner records one of these decisions:

- `PASS`: every blocking automated criterion passes and the manual checklist is complete;
- `FAIL`: at least one blocking criterion fails or a required manual item is incomplete.

Tests and coverage must not be bypassed with `|| true`, permanent skips, or arbitrary threshold
reductions.

## Release validation record

Copy this template into the release or pull request description:

```markdown
## Release validation

Version / commit:
Date:
Reviewer:
Validator:

Installation: PASS / FAIL
Types: PASS / FAIL
Build: PASS / FAIL
Tests Web: PASS / FAIL
Tests Server: PASS / FAIL
Coverage: PASS / FAIL
Lint: PASS / FAIL
Functional validation: PASS / FAIL
Documentation: PASS / FAIL

FINAL DECISION: PASS / FAIL

Notes:
```

## Definition of Done relationship

No separate, current Definition of Done document was found in this repository. Until the group
maintains one elsewhere, this process is the CoreApp implementation of the Definition of Done:

```text
Task acceptance → local checks → blocking CI → review → final PASS/FAIL decision
```

If the group has a shared DoD outside this repository, it should link to this process and retain
the same blocking criteria.

## Exceptions and traceability

An exception must be explicit in the pull request and state the failed criterion, reason, risk,
owner, mitigation, and follow-up date. The exception does not silently turn a failed gate into a
PASS.

The evidence to retain is the pull request review, CI checks, JUnit reports, coverage reports, and
the final commit or release record.
