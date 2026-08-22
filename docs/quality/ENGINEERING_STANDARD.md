# Corevia Engineering Standard

This is the common internal engineering standard for Corevia. Contributors are expected to refer
to it together with the [Quality Acceptance Process](QUALITY_ACCEPTANCE_PROCESS.md). It reuses
tools already present in the repository and does not claim external certification.

## Code style and quality

- TypeScript is the implementation language for CoreApp; workspace type checks must pass.
- Biome is the formatter and linter. Its rules are defined in `biome.json` and are run by the
  workspace `check:lint` scripts and CI.
- Formatting uses the repository Biome configuration rather than editor-specific settings.
- Unused imports are errors; other configured correctness, suspicious, style, CSS, and accessibility
  rules are reviewed according to `biome.json`.
- Commits follow Conventional Commits and are checked by `commitlint.config.js` using
  `@commitlint/config-conventional`.

## Tests and coverage

Every new or modified business behaviour must have appropriate tests, including relevant error
paths. The project uses:

- Vitest for unit, component, hook, and API integration tests;
- in-memory PGlite fixtures for server integration journeys;
- JSDOM for web component and hook tests;
- Vitest coverage thresholds configured in `apps/server/vitest.config.ts` and
  `apps/web/vitest.config.ts`.

The standard requires coverage thresholds to remain satisfied. It does not claim that every
generated file or UI primitive must reach 100%, and exclusions must remain technical and justified.

## Security

Security decisions should follow applicable OWASP recommendations, especially for authentication,
authorization, input validation, secrets, error exposure, and dependency risk. The repository
currently applies these practices through:

- Fastify Helmet and CORS configuration;
- Better Auth session and credential handling;
- Zod validation at API/service boundaries;
- environment-based secrets, with `.env` files ignored by Git;
- dependency audit checks and explicit review of audit findings.

This is a reference to OWASP good practices, not a claim of OWASP compliance or certification.

The current `web` audit script reports audit unavailability as a warning. A local audit currently
reports vulnerabilities, including critical findings, so this risk must be reviewed before a
production release even when the B04 test/build gates pass. No mass dependency upgrade is implied
by this document.

## Accessibility

WCAG 2.1 AA is the accessibility reference for web features. It is supported by the existing
Playwright and axe tooling:

- `@axe-core/playwright` is installed;
- the web package provides an `axe` script;
- Playwright accessibility journeys run in the web CI workflow where configured.

This is an engineering target, not a claim of complete WCAG conformance. Human review remains
required for changed user journeys.

## Pull requests and Definition of Done

A pull request must:

- use a Conventional Commit message;
- contain focused changes and relevant tests;
- pass typecheck, build, lint, test, and coverage gates;
- update documentation when behaviour or configuration changes;
- include review of security and accessibility impact;
- never remove or skip a test only to make CI green.

The final acceptance decision is recorded using
`docs/quality/QUALITY_ACCEPTANCE_PROCESS.md`.

## Evidence matrix

| Domain | Standard / rule | Implementation | Evidence |
| --- | --- | --- | --- |
| Commits | Conventional Commits | commitlint | `commitlint.config.js` and package scripts |
| TypeScript code | Internal code-quality rules | TypeScript + Biome | `biome.json`, workspace CI jobs |
| Tests | Internal test/coverage rule | Vitest + coverage | Vitest configs, JUnit and coverage reports |
| Security | OWASP recommendations when applicable | Helmet, validation, secrets, audit review | server configuration and CI |
| Accessibility | WCAG 2.1 AA reference | Playwright + axe | web package and workflow |
| Review | Internal acceptance rule | PR review + blocking CI | `.github/pull_request_template.md`, workflows |

## Contributor obligation

Before opening a pull request, a contributor must read this standard, run the relevant checks, and
declare any exception or residual risk. Reviewers use the evidence matrix and the acceptance process
to verify that the standard was actually applied.
