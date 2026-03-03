import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { exam } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── List all exams ──────────────────────────────────────────────────────────
export const listExams = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const exams = await db.select().from(exam).orderBy(exam.createdAt);
    return c.json({ data: exams });
};

// ─── Get single exam ─────────────────────────────────────────────────────────
export const getExam = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db.select().from(exam).where(eq(exam.id, id));
    if (!found) {
        return c.json({ error: "Exam not found" }, 404);
    }
    return c.json({ data: found });
};

// ─── Create exam ─────────────────────────────────────────────────────────────
export const createExam = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{
        name: string;
        slug: string;
        description?: string;
        logo?: string;
        duration?: number;
        totalMarks?: number;
        totalQuestions?: number;
    }>();

    if (!body.name || !body.slug) {
        return c.json({ error: "Name and slug are required" }, 400);
    }

    const id = nanoid();
    const [created] = await db
        .insert(exam)
        .values({
            id,
            name: body.name,
            slug: body.slug,
            description: body.description ?? null,
            logo: body.logo ?? null,
            duration: body.duration ?? 180,
            totalMarks: body.totalMarks ?? 100,
            totalQuestions: body.totalQuestions ?? 100,
        })
        .returning();

    return c.json({ data: created }, 201);
};

// ─── Update exam ─────────────────────────────────────────────────────────────
export const updateExam = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<{
        name?: string;
        slug?: string;
        description?: string;
        logo?: string;
        duration?: number;
        totalMarks?: number;
        totalQuestions?: number;
        isActive?: boolean;
    }>();

    const [updated] = await db
        .update(exam)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(exam.id, id))
        .returning();

    if (!updated) {
        return c.json({ error: "Exam not found" }, 404);
    }
    return c.json({ data: updated });
};

// ─── Delete exam ─────────────────────────────────────────────────────────────
export const deleteExam = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [deleted] = await db
        .delete(exam)
        .where(eq(exam.id, id))
        .returning();

    if (!deleted) {
        return c.json({ error: "Exam not found" }, 404);
    }
    return c.json({ data: { id: deleted.id } });
};

// ─── Toggle exam active status ───────────────────────────────────────────────
export const toggleExamStatus = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db.select().from(exam).where(eq(exam.id, id));
    if (!found) {
        return c.json({ error: "Exam not found" }, 404);
    }

    const [updated] = await db
        .update(exam)
        .set({ isActive: !found.isActive, updatedAt: new Date() })
        .where(eq(exam.id, id))
        .returning();

    return c.json({ data: updated });
};
