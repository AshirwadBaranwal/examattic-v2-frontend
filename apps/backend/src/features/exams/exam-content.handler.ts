import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { examSubject, examChapter, subject, chapter } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Get exam content (linked subjects + chapters) ──────────────────────────
export const getExamContent = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const examId = c.req.param("examId");

    const [linkedSubjects, linkedChapters] = await Promise.all([
        db
            .select({
                id: examSubject.id,
                subjectId: examSubject.subjectId,
                order: examSubject.order,
            })
            .from(examSubject)
            .where(eq(examSubject.examId, examId))
            .orderBy(asc(examSubject.order)),
        db
            .select({
                id: examChapter.id,
                chapterId: examChapter.chapterId,
            })
            .from(examChapter)
            .where(eq(examChapter.examId, examId)),
    ]);

    return c.json({
        data: {
            linkedSubjects,
            linkedChapters,
        },
    });
};

// ─── Sync exam content (replace all linked subjects + chapters) ─────────────
export const syncExamContent = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const examId = c.req.param("examId");

    const body = await c.req.json<{
        subjects: { subjectId: string; order: number }[];
        chapterIds: string[];
    }>();

    // Delete all existing links for this exam
    await Promise.all([
        db.delete(examSubject).where(eq(examSubject.examId, examId)),
        db.delete(examChapter).where(eq(examChapter.examId, examId)),
    ]);

    // Insert new subject links
    if (body.subjects.length > 0) {
        await db.insert(examSubject).values(
            body.subjects.map((s) => ({
                id: nanoid(),
                examId,
                subjectId: s.subjectId,
                order: s.order,
            }))
        );
    }

    // Insert new chapter links
    if (body.chapterIds.length > 0) {
        await db.insert(examChapter).values(
            body.chapterIds.map((chapterId) => ({
                id: nanoid(),
                examId,
                chapterId,
            }))
        );
    }

    return c.json({ success: true });
};
