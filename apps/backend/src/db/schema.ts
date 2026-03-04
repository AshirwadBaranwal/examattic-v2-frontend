import {
    pgTable,
    text,
    timestamp,
    boolean,
    pgEnum,
    integer,
    decimal,
    index,
    uniqueIndex,
    jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const sourceTypeEnum = pgEnum("source_type", ["pyq", "mock"]);
export const sourceStatusEnum = pgEnum("source_status", ["draft", "published"]);
export const testAttemptStatusEnum = pgEnum("test_attempt_status", [
    "in_progress",
    "submitted",
]);

// ============================================================================
// AUTH TABLES
// ============================================================================

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: roleEnum("role").notNull().default("student"),
    preferredExamId: text("preferred_exam_id").references(() => exam.id, {
        onDelete: "set null",
    }),
    // Better Auth admin plugin fields
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// CORE CONTENT TABLES
// ============================================================================

export const exam = pgTable(
    "exam",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        description: text("description"),
        logo: text("logo"),
        duration: integer("duration").notNull().default(180),
        totalMarks: integer("total_marks").notNull().default(100),
        totalQuestions: integer("total_questions").notNull().default(100),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [index("exam_slug_idx").on(table.slug)]
);

export const subject = pgTable("subject", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"),
    color: text("color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chapter = pgTable(
    "chapter",
    {
        id: text("id").primaryKey(),
        subjectId: text("subject_id")
            .notNull()
            .references(() => subject.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        order: integer("order").default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("chapter_subject_idx").on(table.subjectId),
        uniqueIndex("chapter_slug_subject_idx").on(table.slug, table.subjectId),
    ]
);

export const question = pgTable(
    "question",
    {
        id: text("id").primaryKey(),
        chapterId: text("chapter_id")
            .notNull()
            .references(() => chapter.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        description: text("description"),
        image: text("image"),
        explanation: text("explanation"),
        explanationImage: text("explanation_image"),
        difficulty: difficultyEnum("difficulty").notNull().default("medium"),
        marks: decimal("marks", { precision: 4, scale: 2 })
            .notNull()
            .default("1.00"),
        negativeMarks: decimal("negative_marks", { precision: 4, scale: 2 }).default(
            "0.25"
        ),
        isPyq: boolean("is_pyq").notNull().default(false),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("question_chapter_idx").on(table.chapterId),
        index("question_difficulty_idx").on(table.difficulty),
        index("question_is_pyq_idx").on(table.isPyq),
    ]
);

export const questionOption = pgTable(
    "question_option",
    {
        id: text("id").primaryKey(),
        questionId: text("question_id")
            .notNull()
            .references(() => question.id, { onDelete: "cascade" }),
        optionText: text("option_text"),
        optionImage: text("option_image"),
        isCorrect: boolean("is_correct").notNull().default(false),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [index("option_question_idx").on(table.questionId)]
);

// ============================================================================
// EXAM JUNCTION TABLES
// ============================================================================

export const examChapter = pgTable(
    "exam_chapter",
    {
        id: text("id").primaryKey(),
        examId: text("exam_id")
            .notNull()
            .references(() => exam.id, { onDelete: "cascade" }),
        chapterId: text("chapter_id")
            .notNull()
            .references(() => chapter.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("exam_chapter_exam_idx").on(table.examId),
        index("exam_chapter_chapter_idx").on(table.chapterId),
        uniqueIndex("exam_chapter_unique_idx").on(table.examId, table.chapterId),
    ]
);

export const examSubject = pgTable(
    "exam_subject",
    {
        id: text("id").primaryKey(),
        examId: text("exam_id")
            .notNull()
            .references(() => exam.id, { onDelete: "cascade" }),
        subjectId: text("subject_id")
            .notNull()
            .references(() => subject.id, { onDelete: "cascade" }),
        order: integer("order").default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("exam_subject_exam_idx").on(table.examId),
        uniqueIndex("exam_subject_unique_idx").on(table.examId, table.subjectId),
    ]
);

// ============================================================================
// UNIFIED SOURCE TABLE (PYQ / Mock)
// ============================================================================

export const source = pgTable(
    "source",
    {
        id: text("id").primaryKey(),
        type: sourceTypeEnum("type").notNull(),
        title: text("title").notNull(),
        slug: text("slug").notNull(),

        // Exam link (required for pyq/mock)
        examId: text("exam_id").references(() => exam.id, {
            onDelete: "set null",
        }),

        // PYQ-specific fields
        sessionDate: timestamp("session_date", { mode: "date" }),
        shift: integer("shift"),

        // Test configuration (for pyq & mock)
        duration: integer("duration"),
        totalQuestions: integer("total_questions").default(0),
        totalMarks: decimal("total_marks", { precision: 8, scale: 2 }).default(
            "0"
        ),
        hasSectionalTiming: boolean("has_sectional_timing").default(false),

        // Common
        instructions: text("instructions"),
        status: sourceStatusEnum("status").notNull().default("draft"),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("source_type_idx").on(table.type),
        index("source_exam_idx").on(table.examId),
        index("source_slug_idx").on(table.slug),
        uniqueIndex("source_pyq_unique_idx").on(
            table.examId,
            table.sessionDate,
            table.shift
        ),
    ]
);

// ============================================================================
// TEST SECTIONS & QUESTION APPEARANCES
// ============================================================================

export const testSection = pgTable(
    "test_section",
    {
        id: text("id").primaryKey(),
        sourceId: text("source_id")
            .notNull()
            .references(() => source.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        order: integer("order").notNull().default(0),
        timeLimit: integer("time_limit"), // minutes, null = no section-specific limit

        // Per-section scoring config (moved from JSON blob)
        marks: decimal("marks", { precision: 4, scale: 2 }),
        negativeMarks: decimal("negative_marks", { precision: 4, scale: 2 }),
        questionCount: integer("question_count"),
        questionLimit: integer("question_limit"), // how many the student must attempt

        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("test_section_source_idx").on(table.sourceId),
        index("test_section_order_idx").on(table.sourceId, table.order),
    ]
);

export const testSectionSubject = pgTable(
    "test_section_subject",
    {
        id: text("id").primaryKey(),
        testSectionId: text("test_section_id")
            .notNull()
            .references(() => testSection.id, { onDelete: "cascade" }),
        subjectId: text("subject_id")
            .notNull()
            .references(() => subject.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("tss_section_idx").on(table.testSectionId),
        index("tss_subject_idx").on(table.subjectId),
        uniqueIndex("tss_unique_idx").on(table.testSectionId, table.subjectId),
    ]
);

export const questionAppearance = pgTable(
    "question_appearance",
    {
        id: text("id").primaryKey(),
        questionId: text("question_id")
            .notNull()
            .references(() => question.id, { onDelete: "cascade" }),
        sourceId: text("source_id")
            .notNull()
            .references(() => source.id, { onDelete: "cascade" }),
        testSectionId: text("test_section_id").references(
            () => testSection.id,
            { onDelete: "set null" }
        ),
        order: integer("order").notNull().default(0),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("qa_question_idx").on(table.questionId),
        index("qa_source_idx").on(table.sourceId),
        index("qa_section_idx").on(table.testSectionId),
        uniqueIndex("qa_unique_idx").on(table.questionId, table.sourceId),
    ]
);

// ============================================================================
// TEST ATTEMPT TABLES
// ============================================================================

export const testAttempt = pgTable(
    "test_attempt",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        sourceId: text("source_id")
            .notNull()
            .references(() => source.id, { onDelete: "cascade" }),

        status: testAttemptStatusEnum("status")
            .notNull()
            .default("in_progress"),

        // Section progress tracking (lightweight state for resume)
        sectionProgress: jsonb("section_progress")
            .$type<
                Record<
                    string,
                    {
                        visited: boolean;
                        timeSpent: number;
                        locked: boolean;
                        timeRemaining: number | null;
                    }
                >
            >()
            .default({}),

        // Current position
        currentSectionIndex: integer("current_section_index").default(0),
        currentQuestionIndex: integer("current_question_index").default(0),

        // Time tracking
        timeRemaining: integer("time_remaining"), // seconds remaining
        startedAt: timestamp("started_at").notNull().defaultNow(),
        submittedAt: timestamp("submitted_at"),

        // Overall results (populated after submission)
        score: decimal("score", { precision: 8, scale: 2 }),
        correctCount: integer("correct_count"),
        incorrectCount: integer("incorrect_count"),
        unattemptedCount: integer("unattempted_count"),

        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("test_attempt_user_idx").on(table.userId),
        index("test_attempt_source_idx").on(table.sourceId),
        index("test_attempt_status_idx").on(table.status),
        index("test_attempt_leaderboard_idx").on(
            table.sourceId,
            table.status,
            table.score
        ),
    ]
);

// ============================================================================
// QUESTION RESPONSE TABLE (Normalized per-question results)
// ============================================================================

export const questionResponse = pgTable(
    "question_response",
    {
        id: text("id").primaryKey(),
        testAttemptId: text("test_attempt_id")
            .notNull()
            .references(() => testAttempt.id, { onDelete: "cascade" }),
        questionId: text("question_id")
            .notNull()
            .references(() => question.id, { onDelete: "cascade" }),

        // Denormalized for fast analytics queries
        chapterId: text("chapter_id")
            .notNull()
            .references(() => chapter.id, { onDelete: "cascade" }),
        subjectId: text("subject_id")
            .notNull()
            .references(() => subject.id, { onDelete: "cascade" }),

        // Response data
        selectedOptionId: text("selected_option_id"),
        correctOptionId: text("correct_option_id").notNull(),
        isCorrect: boolean("is_correct").notNull().default(false),
        isAttempted: boolean("is_attempted").notNull().default(false),
        marksAwarded: decimal("marks_awarded", { precision: 6, scale: 2 })
            .notNull()
            .default("0"),
        timeSpent: integer("time_spent").notNull().default(0),
        markedForReview: boolean("marked_for_review").notNull().default(false),

        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("qr_attempt_idx").on(table.testAttemptId),
        uniqueIndex("qr_attempt_question_idx").on(
            table.testAttemptId,
            table.questionId
        ),
        index("qr_subject_correct_idx").on(table.subjectId, table.isCorrect),
        index("qr_chapter_correct_idx").on(table.chapterId, table.isCorrect),
        index("qr_attempt_subject_idx").on(
            table.testAttemptId,
            table.subjectId
        ),
    ]
);

// ============================================================================
// TEST ATTEMPT SECTION RESULTS (Normalized per-section results)
// ============================================================================

export const testAttemptSectionResult = pgTable(
    "test_attempt_section_result",
    {
        id: text("id").primaryKey(),
        testAttemptId: text("test_attempt_id")
            .notNull()
            .references(() => testAttempt.id, { onDelete: "cascade" }),
        testSectionId: text("test_section_id")
            .notNull()
            .references(() => testSection.id, { onDelete: "cascade" }),
        correct: integer("correct").notNull().default(0),
        incorrect: integer("incorrect").notNull().default(0),
        unattempted: integer("unattempted").notNull().default(0),
        score: decimal("score", { precision: 8, scale: 2 })
            .notNull()
            .default("0"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("tasr_attempt_idx").on(table.testAttemptId),
        uniqueIndex("tasr_unique_idx").on(
            table.testAttemptId,
            table.testSectionId
        ),
    ]
);

// ============================================================================
// BOOKMARK TABLES
// ============================================================================

export const bookmarkFile = pgTable(
    "bookmark_file",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        emoji: text("emoji").notNull().default("📌"),
        color: text("color").notNull().default("#f97316"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("bookmark_file_user_idx").on(table.userId),
        uniqueIndex("bookmark_file_user_name_idx").on(
            table.userId,
            table.name
        ),
    ]
);

export const bookmarkItem = pgTable(
    "bookmark_item",
    {
        id: text("id").primaryKey(),
        bookmarkFileId: text("bookmark_file_id")
            .notNull()
            .references(() => bookmarkFile.id, { onDelete: "cascade" }),
        questionId: text("question_id")
            .notNull()
            .references(() => question.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("bookmark_item_file_idx").on(table.bookmarkFileId),
        index("bookmark_item_question_idx").on(table.questionId),
        uniqueIndex("bookmark_item_unique_idx").on(
            table.bookmarkFileId,
            table.questionId
        ),
    ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    testAttempts: many(testAttempt),
    bookmarkFiles: many(bookmarkFile),
}));

export const examRelations = relations(exam, ({ many }) => ({
    chapters: many(examChapter),
    subjects: many(examSubject),
    sources: many(source),
}));

export const subjectRelations = relations(subject, ({ many }) => ({
    chapters: many(chapter),
    examSubjects: many(examSubject),
    testSectionSubjects: many(testSectionSubject),
}));

export const chapterRelations = relations(chapter, ({ one, many }) => ({
    subject: one(subject, {
        fields: [chapter.subjectId],
        references: [subject.id],
    }),
    exams: many(examChapter),
    questions: many(question),
}));

export const examChapterRelations = relations(examChapter, ({ one }) => ({
    exam: one(exam, {
        fields: [examChapter.examId],
        references: [exam.id],
    }),
    chapter: one(chapter, {
        fields: [examChapter.chapterId],
        references: [chapter.id],
    }),
}));

export const examSubjectRelations = relations(examSubject, ({ one }) => ({
    exam: one(exam, {
        fields: [examSubject.examId],
        references: [exam.id],
    }),
    subject: one(subject, {
        fields: [examSubject.subjectId],
        references: [subject.id],
    }),
}));

export const questionRelations = relations(question, ({ one, many }) => ({
    chapter: one(chapter, {
        fields: [question.chapterId],
        references: [chapter.id],
    }),
    options: many(questionOption),
    appearances: many(questionAppearance),
    bookmarkItems: many(bookmarkItem),
}));

export const optionRelations = relations(questionOption, ({ one }) => ({
    question: one(question, {
        fields: [questionOption.questionId],
        references: [question.id],
    }),
}));

export const sourceRelations = relations(source, ({ one, many }) => ({
    exam: one(exam, {
        fields: [source.examId],
        references: [exam.id],
    }),
    sections: many(testSection),
    appearances: many(questionAppearance),
    attempts: many(testAttempt),
}));

export const testSectionRelations = relations(
    testSection,
    ({ one, many }) => ({
        source: one(source, {
            fields: [testSection.sourceId],
            references: [source.id],
        }),
        subjects: many(testSectionSubject),
        appearances: many(questionAppearance),
    })
);

export const testSectionSubjectRelations = relations(
    testSectionSubject,
    ({ one }) => ({
        section: one(testSection, {
            fields: [testSectionSubject.testSectionId],
            references: [testSection.id],
        }),
        subject: one(subject, {
            fields: [testSectionSubject.subjectId],
            references: [subject.id],
        }),
    })
);

export const questionAppearanceRelations = relations(
    questionAppearance,
    ({ one }) => ({
        question: one(question, {
            fields: [questionAppearance.questionId],
            references: [question.id],
        }),
        source: one(source, {
            fields: [questionAppearance.sourceId],
            references: [source.id],
        }),
        testSection: one(testSection, {
            fields: [questionAppearance.testSectionId],
            references: [testSection.id],
        }),
    })
);

export const testAttemptRelations = relations(
    testAttempt,
    ({ one, many }) => ({
        user: one(user, {
            fields: [testAttempt.userId],
            references: [user.id],
        }),
        source: one(source, {
            fields: [testAttempt.sourceId],
            references: [source.id],
        }),
        questionResponses: many(questionResponse),
        sectionResults: many(testAttemptSectionResult),
    })
);

export const questionResponseRelations = relations(
    questionResponse,
    ({ one }) => ({
        testAttempt: one(testAttempt, {
            fields: [questionResponse.testAttemptId],
            references: [testAttempt.id],
        }),
        question: one(question, {
            fields: [questionResponse.questionId],
            references: [question.id],
        }),
        chapter: one(chapter, {
            fields: [questionResponse.chapterId],
            references: [chapter.id],
        }),
        subject: one(subject, {
            fields: [questionResponse.subjectId],
            references: [subject.id],
        }),
    })
);

export const testAttemptSectionResultRelations = relations(
    testAttemptSectionResult,
    ({ one }) => ({
        testAttempt: one(testAttempt, {
            fields: [testAttemptSectionResult.testAttemptId],
            references: [testAttempt.id],
        }),
        testSection: one(testSection, {
            fields: [testAttemptSectionResult.testSectionId],
            references: [testSection.id],
        }),
    })
);

export const bookmarkFileRelations = relations(
    bookmarkFile,
    ({ one, many }) => ({
        user: one(user, {
            fields: [bookmarkFile.userId],
            references: [user.id],
        }),
        items: many(bookmarkItem),
    })
);

export const bookmarkItemRelations = relations(bookmarkItem, ({ one }) => ({
    bookmarkFile: one(bookmarkFile, {
        fields: [bookmarkItem.bookmarkFileId],
        references: [bookmarkFile.id],
    }),
    question: one(question, {
        fields: [bookmarkItem.questionId],
        references: [question.id],
    }),
}));
