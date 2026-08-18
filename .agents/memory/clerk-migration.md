---
name: Clerk auth migration
description: Details of the session→Clerk migration for the price guide app, including JIT provisioning, admin setup, and DB schema changes.
---

## What changed

- Replaced express-session + bcrypt with Replit-managed Clerk (`@clerk/express` on server, `@clerk/react` on client)
- `users` table: added `clerk_id TEXT UNIQUE`, made `password_hash` nullable
- `conversations` table: added `clerk_user_id TEXT` (Morbid conversations are now scoped per Clerk user)
- `middlewares/auth.ts`: JIT provisions a local user row on first Clerk-authenticated request using `clerkClient.users.getUser(clerkId)` and upserts by email (handles legacy session-auth users by claiming their row)
- `/api/auth/me` still exists and returns the local user's `role` — frontend uses this for the Admin nav link
- Removed: register/login/logout routes, express-session, SESSION_SECRET dependency
- Frontend: `App.tsx` wraps in `<ClerkProvider>`, sign-in/up routes at `/sign-in/*?` and `/sign-up/*?`

## How to make a user admin after Clerk migration

After signing up through Clerk, the JIT provisioner creates a `role: "user"` row. To promote to admin:
```sql
UPDATE users SET role = 'admin' WHERE clerk_id = '<clerk_user_id>';
```
Or by email:
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

**Why:** There's no admin registration flow — admin is granted manually in the DB after first sign-in.

## Clerk proxy

- Proxy path: `/api/__clerk` (from clerkProxyMiddleware template)
- Required for production; no-op in dev (env var `VITE_CLERK_PROXY_URL` is empty in dev)
- Do NOT gate proxy on NODE_ENV — the empty dev value is intentional

## Region / keys

- Clerk app ID: `app_3I6ODguihodBMfSS7NcowQmzJHS`
- Secrets auto-provisioned: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
