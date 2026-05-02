# StreamSync Panel

## Overview

Streaming management panel for Jellyfin/Plex/Emby. Supports admin and reseller roles.
pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24
- **Package manager**: pnpm
- **TypeScript**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (OpenAPI spec)
- **Frontend**: React + Vite (port 5173)
- **API**: Express server (port 8080)

## Artifacts

- `artifacts/streamsync-panel` — React+Vite frontend, routes at `/` (port 5173)
- `artifacts/api-server` — Express 5 API, routes at `/api` (port 8080)

## Workflows

- **StreamSync Panel** — `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/streamsync-panel run dev`
- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev`

## Key Commands

- `pnpm run typecheck` — full typecheck (libs + leaf packages)
- `pnpm run typecheck:libs` — build composite libs (run before leaf typechecks)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push-force` — push DB schema changes

## Admin Credentials

- Email: `admin@streamsync.com`
- Password: `admin123`

## User Roles

- **admin** — full access to all features
- **reseller** — can manage their own clients only (cannot see/modify admins or other resellers' clients)
- **client** — end users

## Features

- Dashboard with stats
- Clients (Users) management — admin sees all clients; resellers see only their own
- Resellers management — admin only; resellers have their own login, manage clients
- Servers management (admin only)
- Packages management (admin only)
- Streaming service pages: Plex, Jellyfin, Emby
- Reseller badge on client rows showing which reseller owns them
- Expiry countdown shown on client rows (red/amber for urgent/expired)
- expiresAt uses end-of-day (23:59:59) to avoid timezone off-by-one

## Libraries

- `lib/db` — Drizzle schema (`usersTable` with `resellerId`)
- `lib/api-spec` — OpenAPI YAML (source of truth for API contract)
- `lib/api-zod` — Zod schemas generated from OpenAPI
- `lib/api-client-react` — React Query hooks generated from OpenAPI

## Architecture Notes

- JWT auth via `jsonwebtoken`/`bcryptjs`
- Reseller permission enforcement in `artifacts/api-server/src/routes/users.ts`
- Reseller CRUD in `artifacts/api-server/src/routes/resellers.ts`
- `ApiError` exported from `lib/api-client-react/src/custom-fetch.ts` (and re-exported from package index)
- Demos section was removed entirely
