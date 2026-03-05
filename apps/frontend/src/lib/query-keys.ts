/**
 * Central Query Key Store
 *
 * All TanStack Query keys in one place for easy revalidation.
 * Use queryClient.invalidateQueries({ queryKey: queryKeys.user.me }) to revalidate.
 *
 * Pattern: Each domain has a base key and specific sub-keys.
 * The `all` key invalidates everything in that domain.
 */
export const queryKeys = {
    // ─── Auth / User ─────────────────────────────────────────
    user: {
        all: ["user"] as const,
        me: ["user", "me"] as const,
        session: ["user", "session"] as const,
    },

    // ─── Admin ───────────────────────────────────────────────
    admin: {
        all: ["admin"] as const,
        stats: ["admin", "stats"] as const,
        users: (params?: { page?: number; search?: string }) =>
            ["admin", "users", params] as const,
    },

    // ─── Exams ───────────────────────────────────────────────
    exams: {
        all: ["exams"] as const,
        list: ["exams", "list"] as const,
        detail: (id: string) => ["exams", "detail", id] as const,
        content: (examId: string) => ["exams", "content", examId] as const,
    },

    // ─── Sources (PYQ & Mock) ────────────────────────────────
    sources: {
        all: ["sources"] as const,
        pyq: ["sources", "pyq"] as const,
        mock: ["sources", "mock"] as const,
        detail: (id: string) => ["sources", "detail", id] as const,
        sections: (sourceId: string) =>
            ["sources", "sections", sourceId] as const,
    },

    // ─── Subjects ────────────────────────────────────────────
    subjects: {
        all: ["subjects"] as const,
        list: ["subjects", "list"] as const,
        detail: (id: string) => ["subjects", "detail", id] as const,
    },

    // ─── Chapters ────────────────────────────────────────────
    chapters: {
        all: ["chapters"] as const,
        bySubject: (subjectId: string) =>
            ["chapters", "bySubject", subjectId] as const,
    },

    // ─── Questions ───────────────────────────────────────────
    questions: {
        all: ["questions"] as const,
        list: (params?: Record<string, string | number | undefined>) =>
            ["questions", "list", params] as const,
        detail: (id: string) => ["questions", "detail", id] as const,
    },

    // ─── Student ─────────────────────────────────────────────
    student: {
        all: ["student"] as const,
        courses: ["student", "courses"] as const,
        exams: (params?: { subjectId?: string }) =>
            ["student", "exams", params] as const,
        results: ["student", "results"] as const,
    },
} as const;

