# Corevia App Context

## Overview
React SPA frontend for patients and doctors. Client-side rendered (SSR disabled) using React Router v7 with file-based routing. Separate from the admin backoffice (`apps/web`).

## Tech Stack
- **Framework**: React 19 + React Router v7 (SPA mode, `ssr: false`)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State/Data**: TanStack React Query + tRPC client (v11)
- **Auth**: Better Auth React client (no admin plugin)
- **Forms**: TanStack React Form
- **i18n**: react-i18next + i18next (en/fr)
- **Theme**: next-themes (dark/light/system)
- **Build**: Vite 7

## Architecture
- **Feature-based organization**: `features/{patient,doctor,shared}/` each with `components/` and `routes/`
- **Role-prefixed routes**: `/patient/*` and `/doctor/*`
- **Guard layers**: useRequireAuth → useRoleGuard → useDoctorVerified/usePatientOnboarded
- **Card-based UI** with infinite scroll (no data tables)
- **Navigation**: Desktop sidebar + mobile bottom tab bar
- **No component sharing** with `apps/web` — fully independent

## Key Commands
```bash
pnpm dev              # Start Vite dev server (port 5174)
pnpm build            # Production build
```

## Environment Variables
- `VITE_SERVER_URL` - Backend server URL

## Path Aliases
- `@/` → `src/`
- `@server/` → `../server/src/` (for type imports)
