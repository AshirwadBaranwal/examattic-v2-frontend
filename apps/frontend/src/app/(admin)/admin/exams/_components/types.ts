// ─── Types ───────────────────────────────────────────────────────────────────
export interface Exam {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    duration: number;
    totalMarks: number;
    totalQuestions: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExamFormData {
    name: string;
    slug: string;
    description: string;
    duration: number;
    totalMarks: number;
    totalQuestions: number;
}

export const defaultExamForm: ExamFormData = {
    name: "",
    slug: "",
    description: "",
    duration: 180,
    totalMarks: 100,
    totalQuestions: 100,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function toSlug(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
