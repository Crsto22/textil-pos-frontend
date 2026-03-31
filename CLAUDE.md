# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

```bash
BACKEND_URL=http://localhost:8080        # Spring Boot backend
API_RENIEC_URL=https://...               # External DNI/RUC lookup API (Peru)
```

## Architecture Overview

**Sistema POS Textil** is a Next.js 16 (App Router) frontend that acts as a BFF (Backend For Frontend) over a Spring Boot Java backend. The frontend does not touch any database directly.

### Routing Layout

- `app/(auth)/` — Public routes (login). Layout redirects to `/dashboard` if already authenticated.
- `app/(protected)/` — All protected routes. Layout enforces auth + RBAC before rendering.
- `app/api/` — BFF API routes: every route proxies requests to `BACKEND_URL`, injecting the Authorization header and forwarding cookies.

### Authentication Flow

1. On app load, `AuthProvider` silently calls `/api/auth/refresh` to restore the session.
2. Login: `POST /api/auth/login` → Next.js BFF proxies to `BACKEND_URL/api/auth/autenticarse` → receives `access_token` + sets `refresh_token` as HttpOnly cookie.
3. `access_token` is stored **in memory only** (`lib/auth/token-store.ts`) — it is lost on page reload and automatically renewed via the refresh cookie.
4. All client-side API calls go through `authFetch()` (`lib/auth/auth-fetch.ts`), which injects the Bearer token and handles 401s by automatically refreshing once before retrying.

### Role-Based Access Control

Defined in `lib/auth/permissions.ts`. Four roles: `ADMINISTRADOR` (full access), `VENTAS`, `VENDEDOR`, `ALMACEN`. The protected layout (`app/(protected)/layout.tsx`) redirects to `getDefaultRoute(role)` if the current route is not in `allowedRoutes`.

### Data Fetching Pattern

All data fetching is done in custom hooks (`lib/hooks/`). The standard pattern:
- Call `authFetch("/api/<resource>/listar?...")` with pagination/filter params
- Use `AbortController` refs to cancel in-flight requests on unmount or filter change
- Debounce search inputs with a shared `useDebouncedValue` hook
- Return `{ data, loading, error, ... }` to components

### BFF API Routes Pattern

Every file under `app/api/` follows the same pattern:
1. Extract and validate query params (allowlist approach)
2. Forward `Authorization` header from the incoming request
3. `fetch(\`${BACKEND_URL}/api/...\`, { headers })`
4. Parse response and return to client

Helpers in `app/api/auth/_helpers.ts` handle cookie forwarding, session user cookie, and safe JSON parsing.

### Key Modules

| Path | Purpose |
|------|---------|
| `lib/auth/auth-context.tsx` | `AuthProvider` + `useAuth()` hook — user state, login, logout |
| `lib/auth/auth-fetch.ts` | `authFetch()` — authenticated fetch with auto-refresh |
| `lib/auth/token-store.ts` | In-memory access token store |
| `lib/auth/permissions.ts` | Role config and `hasAccess()` / `getDefaultRoute()` |
| `lib/company/company-context.tsx` | `CompanyProvider` — global empresa info from `/api/empresa/publico` |
| `lib/types/` | Shared TypeScript DTOs for all entities |
| `lib/hooks/` | ~30+ custom data-fetching hooks, one per resource |
| `components/ui/` | shadcn/ui components + custom UI primitives |

### Import Alias

Use `@/` for all imports from the project root (configured in `tsconfig.json`):
```ts
import { authFetch } from "@/lib/auth/auth-fetch"
```
