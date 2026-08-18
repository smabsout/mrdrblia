import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Returns the local user record for the currently authenticated Clerk session.
// The frontend uses this to read the `role` field (e.g. to show the Admin link).
router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId));

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
});

export default router;
