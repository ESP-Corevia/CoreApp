# Corevia Engineering Standards

Corevia refers to the following existing standards and applies them through repository rules,
automated tools, and review evidence. This document is a practical project reference; it does not
claim certification against any external standard.

## Standards used by the project

| Standard or convention | Application in Corevia | Evidence |
| --- | --- | --- |
| Conventional Commits | Commit messages use a type/scope-oriented format and are checked by commitlint. | `commitlint.config.js`, `@commitlint/config-conventional` |
| Biome project style | Formatting, lint rules, imports, TypeScript conventions, and CSS checks are automated. | `biome.json`, workspace `check:lint` scripts |
| OWASP Top 10 / ASVS principles | Authentication, authorization, input validation, security headers, CORS, secrets, and error handling are reviewed as security controls. | Better Auth, Zod schemas, Fastify Helmet/CORS configuration, server tests |
| WCAG 2.2 accessibility principles | User-facing flows include automated accessibility checks through Playwright and axe. | `@axe-core/playwright`, `apps/web/axe` script, web E2E workflow |
| Internal quality acceptance standard | Every change follows the blocking acceptance gates and review checklist. | `QUALITY_ACCEPTANCE_PROCESS.md`, `.github/workflows/` |

## Contributor rules

Before opening a pull request, contributors must:

1. read this document and `QUALITY_ACCEPTANCE_PROCESS.md`;
2. use a Conventional Commit message;
3. run the relevant type, lint, build, and test commands;
4. add tests for changed business behaviour and error paths;
5. consider OWASP and accessibility impact for security- or UI-related changes;
6. report deviations and residual risks in the pull request.

## How the standards are applied

- Commitlint provides fast feedback on commit format.
- Biome runs locally and in CI; a non-zero result blocks the quality job.
- Vitest coverage thresholds provide a measurable quality gate for server and web code.
- The server exposes an OpenAPI/Scalar reference for the API contract.
- Playwright and axe cover browser-level behaviour and accessibility journeys.
- Reviewers use the acceptance checklist to verify that tools were actually run and that warnings
  or exceptions have an owner.

## Scope and limits

The project uses these standards as engineering references. Passing a linter or an automated scan
does not by itself prove complete OWASP or WCAG compliance. Security-sensitive changes still require
human review, and any exception must be recorded using the process in
`QUALITY_ACCEPTANCE_PROCESS.md`.
