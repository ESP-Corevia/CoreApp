# Corevia Quality Acceptance Process

This document defines the quality acceptance process for the Corevia solution. It is the
Definition of Done used before merging or releasing a change.

## Scope

The process applies to the CoreApp monorepo and its `server`, `web`, `corevia-app`, and `home`
workspaces. It covers source code, tests, documentation, configuration, database migrations, and
deployment-related changes.

## Responsibilities

- The contributor runs the relevant local checks, adds or updates tests, and describes any known
  limitation in the pull request.
- The reviewer checks the acceptance criteria, the business impact, the tests, and the security
  implications. The reviewer must not approve a failed quality gate without a documented exception.
- GitHub Actions provides the reproducible, blocking verification on pull requests and changes
  reaching `master`.

## Mandatory acceptance gates

From the repository root, the following commands must succeed for a code change:

```powershell
pnpm install --frozen-lockfile
pnpm check-types
pnpm build
pnpm --filter server check:lint
pnpm --filter web check:lint
pnpm --filter server check:test
pnpm --filter web check:test
```

The test commands are blocking and enforce the coverage thresholds configured in:

- `apps/server/vitest.config.ts` — 90% branches and 95% functions, lines, and statements;
- `apps/web/vitest.config.ts` — 85% branches, 75% functions, and 80% lines and statements.

The CI workflows also run Knip, depcheck, i18n checks, and the web bundle-size check where
applicable. A database migration change additionally requires the Drizzle migration checks and a
clean generated diff.

## PASS / FAIL criteria

The change is **PASS** only when:

1. installation completes from the lockfile without manual approval steps;
2. type checking and all impacted builds succeed;
3. lint and repository quality checks succeed;
4. all relevant unit and integration tests pass;
5. coverage thresholds remain satisfied without hiding business logic in new exclusions;
6. no secret, credential, or production data is introduced;
7. the pull request contains a short validation summary and the required reviewer approval.

The change is **FAIL** when any mandatory command exits non-zero, a coverage threshold fails, a
test is skipped to hide a defect, a migration is not reproducible, or a security concern is left
without an owner and documented mitigation.

## Pull request and release checklist

- [ ] The change is linked to its issue or acceptance need.
- [ ] The contributor used a Conventional Commit message.
- [ ] Tests cover the changed behaviour and relevant error paths.
- [ ] Local quality gates are green.
- [ ] CI checks are green, including test and coverage reports.
- [ ] Documentation and environment variables are updated when needed.
- [ ] Database migrations are generated, reviewed, and reproducible when applicable.
- [ ] The reviewer confirms the security, accessibility, and regression impact.
- [ ] The release note or deployment impact is recorded when applicable.

## Exceptions

An exception is temporary and must be explicit in the pull request. It must state the failed gate,
the reason, the risk, the owner, and a follow-up issue or deadline. Exceptions do not permit
silencing test or coverage failures with `|| true`, permanent skips, or arbitrary threshold
reductions.

## Evidence for assessment

The following artefacts demonstrate application of this process:

- this process and its checklist;
- the blocking workflows in `.github/workflows/server.yml` and `.github/workflows/web.yml`;
- JUnit and coverage reports produced by Vitest;
- the pull request review and its CI checks;
- the final commit or release record.
