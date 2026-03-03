import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { subject, chapter } from "../../db/schema";
import { eq, asc, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── List all subjects (with chapter count) ──────────────────────────────────
export const listSubjects = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);

    const chapterCountSq = db
        .select({ subjectId: chapter.subjectId, count: count().as("count") })
        .from(chapter)
        .groupBy(chapter.subjectId)
        .as("chapter_count");

    const subjects = await db
        .select({
            id: subject.id,
            name: subject.name,
            slug: subject.slug,
            icon: subject.icon,
            color: subject.color,
            createdAt: subject.createdAt,
            updatedAt: subject.updatedAt,
            chapterCount: sql<number>`coalesce(${chapterCountSq.count}, 0)`.mapWith(Number),
        })
        .from(subject)
        .leftJoin(chapterCountSq, eq(subject.id, chapterCountSq.subjectId))
        .orderBy(asc(subject.name));

    return c.json({ data: subjects });
};

// ─── Get single subject with its chapters ────────────────────────────────────
export const getSubject = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db.select().from(subject).where(eq(subject.id, id));
    if (!found) {
        return c.json({ error: "Subject not found" }, 404);
    }

    const chapters = await db
        .select()
        .from(chapter)
        .where(eq(chapter.subjectId, id))
        .orderBy(asc(chapter.order));

    return c.json({ data: { ...found, chapters } });
};

// ─── Create subject ──────────────────────────────────────────────────────────
export const createSubject = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{
        name: string;
        slug: string;
        icon?: string;
        color?: string;
    }>();

    if (!body.name || !body.slug) {
        return c.json({ error: "Name and slug are required" }, 400);
    }

    const id = nanoid();
    const [created] = await db
        .insert(subject)
        .values({
            id,
            name: body.name,
            slug: body.slug,
            icon: body.icon ?? null,
            color: body.color ?? null,
        })
        .returning();

    return c.json({ data: created }, 201);
};

// ─── Update subject ──────────────────────────────────────────────────────────
export const updateSubject = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<{
        name?: string;
        slug?: string;
        icon?: string;
        color?: string;
    }>();

    const [updated] = await db
        .update(subject)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(subject.id, id))
        .returning();

    if (!updated) {
        return c.json({ error: "Subject not found" }, 404);
    }
    return c.json({ data: updated });
};

// ─── Delete subject ──────────────────────────────────────────────────────────
export const deleteSubject = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [deleted] = await db
        .delete(subject)
        .where(eq(subject.id, id))
        .returning();

    if (!deleted) {
        return c.json({ error: "Subject not found" }, 404);
    }
    return c.json({ data: { id: deleted.id } });
};
