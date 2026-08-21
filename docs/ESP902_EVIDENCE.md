# ESP902 evidence sheet

This sheet is a concise map from the ESP902 competencies to an artifact that can
be opened or demonstrated. It covers the three repositories currently identified
as part of the solution.

| Competency | Requirement | Evidence | Demonstration |
| --- | --- | --- | --- |
| B04 | Quality acceptance process | [Quality Acceptance Process](quality/QUALITY_ACCEPTANCE_PROCESS.md) | Show PASS/FAIL gates, manual checklist and exception rule |
| B05 | Code documentation | [Architecture](ARCHITECTURE.md), [Environment](ENVIRONMENT.md), [API](API.md), [Testing](TESTING.md) | Open Scalar at `/reference` and the generated `/openapi.json` |
| B08 | Unit/integration test coverage | CoreApp Vitest reports and CI; mobile and RAG branches now contain runnable minimum suites | Run the repository commands below and show the coverage artifacts |
| B13 | Refer to a recognized standard | [Engineering Standard](quality/ENGINEERING_STANDARD.md) | Show Conventional Commits, Biome, OWASP and WCAG references |

## B04 — oral proof

The acceptance process defines explicit PASS/FAIL gates and a documented exception path. A change is ready only when its relevant local checks and blocking CI checks pass. The process is linked from both the README and CONTRIBUTING guide.

## B05 — oral proof

The architecture and environment documents describe only components verified in the repository. The API documentation points to the real Fastify routes and explains that Scalar consumes the runtime-generated merged OpenAPI document. Complex integration points also have TSDoc comments in the server.

## B08 — oral proof

CoreApp has a verified baseline of 478/478 web tests and 939/939 server tests, with coverage thresholds enforced by Vitest. `corevia_mobile` now runs 6 tests with Flutter coverage in CI, and `rag-communication-service` runs 7 mocked Vitest tests with coverage in CI. The auxiliary repositories are improved but not yet at full solution-wide coverage; this limitation must be stated during the evaluation.

## B13 — oral proof

The engineering standard maps the project practices to Conventional Commits, Biome, OWASP ASVS and WCAG. The quality process turns those references into repository gates and review evidence. The standards are linked from the contribution guide so they are part of the normal change workflow.

## Reproduction commands

From `CoreApp`:

```powershell
pnpm check-types
pnpm build
pnpm --filter server check:test
pnpm --filter web check:test
```

From `corevia_mobile` on branch `rattrapage-esp902`:

```powershell
flutter analyze --no-fatal-infos --no-fatal-warnings
flutter test --coverage
```

From `rag-communication-service` on branch `rattrapage-esp902`:

```powershell
npm run check:all
```

## Branch evidence

- CoreApp: `rattrapage-esp902`, commit `a3efe86`.
- Mobile: `rattrapage-esp902`, commit `275b7f9`.
- RAG service: `rattrapage-esp902`, commit `a967ebf`.
- No branch was merged into `master`/`main` and no automatic merge was performed.
