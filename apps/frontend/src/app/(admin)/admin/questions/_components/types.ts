// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuestionOption {
    id: string;
    questionId: string;
    optionText: string | null;
    optionImage: string | null;
    isCorrect: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Question {
    id: string;
    chapterId: string;
    content: string;
    description: string | null;
    image: string | null;
    explanation: string | null;
    explanationImage: string | null;
    difficulty: "easy" | "medium" | "hard";
    marks: string;
    negativeMarks: string | null;
    isPyq: boolean;
    isActive: boolean;
    createdAt: string;
    // Joined fields
    chapterName: string | null;
    subjectId: string | null;
    subjectName: string | null;
    options: QuestionOption[];
}

export interface OptionFormData {
    optionText: string;
    optionImage: string;
    isCorrect: boolean;
}

export interface QuestionFormData {
    chapterId: string;
    content: string;
    description: string;
    image: string;
    explanation: string;
    explanationImage: string;
    difficulty: "easy" | "medium" | "hard";
    marks: string;
    negativeMarks: string;
    isPyq: boolean;
    options: OptionFormData[];
}

export const defaultOptionForm: OptionFormData = {
    optionText: "",
    optionImage: "",
    isCorrect: false,
};

export const defaultQuestionForm: QuestionFormData = {
    chapterId: "",
    content: "",
    description: "",
    image: "",
    explanation: "",
    explanationImage: "",
    difficulty: "medium",
    marks: "1.00",
    negativeMarks: "0.25",
    isPyq: false,
    options: [
        { ...defaultOptionForm, isCorrect: true },
        { ...defaultOptionForm },
        { ...defaultOptionForm },
        { ...defaultOptionForm },
    ],
};
