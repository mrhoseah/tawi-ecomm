## Authentication Overview

This project uses **NextAuth (Auth.js)** with **JWT sessions** plus **Prisma** as the source of truth for users and roles. AWS **Cognito** and **Google** act as identity providers.

### Providers and flows

- **Credentials (email + password)**  
  - Primary sign-in path used by the app.  
  - Checks a local Prisma `User` record first (bcrypt password hash).  
  - If no local password match is found and Cognito is configured, it falls back to Cognito `USER_PASSWORD_AUTH`.

- **Cognito provider** (`auth.config.ts`)  
  - Used by middleware/edge and allows OAuth-style login via Cognito hosted UI if needed.

- **Google provider** (`auth.config.ts`)  
  - Enables Google OAuth sign-in.

Regardless of how a user signs in, the **JWT callback** in `lib/auth.ts` upserts a Prisma `User` by email and attaches:

- `token.id` / `session.user.id` – Prisma user id  
- `token.role` / `session.user.role` – application role (`customer`, `admin`, `support`, etc.)

Roles are always taken from Prisma, never directly from Cognito/Google claims.

### Key files

- `lib/auth.ts` – main NextAuth config (credentials provider, JWT/session callbacks).  
- `auth.config.ts` – edge-safe NextAuth config used by `middleware.ts`.  
- `lib/cognito-auth.ts` – low-level Cognito helpers (sign-up, verify, resend, forgot/reset password, direct password auth).  
- `app/api/auth/cognito/*` – HTTP endpoints wrapping Cognito helpers with validation and stable JSON responses.  
- `middleware.ts` – enforces auth for `/account` and `/cp` routes and adds security headers.  
- `lib/auth-guard.ts` – small helpers for server components/actions: `requireAuth`, `requireRole`.

### Environment variables

Auth will **fail fast in production** if the main secret is missing.

Required for NextAuth:

- `AUTH_SECRET` **or** `NEXTAUTH_SECRET`

Required for Cognito flows:

- `COGNITO_CLIENT_ID`  
- `COGNITO_REGION`  
- `COGNITO_CLIENT_SECRET` (optional but recommended)  
- `COGNITO_ISSUER_URL` (for the Cognito provider in `auth.config.ts`)

Required for Google:

- `GOOGLE_CLIENT_ID`  
- `GOOGLE_CLIENT_SECRET`

Make sure these are set in your deployment environment (e.g. Vercel project settings).

### Usage patterns

- **Protecting server routes/pages**
  - For generic “must be logged in” checks in server code, use:
    - `const session = await requireAuth();`
  - For role-based checks (e.g. admin-only tools), use:
    - `const session = await requireRole(["admin"]);`

- **Client-side redirects**
  - Middleware already redirects unauthenticated users from `/account` and `/cp` to `/sign-in` with a `callbackUrl`.
  - Auth pages (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`) redirect logged-in users back to `/`.

### Error messaging

- Credential logins always surface a **generic**: “Invalid email or password.” to avoid leaking which part failed.
- Cognito helpers log detailed errors server-side and return short, user-oriented messages for UI components.

