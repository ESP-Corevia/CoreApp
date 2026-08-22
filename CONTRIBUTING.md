# Contributing to Corevia

Before opening a pull request, read:

- [Architecture](docs/ARCHITECTURE.md)
- [Environment reference](docs/ENVIRONMENT.md)
- [API reference](docs/API.md)
- [Testing guide](docs/TESTING.md)
- [Engineering Standard](docs/quality/ENGINEERING_STANDARD.md)
- [Quality Acceptance Process](docs/quality/QUALITY_ACCEPTANCE_PROCESS.md)

Use Conventional Commits, keep changes focused, and include tests for changed behaviour. At a
minimum, run:

```powershell
pnpm check-types
pnpm build
pnpm --filter server check:test
pnpm --filter web check:test
```

A pull request is ready when its relevant local checks and blocking GitHub Actions checks pass. A
failed gate may only be accepted with a documented exception, owner, mitigation, and follow-up
date; tests and coverage must not be bypassed.
