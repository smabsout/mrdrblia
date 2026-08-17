---
name: Orval Zod v3 compatibility
description: Orval 8.x generates Zod v4 syntax for certain OpenAPI types; workspace uses Zod v3
---

## Rule
Never use `type: integer` or `format: email` in `lib/api-spec/openapi.yaml`.

## Why
Orval 8.x generates `zod.int()` for `type: integer` and `zod.email()` for `format: email`. These are Zod v4 methods. The workspace pins `zod@^3.25.x` (v3), where these methods don't exist on the main `zod` export. The codegen succeeds but `pnpm run typecheck:libs` fails with TS2339 errors.

## How to apply
- Use `type: number` everywhere instead of `type: integer`
- Remove `format: email` from string fields (just use `type: string`)
- Remove `format: date-time` / `format: date` too — treat them as plain strings in the spec
- After any openapi.yaml change, run `pnpm --filter @workspace/api-spec run codegen` and verify typecheck passes
