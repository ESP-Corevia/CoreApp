# ESP902 evidence sheet

This sheet is a concise map from the ESP902 competencies to an artifact that can
be opened or demonstrated. It covers CoreApp and the associated mobile repository.

| Competency | Requirement | Evidence | Demonstration |
| --- | --- | --- | --- |
| B04 | Quality acceptance process | [Quality Acceptance Process](quality/QUALITY_ACCEPTANCE_PROCESS.md) | Show PASS/FAIL gates, manual checklist and exception rule |
| B05 | Code documentation | [Architecture](ARCHITECTURE.md), [Environment](ENVIRONMENT.md), [API](API.md), [Testing](TESTING.md) | Open Scalar at `/reference` and the generated `/openapi.json` |
| B08 | Unit/integration test coverage | CoreApp Vitest reports and CI; the mobile branch contains a runnable minimum suite and coverage CI | Run the repository commands below and show the coverage artifacts |
| B13 | Refer to a recognized standard | [Engineering Standard](quality/ENGINEERING_STANDARD.md) | Show Conventional Commits, Biome, OWASP and WCAG references |

## B04 — oral proof

The acceptance process defines explicit PASS/FAIL gates and a documented exception path. Automated criteria cover types, build, lint, tests and coverage; manual criteria cover functional demonstration and review. The validator/release owner records the final decision, and a change is ready only when its relevant local checks and blocking CI checks pass. The process is linked from both the README and CONTRIBUTING guide.

## B05 — oral proof

The architecture, environment, API and testing documents describe the verified repository. The API documentation points to the real Fastify routes, with OpenAPI exposed through Scalar at `/reference`. Complex integration points also have TSDoc comments in the server.

## B08 — oral proof

CoreApp has a verified baseline of 478/478 web tests and 939/939 server tests, for 1,417 tests total, with coverage thresholds enforced by Vitest and blocking CI checks. `corevia_mobile` now runs 6 tests with Flutter coverage uploaded by CI as a complement. The mobile suite is intentionally a minimum safety net and must not be presented as exhaustive full-solution coverage.

## B13 — oral proof

The engineering standard maps the project practices to Conventional Commits, commitlint, TypeScript, Vitest, Biome, OWASP ASVS and WCAG. The quality process turns those references into repository gates and PR review evidence. The standards are linked from the contribution guide so they are part of the normal change workflow.

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

The mobile commands are a complement to the CoreApp validation and do not claim
exhaustive solution-wide coverage.

## Branch evidence

- CoreApp: `rattrapage-esp902`, commit `a3efe86`.
- Mobile: `rattrapage-esp902`, commit `275b7f9`.
- No branch was merged into `master`/`main` and no automatic merge was performed.

## DÉMO SOUTENANCE

### B04

Ouvrir `docs/quality/QUALITY_ACCEPTANCE_PROCESS.md` : « Une release est acceptée uniquement si tous les critères bloquants passent. La décision finale est explicitement PASS ou FAIL. »

### B05

Ouvrir `docs/ARCHITECTURE.md`, `docs/API.md` et `/reference` : « La documentation couvre l’architecture, l’environnement, les tests et l’API. La documentation API est générée via OpenAPI et exposée avec Scalar. »

### B08

Montrer les rapports Vitest, la couverture et la CI : « Les suites web et server passent entièrement, avec 1 417 tests CoreApp et des seuils de couverture bloquants dans la CI. »

### B13

Ouvrir `docs/quality/ENGINEERING_STANDARD.md` : « Les contributeurs suivent un standard commun : Conventional Commits, Biome, TypeScript, tests, sécurité OWASP et accessibilité WCAG. »
