import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { chapter } from "../../db/schema";
import { eq, asc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── List chapters by subject ────────────────────────────────────────────────
export const listChaptersBySubject = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const subjectId = c.req.param("subjectId");

    const chapters = await db
        .select()
        .from(chapter)
        .where(eq(chapter.subjectId, subjectId))
        .orderBy(asc(chapter.order));

    return c.json({ data: chapters });
};

// ─── Create chapter ──────────────────────────────────────────────────────────
export const createChapter = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const subjectId = c.req.param("subjectId");
    const body = await c.req.json<{
        name: string;
        slug: string;
        order?: number;
    }>();

    if (!body.name || !body.slug) {
        return c.json({ error: "Name and slug are required" }, 400);
    }

    const id = nanoid();
    const [created] = await db
        .insert(chapter)
        .values({
            id,
            subjectId,
            name: body.name,
            slug: body.slug,
            order: body.order ?? 0,
        })
        .returning();

    return c.json({ data: created }, 201);
};

// ─── Update chapter ──────────────────────────────────────────────────────────
export const updateChapter = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<{
        name?: string;
        slug?: string;
        order?: number;
    }>();

    const [updated] = await db
        .update(chapter)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(chapter.id, id))
        .returning();

    if (!updated) {
        return c.json({ error: "Chapter not found" }, 404);
    }
    return c.json({ data: updated });
};

// ─── Delete chapter ──────────────────────────────────────────────────────────
export const deleteChapter = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [deleted] = await db
        .delete(chapter)
        .where(eq(chapter.id, id))
        .returning();

    if (!deleted) {
        return c.json({ error: "Chapter not found" }, 404);
    }
    return c.json({ data: { id: deleted.id } });
};
