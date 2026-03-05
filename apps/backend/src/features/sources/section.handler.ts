import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import {
    testSection,
    testSectionSubject,
    subject,
    source,
} from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── List sections for a source (with subjects) ─────────────────────────────
export const listSections = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const sourceId = c.req.param("sourceId");

    // Verify source exists
    const [src] = await db
        .select({ id: source.id })
        .from(source)
        .where(eq(source.id, sourceId));

    if (!src) {
        return c.json({ error: "Source not found" }, 404);
    }

    // Get sections ordered
    const sections = await db
        .select()
        .from(testSection)
        .where(eq(testSection.sourceId, sourceId))
        .orderBy(asc(testSection.order));

    // Get subjects per section
    const sectionIds = sections.map((s) => s.id);
    let subjectRows: any[] = [];
    if (sectionIds.length > 0) {
        subjectRows = await db
            .select({
                id: testSectionSubject.id,
                testSectionId: testSectionSubject.testSectionId,
                subjectId: testSectionSubject.subjectId,
                subjectName: subject.name,
                subjectIcon: subject.icon,
                subjectColor: subject.color,
                marks: testSectionSubject.marks,
                negativeMarks: testSectionSubject.negativeMarks,
                questionCount: testSectionSubject.questionCount,
                questionLimit: testSectionSubject.questionLimit,
            })
            .from(testSectionSubject)
            .innerJoin(subject, eq(testSectionSubject.subjectId, subject.id))
            .where(
                sectionIds.length === 1
                    ? eq(testSectionSubject.testSectionId, sectionIds[0])
                    : eq(testSectionSubject.testSectionId, testSectionSubject.testSectionId) // we'll filter in JS
            );

        // If multiple sections, re-fetch properly with an IN-like approach
        if (sectionIds.length > 1) {
            subjectRows = [];
            for (const id of sectionIds) {
                const rows = await db
                    .select({
                        id: testSectionSubject.id,
                        testSectionId: testSectionSubject.testSectionId,
                        subjectId: testSectionSubject.subjectId,
                        subjectName: subject.name,
                        subjectIcon: subject.icon,
                        subjectColor: subject.color,
                        marks: testSectionSubject.marks,
                        negativeMarks: testSectionSubject.negativeMarks,
                        questionCount: testSectionSubject.questionCount,
                        questionLimit: testSectionSubject.questionLimit,
                    })
                    .from(testSectionSubject)
                    .innerJoin(
                        subject,
                        eq(testSectionSubject.subjectId, subject.id)
                    )
                    .where(eq(testSectionSubject.testSectionId, id));
                subjectRows.push(...rows);
            }
        }
    }

    // Group subjects by section
    const sectionsWithSubjects = sections.map((sec) => ({
        ...sec,
        subjects: subjectRows.filter((r) => r.testSectionId === sec.id),
    }));

    return c.json({ data: sectionsWithSubjects });
};

// ─── Create section ──────────────────────────────────────────────────────────
export const createSection = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const sourceId = c.req.param("sourceId");
    const body = await c.req.json<{
        name: string;
        timeLimit?: number | null;
    }>();

    if (!body.name) {
        return c.json({ error: "Section name is required" }, 400);
    }

    // Get max order
    const existing = await db
        .select({ order: testSection.order })
        .from(testSection)
        .where(eq(testSection.sourceId, sourceId))
        .orderBy(asc(testSection.order));

    const nextOrder =
        existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;

    const id = nanoid();
    const [created] = await db
        .insert(testSection)
        .values({
            id,
            sourceId,
            name: body.name,
            order: nextOrder,
            timeLimit: body.timeLimit ?? null,
        })
        .returning();

    return c.json({ data: { ...created, subjects: [] } }, 201);
};

// ─── Update section ──────────────────────────────────────────────────────────
export const updateSection = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<{
        name?: string;
        timeLimit?: number | null;
    }>();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.timeLimit !== undefined) updateData.timeLimit = body.timeLimit;

    const [updated] = await db
        .update(testSection)
        .set(updateData)
        .where(eq(testSection.id, id))
        .returning();

    if (!updated) {
        return c.json({ error: "Section not found" }, 404);
    }

    return c.json({ data: updated });
};

// ─── Delete section ──────────────────────────────────────────────────────────
export const deleteSection = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [deleted] = await db
        .delete(testSection)
        .where(eq(testSection.id, id))
        .returning();

    if (!deleted) {
        return c.json({ error: "Section not found" }, 404);
    }

    return c.json({ data: { id: deleted.id } });
};

// ─── Reorder sections ────────────────────────────────────────────────────────
export const reorderSections = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ items: { id: string; order: number }[] }>();

    if (!body.items || !Array.isArray(body.items)) {
        return c.json({ error: "items array is required" }, 400);
    }

    // Update each section's order
    for (const item of body.items) {
        await db
            .update(testSection)
            .set({ order: item.order, updatedAt: new Date() })
            .where(eq(testSection.id, item.id));
    }

    return c.json({ data: { success: true } });
};

// ─── Upsert section subjects (replace all subjects for a section) ────────────
export const upsertSectionSubjects = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const sectionId = c.req.param("id");
    const body = await c.req.json<{
        subjects: {
            subjectId: string;
            marks?: string;
            negativeMarks?: string;
            questionCount?: number;
            questionLimit?: number | null;
        }[];
    }>();

    if (!body.subjects || !Array.isArray(body.subjects)) {
        return c.json({ error: "subjects array is required" }, 400);
    }

    // Verify section exists
    const [sec] = await db
        .select({ id: testSection.id })
        .from(testSection)
        .where(eq(testSection.id, sectionId));

    if (!sec) {
        return c.json({ error: "Section not found" }, 404);
    }

    // Delete all existing subjects for this section
    await db
        .delete(testSectionSubject)
        .where(eq(testSectionSubject.testSectionId, sectionId));

    // Insert new subjects
    if (body.subjects.length > 0) {
        const values = body.subjects.map((s) => ({
            id: nanoid(),
            testSectionId: sectionId,
            subjectId: s.subjectId,
            marks: s.marks ?? "4.00",
            negativeMarks: s.negativeMarks ?? "1.00",
            questionCount: s.questionCount ?? 0,
            questionLimit: s.questionLimit ?? null,
        }));

        await db.insert(testSectionSubject).values(values);
    }

    // Return updated subjects with subject details
    const updated = await db
        .select({
            id: testSectionSubject.id,
            testSectionId: testSectionSubject.testSectionId,
            subjectId: testSectionSubject.subjectId,
            subjectName: subject.name,
            subjectIcon: subject.icon,
            subjectColor: subject.color,
            marks: testSectionSubject.marks,
            negativeMarks: testSectionSubject.negativeMarks,
            questionCount: testSectionSubject.questionCount,
            questionLimit: testSectionSubject.questionLimit,
        })
        .from(testSectionSubject)
        .innerJoin(subject, eq(testSectionSubject.subjectId, subject.id))
        .where(eq(testSectionSubject.testSectionId, sectionId));

    return c.json({ data: updated });
};
