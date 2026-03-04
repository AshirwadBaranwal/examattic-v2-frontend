// ─── Types ───────────────────────────────────────────────────────────────────
export interface Subject {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    chapterCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Chapter {
    id: string;
    subjectId: string;
    name: string;
    slug: string;
    order: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface SubjectFormData {
    name: string;
    slug: string;
    color: string;
    icon: string;
}

export interface ChapterFormData {
    name: string;
    slug: string;
    order: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const SUBJECT_COLORS = [
    { name: "Blue", hex: "#3b82f6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Cyan", hex: "#06b6d4" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Teal", hex: "#14b8a6" },
    { name: "Indigo", hex: "#6366f1" },
    { name: "Orange", hex: "#f97316" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function toSlug(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
