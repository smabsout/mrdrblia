import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getOrProvisionUser(clerkId: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;

  // JIT provision: fetch user info from Clerk and create a local record
  const clerkUser = await clerkClient.users.getUser(clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@clerk.local`;
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // If a legacy session-auth user exists with this email, claim it; otherwise insert fresh
  const [user] = await db
    .insert(usersTable)
    .values({ clerkId, email, displayName, role: "user" })
    .onConflictDoUpdate({ target: usersTable.email, set: { clerkId } })
    .returning();

  return user;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getOrProvisionUser(auth.userId);
    req.userId = user.id;
    req.userRole = user.role;
    req.clerkUserId = auth.userId;
    next();
  } catch {
    res.status(500).json({ error: "Auth provisioning failed" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getOrProvisionUser(auth.userId);
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden — admin only" });
      return;
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.clerkUserId = auth.userId;
    next();
  } catch {
    res.status(500).json({ error: "Auth provisioning failed" });
  }
}
