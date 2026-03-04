import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { source, exam } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// ─── List sources (filtered by ?type=pyq|mock) ──────────────────────────────
export const listSources = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const type = c.req.query("type") as "pyq" | "mock" | undefined;

    if (!type || !["pyq", "mock"].includes(type)) {
        return c.json({ error: "Query param 'type' is required (pyq or mock)" }, 400);
    }

    const sources = await db
        .select({
            id: source.id,
            type: source.type,
            title: source.title,
            slug: source.slug,
            examId: source.examId,
            examName: exam.name,
            sessionDate: source.sessionDate,
            shift: source.shift,
            duration: source.duration,
            totalQuestions: source.totalQuestions,
            totalMarks: source.totalMarks,
            hasSectionalTiming: source.hasSectionalTiming,
            instructions: source.instructions,
            status: source.status,
            isActive: source.isActive,
            createdAt: source.createdAt,
            updatedAt: source.updatedAt,
        })
        .from(source)
        .leftJoin(exam, eq(source.examId, exam.id))
        .where(eq(source.type, type))
        .orderBy(source.createdAt);

    return c.json({ data: sources });
};

// ─── Get single source ──────────────────────────────────────────────────────
export const getSource = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db
        .select({
            id: source.id,
            type: source.type,
            title: source.title,
            slug: source.slug,
            examId: source.examId,
            examName: exam.name,
            sessionDate: source.sessionDate,
            shift: source.shift,
            duration: source.duration,
            totalQuestions: source.totalQuestions,
            totalMarks: source.totalMarks,
            hasSectionalTiming: source.hasSectionalTiming,
            instructions: source.instructions,
            status: source.status,
            isActive: source.isActive,
            createdAt: source.createdAt,
            updatedAt: source.updatedAt,
        })
        .from(source)
        .leftJoin(exam, eq(source.examId, exam.id))
        .where(eq(source.id, id));

    if (!found) {
        return c.json({ error: "Source not found" }, 404);
    }
    return c.json({ data: found });
};

// ─── Create source ──────────────────────────────────────────────────────────
export const createSource = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{
        type: "pyq" | "mock";
        title: string;
        examId: string;
        // PYQ-specific
        sessionDate?: string;
        shift?: number;
        // Mock-specific
        duration?: number;
        totalQuestions?: number;
        totalMarks?: string;
        // Common optional
        instructions?: string;
        hasSectionalTiming?: boolean;
    }>();

    if (!body.type || !["pyq", "mock"].includes(body.type)) {
        return c.json({ error: "Type is required (pyq or mock)" }, 400);
    }
    if (!body.title) {
        return c.json({ error: "Title is required" }, 400);
    }
    if (!body.examId) {
        return c.json({ error: "Exam ID is required" }, 400);
    }

    const id = nanoid();
    const slug = toSlug(body.title);

    const [created] = await db
        .insert(source)
        .values({
            id,
            type: body.type,
            title: body.title,
            slug,
            examId: body.examId,
            // PYQ fields
            sessionDate: body.sessionDate ? new Date(body.sessionDate) : null,
            shift: body.shift ?? null,
            // Mock fields
            duration: body.duration ?? null,
            totalQuestions: body.totalQuestions ?? 0,
            totalMarks: body.totalMarks ?? "0",
            // Common
            hasSectionalTiming: body.hasSectionalTiming ?? false,
            instructions: body.instructions ?? null,
        })
        .returning();

    return c.json({ data: created }, 201);
};

// ─── Update source ──────────────────────────────────────────────────────────
export const updateSource = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<{
        title?: string;
        examId?: string;
        sessionDate?: string | null;
        shift?: number | null;
        duration?: number | null;
        totalQuestions?: number;
        totalMarks?: string;
        instructions?: string | null;
        hasSectionalTiming?: boolean;
        status?: "draft" | "published";
        isActive?: boolean;
    }>();

    // Build update payload — handle sessionDate conversion
    const updateData: Record<string, any> = { ...body, updatedAt: new Date() };
    if (body.title) {
        updateData.slug = toSlug(body.title);
    }
    if (body.sessionDate !== undefined) {
        updateData.sessionDate = body.sessionDate ? new Date(body.sessionDate) : null;
    }

    const [updated] = await db
        .update(source)
        .set(updateData)
        .where(eq(source.id, id))
        .returning();

    if (!updated) {
        return c.json({ error: "Source not found" }, 404);
    }
    return c.json({ data: updated });
};

// ─── Delete source ──────────────────────────────────────────────────────────
export const deleteSource = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [deleted] = await db
        .delete(source)
        .where(eq(source.id, id))
        .returning();

    if (!deleted) {
        return c.json({ error: "Source not found" }, 404);
    }
    return c.json({ data: { id: deleted.id } });
};

// ─── Toggle source active status ────────────────────────────────────────────
export const toggleSourceStatus = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db.select().from(source).where(eq(source.id, id));
    if (!found) {
        return c.json({ error: "Source not found" }, 404);
    }

    const [updated] = await db
        .update(source)
        .set({ isActive: !found.isActive, updatedAt: new Date() })
        .where(eq(source.id, id))
        .returning();

    return c.json({ data: updated });
};
