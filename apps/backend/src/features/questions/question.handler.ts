import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { createDb } from "../../db";
import { question, questionOption, chapter, subject } from "../../db/schema";
import { eq, and, like, sql, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptionInput {
    optionText: string | null;
    optionImage: string | null;
    isCorrect: boolean;
}

interface QuestionInput {
    chapterId: string;
    content: string;
    description?: string | null;
    image?: string | null;
    explanation?: string | null;
    explanationImage?: string | null;
    difficulty: "easy" | "medium" | "hard";
    marks: string;
    negativeMarks?: string | null;
    isPyq: boolean;
    options: OptionInput[];
}

// ─── Get single question ─────────────────────────────────────────────────────
export const getQuestion = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db
        .select({
            id: question.id,
            chapterId: question.chapterId,
            content: question.content,
            description: question.description,
            image: question.image,
            explanation: question.explanation,
            explanationImage: question.explanationImage,
            difficulty: question.difficulty,
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            isPyq: question.isPyq,
            isActive: question.isActive,
            createdAt: question.createdAt,
            chapterName: chapter.name,
            subjectId: chapter.subjectId,
            subjectName: subject.name,
        })
        .from(question)
        .leftJoin(chapter, eq(question.chapterId, chapter.id))
        .leftJoin(subject, eq(chapter.subjectId, subject.id))
        .where(eq(question.id, id));

    if (!found) {
        return c.json({ error: "Question not found" }, 404);
    }

    const options = await db
        .select()
        .from(questionOption)
        .where(eq(questionOption.questionId, id));

    return c.json({ data: { ...found, options } });
};

// ─── List questions (with filters + pagination) ──────────────────────────────
export const listQuestions = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);

    const subjectId = c.req.query("subjectId");
    const chapterId = c.req.query("chapterId");
    const difficulty = c.req.query("difficulty") as "easy" | "medium" | "hard" | undefined;
    const isPyq = c.req.query("isPyq");
    const search = c.req.query("search");
    const page = parseInt(c.req.query("page") ?? "1", 10);
    const limit = parseInt(c.req.query("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (chapterId) {
        conditions.push(eq(question.chapterId, chapterId));
    } else if (subjectId) {
        // Filter by subject → get chapters of that subject
        const subjectChapters = db
            .select({ id: chapter.id })
            .from(chapter)
            .where(eq(chapter.subjectId, subjectId));
        conditions.push(sql`${question.chapterId} IN (${subjectChapters})`);
    }

    if (difficulty) {
        conditions.push(eq(question.difficulty, difficulty));
    }

    if (isPyq === "true") {
        conditions.push(eq(question.isPyq, true));
    } else if (isPyq === "false") {
        conditions.push(eq(question.isPyq, false));
    }

    if (search) {
        conditions.push(like(question.content, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(question)
        .where(whereClause);

    // Get questions with chapter + subject info
    const questions = await db
        .select({
            id: question.id,
            chapterId: question.chapterId,
            content: question.content,
            description: question.description,
            image: question.image,
            explanation: question.explanation,
            explanationImage: question.explanationImage,
            difficulty: question.difficulty,
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            isPyq: question.isPyq,
            isActive: question.isActive,
            createdAt: question.createdAt,
            chapterName: chapter.name,
            subjectId: chapter.subjectId,
            subjectName: subject.name,
        })
        .from(question)
        .leftJoin(chapter, eq(question.chapterId, chapter.id))
        .leftJoin(subject, eq(chapter.subjectId, subject.id))
        .where(whereClause)
        .orderBy(desc(question.createdAt))
        .limit(limit)
        .offset(offset);

    // Get options for all questions
    const questionIds = questions.map((q) => q.id);
    const optionsMap: Record<string, any[]> = {};

    if (questionIds.length > 0) {
        const allOptions = await db
            .select()
            .from(questionOption)
            .where(sql`${questionOption.questionId} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`);

        for (const opt of allOptions) {
            if (!optionsMap[opt.questionId]) {
                optionsMap[opt.questionId] = [];
            }
            optionsMap[opt.questionId].push(opt);
        }
    }

    const data = questions.map((q) => ({
        ...q,
        options: optionsMap[q.id] ?? [],
    }));

    return c.json({
        data,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        },
    });
};

// ─── Create question with options ────────────────────────────────────────────
export const createQuestion = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<QuestionInput>();

    const questionId = nanoid();

    const [created] = await db
        .insert(question)
        .values({
            id: questionId,
            chapterId: body.chapterId,
            content: body.content,
            description: body.description ?? null,
            image: body.image ?? null,
            explanation: body.explanation ?? null,
            explanationImage: body.explanationImage ?? null,
            difficulty: body.difficulty,
            marks: body.marks,
            negativeMarks: body.negativeMarks ?? null,
            isPyq: body.isPyq,
        })
        .returning();

    // Insert options
    if (body.options.length > 0) {
        await db.insert(questionOption).values(
            body.options.map((opt) => ({
                id: nanoid(),
                questionId,
                optionText: opt.optionText,
                optionImage: opt.optionImage,
                isCorrect: opt.isCorrect,
            }))
        );
    }

    // Re-fetch with options
    const options = await db
        .select()
        .from(questionOption)
        .where(eq(questionOption.questionId, questionId));

    return c.json({ data: { ...created, options } }, 201);
};

// ─── Update question with options ────────────────────────────────────────────
export const updateQuestion = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const body = await c.req.json<Partial<QuestionInput>>();

    const [found] = await db.select().from(question).where(eq(question.id, id));
    if (!found) {
        return c.json({ error: "Question not found" }, 404);
    }

    // Update question fields
    const [updated] = await db
        .update(question)
        .set({
            ...(body.chapterId && { chapterId: body.chapterId }),
            ...(body.content && { content: body.content }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.image !== undefined && { image: body.image }),
            ...(body.explanation !== undefined && { explanation: body.explanation }),
            ...(body.explanationImage !== undefined && { explanationImage: body.explanationImage }),
            ...(body.difficulty && { difficulty: body.difficulty }),
            ...(body.marks && { marks: body.marks }),
            ...(body.negativeMarks !== undefined && { negativeMarks: body.negativeMarks }),
            ...(body.isPyq !== undefined && { isPyq: body.isPyq }),
            updatedAt: new Date(),
        })
        .where(eq(question.id, id))
        .returning();

    // Replace options if provided
    if (body.options) {
        await db.delete(questionOption).where(eq(questionOption.questionId, id));
        if (body.options.length > 0) {
            await db.insert(questionOption).values(
                body.options.map((opt) => ({
                    id: nanoid(),
                    questionId: id,
                    optionText: opt.optionText,
                    optionImage: opt.optionImage,
                    isCorrect: opt.isCorrect,
                }))
            );
        }
    }

    const options = await db
        .select()
        .from(questionOption)
        .where(eq(questionOption.questionId, id));

    return c.json({ data: { ...updated, options } });
};

// ─── Delete question ─────────────────────────────────────────────────────────
export const deleteQuestion = async (c: Context<AppEnv>) => {
    const db = createDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    const [found] = await db.select().from(question).where(eq(question.id, id));
    if (!found) {
        return c.json({ error: "Question not found" }, 404);
    }

    await db.delete(question).where(eq(question.id, id));
    return c.json({ data: { id } });
};
