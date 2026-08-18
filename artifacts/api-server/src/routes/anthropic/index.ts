
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  conversations,
  messages,
  itemsTable,
  valuationCacheTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { requireAuth } from "../../middlewares/auth.js";

const router: IRouter = Router();

// ─── Build collection context for the system prompt ────────────────────────

async function buildCollectionContext(): Promise<string> {
  const rows = await db
    .select({
      name: itemsTable.name,
      category: itemsTable.category,
      subcategory: itemsTable.subcategory,
      year: itemsTable.year,
      sourceEvent: itemsTable.sourceEvent,
      authenticator: itemsTable.authenticator,
      purchasePrice: itemsTable.purchasePrice,
      purchaseDate: itemsTable.purchaseDate,
      purchaseSource: itemsTable.purchaseSource,
      owned: itemsTable.owned,
      notorietyTier: itemsTable.notorietyTier,
      medianEstimate: valuationCacheTable.medianEstimate,
      tierUsed: valuationCacheTable.tierUsed,
      confidence: valuationCacheTable.confidence,
    })
    .from(itemsTable)
    .leftJoin(valuationCacheTable, eq(itemsTable.id, valuationCacheTable.itemId))
    .where(eq(itemsTable.status, "approved"))
    .orderBy(desc(itemsTable.createdAt))
    .limit(50);

  if (rows.length === 0) return "The collection is currently empty.";

  const lines = rows.map((r) => {
    const price = r.purchasePrice ? `$${Number(r.purchasePrice).toLocaleString()}` : "unknown purchase price";
    const estimate = r.medianEstimate
      ? `median est. $${Number(r.medianEstimate).toLocaleString()} (Tier ${r.tierUsed ?? "?"}, ${r.confidence ?? "?"} confidence)`
      : "no valuation data";
    const owned = r.owned ? "currently owned" : "previously owned / sold";
    return `- ${r.name} (${r.category}${r.subcategory ? ` / ${r.subcategory}` : ""}, ${r.year ?? "year unknown"}) — ${owned}. Paid: ${price}. Value: ${estimate}. Auth: ${r.authenticator ?? "none"}.`;
  });

  return `The user's collection (${rows.length} items):\n${lines.join("\n")}`;
}

const SYSTEM_PROMPT = `You are a knowledgeable collectibles expert helping the user understand and manage their personal collection.

Your role:
- Answer questions about specific items, their history, rarity, and factors that affect value, using well-established facts. When you are not certain of a detail, say so rather than inventing it.
- Help the user understand WHY an item might be valued the way it is (rarity, condition, authentication status, provenance, market demand) — but always defer to the app's computed valuation numbers rather than inventing your own price estimate. If asked for a price, restate the app's computed low/median/high band and cite the underlying sale count. Do not generate a new number.
- Help surface patterns in the user's collection (e.g. "you have several items from the same era" or "your sports memorabilia is heavily weighted toward baseball").

You are not a licensed appraiser. If asked for a formal appraisal, recommend a professional authenticator/appraiser for anything with real transaction stakes.

IMPORTANT: Never output a dollar-amount price estimate of your own. You may only reference and explain numbers already present in the collection data provided to you in this system prompt.`;

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

// ─── List conversations ─────────────────────────────────────────────────────

router.get("/anthropic/conversations", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.clerkUserId, req.clerkUserId!))
    .orderBy(desc(conversations.createdAt));
  res.json(rows);
});

// ─── Create conversation ────────────────────────────────────────────────────

router.post("/anthropic/conversations", requireAuth, async (req, res): Promise<void> => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [conv] = await db
    .insert(conversations)
    .values({ title, clerkUserId: req.clerkUserId! })
    .returning();
  res.status(201).json(conv);
});

// ─── Get conversation + messages ────────────────────────────────────────────

router.get("/anthropic/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, req.clerkUserId!)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  res.json({ ...conv, messages: msgs });
});

// ─── Delete conversation ────────────────────────────────────────────────────

router.delete("/anthropic/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const deleted = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, req.clerkUserId!)))
    .returning();
  if (!deleted.length) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.status(204).end();
});

// ─── List messages ──────────────────────────────────────────────────────────

router.get("/anthropic/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  // Verify ownership
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, req.clerkUserId!)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

// ─── Send message (SSE streaming) ───────────────────────────────────────────

router.post("/anthropic/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const conversationId = parseId(req.params.id);
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.clerkUserId, req.clerkUserId!)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Persist the user message
  await db.insert(messages).values({ conversationId, role: "user", content });

  // Load full conversation history for context
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Inject collection context into system prompt
  const collectionContext = await buildCollectionContext();
  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${collectionContext}`;

  // Stream SSE response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: fullSystemPrompt,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    if (fullResponse) {
      await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
