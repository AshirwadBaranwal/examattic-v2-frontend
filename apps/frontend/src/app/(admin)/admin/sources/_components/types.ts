export interface Source {
    id: string;
    type: "pyq" | "mock";
    title: string;
    slug: string;
    examId: string | null;
    examName?: string | null; // Joined from exam table

    // PYQ specific
    sessionDate: string | null;
    shift: number | null;

    // Mock specific
    duration: number | null;
    totalQuestions: number;
    totalMarks: string;

    // Common
    hasSectionalTiming: boolean;
    instructions: string | null;
    status: "draft" | "published";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PyqFormData {
    title: string;
    examId: string;
    sessionDate: string;
    shift: number | "";
    instructions: string;
    hasSectionalTiming: boolean;
}

export interface MockFormData {
    title: string;
    examId: string;
    duration: number | "";
    totalQuestions: number | "";
    totalMarks: string;
    instructions: string;
    hasSectionalTiming: boolean;
}

export const defaultPyqForm: PyqFormData = {
    title: "",
    examId: "",
    sessionDate: "",
    shift: "",
    instructions: "",
    hasSectionalTiming: false,
};

export const defaultMockForm: MockFormData = {
    title: "",
    examId: "",
    duration: "",
    totalQuestions: "",
    totalMarks: "",
    instructions: "",
    hasSectionalTiming: false,
};

export function toSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
